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

  // Scroll state
  let isScrolling = false;
  let scrollInterval = null;
  const baseScrollSpeed = 1; // Base pixels per interval

  // Controls state
  let controlsCollapsed = false;

  // Initialize scroll controls
  startScrollBtn.addEventListener("click", startScrolling);
  stopScrollBtn.addEventListener("click", stopScrolling);
  resetScrollBtn.addEventListener("click", resetScroll);
  toggleFullscreenBtn.addEventListener("click", toggleFullscreen);

  // Mini controls
  miniStartScrollBtn.addEventListener("click", startScrolling);
  miniStopScrollBtn.addEventListener("click", stopScrolling);
  miniResetScrollBtn.addEventListener("click", resetScroll);
  miniToggleFullscreenBtn.addEventListener("click", toggleFullscreen);

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
  });

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
    } else {
      controls.classList.remove("collapsed");
      teleprompter.classList.remove("expanded");
      toggleControlsBtn.textContent = "Hide Controls";
      miniControls.classList.remove("visible");
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

          // Update scrolling if active
          if (isScrolling) {
            stopScrolling();
            startScrolling();
          }
        }
        break;
    }
  }
});
