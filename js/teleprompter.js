// Teleprompter functionality
document.addEventListener("DOMContentLoaded", () => {
  const teleprompter = document.getElementById("teleprompter");
  const songContent = document.getElementById("song-content");
  const scrollSpeedInput = document.getElementById("scroll-speed");
  const startScrollBtn = document.getElementById("start-scroll");
  const stopScrollBtn = document.getElementById("stop-scroll");
  const resetScrollBtn = document.getElementById("reset-scroll");
  const toggleFullscreenBtn = document.getElementById("toggle-fullscreen");
  const backToExtractionBtn = document.getElementById("back-to-extraction");
  const appContainer = document.getElementById("app-container");
  const speedValueDisplay = document.querySelector(".speed-value");
  const controls = document.getElementById("controls");
  const toggleControlsBtn = document.getElementById("toggle-controls");

  // Mini controls
  const miniControls = document.getElementById("mini-controls");
  const miniStartScrollBtn = document.getElementById("mini-start-scroll");
  const miniStopScrollBtn = document.getElementById("mini-stop-scroll");
  const miniResetScrollBtn = document.getElementById("mini-reset-scroll");
  const miniToggleFullscreenBtn = document.getElementById(
    "mini-toggle-fullscreen"
  );
  const miniBackToExtractionBtn = document.getElementById(
    "mini-back-to-extraction"
  );
  const miniScrollSpeedInput = document.getElementById("mini-scroll-speed");
  const miniSpeedValueDisplay = document.querySelector(".mini-speed-value");

  // Scroll state
  let isScrolling = false;
  let scrollInterval = null;
  const baseScrollSpeed = 1; // Base pixels per interval

  // Controls state
  let controlsCollapsed = false;

  // Song navigation state
  let savedSongs = [];
  let currentSongIndex = -1;

  // Flag to indicate navigation in progress (to prevent duplicate saves)
  window.navigationInProgress = false;

  // Initialize scroll controls
  startScrollBtn.addEventListener("click", startScrolling);
  stopScrollBtn.addEventListener("click", stopScrolling);
  resetScrollBtn.addEventListener("click", resetScroll);
  toggleFullscreenBtn.addEventListener("click", toggleFullscreen);
  backToExtractionBtn.addEventListener("click", backToExtraction);

  // Mini controls
  miniStartScrollBtn.addEventListener("click", startScrolling);
  miniStopScrollBtn.addEventListener("click", stopScrolling);
  miniResetScrollBtn.addEventListener("click", resetScroll);
  miniToggleFullscreenBtn.addEventListener("click", toggleFullscreen);
  miniBackToExtractionBtn.addEventListener("click", backToExtraction);

  // Toggle controls visibility
  toggleControlsBtn.addEventListener("click", toggleControls);

  // Also toggle when clicking the header
  const compactHeader = document.querySelector(".compact-controls-header");
  if (compactHeader) {
    compactHeader.addEventListener("click", (e) => {
      // Don't toggle if clicking the button itself
      if (e.target !== toggleControlsBtn) {
        toggleControls();
      }
    });
  }

  // Update speed display when slider changes
  scrollSpeedInput.addEventListener("input", () => {
    if (speedValueDisplay) {
      speedValueDisplay.textContent = scrollSpeedInput.value;
    }

    // Sync with mini slider
    if (miniScrollSpeedInput) {
      miniScrollSpeedInput.value = scrollSpeedInput.value;
      if (miniSpeedValueDisplay) {
        miniSpeedValueDisplay.textContent = scrollSpeedInput.value;
      }
    }

    if (isScrolling) {
      stopScrolling();
      startScrolling();
    }
  });

  // Update speed display when mini slider changes
  miniScrollSpeedInput.addEventListener("input", () => {
    if (miniSpeedValueDisplay) {
      miniSpeedValueDisplay.textContent = miniScrollSpeedInput.value;
    }

    // Sync with main slider
    scrollSpeedInput.value = miniScrollSpeedInput.value;
    if (speedValueDisplay) {
      speedValueDisplay.textContent = miniScrollSpeedInput.value;
    }

    if (isScrolling) {
      stopScrolling();
      startScrolling();
    }
  });

  // Keyboard controls
  document.addEventListener("keydown", handleKeyDown);

  // Handle song loaded event
  window.addEventListener("songLoaded", function () {
    resetScroll();

    // Auto-collapse controls when a song is loaded
    if (!controlsCollapsed) {
      toggleControls();
    }

    loadSavedSongs(); // Update the saved songs array and current index
  });

  // Function to return to extraction screen
  function backToExtraction() {
    // Clear the current song display
    songContent.innerHTML = "";

    // Hide scroll controls
    const scrollControls = document.getElementById("scroll-controls");
    if (scrollControls) {
      scrollControls.classList.add("hidden");
    }

    // Show extraction tool
    const extractionTool = document.querySelector(".extract-tool-container");
    if (extractionTool) {
      extractionTool.classList.remove("hidden");
    }

    // Hide mini controls as we're no longer in song view
    miniControls.classList.remove("visible");

    // Stop scrolling if it was active
    if (isScrolling) {
      stopScrolling();
    }

    // If controls were collapsed, expand them for better access to the extraction tools
    if (controlsCollapsed) {
      toggleControls();
    }
  }

  function startScrolling() {
    if (isScrolling) return;

    const speed = calculateScrollSpeed();
    isScrolling = true;

    // Show stop button, hide start button
    startScrollBtn.classList.add("hidden");
    stopScrollBtn.classList.remove("hidden");

    // Also update mini controls
    miniStartScrollBtn.classList.add("hidden");
    miniStopScrollBtn.classList.remove("hidden");

    // Start scrolling at the calculated speed
    scrollInterval = setInterval(() => {
      teleprompter.scrollBy(0, speed);

      // If we've reached the end, stop scrolling
      if (
        teleprompter.scrollTop + teleprompter.clientHeight >=
        teleprompter.scrollHeight - 10
      ) {
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

    // Also update mini controls
    miniStartScrollBtn.classList.remove("hidden");
    miniStopScrollBtn.classList.add("hidden");
  }

  function resetScroll() {
    // Stop scrolling if active
    stopScrolling();

    // Scroll to top
    teleprompter.scrollTop = 0;
  }

  function calculateScrollSpeed() {
    // Get current scroll speed value (1-10)
    const speedValue = parseInt(scrollSpeedInput.value);

    // Calculate actual pixels per interval (exponential scale for more control at slower speeds)
    return baseScrollSpeed * Math.pow(1.3, speedValue - 1);
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
          // Auto-collapse controls in fullscreen
          if (!controlsCollapsed) {
            toggleControls();
          }
        })
        .catch((err) => {
          console.error(
            `Error attempting to enable fullscreen: ${err.message}`
          );
        });
    }
  }

  function toggleControls() {
    controlsCollapsed = !controlsCollapsed;

    if (controlsCollapsed) {
      controls.classList.add("collapsed");
      teleprompter.classList.add("expanded");
      toggleControlsBtn.textContent = "Show Controls";
      miniControls.classList.add("visible");

      // Update saved songs view if it's currently showing
      const savedSongs = songContent.querySelector(".saved-songs");
      if (savedSongs) {
        savedSongs.classList.remove("with-expanded-controls");
        savedSongs.classList.add("with-collapsed-controls");
      }
    } else {
      controls.classList.remove("collapsed");
      teleprompter.classList.remove("expanded");
      toggleControlsBtn.textContent = "Hide Controls";
      miniControls.classList.remove("visible");

      // Update saved songs view if it's currently showing
      const savedSongs = songContent.querySelector(".saved-songs");
      if (savedSongs) {
        savedSongs.classList.remove("with-collapsed-controls");
        savedSongs.classList.add("with-expanded-controls");
      }
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

  // Navigate to next song
  function goToNextSong() {
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
    // Create a clean copy without the timestamp property
    const song = { ...songData };
    delete song.timestamp;

    // Display the song using the existing function
    if (typeof window.processSongFromBookmarklet === "function") {
      window.processSongFromBookmarklet(song);
    }
  }

  // Handle keyboard controls
  function handleKeyDown(e) {
    // Don't capture key events when typing in input fields
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      return;
    }

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

      case "c":
      case "C":
        // Toggle controls
        toggleControls();
        break;

      case "b":
      case "B":
        // Return to extraction screen
        e.preventDefault();
        backToExtraction();
        break;

      case "Escape":
        if (document.fullscreenElement) {
          document.exitFullscreen().then(() => {
            appContainer.classList.remove("fullscreen");
          });
        }
        break;

      // Number keys 1-9 for speed control
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          scrollSpeedInput.value = num;

          // Update display
          if (speedValueDisplay) {
            speedValueDisplay.textContent = num;
          }

          // Sync with mini slider
          if (miniScrollSpeedInput) {
            miniScrollSpeedInput.value = num;
            if (miniSpeedValueDisplay) {
              miniSpeedValueDisplay.textContent = num;
            }
          }

          // Update scrolling if active
          if (isScrolling) {
            stopScrolling();
            startScrolling();
          }
        }
        break;

      case "ArrowLeft":
        // Check if we're in the song view and not on the saved songs list
        if (!songContent.querySelector(".saved-songs")) {
          console.log("Left arrow pressed in song view");
          e.preventDefault();
          goToPreviousSong();
        }
        break;

      case "ArrowRight":
        // Check if we're in the song view and not on the saved songs list
        if (!songContent.querySelector(".saved-songs")) {
          console.log("Right arrow pressed in song view");
          e.preventDefault();
          goToNextSong();
        }
        break;
    }
  }

  // Update keyboard shortcuts display
  const keyboardShortcuts = document.querySelector(".keyboard-shortcuts ul");
  if (keyboardShortcuts) {
    const navigationItem = document.createElement("li");
    navigationItem.innerHTML = "<kbd>←</kbd><kbd>→</kbd> - Previous/Next song";
    keyboardShortcuts.appendChild(navigationItem);

    // Add shortcut for the back to extraction function
    const backToExtractionItem = document.createElement("li");
    backToExtractionItem.innerHTML = "<kbd>B</kbd> - Back to Extraction";
    keyboardShortcuts.appendChild(backToExtractionItem);
  }
});
