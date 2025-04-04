// Card class to represent individual memory cards
class Card {
  constructor(id, characterName, imageUrl) {
    this.id = id;
    this.characterName = characterName;
    this.imageUrl = imageUrl;
    this.isFlipped = false;
    this.isMatched = false;
    this.element = null;
  }

  // Create the DOM element for this card
  createCardElement(index) {
    const cardElement = document.createElement('div');
    cardElement.className = 'memory-card';
    cardElement.dataset.cardId = this.id;
    cardElement.dataset.index = index;

    // Inner HTML structure with front and back faces
    cardElement.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <div class="card-logo"><img src="img/icon.png" alt="Simpsons Logo"></div>
        </div>
        <div class="card-back">
          <img src="${this.imageUrl}" alt="${this.characterName}">
          <div class="card-name">${this.characterName}</div>
        </div>
      </div>
    `;

    this.element = cardElement;
    return cardElement;
  }

  // Flip the card
  flip() {
    if (this.isMatched) return false;
    
    this.isFlipped = !this.isFlipped;
    this.element.classList.toggle('flipped', this.isFlipped);
    return true;
  }

  // Mark the card as matched
  setMatched() {
    this.isMatched = true;
    this.element.classList.add('matched');
    // Add a small delay before applying the matched animation
    setTimeout(() => {
      this.element.classList.add('match-animation');
    }, 300);
  }

  // Reset the card
  reset() {
    this.isFlipped = false;
    this.isMatched = false;
    this.element.classList.remove('flipped', 'matched', 'match-animation');
  }
}

// Import the getAllSimpsonsCharacters function from people.js
// First, try to create a function to import it
let getAllSimpsonsCharactersFunc = null;

// Try to import the function from the people.js module
try {
  import('./people.js')
    .then(module => {
      getAllSimpsonsCharactersFunc = module.getAllSimpsonsCharacters;
      console.log('Successfully imported getAllSimpsonsCharacters');
    })
    .catch(err => {
      console.error('Error importing people.js:', err);
    });
} catch (e) {
  console.warn('Dynamic import not supported, falling back to global function');
}

// Game class to manage the memory game
class MemoryGame {
  constructor() {
    // DOM elements
    this.gameBoard = document.getElementById('game-board');
    this.startButton = document.getElementById('start-game');
    this.resetButton = document.getElementById('reset-game');
    this.difficultySelect = document.getElementById('difficulty');
    this.attemptsElement = document.getElementById('attempts');
    this.matchesElement = document.getElementById('matches');
    this.timerElement = document.getElementById('timer');
    this.resultTimeElement = document.getElementById('result-time');
    this.resultAttemptsElement = document.getElementById('result-attempts');
    this.modal = document.getElementById('win-modal');
    this.modalClose = document.querySelector('.close');
    this.playAgainButton = document.getElementById('play-again');
    
    // Game state
    this.cards = [];
    this.pairsCount = 0;
    this.firstCard = null;
    this.secondCard = null;
    this.isLocked = false;
    this.attempts = 0;
    this.matches = 0;
    this.timerInterval = null;
    this.startTime = 0;
    this.gameStarted = false;
    
    // Initialize the game
    this.init();
  }
  
  // Initialize the game with event listeners
  init() {
    this.startButton.addEventListener('click', () => this.startGame());
    this.resetButton.addEventListener('click', () => this.resetGame());
    this.modalClose.addEventListener('click', () => this.closeModal());
    this.playAgainButton.addEventListener('click', () => {
      this.closeModal();
      this.resetGame();
      this.startGame();
    });
    
    // Show initial message
    this.showMessage('Pick a difficulty level and try your best!');
  }
  
  // Start the game
  async startGame() {
    // Get difficulty
    const difficulty = this.difficultySelect.value;
    this.pairsCount = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 12;
    
    // Clear previous game
    this.resetGameState();
    this.gameBoard.innerHTML = '<p>Loading characters...</p>';
    
    try {
      // Get characters from API
      const characters = await this.fetchCharacters();
      if (!characters || characters.length < this.pairsCount) {
        this.showMessage('Not enough character with pictures. Try again.');
        return;
      }
      
      // Create cards
      this.createCards(characters);
      
      // Start timer
      this.startTimer();
      
      // Enable reset button
      this.resetButton.disabled = false;
      this.startButton.disabled = true;
      this.difficultySelect.disabled = true;
      this.gameStarted = true;
      
      // Hide message when game starts
      this.hideMessage();
      
    } catch (error) {
      console.error('Error starting game:', error);
      this.showMessage('Error al cargar los personajes. Inténtalo de nuevo.');
    }
  }
  
  // Reset the game
  resetGame() {
    this.resetGameState();
    this.gameBoard.innerHTML = '';
    this.showMessage('Pick a difficulty level and try again!');
    this.stopTimer();
    this.resetButton.disabled = true;
    this.startButton.disabled = false;
    this.difficultySelect.disabled = false;
    this.gameStarted = false;
  }
  
  // Reset the game state
  resetGameState() {
    this.cards = [];
    this.firstCard = null;
    this.secondCard = null;
    this.isLocked = false;
    this.attempts = 0;
    this.matches = 0;
    this.updateStats();
  }
  
  // Fetch characters from The Simpsons API
  async fetchCharacters() {
    try {
      // First try the imported function
      if (getAllSimpsonsCharactersFunc) {
        return await getAllSimpsonsCharactersFunc();
      }
      
      // Then try the global function (if it exists)
      if (typeof getAllSimpsonsCharacters === 'function') {
        return await getAllSimpsonsCharacters();
      }
      
      // Otherwise use our fallback implementation
      console.log('Using fallback implementation for fetching characters');
      
      // Check localStorage first
      const storedCharacters = localStorage.getItem('simpsonsCharacters');
      if (storedCharacters) {
        return JSON.parse(storedCharacters);
      }
      
      // If not in localStorage, fetch from API
      const response = await fetch('https://api.tvmaze.com/shows/83?embed=cast');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const showData = await response.json();
      const characters = showData._embedded.cast;
      const charactersWithImages = characters.filter(character => 
        character.character.image && character.character.image.medium
      );
      
      // Remove duplicates
      const uniqueCharacters = Array.from(
        new Map(charactersWithImages.map(char => [char.character.name, char])).values()
      );
      
      // Save to localStorage
      localStorage.setItem('simpsonsCharacters', JSON.stringify(uniqueCharacters));
      return uniqueCharacters;
      
    } catch (error) {
      console.error('Error fetching characters:', error);
      // Use mock data as a last resort
      return this.getMockCharacters();
    }
  }
  
  // Provide mock character data as a fallback
  getMockCharacters() {
    return [
      { character: { id: 1, name: 'Homer Simpson', image: { medium: 'img/homer.png' } } },
      { character: { id: 2, name: 'Marge Simpson', image: { medium: 'img/marge.png' } } },
      { character: { id: 3, name: 'Bart Simpson', image: { medium: 'img/bart.png' } } },
      { character: { id: 4, name: 'Lisa Simpson', image: { medium: 'img/lisa.png' } } },
      { character: { id: 5, name: 'Maggie Simpson', image: { medium: 'img/maggie.png' } } },
      { character: { id: 6, name: 'Ned Flanders', image: { medium: 'img/ned.png' } } },
      { character: { id: 7, name: 'Mr. Burns', image: { medium: 'img/burns.png' } } },
      { character: { id: 8, name: 'Moe Szyslak', image: { medium: 'img/moe.png' } } },
      { character: { id: 9, name: 'Krusty the Clown', image: { medium: 'img/krusty.png' } } },
      { character: { id: 10, name: 'Milhouse Van Houten', image: { medium: 'img/milhouse.png' } } },
      { character: { id: 11, name: 'Apu Nahasapeemapetilon', image: { medium: 'img/apu.png' } } },
      { character: { id: 12, name: 'Chief Wiggum', image: { medium: 'img/wiggum.png' } } }
    ];
  }
  
  // Create cards from characters
  createCards(characters) {
    // Shuffle and select characters based on difficulty
    const shuffledCharacters = this.shuffleArray([...characters]);
    const selectedCharacters = shuffledCharacters.slice(0, this.pairsCount);
    
    // Create pairs
    const cardPairs = [];
    selectedCharacters.forEach(castMember => {
      const character = castMember.character;
      
      // Create two identical cards (a pair)
      const card1 = new Card(character.id, character.name, character.image.medium);
      const card2 = new Card(character.id, character.name, character.image.medium);
      
      cardPairs.push(card1, card2);
    });
    
    // Shuffle all cards
    this.cards = this.shuffleArray(cardPairs);
    
    // Render cards
    this.renderCards();
  }
  
  // Render cards on the game board
  renderCards() {
    this.gameBoard.innerHTML = '';
    
    // Set grid CSS based on number of cards
    const columns = this.pairsCount <= 6 ? 4 : this.pairsCount <= 8 ? 4 : 6;
    this.gameBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    // Create and append card elements
    this.cards.forEach((card, index) => {
      const cardElement = card.createCardElement(index);
      cardElement.addEventListener('click', () => this.flipCard(index));
      this.gameBoard.appendChild(cardElement);
    });
  }
  
  // Handle card flip
  flipCard(index) {
    const card = this.cards[index];
    
    // Prevent clicking if game is locked or card is already flipped/matched
    if (this.isLocked || card.isFlipped || card.isMatched) return;
    
    // Flip the card
    if (!card.flip()) return;
    
    // Logic for checking matches
    if (!this.firstCard) {
      // First card flipped
      this.firstCard = card;
    } else {
      // Second card flipped
      this.secondCard = card;
      this.attempts++;
      this.updateStats();
      
      // Check for match
      this.checkForMatch();
    }
  }
  
  // Check if the two flipped cards match
  checkForMatch() {
    const isMatch = this.firstCard.id === this.secondCard.id;
    
    if (isMatch) {
      this.handleMatch();
    } else {
      this.handleMismatch();
    }
  }
  
  // Handle matching cards
  handleMatch() {
    this.firstCard.setMatched();
    this.secondCard.setMatched();
    this.matches++;
    this.updateStats();
    
    // Reset selection
    this.resetSelection();
    
    // Check for win
    if (this.matches === this.pairsCount) {
      this.handleWin();
    }
  }
  
  // Handle non-matching cards
  handleMismatch() {
    this.isLocked = true;
    
    // Flip back after a delay
    setTimeout(() => {
      this.firstCard.flip();
      this.secondCard.flip();
      this.resetSelection();
    }, 1000);
  }
  
  // Reset card selection
  resetSelection() {
    this.firstCard = null;
    this.secondCard = null;
    this.isLocked = false;
  }
  
  // Handle win condition
  handleWin() {
    // Stop the timer
    this.stopTimer();
    
    // Update results
    this.resultTimeElement.textContent = this.timerElement.textContent;
    this.resultAttemptsElement.textContent = this.attempts;
    
    // Show modal after a short delay
    setTimeout(() => {
      this.openModal();
    }, 1000);
  }
  
  // Start the timer
  startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
      const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
      const seconds = (elapsedTime % 60).toString().padStart(2, '0');
      this.timerElement.textContent = `${minutes}:${seconds}`;
    }, 1000);
  }
  
  // Stop the timer
  stopTimer() {
    clearInterval(this.timerInterval);
  }
  
  // Update game statistics
  updateStats() {
    this.attemptsElement.textContent = this.attempts;
    this.matchesElement.textContent = this.matches;
  }
  
  // Show a message in the game board
  showMessage(message) {
    // Check if message container exists
    let messageContainer = document.querySelector('.game-message');
    if (!messageContainer) {
      messageContainer = document.createElement('div');
      messageContainer.className = 'game-message';
      this.gameBoard.parentNode.insertBefore(messageContainer, this.gameBoard);
    }
    
    messageContainer.innerHTML = `<p>${message}</p>`;
    messageContainer.style.display = 'block';
  }
  
  // Hide the message
  hideMessage() {
    const messageContainer = document.querySelector('.game-message');
    if (messageContainer) {
      messageContainer.style.display = 'none';
    }
  }
  
  // Open the win modal
  openModal() {
    this.modal.style.display = 'block';
  }
  
  // Close the win modal
  closeModal() {
    this.modal.style.display = 'none';
  }
  
  // Shuffle an array (Fisher-Yates algorithm)
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Update navigation to include the new Games link in other pages
  const navLists = document.querySelectorAll('nav ul');
  navLists.forEach(navList => {
    // Check if we're not on the games page and the Games link doesn't exist yet
    if (!window.location.href.includes('games.html') && 
        !Array.from(navList.querySelectorAll('a')).some(a => a.href.includes('games.html'))) {
      
      // Find the position to insert the new link (before Contact)
      const contactLink = Array.from(navList.querySelectorAll('.nav-link')).find(li => 
        li.querySelector('a').href.includes('contact.html')
      );
      
      if (contactLink) {
        // Create and insert the new link
        const gamesLi = document.createElement('li');
        gamesLi.className = 'nav-link';
        gamesLi.innerHTML = '<a href="games.html">Juegos</a>';
        navList.insertBefore(gamesLi, contactLink);
      }
    }
  });
  
  // Create and initialize the memory game
  const game = new MemoryGame();
});