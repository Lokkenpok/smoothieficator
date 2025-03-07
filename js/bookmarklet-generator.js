document.addEventListener("DOMContentLoaded", function () {
  const bookmarkletLink = document.getElementById("bookmarklet-link");

  // Get the current site URL for the teleprompter
  const teleprompterURL = window.location.origin + window.location.pathname;

  // Bookmarklet code to be executed on Ultimate Guitar
  const bookmarkletCode = `
    (function() {
      // Check if we're on Ultimate Guitar
      if (!window.location.hostname.includes('ultimate-guitar.com')) {
        alert('This bookmarklet only works on Ultimate Guitar pages.');
        return;
      }
      
      try {
        // Try to find the song content container
        const songContainer = document.querySelector('.js-store');
        
        if (!songContainer) {
          alert('Could not find song data on this page.');
          return;
        }
        
        // Get the song data from UG's data store
        const storeContent = songContainer.getAttribute('data-content');
        if (!storeContent) {
          alert('Could not extract song data.');
          return;
        }
        
        const storeData = JSON.parse(storeContent);
        const songData = storeData.store.page.data;
        
        // Extract song information
        const songInfo = {
          title: songData.tab.song_name || 'Unknown Song',
          artist: songData.tab.artist_name || 'Unknown Artist',
          content: songData.tab_view.wiki_tab.content || '',
          type: songData.tab.type || ''
        };
        
        // Encode the song data to pass through URL
        const encodedData = encodeURIComponent(JSON.stringify(songInfo));
        
        // Open the teleprompter with the song data
        window.open('${teleprompterURL}?songData=' + encodedData, '_blank');
      } catch (error) {
        alert('Error extracting song: ' + error.message);
      }
    })();
  `;

  // Create the bookmarklet URL by minifying the code
  const minifiedCode = bookmarkletCode.replace(/\s+/g, " ").trim();
  const bookmarkletURL = "javascript:" + encodeURIComponent(minifiedCode);

  // Set the href of the bookmarklet link
  bookmarkletLink.setAttribute("href", bookmarkletURL);
});
