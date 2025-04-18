// Mobile-specific functionality
document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileTeleprompterControls = document.getElementById(
    "mobile-teleprompter-controls"
  );
  const teleprompter = document.getElementById("teleprompter");
  const songContent = document.getElementById("song-content");

  // Mobile controls
  const mobileScrollSpeed = document.getElementById("mobile-scroll-speed");
  const mobileSpeedValue = document.getElementById("mobile-speed-value");
  const mobileStartScroll = document.getElementById("mobile-start-scroll");
  const mobileStopScroll = document.getElementById("mobile-stop-scroll");
  const mobileResetScroll = document.getElementById("mobile-reset-scroll");

  // Mobile form elements
  const mobileAddClipboard = document.getElementById("mobile-add-clipboard");
  const mobileAddManual = document.getElementById("mobile-add-manual");
  const mobileManualForm = document.getElementById("mobile-manual-form");
  const closeMobileManual = document.getElementById("close-mobile-manual");
  const mobileSongTitle = document.getElementById("mobile-song-title");
  const mobileSongArtist = document.getElementById("mobile-song-artist");
  const mobileSongContent = document.getElementById("mobile-song-content");
  const mobileCreateSong = document.getElementById("mobile-create-song");

  // Navigation buttons
  const mobilePrevSong = document.getElementById("mobile-prev-song");
  const mobileNextSong = document.getElementById("mobile-next-song");

  // Other control buttons
  const mobileEditMode = document.getElementById("mobile-edit-mode");
  const mobileSavedSongs = document.getElementById("mobile-saved-songs");
  const mobileExport = document.getElementById("mobile-export");
  const mobileImport = document.getElementById("mobile-import");
  const importFileInput = document.getElementById("import-file-input");

  // Track if we're on a mobile device
  let isMobileDevice = isMobile();

  // Initialize mobile UI if on mobile device
  if (isMobileDevice) {
    initMobileUI();
  }

  // Add window resize listener to handle orientation changes
  window.addEventListener("resize", () => {
    const wasMobile = isMobileDevice;
    isMobileDevice = isMobile();

    // If device state changed between mobile/desktop
    if (wasMobile !== isMobileDevice) {
      if (isMobileDevice) {
        initMobileUI();
      } else {
        // Switch back to desktop view
        hideMobileMenu();
        hideMobileTeleprompterControls();
      }
    }
  });

  // Check if we're on a mobile device
  function isMobile() {
    return window.innerWidth <= 768;
  }

  // Initialize mobile UI components
  function initMobileUI() {
    // Show mobile controls when a song is loaded
    window.addEventListener("songLoaded", showMobileTeleprompterControls);

    // Listen for when songs are processed from paste view
    document.addEventListener(
      "songPasteProcessed",
      showMobileTeleprompterControls
    );

    // Ensure all mobile elements are properly set up
    setupMobileMenuToggle();
    setupMobileTeleprompterControls();
    setupMobileAddSongButtons();
    setupMobileNavigationButtons();
    setupMobileOtherControls();
    setupMobileSyncWithDesktop();

    // Show mobile teleprompter controls if a song is already loaded
    if (isASongLoaded()) {
      showMobileTeleprompterControls();
    }
  }

  // Check if a song is currently loaded
  function isASongLoaded() {
    const songHeader = document.querySelector(".song-header");
    return songHeader !== null;
  }

  // Hamburger menu toggle functionality
  function setupMobileMenuToggle() {
    if (mobileMenuToggle && mobileMenu) {
      // Toggle menu when hamburger is clicked
      mobileMenuToggle.addEventListener("click", toggleMobileMenu);
    }
  }

  function toggleMobileMenu() {
    if (mobileMenu) {
      // If menu is active, hide it; otherwise show it
      if (mobileMenu.classList.contains("active")) {
        hideMobileMenu();
      } else {
        showMobileMenu();
      }
    }
  }

  function showMobileMenu() {
    if (mobileMenu) {
      mobileMenu.classList.add("active");
    }
  }

  function hideMobileMenu() {
    if (mobileMenu) {
      mobileMenu.classList.remove("active");
    }

    // Also hide manual form if open
    if (mobileManualForm) {
      mobileManualForm.classList.add("hidden");
      mobileManualForm.classList.remove("active");
    }
  }

  // Mobile teleprompter controls
  function setupMobileTeleprompterControls() {
    // Sync mobile scroll speed with desktop
    if (mobileScrollSpeed && mobileSpeedValue) {
      mobileScrollSpeed.addEventListener("input", () => {
        mobileSpeedValue.textContent = mobileScrollSpeed.value;

        // Sync with desktop
        const desktopScrollSpeed = document.getElementById("scroll-speed");
        if (desktopScrollSpeed) {
          desktopScrollSpeed.value = mobileScrollSpeed.value;

          // Trigger the input event on desktop control to update everything
          desktopScrollSpeed.dispatchEvent(new Event("input"));
        }
      });
    }

    // Mobile scroll controls
    if (mobileStartScroll) {
      mobileStartScroll.addEventListener("click", () => {
        const desktopStartScroll = document.getElementById("start-scroll");
        if (desktopStartScroll) {
          desktopStartScroll.click();
        }

        if (mobileStartScroll && mobileStopScroll) {
          mobileStartScroll.classList.add("hidden");
          mobileStopScroll.classList.remove("hidden");
        }
      });
    }

    if (mobileStopScroll) {
      mobileStopScroll.addEventListener("click", () => {
        const desktopStopScroll = document.getElementById("stop-scroll");
        if (desktopStopScroll) {
          desktopStopScroll.click();
        }

        if (mobileStartScroll && mobileStopScroll) {
          mobileStopScroll.classList.add("hidden");
          mobileStartScroll.classList.remove("hidden");
        }
      });
    }

    if (mobileResetScroll) {
      mobileResetScroll.addEventListener("click", () => {
        const desktopResetScroll = document.getElementById("reset-scroll");
        if (desktopResetScroll) {
          desktopResetScroll.click();
        }
      });
    }

    // Add navigation button handlers directly in the teleprompter controls
    const mobilePrevSongBtn = document.getElementById("mobile-prev-song");
    const mobileNextSongBtn = document.getElementById("mobile-next-song");

    if (mobilePrevSongBtn) {
      mobilePrevSongBtn.addEventListener("click", () => {
        if (typeof window.goToPreviousSong === "function") {
          window.goToPreviousSong();
        }
      });
    }

    if (mobileNextSongBtn) {
      mobileNextSongBtn.addEventListener("click", () => {
        if (typeof window.goToNextSong === "function") {
          window.goToNextSong();
        }
      });
    }
  }

  // Show mobile teleprompter controls
  function showMobileTeleprompterControls() {
    if (mobileTeleprompterControls && isMobileDevice) {
      mobileTeleprompterControls.classList.remove("hidden");

      // Hide the hamburger menu when showing controls in teleprompter mode
      hideMobileMenu();

      // Adjust padding of teleprompter to make room for controls
      if (teleprompter) {
        teleprompter.style.paddingBottom = "70px";
      }

      // Sync scroll speed value from desktop to mobile
      const desktopScrollSpeed = document.getElementById("scroll-speed");
      if (desktopScrollSpeed && mobileScrollSpeed && mobileSpeedValue) {
        mobileScrollSpeed.value = desktopScrollSpeed.value;
        mobileSpeedValue.textContent = desktopScrollSpeed.value;
      }

      // Sync play/pause button states
      const desktopStartScroll = document.getElementById("start-scroll");
      const desktopStopScroll = document.getElementById("stop-scroll");

      if (
        desktopStartScroll &&
        desktopStopScroll &&
        mobileStartScroll &&
        mobileStopScroll
      ) {
        if (desktopStartScroll.classList.contains("hidden")) {
          mobileStartScroll.classList.add("hidden");
          mobileStopScroll.classList.remove("hidden");
        } else {
          mobileStartScroll.classList.remove("hidden");
          mobileStopScroll.classList.add("hidden");
        }
      }
    }
  }

  // Hide mobile teleprompter controls
  function hideMobileTeleprompterControls() {
    if (mobileTeleprompterControls) {
      mobileTeleprompterControls.classList.add("hidden");

      // Reset teleprompter padding
      if (teleprompter) {
        teleprompter.style.paddingBottom = "";
      }
    }
  }

  // Mobile add song buttons
  function setupMobileAddSongButtons() {
    // Add song from clipboard
    if (mobileAddClipboard) {
      mobileAddClipboard.addEventListener("click", () => {
        hideMobileMenu();

        // Click the desktop extract button
        const desktopExtractButton = document.getElementById("extract-button");
        if (desktopExtractButton) {
          desktopExtractButton.click();
        }
      });
    }

    // Add song manually
    if (mobileAddManual && mobileManualForm && closeMobileManual) {
      mobileAddManual.addEventListener("click", () => {
        // Hide main menu
        hideMobileMenu();

        // Show manual form with proper class
        mobileManualForm.classList.remove("hidden");
        mobileManualForm.classList.add("active");
      });

      closeMobileManual.addEventListener("click", () => {
        mobileManualForm.classList.add("hidden");
        mobileManualForm.classList.remove("active");
      });
    }

    // Create song button
    if (mobileCreateSong) {
      mobileCreateSong.addEventListener("click", () => {
        if (!mobileSongTitle || !mobileSongArtist || !mobileSongContent) {
          return;
        }

        const title = mobileSongTitle.value.trim();
        const artist = mobileSongArtist.value.trim();
        const content = mobileSongContent.value.trim();

        if (!title || !artist || !content) {
          alert("Please fill in all fields");
          return;
        }

        // Use the extractor.js processChords function if available
        if (typeof window.processChords === "function") {
          createSong({
            title: title,
            artist: artist,
            content: window.processChords(content, true),
          });
        } else {
          // Fallback to direct song creation
          createSong({
            title: title,
            artist: artist,
            content: content,
          });
        }

        // Reset form and hide it
        mobileSongTitle.value = "";
        mobileSongArtist.value = "";
        mobileSongContent.value = "";
        mobileManualForm.classList.add("hidden");
        mobileManualForm.classList.remove("active");
      });
    }
  }

  // Create song and pass to the teleprompter (copy of function from extractor.js)
  function createSong(songData) {
    // Add current scroll speed to the song data
    const scrollSpeed = document.getElementById("scroll-speed");
    if (scrollSpeed) {
      songData.scrollSpeed = parseInt(scrollSpeed.value);
    }

    // If scraper.js is available, use its function
    if (typeof window.processSongFromBookmarklet === "function") {
      window.processSongFromBookmarklet(songData);
    } else {
      // Fallback if scraper.js isn't loaded
      const event = new CustomEvent("songExtracted", { detail: songData });
      document.dispatchEvent(event);
      alert("Song created! Use the scroll controls to start the teleprompter.");
    }
  }

  // Mobile navigation buttons
  function setupMobileNavigationButtons() {
    if (mobilePrevSong) {
      mobilePrevSong.addEventListener("click", () => {
        hideMobileMenu();
        if (typeof window.goToPreviousSong === "function") {
          window.goToPreviousSong();
        }
      });
    }

    if (mobileNextSong) {
      mobileNextSong.addEventListener("click", () => {
        hideMobileMenu();
        if (typeof window.goToNextSong === "function") {
          window.goToNextSong();
        }
      });
    }
  }

  // Mobile other controls
  function setupMobileOtherControls() {
    // Edit mode toggle only - fullscreen and shortcuts removed from mobile
    if (mobileEditMode) {
      mobileEditMode.addEventListener("click", () => {
        hideMobileMenu();

        // Create and dispatch E key event
        const eKeyEvent = new KeyboardEvent("keydown", {
          key: "e",
          code: "KeyE",
          keyCode: 69,
          which: 69,
          bubbles: true,
        });

        document.dispatchEvent(eKeyEvent);
      });
    }

    // Saved songs button
    if (mobileSavedSongs) {
      mobileSavedSongs.addEventListener("click", () => {
        hideMobileMenu();

        // Show saved songs in a mobile-friendly way
        showMobileSavedSongsList();
      });
    }

    // Export songs
    if (mobileExport) {
      mobileExport.addEventListener("click", () => {
        hideMobileMenu();
        const exportSongsButton = document.getElementById(
          "export-songs-button"
        );
        if (exportSongsButton) {
          exportSongsButton.click();
        }
      });
    }

    // Import songs
    if (mobileImport && importFileInput) {
      mobileImport.addEventListener("click", () => {
        hideMobileMenu();
        importFileInput.click();
      });
    }
  }

  // Create a mobile-friendly saved songs list using CSS classes instead of inline styles
  function showMobileSavedSongsList() {
    // Get saved songs from localStorage
    const savedSongsData = JSON.parse(
      localStorage.getItem("savedSongs") || "{}"
    );
    const savedSongsEntries = Object.entries(savedSongsData);

    // Create container with CSS classes
    const mobileList = document.createElement("div");
    mobileList.className = "mobile-saved-songs-list";

    // Create header
    const header = document.createElement("div");
    header.className = "mobile-saved-songs-header";

    const title = document.createElement("h2");
    title.textContent = "Saved Songs";

    const closeButton = document.createElement("button");
    closeButton.className = "mobile-saved-songs-close";
    closeButton.innerHTML = '<i class="fas fa-times"></i>';

    header.appendChild(title);
    header.appendChild(closeButton);
    mobileList.appendChild(header);

    // Create scrollable list container
    const listContainer = document.createElement("div");
    listContainer.className = "mobile-saved-songs-container";

    if (savedSongsEntries.length === 0) {
      const noSongs = document.createElement("p");
      noSongs.className = "mobile-saved-songs-empty";
      noSongs.textContent =
        "No songs saved yet. Load a song to save it automatically.";
      listContainer.appendChild(noSongs);
    } else {
      // Sort by newest first
      savedSongsEntries.sort((a, b) => b[0].localeCompare(a[0]));

      const ul = document.createElement("ul");

      savedSongsEntries.forEach(([id, song]) => {
        const li = document.createElement("li");

        const songInfo = document.createElement("div");
        songInfo.className = "mobile-song-info";
        songInfo.textContent = `${song.title} - ${song.artist}`;
        li.appendChild(songInfo);

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "mobile-song-buttons";

        const loadButton = document.createElement("button");
        loadButton.className = "mobile-load-button";
        loadButton.textContent = "Load";

        const deleteButton = document.createElement("button");
        deleteButton.className = "mobile-delete-button";
        deleteButton.textContent = "Delete";

        buttonContainer.appendChild(loadButton);
        buttonContainer.appendChild(deleteButton);
        li.appendChild(buttonContainer);

        // Add event listeners
        loadButton.addEventListener("click", () => {
          // Load the song
          if (typeof window.processSongFromBookmarklet === "function") {
            window.processSongFromBookmarklet(song);
          }
          // Remove the list
          document.body.removeChild(mobileList);
        });

        deleteButton.addEventListener("click", () => {
          if (confirm(`Delete "${song.title}" from saved songs?`)) {
            // Delete from localStorage
            delete savedSongsData[id];
            localStorage.setItem("savedSongs", JSON.stringify(savedSongsData));
            // Remove from list
            ul.removeChild(li);
            // If no songs left, show message
            if (Object.keys(savedSongsData).length === 0) {
              const noSongs = document.createElement("p");
              noSongs.className = "mobile-saved-songs-empty";
              noSongs.textContent =
                "No songs saved yet. Load a song to save it automatically.";
              listContainer.innerHTML = "";
              listContainer.appendChild(noSongs);
            }
          }
        });

        ul.appendChild(li);
      });

      listContainer.appendChild(ul);
    }

    mobileList.appendChild(listContainer);

    // Close button event
    closeButton.addEventListener("click", () => {
      document.body.removeChild(mobileList);
    });

    // Add to body
    document.body.appendChild(mobileList);
  }

  // Sync mobile controls with desktop controls
  function setupMobileSyncWithDesktop() {
    // When desktop controls change, update mobile controls
    const desktopScrollSpeed = document.getElementById("scroll-speed");
    const desktopStartScroll = document.getElementById("start-scroll");
    const desktopStopScroll = document.getElementById("stop-scroll");

    if (desktopScrollSpeed && mobileScrollSpeed) {
      desktopScrollSpeed.addEventListener("input", () => {
        if (isMobileDevice && mobileScrollSpeed && mobileSpeedValue) {
          mobileScrollSpeed.value = desktopScrollSpeed.value;
          mobileSpeedValue.textContent = desktopScrollSpeed.value;
        }
      });
    }

    // Sync play/stop states
    if (desktopStartScroll && mobileStartScroll && mobileStopScroll) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "class"
          ) {
            const isStartHidden =
              desktopStartScroll.classList.contains("hidden");

            if (isStartHidden) {
              mobileStartScroll.classList.add("hidden");
              mobileStopScroll.classList.remove("hidden");
            } else {
              mobileStartScroll.classList.remove("hidden");
              mobileStopScroll.classList.add("hidden");
            }
          }
        });
      });

      observer.observe(desktopStartScroll, { attributes: true });
    }
  }

  // Close popups when clicking on teleprompter area
  if (teleprompter) {
    teleprompter.addEventListener("click", (e) => {
      // Don't close if clicking on a button or control
      if (
        e.target.tagName === "BUTTON" ||
        e.target.closest(".mobile-teleprompter-controls") ||
        e.target.closest("#shortcuts-popup")
      ) {
        return;
      }

      const shortcutsPopup = document.getElementById("shortcuts-popup");
      if (shortcutsPopup && !shortcutsPopup.classList.contains("hidden")) {
        shortcutsPopup.classList.add("hidden");

        // Reset positioning
        shortcutsPopup.style.top = "";
        shortcutsPopup.style.left = "";
        shortcutsPopup.style.transform = "";
        shortcutsPopup.style.right = "";
        shortcutsPopup.style.maxHeight = "";
        shortcutsPopup.style.overflow = "";

        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  // Make sure the processChords function is available globally
  if (
    typeof window.processChords !== "function" &&
    typeof processChords === "function"
  ) {
    window.processChords = processChords;
  }
});
