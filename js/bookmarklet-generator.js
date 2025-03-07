document.addEventListener("DOMContentLoaded", function () {
  const bookmarkletLink = document.getElementById("bookmarklet-link");

  // Get the current site URL for the teleprompter
  const teleprompterURL = window.location.origin + window.location.pathname;

  // Create an ultra-minimal bookmarklet with simpler code structure
  const bookmarkletCode = `javascript:(function(){
    try{
      if(!window.location.hostname.includes('ultimate-guitar.com')){
        alert('Only works on Ultimate Guitar');
        return;
      }
      
      // Basic extraction
      var t = document.querySelector('h1') ? document.querySelector('h1').innerText : 'Unknown Song';
      var a = document.querySelector('[class*="artist"]') ? document.querySelector('[class*="artist"]').innerText : 'Unknown Artist';
      var c = '';
      
      // Get content from UGAPP store
      if(window.UGAPP && window.UGAPP.store && window.UGAPP.store.page && window.UGAPP.store.page.data) {
        c = window.UGAPP.store.page.data.tab_view.wiki_tab.content || '';
      }
      
      // Fallback to tab content
      if(!c) {
        var e = document.querySelector('.js-tab-content, pre.tab-content');
        c = e ? e.innerText : '';
      }
      
      if(!c) {
        alert('Could not extract song content');
        return;
      }
      
      // Simple and direct localStorage approach
      var id = 'meatSong_' + Date.now();
      localStorage.setItem(id, JSON.stringify({title:t, artist:a, content:c}));
      
      // Show success message
      var msg = document.createElement('div');
      msg.style = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:9999;background:#4CAF50;color:white;padding:10px;border-radius:4px';
      msg.textContent = 'Song extracted! Opening teleprompter...';
      document.body.appendChild(msg);
      
      // Open teleprompter
      window.open('${teleprompterURL}?songId=' + id, '_blank');
    }catch(e){
      alert('Error: ' + e.message);
    }
  })();`;

  // Set the href directly - no minification needed
  bookmarkletLink.setAttribute("href", bookmarkletCode);

  // Add better visual styling for the bookmarklet
  const container = document.querySelector(".bookmarklet-container");
  container.innerHTML = `
    <p><strong>Drag</strong> this button to your bookmarks bar:</p>
    <div class="drag-instruction">
      <a id="bookmarklet-link" href="#">Meat Smoothie</a>
      <span class="drag-arrow">← Drag to bookmarks</span>
    </div>
    <p class="bookmarklet-instructions">
      When viewing a song on Ultimate Guitar, click this bookmark to send it to the teleprompter.
    </p>
  `;

  // Re-select the link after changing the HTML
  const updatedLink = document.getElementById("bookmarklet-link");
  updatedLink.setAttribute("href", bookmarkletCode);

  // Add warning when clicked instead of dragged
  updatedLink.addEventListener("click", function (e) {
    e.preventDefault();
    alert(
      "Don't click this link - drag it to your browser's bookmarks bar instead."
    );
  });
});
