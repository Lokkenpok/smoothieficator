document.addEventListener("DOMContentLoaded", function () {
  const bookmarkletLink = document.getElementById("bookmarklet-link");

  // Get the base URL for our site - extract the path correctly
  const baseUrl = window.location.origin;
  const pathSegments = window.location.pathname.split("/");
  // Remove the last segment (index.html or empty string if at root)
  pathSegments.pop();
  const basePath = pathSegments.join("/");

  // Create the full URL to the extractor
  const extractorUrl = `${baseUrl}${basePath}/extractor.html`;

  // Create a tiny bookmarklet that just opens our extraction page with the correct path
  const bookmarkletCode = `javascript:(function(){
    var url='${extractorUrl}?url='+encodeURIComponent(window.location.href);
    window.open(url,'MeatSmoothieExtractor','width=500,height=600');
  })();`;

  // Set the href attribute to the bookmarklet code
  bookmarkletLink.setAttribute("href", bookmarkletCode);

  // Update the bookmarklet UI with the correct path in the explanation
  const container = document.querySelector(".bookmarklet-container");
  container.innerHTML = `
    <h3>The Easiest Way to Extract Songs</h3>
    <p>Drag this button to your bookmarks bar:</p>
    <div class="drag-instruction">
      <a id="bookmarklet-link" href="#" class="bookmarklet-button">Get Song</a>
      <span class="drag-arrow">← Drag to your bookmarks</span>
    </div>
    <div class="bookmarklet-instructions">
      <ol>
        <li>First, make sure your <strong>bookmarks bar is visible</strong> (press Ctrl+Shift+B)</li>
        <li><strong>Drag</strong> the button above to your bookmarks bar</li>
        <li>When viewing any song on Ultimate Guitar, click the bookmark</li>
        <li>In the popup window, click "Extract & Open in Teleprompter"</li>
      </ol>
      <p><small>Extractor path: ${extractorUrl}</small></p>
    </div>
  `;

  // Re-attach the href to the new link
  const updatedLink = document.getElementById("bookmarklet-link");
  updatedLink.setAttribute("href", bookmarkletCode);

  // Add click warning
  updatedLink.addEventListener("click", function (e) {
    e.preventDefault();
    alert("Don't click this link! Drag it to your bookmarks bar instead.");
  });
});
