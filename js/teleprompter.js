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
    if (isScrolling) return;

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
        // Reduced buffer back to 10 pixels to prevent cutting off too early
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

  // Make goToPreviousSong available globally for the navigation buttons
  window.goToPreviousSong = goToPreviousSong;

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

      case "Escape":
        if (document.fullscreenElement) {
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

          // Update scrolling if active
          if (isScrolling) {
            stopScrolling();
            startScrolling();
          }

          // Save the scroll speed for current song
          saveScrollSpeedForCurrentSong();
        }
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

      case "E":
      case "e":
        // Toggle extraction dropdown
        e.preventDefault();
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
        }
        break;

      case "S":
      case "s":
        // Toggle saved songs dropdown
        e.preventDefault();
        const savedSongsDropdown = document.querySelector(
          "#songs-dropdown .dropdown-content"
        );
        if (savedSongsDropdown) {
          savedSongsDropdown.classList.toggle("hidden");
          // Update the saved songs list
          if (!savedSongsDropdown.classList.contains("hidden")) {
            const event = new Event("click");
            document.getElementById("saved-songs-button").dispatchEvent(event);
          }
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
