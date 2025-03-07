document.addEventListener("DOMContentLoaded", function () {
  const bookmarkletLink = document.getElementById("bookmarklet-link");

  // Get the current site URL base
  const baseUrl = window.location.origin;

  // Create a very simple bookmarklet that loads our extractor script
  const bookmarkletCode = `javascript:(function(){
    var script = document.createElement('script');
    script.src = '${baseUrl}/js/ug-extractor.js?' + new Date().getTime();
    script.setAttribute('data-teleprompter-url', '${baseUrl}');
    document.body.appendChild(script);
  })();`;

  // Set the href directly - this is a very short code that won't be truncated
  bookmarkletLink.setAttribute("href", bookmarkletCode);

  // Add instructions about how to install the bookmarklet
  bookmarkletLink.addEventListener("click", function (e) {
    e.preventDefault();
    alert(
      "To install the bookmarklet: Right-click this link, select 'Add to bookmarks' or 'Bookmark this link'. When viewing a song on Ultimate Guitar, click this bookmark to extract the song."
    );
  });
});
