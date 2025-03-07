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
      { name: "Interlude", regex: /\[Interlude[^\]]*\]/g },
      { name: "Solo", regex: /\[Solo[^\]]*\]/g },
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

    // Save to local storage with the current timestamp as key
    const timestamp = new Date().toISOString();
    localSongs[timestamp] = song;
    localStorage.setItem("savedSongs", JSON.stringify(localSongs));

    // Dispatch event that song has loaded
    window.dispatchEvent(new CustomEvent("songLoaded"));

    // Make sure mini controls are visible
    document.getElementById("mini-controls").classList.add("visible");
  }

  // Process song data from extraction tools
  window.processSongFromBookmarklet = function (songData) {
    if (!songData || !songData.content) {
      showError("Invalid or missing song data");
      return false;
    }

    // Display the song
    displaySong(songData);

    // Show scroll controls
    scrollControls.classList.remove("hidden");
    return true;
  };

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
});
