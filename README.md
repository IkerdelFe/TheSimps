# TheSimps
Homer Simpson's unofficial webpage

# Overview
This web application is an interactive platform dedicated to The Simpsons, featuring character exploration, information, and a memory game. The project demonstrates object-oriented JavaScript programming, DOM manipulation, API consumption, and local data persistence.

# Features
Browse the complete cast of The Simpsons show
Search for specific characters by name
Filter to show only the Simpson family members
Save favorite characters using localStorage
Display character details with images pulled from the TVMaze API

# DOM Manipulation
Dynamic creation and updating of character cards
Interactive memory game board generation based on difficulty
Real-time statistics updates without page reloads
Modal dialogs for game completion
Event handling for user interactions

# API Integration
Fetches character data from the TVMaze API
Caches responses in localStorage for improved performance
Graceful fallback to mock data when API is unavailable
Proper error handling for failed requests

# Data Persistence
Saves favorite characters to localStorage
Caches API responses to reduce network requests
Remembers last search query between sessions
Stores game statistics for returning players

# Memory Game 
Three difficulty levels: Easy (6 pairs), Medium (8 pairs), and Hard (12 pairs)
Interactive card flipping with animations
Game statistics tracking (attempts, matches, timer)
Win detection with congratulations modal
Persistent high scores using localStorage
Responsive design for various screen sizes

# Technologies Used
Vanilla JavaScript (ES6+)
HTML5 & CSS3
Fetch API
Local Storage
Font Awesome for icons

# Future Enhancements
Dark/Light mode toggle
User authentication with Firebase
Additional games and interactive features
Localization support for multiple languages
Expanded character information and trivia
