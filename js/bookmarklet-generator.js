document.addEventListener("DOMContentLoaded", function () {
  const bookmarkletLink = document.getElementById("bookmarklet-link");

  // Get the current site URL for the teleprompter
  const teleprompterURL = window.location.origin + window.location.pathname;

  // Create an absolutely minimal bookmarklet that will work everywhere
  const bookmarkletCode = `javascript:(function(){
    var d=document;
    if(!location.hostname.includes('ultimate-guitar.com')){
      alert('This only works on Ultimate Guitar pages');
      return;
    }
    
    // Add visual feedback that we're working
    var overlay=d.createElement('div');
    overlay.style='position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#ff6b6b;color:#fff;padding:10px;border-radius:4px;z-index:9999;font-weight:bold';
    overlay.textContent='Extracting song data...';
    d.body.appendChild(overlay);
    
    try{
      // Extract basic info (most reliable first)
      var title=d.querySelector('h1')?.innerText||'Unknown Song';
      var artist=d.querySelector('[class*="artist"]')?.innerText||'Unknown Artist';
      var content='';
      
      // Try the most common content sources from most to least reliable
      // Method 1: Direct tab content element
      var tabContent=d.querySelector('.js-tab-content, [data-content="tab"], pre.tab-content, div.tb-b');
      if(tabContent){
        content=tabContent.innerText||tabContent.textContent||'';
      }
      
      // Method 2: Global UGAPP store
      if(!content && window.UGAPP && window.UGAPP.store?.page?.data?.tab_view?.wiki_tab?.content){
        content=window.UGAPP.store.page.data.tab_view.wiki_tab.content;
      }
      
      // Method 3: Last resort - grab the main content area
      if(!content){
        var mainContent=d.querySelector('div[class*="Tablature"], main');
        if(mainContent){
          var clone=mainContent.cloneNode(true);
          // Remove irrelevant elements from the clone
          var toRemove=clone.querySelectorAll('header,footer,nav,script,style,noscript,iframe,ins');
          toRemove.forEach(function(el){ el.parentNode.removeChild(el); });
          content=clone.innerText||clone.textContent||'';
        }
      }
      
      if(!content){
        throw new Error('Could not extract song content');
      }
      
      // Create storage ID and store data
      var id='ug_'+Math.floor(Math.random()*1000000);
      var data=JSON.stringify({title:title,artist:artist,content:content});
      
      // Store in sessionStorage instead of localStorage for better privacy
      sessionStorage.setItem(id,data);
      
      // Update overlay
      overlay.textContent='Song extracted! Opening teleprompter...';
      overlay.style.background='#4CAF50';
      
      // Open the teleprompter with our stored ID
      setTimeout(function(){
        window.open('${teleprompterURL}?songId='+id,'_blank');
      }, 500);
    }catch(e){
      overlay.textContent='Error: '+e.message;
      overlay.style.background='#F44336';
      setTimeout(function(){ d.body.removeChild(overlay); }, 3000);
    }
  })();`;

  // Set the bookmarklet link href
  bookmarkletLink.setAttribute("href", bookmarkletCode);

  // Update the bookmarklet UI for better user experience
  const container = document.querySelector(".bookmarklet-container");
  container.innerHTML = `
    <h3>Chord Extractor Bookmarklet</h3>
    <p>Drag this button to your bookmarks bar:</p>
    <div class="drag-instruction">
      <a id="bookmarklet-link" href="#" class="bookmarklet-button">Ultimate Guitar Extractor</a>
      <span class="drag-arrow">← Drag this to your bookmarks bar</span>
    </div>
    <div class="bookmarklet-instructions">
      <ol>
        <li>Drag the button above to your browser's bookmarks bar</li>
        <li>Navigate to any Ultimate Guitar chord or tab page</li>
        <li>Click the bookmarklet in your bookmarks bar</li>
        <li>The song will open in the teleprompter automatically</li>
      </ol>
    </div>
  `;

  // Re-select the link after updating the HTML
  const updatedLink = document.getElementById("bookmarklet-link");
  updatedLink.setAttribute("href", bookmarkletCode);

  // Add click listener with warning
  updatedLink.addEventListener("click", function (e) {
    e.preventDefault();
    alert("Don't click this link - drag it to your bookmarks bar instead!");
  });
});
