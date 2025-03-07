// Song scraper functionality
document.addEventListener("DOMContentLoaded", () => {
  const songUrlInput = document.getElementById("song-url");
  const loadButton = document.getElementById("load-button");
  const songContent = document.getElementById("song-content");
  const loadingIndicator = document.getElementById("loading-indicator");
  const errorLoad = document.getElementById("error-load");
  const scrollControls = document.getElementById("scroll-controls");
  const teleprompter = document.getElementById("teleprompter");

  // Initialize local storage for saved songs
  const localSongs = JSON.parse(localStorage.getItem("savedSongs") || "{}");

  loadButton.addEventListener("click", loadSong);
  songUrlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      loadSong();
    }
  });

  async function loadSong() {
    const url = songUrlInput.value.trim();
    if (!url) {
      showError("Please enter a URL");
      return;
    }
    if (!url.includes("ultimate-guitar.com")) {
      showError("Please enter a valid Ultimate Guitar URL");
      return;
    }

    // Clear previous content safely
    while (songContent.firstChild) {
      songContent.removeChild(songContent.firstChild);
    }

    // Show loading indicator
    loadingIndicator.classList.remove("hidden");
    errorLoad.classList.add("hidden");
    scrollControls.classList.add("hidden");

    try {
      // For development/testing, check if we should use mock data
      if (url.includes("2272453")) {
        displaySong(createMockSong("Bones", "Low Roar", mockContent.bones));
        scrollControls.classList.remove("hidden");
        return;
      }

      // Check if song is in local storage first
      if (localSongs[url]) {
        console.log("Loading song from local storage");
        displaySong(localSongs[url]);
        scrollControls.classList.remove("hidden");
        return;
      }

      // Extract the song ID from the URL
      const songId = extractSongIdFromUrl(url);
      if (!songId) {
        throw new Error("Could not extract song ID from URL");
      }

      // Use the user to manually open the tab page and copy the store data
      showManualInstructions(songId);
    } catch (error) {
      console.error("Error loading song:", error);
      showError(error.message);
    } finally {
      loadingIndicator.classList.add("hidden");
    }
  }

  // Function to show instructions for manual data extraction
  function showManualInstructions(songId) {
    // Hide loading indicator
    loadingIndicator.classList.add("hidden");

    // Clear song content
    songContent.innerHTML = "";

    // Create instructions
    const instructionsDiv = document.createElement("div");
    instructionsDiv.classList.add("manual-instructions");
    instructionsDiv.innerHTML = `
      <h3>One-time Setup (Due to CORS limitations)</h3>
      <ol>
        <li>Open the Ultimate Guitar tab in a new tab</li>
        <li>Press F12 to open developer tools</li>
        <li>Click on the "Console" tab</li>
        <li>Copy and paste the following code into the console and press Enter:</li>
      </ol>
      
      <pre class="code-block">
// Function to get song content
function getSongData() {
  // Try to get the content from multiple possible sources
  let content = '';
  
  // First try: UGAPP store (modern UG)
  if (window.UGAPP && window.UGAPP.store && window.UGAPP.store.page && window.UGAPP.store.page.data && window.UGAPP.store.page.data.tab) {
    content = window.UGAPP.store.page.data.tab.content;
  }
  
  // Second try: Look for tab content element
  if (!content) {
    const tabElement = document.querySelector('.js-tab-content, [data-content="tab"], .tab-content, #cont');
    if (tabElement) {
      content = tabElement.innerText;
    }
  }
  
  // Third try: Extract from JSON in the script tags
  if (!content) {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      if (script.textContent.includes('"content":"') && script.textContent.includes('"revision_id"')) {
        const match = script.textContent.match(/"content":"([^"]+)"/);
        if (match && match[1]) {
          content = match[1].replace(/\\n/g, '\\n').replace(/\\"/g, '"');
          break;
        }
      }
    }
  }
  
  // Get title and artist
  let title = document.querySelector('h1')?.textContent || "";
  let artist = document.querySelector('div[class*="artist"]')?.textContent || "";
  
  // If we couldn't find the artist through normal means, try to extract it from the title
  if (!artist && title.includes(" by ")) {
    const parts = title.split(" by ");
    title = parts[0];
    artist = parts[1];
  }
  
  return {
    title: title || "Unknown Song",
    artist: artist || "Unknown Artist",
    content: content || "",
    url: window.location.href
  };
}

// Copy the data to clipboard
copy(JSON.stringify(getSongData()));
console.log("✅ Song data copied to clipboard! Return to the teleprompter app and click 'Paste Song Data'");
      </pre>
      
      <p>This will copy the song data to your clipboard.</p>
      
      <h3>After copying:</h3>
      <ol>
        <li>Return to this page</li>
        <li>Click the button below</li>
        <li>Paste the copied data into the prompt box that appears</li>
      </ol>
      
      <button id="paste-data-button" class="button">Paste Song Data</button>
    `;

    songContent.appendChild(instructionsDiv);

    // Add event listener for paste button
    document
      .getElementById("paste-data-button")
      .addEventListener("click", () => {
        const songData = prompt("Paste the copied song data here:");
        if (songData) {
          try {
            const parsedData = JSON.parse(songData);

            // Check if content is empty
            if (!parsedData.content || parsedData.content.trim() === "") {
              showError(
                "The song content is empty. This can happen if the tab requires a Pro account or isn't properly loaded. Please try again with a different song or manually copy the tab content."
              );
              return;
            }

            if (parsedData.title) {
              processSongData(parsedData, songUrlInput.value);
            } else {
              showError("Invalid song data format. Please try again.");
            }
          } catch (e) {
            showError(
              "Could not parse song data. Please make sure you've copied the entire output from the console."
            );
          }
        }
      });
  }

  // Process the pasted song data
  function processSongData(songData, url) {
    // Process content for chords if needed
    let processedContent = songData.content;

    // Clean up the content - handle escape sequences
    processedContent = processedContent
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\t/g, "    ");

    // If content doesn't have [ch] tags, process the chords
    if (!processedContent.includes("[ch]")) {
      processedContent = processChords(processedContent);
    }

    // Create song object
    const song = {
      title: songData.title,
      artist: songData.artist,
      content: processedContent,
      type: "chords",
    };

    // Save to local storage
    localSongs[url] = song;
    localStorage.setItem("savedSongs", JSON.stringify(localSongs));

    // Display the song
    displaySong(song);
    scrollControls.classList.remove("hidden");
  }

  // Process text to add chord tags
  function processChords(text) {
    // First split into lines
    const lines = text.split("\n");
    const processedLines = [];

    // Process each line
    for (const line of lines) {
      // If line starts with a section marker, keep as is
      if (line.trim().startsWith("[") && line.trim().includes("]")) {
        processedLines.push(line);
        continue;
      }

      // Look for common chord patterns
      const chordsRegex =
        /\b([A-G][#b]?(m|maj|min|dim|sus|aug|add|2|4|5|6|7|9|11|13)?(?:\([^)]*\))?)\b/g;
      let processedLine = line.replace(chordsRegex, "[ch]$1[/ch]");

      processedLines.push(processedLine);
    }

    return processedLines.join("\n");
  }

  // Extract song ID from a Ultimate Guitar URL
  function extractSongIdFromUrl(url) {
    const matches = url.match(/\-(\d+)$/) || url.match(/\/(\d+)$/);
    return matches ? matches[1] : null;
  }

  function decodeHTMLEntities(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }

  function extractTitleFromUrl(url) {
    try {
      const parts = url.split("/");
      const songPart = parts[parts.length - 1].split("-");

      // Remove the ID at the end and join with spaces
      songPart.pop();
      return songPart.join(" ").replace(/-/g, " ");
    } catch (e) {
      return "Unknown Song";
    }
  }

  function showError(message) {
    errorLoad.textContent = message;
    errorLoad.classList.remove("hidden");
    scrollControls.classList.add("hidden");
  }

  function createMockSong(title, artist, content) {
    return {
      title: title,
      artist: artist,
      content: content,
      type: "chords",
    };
  }

  // Mock content for development/testing
  const mockContent = {
    bones: `[Intro]
[ch]Em[/ch]    [ch]G[/ch]    [ch]D[/ch]    [ch]Em[/ch]
[ch]Em[/ch]    [ch]G[/ch]    [ch]D[/ch]    [ch]Em[/ch]

[Verse 1]
[ch]Em[/ch]          [ch]G[/ch]                      [ch]D[/ch]
   Some days I barely feel alive
[ch]Em[/ch]
   When will this end?
[ch]Em[/ch]               [ch]G[/ch]                    [ch]D[/ch]
   Myself is lost, still I am searching
[ch]Em[/ch]
   Pile of bones

[Chorus]
[ch]Am[/ch]                  [ch]G[/ch]
   I keep it together, then I fall apart,
[ch]Em[/ch]                   [ch]D[/ch]
   I turn to a stranger frequently
[ch]Am[/ch]               [ch]G[/ch]
   I see a reflection in you,
[ch]Em[/ch]        [ch]D[/ch]
   You see nothing

[Verse 2]
[ch]Em[/ch]         [ch]G[/ch]                       [ch]D[/ch]
   Some days I fade into myself
[ch]Em[/ch]
   Don't even try
[ch]Em[/ch]           [ch]G[/ch]                 [ch]D[/ch]
   I'm holding on for one last breath
[ch]Em[/ch]
   Here I reside

[Chorus]
[ch]Am[/ch]                  [ch]G[/ch]
   I keep it together, then I fall apart,
[ch]Em[/ch]                   [ch]D[/ch]
   I turn to a stranger frequently
[ch]Am[/ch]               [ch]G[/ch]
   I see a reflection in you,
[ch]Em[/ch]        [ch]D[/ch]
   You see nothing

[Bridge]
[ch]Em[/ch]         [ch]C[/ch]            [ch]G[/ch]        [ch]D[/ch]
   Will you never know what we've lost now?
[ch]Em[/ch]         [ch]C[/ch]            [ch]G[/ch]        [ch]D[/ch]
   Will you never know what we've lost now?

[Chorus]
[ch]Am[/ch]                  [ch]G[/ch]
   I keep it together, then I fall apart,
[ch]Em[/ch]                   [ch]D[/ch]
   I turn to a stranger frequently
[ch]Am[/ch]               [ch]G[/ch]
   I see a reflection in you,
[ch]Em[/ch]        [ch]D[/ch]
   You see nothing`,
  };

  function displaySong(song) {
    // Clear any existing content
    songContent.innerHTML = "";

    // Add song title and artist
    const header = document.createElement("div");
    header.classList.add("song-header");
    header.innerHTML = `<h2>${song.title}</h2><h3>by ${song.artist}</h3>`;
    songContent.appendChild(header);

    // Process the song content
    let content = song.content;

    // Replace [ch] tags with spans for chord styling
    content = content.replace(
      /\[ch\](.*?)\[\/ch\]/g,
      '<span class="chord">$1</span>'
    );

    // Identify and mark up sections like Verse, Chorus, etc.
    const sections = [
      { name: "Verse", regex: /\[Verse[^\]]*\]/g },
      { name: "Chorus", regex: /\[Chorus[^\]]*\]/g },
      { name: "Bridge", regex: /\[Bridge[^\]]*\]/g },
      { name: "Intro", regex: /\[Intro[^\]]*\]/g },
      { name: "Outro", regex: /\[Outro[^\]]*\]/g },
      { name: "Pre-Chorus", regex: /\[Pre-Chorus[^\]]*\]/g },
    ];

    for (const section of sections) {
      content = content.replace(
        section.regex,
        `<div class="section-title">${section.name}</div>`
      );
    }

    // Replace newlines with <br> for HTML display
    content = content.replace(/\n/g, "<br>");

    // Add the formatted content to the song content div
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("song-body");
    contentDiv.innerHTML = content;
    songContent.appendChild(contentDiv);

    // Scroll to the top of the content
    teleprompter.scrollTop = 0;

    // Dispatch event that song has loaded
    window.dispatchEvent(new CustomEvent("songLoaded"));
  }

  // Add a button to manage saved songs
  const controlsDiv = document.getElementById("controls");
  const manageSongsButton = document.createElement("button");
  manageSongsButton.textContent = "Manage Saved Songs";
  manageSongsButton.classList.add("manage-songs-button");
  manageSongsButton.addEventListener("click", showSavedSongs);
  controlsDiv.appendChild(manageSongsButton);

  // Function to display and manage saved songs
  function showSavedSongs() {
    // Clear song content
    songContent.innerHTML = "";

    // Create saved songs UI
    const savedSongsDiv = document.createElement("div");
    savedSongsDiv.classList.add("saved-songs");

    const savedSongsHeader = document.createElement("h2");
    savedSongsHeader.textContent = "Your Saved Songs";
    savedSongsDiv.appendChild(savedSongsHeader);

    const songsList = document.createElement("ul");
    songsList.classList.add("songs-list");

    const savedSongsEntries = Object.entries(localSongs);

    if (savedSongsEntries.length === 0) {
      const noSongs = document.createElement("p");
      noSongs.textContent =
        "No songs saved yet. Load a song to save it automatically.";
      savedSongsDiv.appendChild(noSongs);
    } else {
      savedSongsEntries.forEach(([url, song]) => {
        const songItem = document.createElement("li");

        const songTitle = document.createElement("span");
        songTitle.textContent = `${song.title} - ${song.artist}`;
        songItem.appendChild(songTitle);

        const loadButton = document.createElement("button");
        loadButton.textContent = "Load";
        loadButton.addEventListener("click", () => {
          displaySong(song);
          scrollControls.classList.remove("hidden");
        });
        songItem.appendChild(loadButton);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("delete-button");
        deleteButton.addEventListener("click", () => {
          if (confirm(`Delete "${song.title}" from saved songs?`)) {
            delete localSongs[url];
            localStorage.setItem("savedSongs", JSON.stringify(localSongs));
            showSavedSongs(); // Refresh the list
          }
        });
        songItem.appendChild(deleteButton);

        songsList.appendChild(songItem);
      });

      savedSongsDiv.appendChild(songsList);
    }

    songContent.appendChild(savedSongsDiv);
  }

  // Check URL parameters for incoming song data from bookmarklet
  function checkForBookmarkletData() {
    const urlParams = new URLSearchParams(window.location.search);
    const songData = urlParams.get("songData");

    if (songData) {
      try {
        // Clear the URL parameters without refreshing the page
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        // Parse the song data
        const parsedData = JSON.parse(decodeURIComponent(songData));

        // Display the song content
        displaySongContent(parsedData);

        // Show scroll controls
        scrollControls.classList.remove("hidden");

        return true;
      } catch (error) {
        console.error("Error processing bookmarklet data:", error);
        errorLoad.textContent = "Error processing song data.";
        errorLoad.classList.remove("hidden");
      }
    }
    return false;
  }

  // Handle displaying song content from either source
  function displaySongContent(data) {
    // Build HTML content
    let html = `<h1>${data.title} - ${data.artist}</h1>`;

    // Format the content based on type
    if (data.type === "Chords" || data.type === "Tabs") {
      html += `<pre>${data.content}</pre>`;
    } else {
      // Convert newlines to <br> tags for lyrics
      html += `<div>${data.content.replace(/\n/g, "<br>")}</div>`;
    }

    // Display in the teleprompter
    songContent.innerHTML = html;

    // Hide loading indicator if visible
    loadingIndicator.classList.add("hidden");
  }

  // Check for bookmarklet data on page load
  window.addEventListener("load", function () {
    if (document.getElementById("app-container").classList.contains("hidden")) {
      // Don't process if the user hasn't logged in yet
      return;
    }

    checkForBookmarkletData();
  });
});
