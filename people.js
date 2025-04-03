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
  