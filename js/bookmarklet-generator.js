document.addEventListener("DOMContentLoaded", function () {
  const bookmarkletLink = document.getElementById("bookmarklet-link");

  // Get the current site URL for the teleprompter
  const teleprompterURL = window.location.origin + window.location.pathname;

  // Create a super-compact bookmarklet that will work across browsers
  const bookmarkletCode = `javascript:(function(){
    if(!window.location.hostname.includes('ultimate-guitar.com')){alert('Only works on Ultimate Guitar');return;}
    var t,a,c,s={};
    t=document.querySelector('h1')?document.querySelector('h1').innerText:'Unknown Song';
    a=document.querySelector('[class*="artist"]')?document.querySelector('[class*="artist"]').innerText:'Unknown Artist';
    try{
      c=window.UGAPP&&window.UGAPP.store&&window.UGAPP.store.page&&window.UGAPP.store.page.data&&window.UGAPP.store.page.data.tab_view?window.UGAPP.store.page.data.tab_view.wiki_tab.content:'';
      if(!c){
        var e=document.querySelector('.js-tab-content, pre.tab-content');
        c=e?e.innerText:'';
      }
      if(!c){alert('Could not extract song content');return;}
      s={title:t,artist:a,content:c,type:'Chords'};
      window.open('${teleprompterURL}?songData='+encodeURIComponent(JSON.stringify(s)),'_blank');
    }catch(e){alert('Error: '+e.message);}
  })();`;

  // Set the href directly with the minimal bookmarklet code
  bookmarkletLink.setAttribute("href", bookmarkletCode);

  // Make the bookmarklet link more visually distinct
  bookmarkletLink.classList.add("drag-me");

  // Add better drag instructions
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
      "Don't click this link - drag it to your browser's bookmarks bar instead. Then, when viewing an Ultimate Guitar tab, click the bookmark to extract the song."
    );
  });
});
