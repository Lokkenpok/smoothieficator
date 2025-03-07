document.addEventListener("DOMContentLoaded", function () {
  const bookmarkletLink = document.getElementById("bookmarklet-link");

  // Get the current site URL for the teleprompter
  const teleprompterURL = window.location.origin + window.location.pathname;

  // Create a super-compact bookmarklet that will work across browsers
  const bookmarkletCode = `javascript:(function(){
    if(!window.location.hostname.includes('ultimate-guitar.com')){alert('Only works on Ultimate Guitar');return;}
    var t,a,c,s,id;
    t=document.querySelector('h1')?document.querySelector('h1').innerText:'Unknown Song';
    a=document.querySelector('[class*="artist"]')?document.querySelector('[class*="artist"]').innerText:'Unknown Artist';
    try{
      // Show extraction indicator
      var ind=document.createElement('div');
      ind.style.position='fixed';ind.style.top='10px';ind.style.left='50%';
      ind.style.transform='translateX(-50%)';ind.style.zIndex='9999';
      ind.style.background='#ff6b6b';ind.style.color='white';
      ind.style.padding='10px 20px';ind.style.borderRadius='4px';
      ind.style.boxShadow='0 2px 8px rgba(0,0,0,0.3)';
      ind.textContent='Extracting song...';
      document.body.appendChild(ind);
      
      // Extract content
      c=window.UGAPP&&window.UGAPP.store&&window.UGAPP.store.page&&
        window.UGAPP.store.page.data&&window.UGAPP.store.page.data.tab_view?
        window.UGAPP.store.page.data.tab_view.wiki_tab.content:'';
      if(!c){
        var e=document.querySelector('.js-tab-content, pre.tab-content');
        c=e?e.innerText:'';
      }
      if(!c){alert('Could not extract song content');return;}
      
      // Create unique ID for this song
      id='ugSong_'+Math.random().toString(36).substring(2,10);
      
      // Create the song data object
      s={title:t,artist:a,content:c,type:'Chords'};
      
      // Store song in localStorage
      localStorage.setItem(id,JSON.stringify(s));
      
      // Update indicator
      ind.textContent='Opening teleprompter...';
      ind.style.background='#4CAF50';
      
      // Open teleprompter with ID reference instead of full content
      window.open('${teleprompterURL}?songId='+id,'_blank');
      
      // Set timeout to remove the stored song data after 5 minutes
      setTimeout(function(){
        localStorage.removeItem(id);
      }, 300000); // 5 minutes
    }catch(e){alert('Error: '+e.message);}
  })();`;

  // Set the href directly with the minimal bookmarklet code
  bookmarkletLink.setAttribute("href", bookmarkletCode);

  // Re-select the link after changing the HTML
  const updatedLink = document.getElementById("bookmarklet-link");

  // Add warning when clicked instead of dragged
  updatedLink.addEventListener("click", function (e) {
    e.preventDefault();
    alert(
      "Don't click this link - drag it to your browser's bookmarks bar instead. Then, when viewing an Ultimate Guitar tab, click the bookmark to extract the song."
    );
  });
});
