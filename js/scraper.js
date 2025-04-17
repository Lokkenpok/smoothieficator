// Song scraper functionality
document.addEventListener("DOMContentLoaded", () => {
  const songContent = document.getElementById("song-content");
  const loadingIndicator = document.getElementById("loading-indicator");
  const errorLoad = document.getElementById("error-load");
  const teleprompter = document.getElementById("teleprompter");

  // Initialize local storage for saved songs
  const localSongs = JSON.parse(localStorage.getItem("savedSongs") || "{}");

  // Make a function to update the localSongs cache from teleprompter.js edit mode
  window.updateLocalSongsCache = function (updatedSongs) {
    // Update the in-memory cache to match localStorage
    Object.assign(localSongs, updatedSongs);
    console.log("Local songs cache updated after editing");
  };

  // Listen for the manual extraction event
  document.addEventListener("songExtracted", (event) => {
    if (event.detail) {
      displaySong(event.detail);

      // Collapse controls to maximize teleprompter space
      const controls = document.getElementById("controls");
      if (controls && !controls.classList.contains("collapsed")) {
        document.getElementById("toggle-controls").click();
      }
    }
  });

  function showError(message) {
    errorLoad.textContent = message;
    errorLoad.classList.remove("hidden");
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

    // First, normalize any newlines to ensure consistent line breaks
    content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Replace [ch] tags with spans for chord styling, but preserve their original spacing
    content = content.replace(
      /\[ch\](.*?)\[\/ch\]/g,
      '<span class="chord">$1</span>'
    );

    // Identify and mark up sections like Verse, Chorus, etc.
    // Make sure any existing HTML section headers are removed first
    content = content.replace(/<div class="section-title">[^<]+<\/div>/g, "");

    // Then convert all section markers from text format to HTML
    const sectionRegex =
      /\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Interlude|Solo)(?:\s*\d+|\s+[^\]]*)*\]/g;
    content = content.replace(sectionRegex, (match) => {
      // Extract the base section type (Verse, Chorus, etc.)
      const sectionType = match.match(
        /\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Interlude|Solo)/
      )[1];
      return `<div class="section-title">${sectionType}</div>`;
    });

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

    return true;
  };

  // Function to display and manage saved songs
  function showSavedSongs() {
    // Clear song content
    songContent.innerHTML = "";

    // Create saved songs UI
    const savedSongsDiv = document.createElement("div");
    savedSongsDiv.classList.add("saved-songs");

    // Check if controls are collapsed and add appropriate class
    const controls = document.getElementById("controls");
    const isControlsCollapsed =
      controls && controls.classList.contains("collapsed");
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
        const limitedTitle = limitLength(song.title, 60);
        const limitedArtist = limitLength(song.artist, 60);
        songTitle.textContent = `${limitedTitle} - ${limitedArtist}`;
        songTitle.title = `${song.title} - ${song.artist}`; // Add tooltip for full names
        songItem.appendChild(songTitle);

        const loadButton = document.createElement("button");
        loadButton.textContent = "Load";
        loadButton.addEventListener("click", () => {
          displaySong(song);
        });
        songItem.appendChild(loadButton);

        // Add Rename button
        const renameButton = document.createElement("button");
        renameButton.textContent = "Rename";
        renameButton.addEventListener("click", () => {
          const newTitle = prompt("Enter new song title:", song.title);
          if (newTitle === null) return; // Cancelled
          const newArtist = prompt("Enter new artist name:", song.artist);
          if (newArtist === null) return; // Cancelled
          if (!newTitle.trim() || !newArtist.trim()) {
            alert("Title and artist cannot be empty.");
            return;
          }
          // Check for duplicate
          const duplicate = Object.values(localSongs).some(
            (s, idx) =>
              s.title === newTitle.trim() &&
              s.artist === newArtist.trim() &&
              Object.keys(localSongs)[idx] !== id
          );
          if (duplicate) {
            alert("A song with this title and artist already exists.");
            return;
          }
          song.title = newTitle.trim();
          song.artist = newArtist.trim();
          localSongs[id] = song;
          localStorage.setItem("savedSongs", JSON.stringify(localSongs));
          showSavedSongs();
        });
        songItem.appendChild(renameButton);

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

  // Helper function to limit string length
  function limitLength(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + "...";
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
        const limitedTitle = limitLength(song.title, 20);
        const limitedArtist = limitLength(song.artist, 20);
        songTitle.textContent = `${limitedTitle} - ${limitedArtist}`;
        songTitle.title = `${song.title} - ${song.artist}`; // Add tooltip for full names
        songItem.appendChild(songTitle);

        const loadButton = document.createElement("button");
        loadButton.textContent = "Load";
        loadButton.addEventListener("click", () => {
          displaySong(song);
          songsDropdownContent.classList.add("hidden");
        });
        songItem.appendChild(loadButton);

        // Add Rename button to dropdown
        const renameButton = document.createElement("button");
        renameButton.textContent = "Rename";
        renameButton.addEventListener("click", (e) => {
          e.stopPropagation();
          const newTitle = prompt("Enter new song title:", song.title);
          if (newTitle === null) return; // Cancelled
          const newArtist = prompt("Enter new artist name:", song.artist);
          if (newArtist === null) return; // Cancelled
          if (!newTitle.trim() || !newArtist.trim()) {
            alert("Title and artist cannot be empty.");
            return;
          }
          // Check for duplicate
          const duplicate = Object.values(localSongs).some(
            (s, idx) =>
              s.title === newTitle.trim() &&
              s.artist === newArtist.trim() &&
              Object.keys(localSongs)[idx] !== id
          );
          if (duplicate) {
            alert("A song with this title and artist already exists.");
            return;
          }
          song.title = newTitle.trim();
          song.artist = newArtist.trim();
          localSongs[id] = song;
          localStorage.setItem("savedSongs", JSON.stringify(localSongs));
          updateSavedSongsDropdown();
        });
        songItem.appendChild(renameButton);

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

  // Import/Export functionality
  const importExportBtn = document.getElementById("import-export-button");
  const importExportDropdownContent = document.querySelector(
    "#import-export-dropdown .dropdown-content"
  );
  const exportSongsBtn = document.getElementById("export-songs-button");
  const importSongsBtn = document.getElementById("import-songs-button");
  const importFileInput = document.getElementById("import-file-input");
  const importStatus = document.getElementById("import-status");

  if (importExportBtn && importExportDropdownContent) {
    importExportBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      importExportDropdownContent.classList.toggle("hidden");

      // Close other dropdowns
      const otherDropdowns = [
        document.querySelector("#songs-dropdown .dropdown-content"),
        document.querySelector("#extract-dropdown .dropdown-content"),
      ];

      otherDropdowns.forEach((dropdown) => {
        if (dropdown && !dropdown.classList.contains("hidden")) {
          dropdown.classList.add("hidden");
        }
      });

      // Close shortcuts popup if open
      const shortcutsPopup = document.getElementById("shortcuts-popup");
      if (shortcutsPopup && !shortcutsPopup.classList.contains("hidden")) {
        shortcutsPopup.classList.add("hidden");
      }
    });
  }

  // Add event listeners to close import/export when other dropdowns are opened
  const otherDropdownButtons = [
    document.getElementById("saved-songs-button"),
    document.querySelector("#extract-dropdown .dropdown-button"),
  ];

  otherDropdownButtons.forEach((button) => {
    if (button) {
      button.addEventListener("click", () => {
        if (
          importExportDropdownContent &&
          !importExportDropdownContent.classList.contains("hidden")
        ) {
          importExportDropdownContent.classList.add("hidden");
        }
      });
    }
  });

  // Export songs functionality
  if (exportSongsBtn) {
    exportSongsBtn.addEventListener("click", () => {
      const savedSongsData = localStorage.getItem("savedSongs");

      if (!savedSongsData || savedSongsData === "{}") {
        alert("No songs to export. Save some songs first!");
        return;
      }

      // Create JSON file blob
      const blob = new Blob([savedSongsData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = `smoothieficator-songs-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      // Hide dropdown after export
      importExportDropdownContent.classList.add("hidden");
    });
  }

  // Import songs functionality
  if (importSongsBtn && importFileInput) {
    importSongsBtn.addEventListener("click", () => {
      importFileInput.click();
    });

    importFileInput.addEventListener("change", (e) => {
      if (!e.target.files.length) return;

      const file = e.target.files[0];
      if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        showImportStatus("Error: Please select a valid JSON file.", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);

          // Validate imported data format
          if (typeof importedData !== "object") {
            showImportStatus("Error: Invalid data format.", "error");
            return;
          }

          // Get current songs
          const currentSongs = JSON.parse(
            localStorage.getItem("savedSongs") || "{}"
          );

          // Count stats for user feedback
          let totalImported = 0;
          let newSongs = 0;
          let updatedSongs = 0;

          // Process imported songs
          Object.entries(importedData).forEach(([id, song]) => {
            // Validate song data
            if (!song.title || !song.artist || !song.content) {
              return; // Skip invalid entries
            }

            totalImported++;

            // Check if song already exists
            const existingEntry = Object.entries(currentSongs).find(
              ([_, savedSong]) =>
                savedSong.title === song.title &&
                savedSong.artist === song.artist
            );

            if (existingEntry) {
              updatedSongs++;
              // Update existing song if import has more data
              const [existingId, _] = existingEntry;
              currentSongs[existingId] = song;
            } else {
              newSongs++;
              // Add as new song with original timestamp if possible
              currentSongs[id] = song;
            }
          });

          // Save merged data back to localStorage
          localStorage.setItem("savedSongs", JSON.stringify(currentSongs));

          // Update the local songs reference to match localStorage
          Object.assign(localSongs, currentSongs);

          // Update UI and show status message
          updateSavedSongsDropdown();
          showImportStatus(
            `Import successful: ${totalImported} songs imported (${newSongs} new, ${updatedSongs} updated).`,
            "success"
          );
        } catch (error) {
          console.error("Import error:", error);
          showImportStatus(
            "Error: Could not parse the imported file.",
            "error"
          );
        }
      };

      reader.onerror = () => {
        showImportStatus("Error: Could not read the file.", "error");
      };

      reader.readAsText(file);

      // Reset the input so the same file can be selected again
      e.target.value = "";
    });
  }

  // Helper function to show import status
  function showImportStatus(message, type) {
    if (!importStatus) return;

    importStatus.textContent = message;
    importStatus.className =
      type === "error" ? "error-status" : "success-status";
    importStatus.classList.remove("hidden");

    // Auto-hide after 5 seconds
    setTimeout(() => {
      importStatus.classList.add("hidden");
    }, 5000);
  }
});
