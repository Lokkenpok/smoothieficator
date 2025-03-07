document.addEventListener("DOMContentLoaded", function () {
  const bookmarkletLink = document.getElementById("bookmarklet-link");

  // Get the current site URL for the teleprompter
  const teleprompterURL = window.location.origin + window.location.pathname;

  // Ultra-minimal bookmarklet that uses the very simplest syntax
  const bookmarkletCode = `javascript:
(function(){
  // Simple extraction function that won't break
  var d=document;
  var t=d.querySelector('h1')?d.querySelector('h1').innerText:'Unknown Song';
  var a=d.querySelector('[class*="artist"]')?d.querySelector('[class*="artist"]').innerText:'Unknown Artist';
  
  // Show user feedback
  var o=d.createElement('div');
  o.style.cssText='position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:9999;background:#ff6b6b;color:#fff;padding:10px;border-radius:4px';
  o.innerHTML='Extracting song...';
  d.body.appendChild(o);
  
  try{
    // Get content from page
    var c='';
    var tab=d.querySelector('.js-tab-content, pre.tab-content');
    if(tab) c=tab.innerText;
    
    if(!c && window.UGAPP) c=window.UGAPP.store.page.data.tab_view.wiki_tab.content;
    
    if(!c){
      o.innerHTML='Could not extract song content';
      o.style.background='#F44336';
      setTimeout(function(){d.body.removeChild(o)},3000);
      return;
    }
    
    o.innerHTML='Opening teleprompter...';
    o.style.background='#4CAF50';
    
    // Create a simple data object and send to teleprompter
    var data={title:t,artist:a,content:c};
    var url='${teleprompterURL}?songData='+encodeURIComponent(JSON.stringify(data));
    
    // Open in new tab with limited URL length
    setTimeout(function(){
      window.open(url,'_blank');
      setTimeout(function(){d.body.removeChild(o)},1000);
    },500);
  }catch(e){
    o.innerHTML='Error: '+e.message;
    o.style.background='#F44336';
    setTimeout(function(){d.body.removeChild(o)},3000);
  }
})();`;

  // Set the href without further processing
  bookmarkletLink.setAttribute("href", bookmarkletCode);

  // Keep the current bookmarklet UI since it looks good
  // But modify the instructions to be more clear
  const instructionsDiv = document.querySelector(".bookmarklet-instructions");
  if (instructionsDiv) {
    instructionsDiv.innerHTML = `
      <ol>
        <li>First, <strong>reveal your bookmarks bar</strong> in your browser if it's not visible (Ctrl+Shift+B in most browsers)</li>
        <li><strong>Drag</strong> the button above to your bookmarks bar - don't click it!</li>
        <li>Visit any Ultimate Guitar chord or tab page</li>
        <li>Click the bookmark you just created in your bookmarks bar</li>
        <li>The song will open in this teleprompter automatically</li>
      </ol>
    `;
  }

  // Add click warning
  bookmarkletLink.addEventListener("click", function (e) {
    e.preventDefault();
    alert("Don't click this button! Instead, drag it to your bookmarks bar.");
  });
});
