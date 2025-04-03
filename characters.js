async function getSimpsonsShow() {
    try {
      const response = await fetch('https://api.tvmaze.com/shows/83?embed=cast');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const showData = await response.json();
      return showData;
    } catch (error) {
      console.error("Error fetching Simpsons show data:", error);
      throw error;
    }
  }
  
  async function getAllSimpsonsCharacters() {
    // Check localStorage for cached data
    const storedCharacters = localStorage.getItem('simpsonsCharacters');
    if (storedCharacters) {
      return JSON.parse(storedCharacters);
    }
    
    try {
      const showData = await getSimpsonsShow();
      const characters = showData._embedded.cast;
      const charactersWithImages = characters.filter(character => 
        character.character.image && character.character.image.medium
      );
      
      // Remove duplicates based on character name
      const uniqueCharacters = Array.from(
        new Map(charactersWithImages.map(char => [char.character.name, char])).values()
      );
      
      // Save to localStorage for future requests
      localStorage.setItem('simpsonsCharacters', JSON.stringify(uniqueCharacters));
      return uniqueCharacters;
    } catch (error) {
      console.error("Error getting characters:", error);
      throw error;
    }
  }
  
  function findCharacterByName(characters, name) {
    const searchName = name.toLowerCase();
    return characters.filter(character => 
      character.character.name.toLowerCase().includes(searchName)
    );
  }
  
  // Get favorites from localStorage
  function getFavorites() {
    const favorites = localStorage.getItem('simpsonsFavorites');
    return favorites ? JSON.parse(favorites) : [];
  }
  
  // Save favorites to localStorage
  function saveFavorites(favorites) {
    localStorage.setItem('simpsonsFavorites', JSON.stringify(favorites));
  }
  
  // Check if a character is a favorite
  function isFavorite(characterId) {
    const favorites = getFavorites();
    return favorites.includes(characterId);
  }
  
  // Toggle favorite status for a character
  function toggleFavorite(characterId) {
    const favorites = getFavorites();
    const index = favorites.indexOf(characterId);
    
    if (index === -1) {
      favorites.push(characterId);
    } else {
      favorites.splice(index, 1);
    }
    
    saveFavorites(favorites);
    return index === -1; // Return true if was added, false if was removed
  }
  
  // Filter characters to show only favorites
  function filterFavorites(characters) {
    const favorites = getFavorites();
    return characters.filter(character => 
      favorites.includes(character.character.id)
    );
  }
  
  async function drawSimpsonsFamily() {
    const characterContainer = document.getElementById("character-container");
    characterContainer.innerHTML = '<p>Loading Simpson family...</p>';
    
    try {
      const allCharacters = await getAllSimpsonsCharacters();
      const familyNames = ["Homer Simpson", "Marge Simpson", "Bart Simpson", "Lisa Simpson", "Maggie Simpson"];
      const familyMembers = allCharacters.filter(character => 
        familyNames.includes(character.character.name)
      );
      
      if (familyMembers.length === 0) {
        characterContainer.innerHTML = '<p>Could not find Simpson family members with images.</p>';
        return;
      }
      
      drawCharacterCards(familyMembers, characterContainer);
    } catch (error) {
      characterContainer.innerHTML = '<p>Error loading Simpson family members. Please try again.</p>';
      console.error("Error loading Simpson family:", error);
    }
  }
  
  async function drawFavoriteCharacters() {
    const characterContainer = document.getElementById("character-container");
    characterContainer.innerHTML = '<p>Loading favorite characters...</p>';
    
    try {
      const allCharacters = await getAllSimpsonsCharacters();
      const favoriteCharacters = filterFavorites(allCharacters);
      
      if (favoriteCharacters.length === 0) {
        characterContainer.innerHTML = '<p>You have no favorite characters yet. Click the heart icon on characters to add them to favorites.</p>';
        return;
      }
      
      drawCharacterCards(favoriteCharacters, characterContainer);
    } catch (error) {
      characterContainer.innerHTML = '<p>Error loading favorite characters. Please try again.</p>';
      console.error("Error loading favorites:", error);
    }
  }
  
  function drawCharacterCards(characters, container) {
    container.innerHTML = '';
    
    if (characters.length === 0) {
      container.innerHTML = '<p>No characters found with images.</p>';
      return;
    }
    
    // Add results counter
    const resultsCounter = document.createElement('div');
    resultsCounter.className = 'results-counter';
    resultsCounter.textContent = `Found ${characters.length} character${characters.length !== 1 ? 's' : ''}`;
    container.appendChild(resultsCounter);
    
    characters.forEach(castMember => {
      const character = castMember.character;
      if (!character.image || !character.image.medium) {
        return; // Skip characters without images
      }
      
      const characterCard = document.createElement('article');
      characterCard.className = 'fichaPersonaje';
      characterCard.dataset.characterId = character.id;
      
      const imageUrl = character.image.medium;
      const isFav = isFavorite(character.id);
      
      characterCard.innerHTML = `
        <img src="${imageUrl}" alt="${character.name}">
        <div class="infoPersonaje">
          <h3>${character.name}</h3>
          <div class="character-actions">
            <a class="info_link" href="${character.url}" target="_blank">Info</a>
            <button class="favorite-btn ${isFav ? 'favorite' : ''}" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
              <i class="fas fa-heart"></i>
            </button>
          </div>
        </div>
      `;
      
      // Add event listener to the favorite button
      const favoriteBtn = characterCard.querySelector('.favorite-btn');
      favoriteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isNowFavorite = toggleFavorite(character.id);
        favoriteBtn.classList.toggle('favorite', isNowFavorite);
        favoriteBtn.setAttribute('aria-label', isNowFavorite ? 'Remove from favorites' : 'Add to favorites');
      });
      
      container.appendChild(characterCard);
    });
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const characterContainer = document.getElementById("character-container");
    const controlsDiv = document.querySelector('.controls');
    
    if (!characterContainer || !controlsDiv) {
      console.error("Required DOM elements not found");
      return;
    }
    
    // Create search input and button
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'character-name';
    searchInput.placeholder = 'Search by character name';
    
    const searchButton = document.createElement('button');
    searchButton.id = 'search-character';
    searchButton.textContent = 'Search Character';
    
    // Create favorites button
    const favoritesButton = document.createElement('button');
    favoritesButton.id = 'fetch-favorites';
    favoritesButton.textContent = 'Favorites';
    
    // Add search elements to controls div
    controlsDiv.prepend(searchButton);
    controlsDiv.prepend(searchInput);
    
    // Add favorites button after the existing buttons
    const fetchAllButton = document.getElementById('fetch-all');
    if (fetchAllButton) {
      controlsDiv.insertBefore(favoritesButton, fetchAllButton.nextSibling);
    } else {
      controlsDiv.appendChild(favoritesButton);
    }
    
    // Set up event handlers
    const fetchFamilyButton = document.getElementById('fetch-family');
    if (fetchFamilyButton) {
      fetchFamilyButton.addEventListener('click', drawSimpsonsFamily);
    }
    
    // Add event listener to favorites button
    favoritesButton.addEventListener('click', drawFavoriteCharacters);
    
    const handleSearch = async () => {
      const searchName = searchInput.value.trim();
      if (searchName) {
        characterContainer.innerHTML = '<p>Searching characters...</p>';
        
        try {
          const allCharacters = await getAllSimpsonsCharacters();
          const foundCharacters = findCharacterByName(allCharacters, searchName);
          
          drawCharacterCards(foundCharacters, characterContainer);
          
          // Save recent search to localStorage
          localStorage.setItem('lastSearch', searchName);
        } catch (error) {
          characterContainer.innerHTML = '<p>Error searching characters. Please try again.</p>';
          console.error("Search error:", error);
        }
      } else {
        alert('Please enter a character name');
      }
    };
    
    searchButton.addEventListener('click', handleSearch);
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });
    
    if (fetchAllButton) {
      fetchAllButton.addEventListener('click', async () => {
        characterContainer.innerHTML = '<p>Loading all characters with images...</p>';
        
        try {
          const allCharacters = await getAllSimpsonsCharacters();
          drawCharacterCards(allCharacters, characterContainer);
        } catch (error) {
          characterContainer.innerHTML = '<p>Error loading characters. Please try again.</p>';
          console.error("Error loading all characters:", error);
        }
      });
    }
    
    // Restore last search from localStorage
    const lastSearch = localStorage.getItem('lastSearch');
    if (lastSearch) {
      searchInput.value = lastSearch;
    }
    

  });