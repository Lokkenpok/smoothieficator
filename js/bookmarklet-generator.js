document.addEventListener("DOMContentLoaded", function () {
  const bookmarkletLink = document.getElementById("bookmarklet-link");

  // Get the current site URL for the teleprompter
  const teleprompterURL = window.location.origin + window.location.pathname;

  // Create a fully self-contained bookmarklet with all extraction logic inline
  const bookmarkletCode = `
    javascript:(function(){
      if(!window.location.hostname.includes('ultimate-guitar.com')){
        alert('This bookmarklet only works on Ultimate Guitar pages.');
        return;
      }
      
      // Create and show extraction indicator
      var indicator = document.createElement('div');
      indicator.style.position = 'fixed';
      indicator.style.top = '10px';
      indicator.style.left = '50%';
      indicator.style.transform = 'translateX(-50%)';
      indicator.style.zIndex = '9999';
      indicator.style.background = '#ff6b6b';
      indicator.style.color = 'white';
      indicator.style.padding = '10px 20px';
      indicator.style.borderRadius = '4px';
      indicator.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      indicator.style.fontWeight = 'bold';
      indicator.textContent = 'Extracting song data...';
      document.body.appendChild(indicator);
      
      try{
        var title = document.querySelector("h1") ? document.querySelector("h1").innerText : "";
        var artist = document.querySelector('[class*="artist"]') ? document.querySelector('[class*="artist"]').innerText : 
                   (document.querySelector('[class*="header"]') && document.querySelector('[class*="header"]').querySelectorAll('a').length > 0) ? 
                   document.querySelector('[class*="header"]').querySelectorAll('a')[0].innerText : 
                   "Unknown Artist";
        
        var content = "";
        var type = "Chords";
        
        // Method 1: Try UGAPP global object (modern UG)
        if(window.UGAPP && window.UGAPP.store && window.UGAPP.store.page && 
            window.UGAPP.store.page.data && window.UGAPP.store.page.data.tab_view){
          content = window.UGAPP.store.page.data.tab_view.wiki_tab.content;
          type = window.UGAPP.store.page.data.tab.type || "Chords";
          title = window.UGAPP.store.page.data.tab.song_name || title;
          artist = window.UGAPP.store.page.data.tab.artist_name || artist;
        }
        
        // Method 2: Find the store data in attributes
        if(!content){
          var dataElements = document.querySelectorAll('[data-content]');
          for(var i = 0; i < dataElements.length; i++){
            try{
              var el = dataElements[i];
              var data = JSON.parse(el.getAttribute('data-content'));
              if(data.store && data.store.page && data.store.page.data){
                content = data.store.page.data.tab_view.wiki_tab.content;
                type = data.store.page.data.tab.type || "Chords";
                title = data.store.page.data.tab.song_name || title;
                artist = data.store.page.data.tab.artist_name || artist;
                break;
              }
            }catch(e){}
          }
        }
        
        // Method 3: Try to find the js-store element
        if(!content){
          var storeElement = document.querySelector('.js-store');
          if(storeElement && storeElement.hasAttribute('data-content')){
            try{
              var storeData = JSON.parse(storeElement.getAttribute('data-content'));
              if(storeData.store && storeData.store.page && storeData.store.page.data){
                content = storeData.store.page.data.tab_view.wiki_tab.content;
                type = storeData.store.page.data.tab.type || "Chords";
                title = storeData.store.page.data.tab.song_name || title;
                artist = storeData.store.page.data.tab.artist_name || artist;
              }
            }catch(e){}
          }
        }
        
        // Method 4: Look for content in prerender element
        if(!content){
          var tabElement = document.querySelector('.js-tab-content, [data-content="tab"], .tab-content, pre');
          if(tabElement){
            content = tabElement.innerText || tabElement.textContent;
          }
        }
        
        // Method 5: Direct extraction from rendered tab content
        if(!content){
          var tabContent = document.querySelector('.js-page-content');
          if(tabContent){
            // Remove the chord diagrams and other UI elements
            var clone = tabContent.cloneNode(true);
            var toRemove = clone.querySelectorAll('.chord-diagrams, .usr-profile, .comments');
            for(var i = 0; i < toRemove.length; i++){
              toRemove[i].remove();
            }
            content = clone.textContent.trim();
          }
        }
        
        // Check if we got any content
        if(!content || content.trim() === ""){
          throw new Error("Could not extract song content");
        }
        
        // Clean title if needed
        if(title.includes(" by ")){
          var parts = title.split(" by ");
          title = parts[0].trim();
          if(!artist || artist === "Unknown Artist"){
            artist = parts[1].trim();
          }
        }
        
        // Create the song info object
        var songInfo = {
          title: title || "Unknown Song",
          artist: artist || "Unknown Artist",
          content: content,
          type: type
        };
        
        // Update indicator
        indicator.textContent = "Song extracted! Opening teleprompter...";
        indicator.style.background = "#4CAF50";
        
        // Encode the song data to pass through URL
        var encodedData = encodeURIComponent(JSON.stringify(songInfo));
        
        // Open the teleprompter with the song data
        setTimeout(function() {
          window.open('${teleprompterURL}?songData=' + encodedData, '_blank');
          // Remove the indicator after opening teleprompter
          setTimeout(function() {
            document.body.removeChild(indicator);
          }, 1000);
        }, 500);
      }catch(error){
        indicator.textContent = "Error: " + error.message;
        indicator.style.background = "#F44336";
        setTimeout(function() {
          document.body.removeChild(indicator);
        }, 3000);
      }
    })();
  `;

  // Minify the code properly
  const minifiedCode = bookmarkletCode
    .replace(/\s+/g, " ") // Replace all whitespace with a single space
    .replace(/\/\/.*?(?=\n|$)/g, "") // Remove comments
    .replace(/^\s+|\s+$/g, ""); // Trim start and end

  // Set the href attribute to the bookmarklet code
  bookmarkletLink.setAttribute("href", minifiedCode);

  // Add instructions about how to install the bookmarklet
  bookmarkletLink.addEventListener("click", function (e) {
    e.preventDefault();
    alert(
      "To install the bookmarklet: Right-click this link, select 'Add to bookmarks' or 'Bookmark this link'. When viewing a song on Ultimate Guitar, click this bookmark to extract the song."
    );

    console.log(
      "Bookmarklet length:",
      minifiedCode.length,
      "chars (if over 2000 chars, it may be too long for some browsers)"
    );
  });
});
