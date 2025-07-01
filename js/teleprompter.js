// Teleprompter functionality
document.addEventListener("DOMContentLoaded", () => {
  const teleprompter = document.getElementById("teleprompter");
  const songContent = document.getElementById("song-content");
  const scrollSpeedInput = document.getElementById("scroll-speed");
  const startScrollBtn = document.getElementById("start-scroll");
  const stopScrollBtn = document.getElementById("stop-scroll");
  const resetScrollBtn = document.getElementById("reset-scroll");
  const toggleFullscreenBtn = document.getElementById("toggle-fullscreen");
  const appContainer = document.getElementById("app-container");
  const speedValueDisplay = document.querySelector(".speed-value");
  const topBar = document.getElementById("top-bar");

  // Scroll state
  let isScrolling = false;
  let scrollInterval = null;
  let scrollAccumulator = 0; // Accumulator for fractional scrolling
  const baseScrollSpeed = 1; // Base pixels per interval

  // Song navigation state
  let savedSongs = [];
  let currentSongIndex = -1;

  // Edit mode state
  let isEditMode = false;
  let editArea = null;

  // Flag to indicate navigation in progress (to prevent duplicate saves)
  window.navigationInProgress = false;

  // Initialize scroll controls
  startScrollBtn.addEventListener("click", startScrolling);
  stopScrollBtn.addEventListener("click", stopScrolling);
  resetScrollBtn.addEventListener("click", resetScroll);
  toggleFullscreenBtn.addEventListener("click", toggleFullscreen);

  // Update speed display when slider changes
  scrollSpeedInput.addEventListener("input", () => {
    if (speedValueDisplay) {
      speedValueDisplay.textContent = scrollSpeedInput.value;
    }

    if (isScrolling) {
      stopScrolling();
      startScrolling();
    }

    // Save scroll speed for current song
    saveScrollSpeedForCurrentSong();
  });

  // Keyboard controls
  document.addEventListener("keydown", handleKeyDown);

  // Handle song loaded event
  window.addEventListener("songLoaded", function () {
    resetScroll();
    loadSavedSongs(); // Update the saved songs array and current index
  });

  function startScrolling() {
    // Don't allow scrolling in edit mode
    if (isEditMode || isScrolling) return;

    const speed = calculateScrollSpeed();
    isScrolling = true;
    scrollAccumulator = 0; // Reset accumulator when starting

    // Show stop button, hide start button
    startScrollBtn.classList.add("hidden");
    stopScrollBtn.classList.remove("hidden");

    // Start scrolling at the calculated speed
    scrollInterval = setInterval(() => {
      // Add the fractional speed to the accumulator
      scrollAccumulator += speed;

      // When the accumulator reaches at least 1, scroll by the integer part
      if (scrollAccumulator >= 1) {
        const scrollPixels = Math.floor(scrollAccumulator);
        teleprompter.scrollBy(0, scrollPixels);
        scrollAccumulator -= scrollPixels; // Keep the remainder for next time
      }

      // If we've reached the end, stop scrolling
      // Check if the last content element is at the bottom of the viewport
      const lastElement = songContent.lastElementChild;
      if (lastElement) {
        const lastElementBottom = lastElement.getBoundingClientRect().bottom;
        const teleprompterBottom = teleprompter.getBoundingClientRect().bottom;

        // Stop when the bottom of the last element is at or near the bottom of the teleprompter
        if (lastElementBottom <= teleprompterBottom + 5) {
          stopScrolling();
        }
      } else if (
        teleprompter.scrollTop + teleprompter.clientHeight >=
        teleprompter.scrollHeight - 10
      ) {
        // Fallback to the original check if there's no last element
        stopScrolling();
      }
    }, 50); // Update every 50ms for smooth scrolling
  }

  function stopScrolling() {
    if (!isScrolling) return;

    isScrolling = false;
    clearInterval(scrollInterval);

    // Show start button, hide stop button
    startScrollBtn.classList.remove("hidden");
    stopScrollBtn.classList.add("hidden");
  }

  function resetScroll() {
    // Stop scrolling if active
    stopScrolling();

    // Scroll to top
    teleprompter.scrollTop = 0;
  }

  function calculateScrollSpeed() {
    // Get current scroll speed value (1-25)
    const speedValue = parseInt(scrollSpeedInput.value);

    // Updated formula to allow for speeds below 1 pixel per interval:
    // Speed 1: 0.2 pixels per update (very very slow, takes 5 updates to move 1 pixel)
    // Speed 5: 1.0 pixels per update (1 pixel per update - visible but still slow)
    // Speed 13: ~2.6 pixels per update (medium)
    // Speed 25: ~5.0 pixels per update (very fast)
    return 0.2 + (speedValue - 1) * 0.2;
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      // Exit fullscreen
      document
        .exitFullscreen()
        .then(() => {
          appContainer.classList.remove("fullscreen");
        })
        .catch((err) => {
          console.error(`Error exiting fullscreen: ${err.message}`);
        });
    } else {
      // Enter fullscreen
      appContainer
        .requestFullscreen()
        .then(() => {
          appContainer.classList.add("fullscreen");
        })
        .catch((err) => {
          console.error(
            `Error attempting to enable fullscreen: ${err.message}`
          );
        });
    }
  }

  // Enable edit mode for the song content
  function enableEditMode() {
    // Only enable edit mode if we have a song displayed
    const songHeader = document.querySelector(".song-header");
    if (!songHeader || isEditMode) return;

    isEditMode = true;

    // Stop scrolling if active
    stopScrolling();

    // Store current content and create edit area
    const songBody = document.querySelector(".song-body");
    if (!songBody) return;

    // Get song title and artist for later use in saving
    const songTitle = document.querySelector(".song-header h2")?.textContent;
    const songArtist = document
      .querySelector(".song-header h3")
      ?.textContent?.replace(/by\s+/i, "")
      .trim();

    // Create notification that we're in edit mode with save and cancel buttons
    const editNotice = document.createElement("div");
    editNotice.classList.add("edit-mode-notice"); // Main class for the notice bar

    // Add edit mode text and shortcut info
    const editModeTextContainer = document.createElement("div");
    editModeTextContainer.classList.add("edit-mode-text-container");

    const editModeText = document.createElement("span");
    editModeText.textContent = "Edit Mode";

    const shortcutInfo = document.createElement("small");
    shortcutInfo.textContent = "(Ctrl+Enter to save)";

    editModeText.appendChild(shortcutInfo);
    editModeTextContainer.appendChild(editModeText);

    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("buttons-container"); // Class for the button container

    // Create Accept button
    const acceptButton = document.createElement("button");
    acceptButton.textContent = "Accept Changes";
    acceptButton.classList.add("accept-button"); // Class for accept button styling
    acceptButton.onclick = saveEditedSong;

    // Create Cancel button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.classList.add("cancel-button"); // Class for cancel button styling
    cancelButton.onclick = () => {
      if (confirm("Exit edit mode? Any unsaved changes will be lost.")) {
        exitEditMode();
        // Redisplay current song
        const currentTitle =
          document.querySelector(".song-header h2")?.textContent;
        const currentArtist = document
          .querySelector(".song-header h3")
          ?.textContent?.replace(/by\s+/i, "")
          .trim();
        if (currentTitle && currentArtist) {
          const songs = loadSavedSongs();
          const currentSong = songs.find(
            (song) =>
              song.title === currentTitle && song.artist === currentArtist
          );
          if (currentSong) {
            displaySavedSong(currentSong);
          }
        }
      }
    };

    // Add buttons to container
    buttonsContainer.appendChild(acceptButton);
    buttonsContainer.appendChild(cancelButton);

    // Add text and buttons to notice
    editNotice.appendChild(editModeTextContainer);
    editNotice.appendChild(buttonsContainer);

    // Add notice to DOM
    songContent.insertBefore(editNotice, songHeader.nextSibling);

    // Get raw content directly from the song in local storage instead of the DOM when possible
    let rawContent = "";

    // First try to get content from the current displayed song reference
    if (window.currentDisplayedSong && window.currentDisplayedSong.content) {
      rawContent = window.currentDisplayedSong.content;
    }
    // If that fails, extract from the DOM
    else {
      // Process the song body directly, skipping the title and artist header
      const lines = songBody.querySelectorAll("div");
      lines.forEach((line) => {
        if (line.classList.contains("section-title")) {
          const sectionText = line.textContent.trim();
          rawContent += `[${sectionText}]\n`;
        } else if (line.classList.contains("chord-line")) {
          // Convert chord spans back to [ch] tags
          let lineText = line.innerHTML;
          lineText = lineText.replace(
            /<span class="chord">([^<]+)<\/span>/g,
            "[ch]$1[/ch]"
          );
          // Convert HTML entities back to characters
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = lineText;
          rawContent += tempDiv.textContent + "\n";
        } else if (line.classList.contains("lyric-line")) {
          rawContent += line.textContent + "\n";
        } else if (line.classList.contains("spacer")) {
          rawContent += "\n";
        }
      });
    }

    // Normalize line endings to prevent issues when editing
    rawContent = rawContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Create the edit textarea with similar styling to the song display
    editArea = document.createElement("textarea");
    editArea.value = rawContent;
    editArea.style.cssText = `
      width: 100%;
      height: calc(100vh - 200px);
      background-color: #1a1a1a;
      color: #fff;
      border: 1px solid #333;
      padding: 20px;
      font-family: monospace;
      font-size: 16px;
      line-height: 1.5;
      white-space: pre-wrap;
      overflow-y: auto;
      box-sizing: border-box;
    `;

    // Replace the song body with the edit area
    songBody.replaceWith(editArea);

    // Focus the edit area, place cursor at the beginning, and scroll to top
    editArea.focus();
    editArea.setSelectionRange(0, 0);

    // Ensure the textarea is scrolled to the top
    editArea.scrollTop = 0;

    // Also ensure the teleprompter container is scrolled to the top
    teleprompter.scrollTop = 0;
  }

  // Save edited content and exit edit mode
  function saveEditedSong() {
    if (!isEditMode || !editArea) return;

    try {
      // Get song title and artist
      const songTitle = document.querySelector(".song-header h2")?.textContent;
      const songArtist = document
        .querySelector(".song-header h3")
        ?.textContent?.replace(/by\s+/i, "")
        .trim();

      if (!songTitle || !songArtist) {
        throw new Error("Could not find song title or artist");
      }

      // Get edited content from textarea
      const editedContent = editArea.value;

      // Find the song in local storage
      const savedSongs = JSON.parse(localStorage.getItem("savedSongs") || "{}");
      const entries = Object.entries(savedSongs);
      const match = entries.find(
        ([id, song]) => song.title === songTitle && song.artist === songArtist
      );

      if (match) {
        const [id, song] = match;
        // Update the song's content - use the edited content directly
        song.content = editedContent;
        savedSongs[id] = song;

        // Save to localStorage
        localStorage.setItem("savedSongs", JSON.stringify(savedSongs));

        // Update the shared reference in scraper.js if possible
        if (typeof window.updateLocalSongsCache === "function") {
          window.updateLocalSongsCache(savedSongs);
        }

        // Update the current displayed song reference
        if (window.currentDisplayedSong) {
          window.currentDisplayedSong.content = editedContent;
        }

        // Redisplay the song with updated content
        displayEditedSong({
          title: songTitle,
          artist: songArtist,
          content: editedContent,
        });

        console.log("Song successfully saved with edited content");
      } else {
        console.error("Could not find song in local storage");
      }
    } catch (error) {
      console.error("Error saving edited song:", error);
    } finally {
      // Clean up and exit edit mode
      exitEditMode();
    }
  }

  // Display the edited song
  function displayEditedSong(songData) {
    // Remove edit mode notice
    const editNotice = document.querySelector(".edit-mode-notice");
    if (editNotice) {
      editNotice.remove();
    }

    // Use the existing function to display the song
    if (typeof window.processSongFromBookmarklet === "function") {
      window.processSongFromBookmarklet(songData);
    }
  }

  // Exit edit mode without saving
  function exitEditMode() {
    if (!isEditMode) return;

    isEditMode = false;

    // Remove edit mode notice
    const editNotice = document.querySelector(".edit-mode-notice");
    if (editNotice) {
      editNotice.remove();
    }

    // Restore song display
    if (editArea) {
      // The song will be redisplayed when we exit edit mode
      editArea = null;
    }
  }

  // Load saved songs
  function loadSavedSongs() {
    const localStorageSongs = localStorage.getItem("savedSongs");
    if (!localStorageSongs) return [];

    const localSongs = JSON.parse(localStorageSongs);
    // Convert from object to array with timestamps as keys
    savedSongs = Object.entries(localSongs).map(([timestamp, song]) => ({
      ...song,
      timestamp,
    }));

    // Sort by timestamp (newest first)
    savedSongs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // If a song is currently displayed, find its index
    const currentTitle = document.querySelector(".song-header h2")?.textContent;
    const currentArtist = document
      .querySelector(".song-header h3")
      ?.textContent?.replace(/by\s+/i, "")
      .trim();

    if (currentTitle && currentArtist) {
      currentSongIndex = savedSongs.findIndex(
        (song) => song.title === currentTitle && song.artist === currentArtist
      );
      console.log(
        `Current song index: ${currentSongIndex} (${currentTitle} - ${currentArtist})`
      );
    }

    return savedSongs;
  }

  // Navigate to previous song
  function goToPreviousSong() {
    // Don't allow navigation in edit mode
    if (isEditMode) return;

    console.log("Attempting to go to previous song");
    const songs = loadSavedSongs();
    console.log(`Found ${songs.length} total songs`);

    if (songs.length === 0) {
      console.log("No songs found, exiting");
      return; // No songs saved
    }

    // Find unique songs (by title and artist)
    const uniqueSongs = getUniqueSongs(songs);
    console.log(`Found ${uniqueSongs.length} unique songs`);

    if (uniqueSongs.length === 0) return;

    // Find current song in unique list
    let currentTitle = document.querySelector(".song-header h2")?.textContent;
    let currentArtist = document
      .querySelector(".song-header h3")
      ?.textContent?.replace(/by\s+/i, "")
      .trim();
    console.log(`Current song: "${currentTitle}" by "${currentArtist}"`);

    let uniqueIndex = uniqueSongs.findIndex(
      (song) => song.title === currentTitle && song.artist === currentArtist
    );
    console.log(`Current song index: ${uniqueIndex}`);

    if (uniqueIndex <= 0) {
      uniqueIndex = uniqueSongs.length - 1; // Wrap around to the last song
      console.log(`Wrapping to last song: ${uniqueIndex}`);
    } else {
      uniqueIndex--;
      console.log(`Moving to previous song: ${uniqueIndex}`);
    }

    const prevSong = uniqueSongs[uniqueIndex];
    console.log(`Will display: "${prevSong.title}" by "${prevSong.artist}"`);

    // Set navigation flag to prevent duplicate saves
    window.navigationInProgress = true;
    displaySavedSong(prevSong);
    setTimeout(() => {
      window.navigationInProgress = false;
    }, 500); // Increased timeout
  }

  // Make goToPreviousSong available globally for the navigation buttons
  window.goToPreviousSong = goToPreviousSong;

  // Navigate to next song
  function goToNextSong() {
    // Don't allow navigation in edit mode
    if (isEditMode) return;

    const songs = loadSavedSongs();
    if (songs.length === 0) return; // No songs saved

    // Find unique songs (by title and artist)
    const uniqueSongs = getUniqueSongs(songs);
    if (uniqueSongs.length === 0) return;

    // Find current song in unique list
    let currentTitle = document.querySelector(".song-header h2")?.textContent;
    let currentArtist = document
      .querySelector(".song-header h3")
      ?.textContent?.replace(/by\s+/i, "")
      .trim();

    let uniqueIndex = uniqueSongs.findIndex(
      (song) => song.title === currentTitle && song.artist === currentArtist
    );

    if (uniqueIndex >= uniqueSongs.length - 1 || uniqueIndex === -1) {
      uniqueIndex = 0; // Wrap around to the first song
    } else {
      uniqueIndex++;
    }

    // Set navigation flag to prevent duplicate saves
    window.navigationInProgress = true;
    displaySavedSong(uniqueSongs[uniqueIndex]);
    setTimeout(() => {
      window.navigationInProgress = false;
    }, 100);
  }

  // Make goToNextSong available globally for the navigation buttons
  window.goToNextSong = goToNextSong;

  // Helper function to get unique songs by title and artist
  function getUniqueSongs(songs) {
    const uniqueSongs = [];
    const seen = new Set();

    for (const song of songs) {
      const key = `${song.title}-${song.artist}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSongs.push(song);
      }
    }

    return uniqueSongs;
  }

  // Display saved song (separate from the scraper.js function to avoid circular dependencies)
  function displaySavedSong(songData) {
    // Exit edit mode if active
    if (isEditMode) {
      exitEditMode();
    }

    // Create a clean copy without the timestamp property
    const song = { ...songData };
    delete song.timestamp;

    // Display the song using the existing function
    if (typeof window.processSongFromBookmarklet === "function") {
      window.processSongFromBookmarklet(song);
    }
  }

  // Function to save current scroll speed for the displayed song
  function saveScrollSpeedForCurrentSong() {
    const currentSpeed = parseInt(scrollSpeedInput.value);
    // Check if we have a current song displayed and an updateSongScrollSpeed function
    if (window.currentDisplayedSong) {
      // Get current song title and artist
      const currentTitle =
        document.querySelector(".song-header h2")?.textContent;
      const currentArtist = document
        .querySelector(".song-header h3")
        ?.textContent?.replace(/by\s+/i, "")
        .trim();

      if (currentTitle && currentArtist) {
        // Try to find song in local storage
        const savedSongs = JSON.parse(
          localStorage.getItem("savedSongs") || "{}"
        );
        const entries = Object.entries(savedSongs);
        const match = entries.find(
          ([id, song]) =>
            song.title === currentTitle && song.artist === currentArtist
        );

        if (match) {
          const [id, song] = match;
          // Update the song's scroll speed
          song.scrollSpeed = currentSpeed;
          savedSongs[id] = song;
          localStorage.setItem("savedSongs", JSON.stringify(savedSongs));

          // Update the reference if we have it
          if (window.currentDisplayedSong) {
            window.currentDisplayedSong.scrollSpeed = currentSpeed;
          }
        }
      }
    }
  }

  // Handle keyboard controls
  function handleKeyDown(e) {
    // Don't capture key events when typing in input fields
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      // Handle Enter key in edit area to save
      if (
        isEditMode &&
        e.key === "Enter" &&
        e.ctrlKey &&
        e.target === editArea
      ) {
        e.preventDefault();
        saveEditedSong();
      }
      return;
    }

    // Debug keyboard events
    console.log(
      `Key pressed: ${e.key}, keyCode: ${e.keyCode}, which: ${e.which}`
    );

    switch (e.key) {
      case " ": // Spacebar
      case "Space":
        e.preventDefault();
        isScrolling ? stopScrolling() : startScrolling();
        break;

      case "ArrowUp":
        e.preventDefault();
        // Scroll up manually
        teleprompter.scrollBy(0, -40);
        break;

      case "ArrowDown":
        e.preventDefault();
        // Scroll down manually
        teleprompter.scrollBy(0, 40);
        break;

      case "Home":
        e.preventDefault();
        resetScroll();
        break;

      case "F":
      case "f":
        e.preventDefault();
        toggleFullscreen();
        break;

      case "E":
      case "e":
        e.preventDefault();
        // Toggle edit mode
        if (isEditMode) {
          if (confirm("Exit edit mode? Any unsaved changes will be lost.")) {
            exitEditMode();
            // Redisplay current song
            const currentTitle =
              document.querySelector(".song-header h2")?.textContent;
            const currentArtist = document
              .querySelector(".song-header h3")
              ?.textContent?.replace(/by\s+/i, "")
              .trim();
            if (currentTitle && currentArtist) {
              const songs = loadSavedSongs();
              const currentSong = songs.find(
                (song) =>
                  song.title === currentTitle && song.artist === currentArtist
              );
              if (currentSong) {
                displaySavedSong(currentSong);
              }
            }
          }
        } else {
          enableEditMode();
        }
        break;

      case "Enter":
        // Save edited song if in edit mode
        if (isEditMode) {
          e.preventDefault();
          saveEditedSong();
        }
        break;

      case "Escape":
        if (isEditMode) {
          // Exit edit mode
          e.preventDefault();
          if (confirm("Exit edit mode? Any unsaved changes will be lost.")) {
            exitEditMode();
            // Redisplay current song
            const currentTitle =
              document.querySelector(".song-header h2")?.textContent;
            const currentArtist = document
              .querySelector(".song-header h3")
              ?.textContent?.replace(/by\s+/i, "")
              .trim();
            if (currentTitle && currentArtist) {
              const songs = loadSavedSongs();
              const currentSong = songs.find(
                (song) =>
                  song.title === currentTitle && song.artist === currentArtist
              );
              if (currentSong) {
                displaySavedSong(currentSong);
              }
            }
          }
        } else if (document.fullscreenElement) {
          document.exitFullscreen().then(() => {
            appContainer.classList.remove("fullscreen");
          });
        } else {
          // Close any open dropdowns
          const dropdowns = document.querySelectorAll(
            ".dropdown-content:not(.hidden)"
          );
          if (dropdowns.length > 0) {
            dropdowns.forEach((dropdown) => dropdown.classList.add("hidden"));
          }

          // Close shortcuts popup if open
          const shortcutsPopup = document.getElementById("shortcuts-popup");
          if (shortcutsPopup && !shortcutsPopup.classList.contains("hidden")) {
            shortcutsPopup.classList.add("hidden");
          }
        }
        break;

      // Plus and minus keys for speed control (but not when Ctrl is pressed for browser zoom)
      case "+":
      case "=": // Plus key (= key without shift)
        // Allow browser zoom if Ctrl is pressed
        if (e.ctrlKey || e.metaKey) {
          return; // Let browser handle Ctrl+Plus for zoom
        }
        e.preventDefault();
        const currentSpeedUp = parseInt(scrollSpeedInput.value);
        const newSpeedUp = Math.min(currentSpeedUp + 1, 25); // Max speed is 25
        scrollSpeedInput.value = newSpeedUp;

        // Update display
        if (speedValueDisplay) {
          speedValueDisplay.textContent = newSpeedUp;
        }

        // Update scrolling if active
        if (isScrolling) {
          stopScrolling();
          startScrolling();
        }

        // Save the scroll speed for current song
        saveScrollSpeedForCurrentSong();
        break;

      case "-":
      case "_": // Minus key (- key with shift, though unlikely to be used)
        // Allow browser zoom if Ctrl is pressed
        if (e.ctrlKey || e.metaKey) {
          return; // Let browser handle Ctrl+Minus for zoom
        }
        e.preventDefault();
        const currentSpeedDown = parseInt(scrollSpeedInput.value);
        const newSpeedDown = Math.max(currentSpeedDown - 1, 1); // Min speed is 1
        scrollSpeedInput.value = newSpeedDown;

        // Update display
        if (speedValueDisplay) {
          speedValueDisplay.textContent = newSpeedDown;
        }

        // Update scrolling if active
        if (isScrolling) {
          stopScrolling();
          startScrolling();
        }

        // Save the scroll speed for current song
        saveScrollSpeedForCurrentSong();
        break;

      case "ArrowLeft":
        // Check if we're in the song view and not on the saved songs list
        e.preventDefault();
        goToPreviousSong();
        break;

      case "ArrowRight":
        // Check if we're in the song view and not on the saved songs list
        e.preventDefault();
        goToNextSong();
        break;

      case "A":
      case "a":
        // Toggle extraction dropdown
        e.preventDefault();
        const extractDropdownBtn = document.querySelector(
          "#extract-dropdown .dropdown-button"
        );
        if (extractDropdownBtn) {
          extractDropdownBtn.click(); // Trigger the click event handler directly
          return;
        }

        // Fallback to the old method if the button isn't found
        const extractDropdownContent = document.querySelector(
          "#extract-dropdown .dropdown-content"
        );
        if (extractDropdownContent) {
          extractDropdownContent.classList.toggle("hidden");
          // Close other dropdowns
          const savedSongsDropdown = document.querySelector(
            "#songs-dropdown .dropdown-content"
          );
          if (
            savedSongsDropdown &&
            !savedSongsDropdown.classList.contains("hidden")
          ) {
            savedSongsDropdown.classList.add("hidden");
          }

          // Close import/export dropdown
          const importExportDropdown = document.querySelector(
            "#import-export-dropdown .dropdown-content"
          );
          if (
            importExportDropdown &&
            !importExportDropdown.classList.contains("hidden")
          ) {
            importExportDropdown.classList.add("hidden");
          }
        }
        break;

      case "S":
      case "s":
        // Toggle saved songs dropdown
        e.preventDefault();
        // Directly click the saved-songs-button instead of just toggling the dropdown
        const savedSongsBtn = document.getElementById("saved-songs-button");
        if (savedSongsBtn) {
          savedSongsBtn.click(); // This will trigger the click event handler
        }
        break;

      case "I":
      case "i":
        // Toggle import/export dropdown
        e.preventDefault();
        // Directly click the import-export button instead of just toggling the dropdown
        const importExportBtn = document.getElementById("import-export-button");
        if (importExportBtn) {
          importExportBtn.click(); // This will trigger the click event handler
        }
        break;

      case "K":
      case "k":
        // Show keyboard shortcuts
        e.preventDefault();
        const shortcutsPopup = document.getElementById("shortcuts-popup");
        if (shortcutsPopup) {
          shortcutsPopup.classList.toggle("hidden");
        }
        break;
    }
  }
});
