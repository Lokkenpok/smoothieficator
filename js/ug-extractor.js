(function () {
  // Get the teleprompter URL from the script tag
  var scripts = document.querySelectorAll("script");
  var currentScript = scripts[scripts.length - 1];
  var teleprompterURL =
    currentScript.getAttribute("data-teleprompter-url") ||
    window.location.origin;

  // Check if we're on Ultimate Guitar
  if (!window.location.hostname.includes("ultimate-guitar.com")) {
    alert("This bookmarklet only works on Ultimate Guitar pages.");
    return;
  }

  console.log("Meat Smoothie Bookmarklet: Starting extraction...");

  try {
    // Get song title and artist
    let title = document.querySelector("h1")?.innerText || "";
    let artist =
      document.querySelector('[class*="artist"]')?.innerText ||
      document.querySelector('[class*="header"]')?.querySelectorAll("a")?.[0]
        ?.innerText ||
      "Unknown Artist";

    console.log("Found title:", title);
    console.log("Found artist:", artist);

    // Try multiple methods to extract content
    let content = "";
    let type = "Chords";

    // Method 1: Try UGAPP global object (modern UG)
    if (
      window.UGAPP &&
      window.UGAPP.store &&
      window.UGAPP.store.page &&
      window.UGAPP.store.page.data &&
      window.UGAPP.store.page.data.tab_view
    ) {
      console.log("Method 1: Found UGAPP store");
      content = window.UGAPP.store.page.data.tab_view.wiki_tab.content;
      type = window.UGAPP.store.page.data.tab.type || "Chords";
      title = window.UGAPP.store.page.data.tab.song_name || title;
      artist = window.UGAPP.store.page.data.tab.artist_name || artist;
    }

    // Method 2: Find the store data in attributes
    if (!content) {
      console.log("Method 2: Trying data attributes");
      const dataElements = document.querySelectorAll("[data-content]");
      for (let i = 0; i < dataElements.length; i++) {
        try {
          const el = dataElements[i];
          const data = JSON.parse(el.getAttribute("data-content"));
          if (data.store && data.store.page && data.store.page.data) {
            content = data.store.page.data.tab_view.wiki_tab.content;
            type = data.store.page.data.tab.type || "Chords";
            title = data.store.page.data.tab.song_name || title;
            artist = data.store.page.data.tab.artist_name || artist;
            break;
          }
        } catch (e) {
          console.log("Error parsing data attribute:", e);
        }
      }
    }

    // Method 3: Try to find the js-store element
    if (!content) {
      console.log("Method 3: Trying js-store element");
      const storeElement = document.querySelector(".js-store");
      if (storeElement && storeElement.hasAttribute("data-content")) {
        try {
          const storeData = JSON.parse(
            storeElement.getAttribute("data-content")
          );
          if (
            storeData.store &&
            storeData.store.page &&
            storeData.store.page.data
          ) {
            content = storeData.store.page.data.tab_view.wiki_tab.content;
            type = storeData.store.page.data.tab.type || "Chords";
            title = storeData.store.page.data.tab.song_name || title;
            artist = storeData.store.page.data.tab.artist_name || artist;
          }
        } catch (e) {
          console.log("Error parsing store data:", e);
        }
      }
    }

    // Method 4: Look for the content in the prerender content
    if (!content) {
      console.log("Method 4: Trying tab content element");
      const tabElement = document.querySelector(
        '.js-tab-content, [data-content="tab"], .tab-content, pre'
      );
      if (tabElement) {
        content = tabElement.innerText || tabElement.textContent;
      }
    }

    // Method 5: Look for content in script tags
    if (!content) {
      console.log("Method 5: Searching script tags");
      const scripts = document.querySelectorAll("script:not([src])");
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        const text = script.textContent || script.innerText;
        if (text.includes('"content":"') && text.includes('"revision_id"')) {
          try {
            const match = text.match(/"content":"([^"]+?)","revision_id"/);
            if (match && match[1]) {
              content = match[1]
                .replace(/\\\\n/g, "\\n")
                .replace(/\\\\"/g, '"');
              break;
            }
          } catch (e) {
            console.log("Error extracting from script:", e);
          }
        }
      }
    }

    // Check if we got any content
    if (!content || content.trim() === "") {
      console.error("No content found using any method");
      alert(
        "Could not extract song content. Please try a different song or tab."
      );
      return;
    }

    console.log("Successfully extracted song content!");

    // Clean title if needed
    if (title.includes(" by ")) {
      const parts = title.split(" by ");
      title = parts[0].trim();
      if (!artist || artist === "Unknown Artist") {
        artist = parts[1].trim();
      }
    }

    // Create the song info object
    const songInfo = {
      title: title || "Unknown Song",
      artist: artist || "Unknown Artist",
      content: content,
      type: type,
    };

    // Encode the song data to pass through URL
    const encodedData = encodeURIComponent(JSON.stringify(songInfo));

    // Open the teleprompter with the song data
    console.log("Opening teleprompter with extracted data");
    window.open(teleprompterURL + "?songData=" + encodedData, "_blank");
  } catch (error) {
    console.error("Error extracting song:", error);
    alert(
      "Error extracting song: " +
        error.message +
        ". Check browser console for details."
    );
  }
})();
