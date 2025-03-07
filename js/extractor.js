document.addEventListener("DOMContentLoaded", function () {
  // Tab functionality
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons and hide all contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.add("hidden"));

      // Add active class to clicked button and show corresponding content
      button.classList.add("active");
      const tabId = button.getAttribute("data-tab");
      document.getElementById(tabId).classList.remove("hidden");
    });
  });

  // Copy-paste extraction method
  const extractButton = document.getElementById("extract-button");
  if (extractButton) {
    extractButton.addEventListener("click", () => {
      // Create a textarea for the user to paste into
      const pasteArea = document.createElement("textarea");
      pasteArea.style.position = "fixed";
      pasteArea.style.left = "0";
      pasteArea.style.top = "0";
      pasteArea.style.width = "100%";
      pasteArea.style.height = "100%";
      pasteArea.style.padding = "20px";
      pasteArea.style.background = "#1a1a1a";
      pasteArea.style.color = "#fff";
      pasteArea.style.zIndex = "9999";
      pasteArea.placeholder =
        "Paste the copied content from Ultimate Guitar here, then press Ctrl+Enter or click outside this box";
      document.body.appendChild(pasteArea);

      // Focus the textarea so the user can paste immediately
      pasteArea.focus();

      // Add event listeners
      pasteArea.addEventListener("blur", () => {
        const content = pasteArea.value;
        document.body.removeChild(pasteArea);
        if (content) {
          processClipboardContent(content);
        }
      });

      pasteArea.addEventListener("keydown", (e) => {
        // Ctrl+Enter to confirm
        if (e.ctrlKey && e.key === "Enter") {
          const content = pasteArea.value;
          document.body.removeChild(pasteArea);
          if (content) {
            processClipboardContent(content);
          }
        }
      });
    });
  }

  // Manual input method
  const manualExtractButton = document.getElementById("manual-extract-button");
  if (manualExtractButton) {
    manualExtractButton.addEventListener("click", () => {
      const title = document.getElementById("song-title").value;
      const artist = document.getElementById("song-artist").value;
      const content = document.getElementById("song-content-input").value;

      if (!title || !artist || !content) {
        alert("Please fill in all fields");
        return;
      }

      createSong({
        title: title,
        artist: artist,
        content: processChords(content),
      });

      // Clear the form
      document.getElementById("song-title").value = "";
      document.getElementById("song-artist").value = "";
      document.getElementById("song-content-input").value = "";
    });
  }

  // Process clipboard content to extract song information
  function processClipboardContent(content) {
    try {
      // Try to extract the song title and artist
      let title = "Unknown Song";
      let artist = "Unknown Artist";

      // Find title and artist in the text (common patterns on UG)
      const titleMatch = content.match(/(.*?)\s+by\s+(.*?)(?:\r?\n|\r|$)/);
      if (titleMatch) {
        title = titleMatch[1].trim();
        artist = titleMatch[2].trim();
      } else {
        // Try to find H1 header style title
        const lines = content.split(/\r?\n/);
        for (let i = 0; i < Math.min(10, lines.length); i++) {
          const line = lines[i].trim();
          if (line && line.length > 3 && line.length < 100) {
            // Likely a title
            title = line;
            break;
          }
        }
      }

      // Clean up title if it has "tabs" or "chords" in it
      title = title.replace(/\s*(tabs|chords|tab|chord)\s*$/i, "").trim();

      // Process the content to identify chords
      const processedContent = processChords(content);

      // Create a song object
      createSong({
        title: title,
        artist: artist,
        content: processedContent,
      });
    } catch (e) {
      console.error("Error processing clipboard content:", e);
      alert(
        "Error processing content. Please try again or use the manual method."
      );
    }
  }

  // Create song and pass to the teleprompter
  function createSong(songData) {
    // Get the main scraper functions
    if (typeof processSongFromBookmarklet === "function") {
      // Use the existing function from scraper.js
      processSongFromBookmarklet(songData);
    } else {
      // Fallback if the function isn't available
      const event = new CustomEvent("songExtracted", { detail: songData });
      document.dispatchEvent(event);

      alert("Song created! Use the scroll controls to start the teleprompter.");
    }
  }

  // Process text to add chord tags (borrowed from scraper.js)
  function processChords(text) {
    // First split into lines
    const lines = text.split(/\r?\n/);
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
});
