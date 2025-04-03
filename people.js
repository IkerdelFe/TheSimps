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
    // Comprobar localStorage
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
      
      const uniqueCharacters = Array.from(
        new Map(charactersWithImages.map(char => [char.character.name, char])).values()
      );
      
      // Guardar en localStorage
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
  
  async function drawSimpsonsFamily() {
    const characterContainer = document.getElementById("character-container");
    characterContainer.innerHTML = '<p>Loading Simpson family...</p>';
    
    try {
      const allCharacters = await getAllSimpsonsCharacters();
      const familyNames = ["Homer Simpson", "Marge Simpson", "Bart Simpson", "Lisa Simpson", "Maggie Simpson"];
      const familyMembers = allCharacters.filter(character => 
        familyNames.includes(character.character.name)
      );
      
      drawCharacterCards(familyMembers, characterContainer);
    } catch (error) {
      characterContainer.innerHTML = '<p>Error loading Simpson family members. Please try again.</p>';
    }
  }
  
  function drawCharacterCards(characters, container) {
    container.innerHTML = '';
    
    if (characters.length === 0) {
      container.innerHTML = '<p>No characters found with images.</p>';
      return;
    }
    
    characters.forEach(castMember => {
      const character = castMember.character;
      const characterCard = document.createElement('article');
      characterCard.className = 'fichaPersonaje';
      
      const imageUrl = character.image.medium;
      
      characterCard.innerHTML = `
        <img src="${imageUrl}" alt="${character.name}">
        <div class="infoPersonaje">
          <h3>${character.name}</h3>
          <a class="info_link" href="${character.url}" target="_blank">Info</a>
        </div>
      `;
      
      container.appendChild(characterCard);
    });
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const characterContainer = document.getElementById("character-container");
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'character-name';
    searchInput.placeholder = 'Search by character name';
    
    const searchButton = document.createElement('button');
    searchButton.id = 'search-character';
    searchButton.textContent = 'Search Character';
    
    const controlsDiv = document.querySelector('.controls');
    controlsDiv.prepend(searchButton);
    controlsDiv.prepend(searchInput);
    
    const fetchFamilyButton = document.getElementById('fetch-family');
    if (fetchFamilyButton) {
      fetchFamilyButton.addEventListener('click', drawSimpsonsFamily);
    }
    
    searchButton.addEventListener('click', async () => {
      const searchName = searchInput.value.trim();
      if (searchName) {
        characterContainer.innerHTML = '<p>Searching characters...</p>';
        
        try {
          const allCharacters = await getAllSimpsonsCharacters();
          const foundCharacters = findCharacterByName(allCharacters, searchName);
          
          drawCharacterCards(foundCharacters, characterContainer);
          
          // Guardar búsqueda reciente en localStorage
          localStorage.setItem('lastSearch', searchName);
        } catch (error) {
          characterContainer.innerHTML = '<p>Error searching characters. Please try again.</p>';
        }
      } else {
        alert('Please enter a character name');
      }
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchButton.click();
      }
    });
    
    const fetchAllButton = document.getElementById('fetch-all');
    if (fetchAllButton) {
      fetchAllButton.addEventListener('click', async () => {
        characterContainer.innerHTML = '<p>Loading all characters with images...</p>';
        
        try {
          const allCharacters = await getAllSimpsonsCharacters();
          drawCharacterCards(allCharacters, characterContainer);
        } catch (error) {
          characterContainer.innerHTML = '<p>Error loading characters. Please try again.</p>';
        }
      });
    }
    
    // Recuperar última búsqueda
    const lastSearch = localStorage.getItem('lastSearch');
    if (lastSearch) {
      searchInput.value = lastSearch;
    }
  });