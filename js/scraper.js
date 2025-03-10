// Song scraper functionality
document.addEventListener("DOMContentLoaded", () => {
  const songContent = document.getElementById("song-content");
  const loadingIndicator = document.getElementById("loading-indicator");
  const errorLoad = document.getElementById("error-load");
  const scrollControls = document.getElementById("scroll-controls");
  const teleprompter = document.getElementById("teleprompter");
  const controls = document.getElementById("controls");

  // Initialize local storage for saved songs
  const localSongs = JSON.parse(localStorage.getItem("savedSongs") || "{}");

  // Listen for the manual extraction event
  document.addEventListener("songExtracted", (event) => {
    if (event.detail) {
      displaySong(event.detail);
      scrollControls.classList.remove("hidden");

      // Collapse controls to maximize teleprompter space
      if (!controls.classList.contains("collapsed")) {
        document.getElementById("toggle-controls").click();
      }
    }
  });

  function showError(message) {
    errorLoad.textContent = message;
    errorLoad.classList.remove("hidden");
    scrollControls.classList.add("hidden");
  }

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

    // Replace [ch] tags with spans for chord styling, but preserve their original spacing
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
      { name: "Interlude", regex: /\[Interlude[^\]]*\]/g },
      { name: "Solo", regex: /\[Solo[^\]]*\]/g },
    ];

    for (const section of sections) {
      content = content.replace(
        section.regex,
        `<div class="section-title">${section.name}</div>`
      );
    }

    // Split content into lines to process for chord/lyric pairs
    const lines = content.split("\n");
    let processedHtml = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this line has chords (contains chord spans)
      const hasChords = line.includes('<span class="chord">');

      if (hasChords) {
        // Preserve whitespace in chord lines for positioning
        processedHtml += `<div class="chord-line" style="white-space: pre">${line}</div>`;
      } else if (line.trim() === "") {
        // Empty line becomes a spacer
        processedHtml += '<div class="spacer"></div>';
      } else {
        // Regular lyrics line
        processedHtml += `<div class="lyric-line">${line}</div>`;
      }
    }

    // Add the formatted content to the song content div
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("song-body");
    contentDiv.innerHTML = processedHtml;
    songContent.appendChild(contentDiv);

    // Safely scroll to the top of the content if teleprompter exists
    if (teleprompter) {
      teleprompter.scrollTop = 0;
    }

    // Load saved scroll speed if available
    if (song.scrollSpeed) {
      const scrollSpeedInput = document.getElementById("scroll-speed");
      const speedValueDisplay = document.querySelector(".speed-value");

      if (scrollSpeedInput) {
        scrollSpeedInput.value = song.scrollSpeed;
        if (speedValueDisplay) {
          speedValueDisplay.textContent = song.scrollSpeed;
        }
      }
    }

    // Check if song already exists before saving
    // Don't save if this is triggered by keyboard navigation
    const isKeyboardNavigation = window.navigationInProgress === true;

    if (!isKeyboardNavigation && !songExistsInStorage(song)) {
      console.log("Saving song to storage (not a navigation event)");
      // Save to local storage with the current timestamp as key
      const timestamp = new Date().toISOString();
      localSongs[timestamp] = song;
      localStorage.setItem("savedSongs", JSON.stringify(localSongs));

      // Refresh the saved songs list if it's currently open
      updateSavedSongsDropdown();
    } else if (isKeyboardNavigation) {
      console.log("Skipping save due to navigation event");
    } else if (songExistsInStorage(song)) {
      console.log("Skipping save because song already exists");

      // Update the stored song's scroll speed if it changed
      const currentScrollSpeed = document.getElementById("scroll-speed")?.value;
      if (
        currentScrollSpeed &&
        song.scrollSpeed !== parseInt(currentScrollSpeed)
      ) {
        updateSongScrollSpeed(song, parseInt(currentScrollSpeed));
      }
    }

    // Store current song reference for scroll speed updates
    window.currentDisplayedSong = song;

    // Dispatch event that song has loaded
    window.dispatchEvent(new CustomEvent("songLoaded"));

    // Make sure mini controls are visible if they exist
    const miniControls = document.getElementById("mini-controls");
    if (miniControls) {
      miniControls.classList.add("visible");
    }
  }

  // Helper function to check if song already exists in storage
  function songExistsInStorage(newSong) {
    return Object.values(localSongs).some(
      (savedSong) =>
        savedSong.title === newSong.title && savedSong.artist === newSong.artist
    );
  }

  // Helper function to update a song's scroll speed in storage
  function updateSongScrollSpeed(song, newSpeed) {
    // Find the song in local storage and update its scroll speed
    const entries = Object.entries(localSongs);
    const match = entries.find(
      ([id, savedSong]) =>
        savedSong.title === song.title && savedSong.artist === song.artist
    );

    if (match) {
      const [id, savedSong] = match;
      savedSong.scrollSpeed = newSpeed;
      localSongs[id] = savedSong;
      localStorage.setItem("savedSongs", JSON.stringify(localSongs));

      // Update the current displayed song reference
      if (window.currentDisplayedSong) {
        window.currentDisplayedSong.scrollSpeed = newSpeed;
      }
    }
  }

  // Process song data from extraction tools
  window.processSongFromBookmarklet = function (songData) {
    if (!songData || !songData.content) {
      showError("Invalid or missing song data");
      return false;
    }

    // Display the song
    displaySong(songData);

    // Show scroll controls if they exist
    if (scrollControls) {
      scrollControls.classList.remove("hidden");
    }

    return true;
  };

  // Add a button to manage saved songs
  const controlsDiv = document.querySelector(".controls-content");
  if (controlsDiv) {
    // Find the extract container to add the button there
    const extractContainer = document.querySelector(".extract-tool-container");

    if (extractContainer) {
      // Create a button row div to hold both buttons
      const buttonRow = document.createElement("div");
      buttonRow.classList.add("button-row");

      // Move the extract button into the button row (if it exists)
      const existingExtractBtn =
        extractContainer.querySelector("#extract-button");
      if (existingExtractBtn) {
        buttonRow.appendChild(existingExtractBtn.cloneNode(true));
        existingExtractBtn.remove();
      }

      // Add the manage songs button
      const manageSongsButton = document.createElement("button");
      manageSongsButton.textContent = "Manage Saved Songs";
      manageSongsButton.classList.add("primary-button", "compact-button");
      manageSongsButton.addEventListener("click", showSavedSongs);
      buttonRow.appendChild(manageSongsButton);

      // Add the button row after the tabs
      const tabsContainer = extractContainer.querySelector(".tabs");
      if (tabsContainer && tabsContainer.nextElementSibling) {
        tabsContainer.nextElementSibling.after(buttonRow);
      } else {
        extractContainer.appendChild(buttonRow);
      }
    } else {
      // Fallback to original approach if extract container not found
      const manageSongsButton = document.createElement("button");
      manageSongsButton.textContent = "Manage Saved Songs";
      manageSongsButton.classList.add("manage-songs-button");
      manageSongsButton.addEventListener("click", showSavedSongs);
      controlsDiv.appendChild(manageSongsButton);
    }
  }

  // Function to display and manage saved songs
  function showSavedSongs() {
    // Clear song content
    songContent.innerHTML = "";

    // Hide extraction tool and show scroll controls
    const extractionTool = document.querySelector(".extract-tool-container");
    if (extractionTool) {
      extractionTool.classList.add("hidden");
    }

    // Show scroll controls if they exist
    if (scrollControls) {
      scrollControls.classList.remove("hidden");
    }

    // Create saved songs UI
    const savedSongsDiv = document.createElement("div");
    savedSongsDiv.classList.add("saved-songs");

    // Check if controls are collapsed and add appropriate class
    const isControlsCollapsed = controls.classList.contains("collapsed");
    if (isControlsCollapsed) {
      savedSongsDiv.classList.add("with-collapsed-controls");
    } else {
      savedSongsDiv.classList.add("with-expanded-controls");
    }

    // Add a back button to return to extraction UI
    const topControls = document.createElement("div");
    topControls.classList.add("saved-songs-controls");

    const backButton = document.createElement("button");
    backButton.textContent = "Back to Song Extraction";
    backButton.classList.add("compact-button");
    backButton.addEventListener("click", function () {
      // Hide the saved songs view
      songContent.innerHTML = "";

      // Show extraction tool again
      if (extractionTool) {
        extractionTool.classList.remove("hidden");
      }

      // Hide scroll controls until a song is loaded
      if (scrollControls) {
        scrollControls.classList.add("hidden");
      }
    });

    topControls.appendChild(backButton);
    savedSongsDiv.appendChild(topControls);

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
      savedSongsEntries.forEach(([id, song]) => {
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
            delete localSongs[id];
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

  // Saved songs dropdown functionality
  const savedSongsBtn = document.getElementById("saved-songs-button");
  const songsDropdownContent = document.querySelector(
    "#songs-dropdown .dropdown-content"
  );
  const savedSongsContainer = document.getElementById("saved-songs-container");

  if (savedSongsBtn && songsDropdownContent) {
    savedSongsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      songsDropdownContent.classList.toggle("hidden");

      // Update the saved songs list
      updateSavedSongsDropdown();

      // Close other dropdowns
      const extractDropdownContent = document.querySelector(
        "#extract-dropdown .dropdown-content"
      );
      if (
        extractDropdownContent &&
        !extractDropdownContent.classList.contains("hidden")
      ) {
        extractDropdownContent.classList.add("hidden");
      }

      // Close shortcuts popup if open
      const shortcutsPopup = document.getElementById("shortcuts-popup");
      if (shortcutsPopup && !shortcutsPopup.classList.contains("hidden")) {
        shortcutsPopup.classList.add("hidden");
      }
    });
  }

  // Initialize navigation buttons
  const prevSongBtn = document.getElementById("prev-song");
  const nextSongBtn = document.getElementById("next-song");

  if (prevSongBtn) {
    prevSongBtn.addEventListener("click", () => {
      if (typeof window.goToPreviousSong === "function") {
        window.goToPreviousSong();
      }
    });
  }

  if (nextSongBtn) {
    nextSongBtn.addEventListener("click", () => {
      if (typeof window.goToNextSong === "function") {
        window.goToNextSong();
      }
    });
  }

  // Update the saved songs dropdown content
  function updateSavedSongsDropdown() {
    if (!savedSongsContainer) return;

    const savedSongsData = JSON.parse(
      localStorage.getItem("savedSongs") || "{}"
    );
    savedSongsContainer.innerHTML = "";

    const header = document.createElement("div");
    header.classList.add("songs-header");
    header.innerHTML = `<h3>Saved Songs</h3>`;
    savedSongsContainer.appendChild(header);

    const savedSongsEntries = Object.entries(savedSongsData);

    if (savedSongsEntries.length === 0) {
      const noSongs = document.createElement("p");
      noSongs.textContent =
        "No songs saved yet. Extract a song to save it automatically.";
      noSongs.style.padding = "10px 5px";
      savedSongsContainer.appendChild(noSongs);
    } else {
      const songsList = document.createElement("ul");
      songsList.classList.add("songs-list");

      // Sort by newest first
      savedSongsEntries.sort((a, b) => b[0].localeCompare(a[0]));

      savedSongsEntries.forEach(([id, song]) => {
        const songItem = document.createElement("li");

        const songTitle = document.createElement("span");
        songTitle.textContent = `${song.title} - ${song.artist}`;
        songTitle.title = `${song.title} - ${song.artist}`; // Add tooltip for long titles
        songItem.appendChild(songTitle);

        const loadButton = document.createElement("button");
        loadButton.textContent = "Load";
        loadButton.addEventListener("click", () => {
          displaySong(song);
          songsDropdownContent.classList.add("hidden");
        });
        songItem.appendChild(loadButton);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "X";
        deleteButton.classList.add("delete-button");
        deleteButton.title = "Delete Song";
        deleteButton.addEventListener("click", (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${song.title}" from saved songs?`)) {
            delete localSongs[id];
            localStorage.setItem("savedSongs", JSON.stringify(localSongs));
            updateSavedSongsDropdown(); // Refresh the list
          }
        });
        songItem.appendChild(deleteButton);

        songsList.appendChild(songItem);
      });

      savedSongsContainer.appendChild(songsList);
    }
  }
});
