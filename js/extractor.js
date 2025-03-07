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
      // Show the info popup the first time
      if (!localStorage.getItem("extractionInfoShown")) {
        localStorage.setItem("extractionInfoShown", "true");
        showExtractionInfo();
      }

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
      // First clean up the content to remove noise
      const cleanedContent = cleanUltimateGuitarContent(content);

      // Try to extract the song title and artist
      let title = "Unknown Song";
      let artist = "Unknown Artist";

      // Find title and artist in the cleaned text
      const titleMatch = cleanedContent.match(
        /([^\n]+)\s+(?:Chords|Tabs)\s+by\s+([^\n]+)/i
      );
      if (titleMatch) {
        title = titleMatch[1].trim();
        artist = titleMatch[2].trim();
      } else {
        // Try to find the title in the first few lines
        const lines = cleanedContent.split(/\r?\n/);
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
      const processedContent = processChords(cleanedContent);

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

  // Clean Ultimate Guitar pasted content to extract only tab/chord content
  function cleanUltimateGuitarContent(rawContent) {
    // Remove any HTML tags that might have been copied
    let content = rawContent.replace(/<[^>]*>/g, "");

    // Split into lines for processing
    const lines = content.split(/\r?\n/);
    const cleanedLines = [];

    // Track when we're inside the actual song content
    let inSongContent = false;
    let foundIntro = false;
    let foundFirstSection = false;
    let songContentStarted = false;
    let consecutiveEmptyLines = 0;

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines (but preserve some within song content)
      if (!line) {
        if (songContentStarted) {
          consecutiveEmptyLines++;
          if (consecutiveEmptyLines <= 1) {
            cleanedLines.push(""); // Preserve max one empty line
          }
        }
        continue;
      }

      consecutiveEmptyLines = 0;

      // Detect intro or section header
      if (
        line.match(
          /^\[(Intro|Verse|Chorus|Bridge|Outro|Pre-chorus|Solo|Interlude)/i
        )
      ) {
        songContentStarted = true;
        inSongContent = true;
        foundFirstSection = true;
        cleanedLines.push(line);
        continue;
      }

      // Skip lines with common UI elements/headers
      if (
        line.match(
          /^(Winter Sale|Pro Access|days|hrs|min|sec|Tabs|Courses|Songbooks|Articles|Forums|Publish tab|Pro|More Versions|Ver \d+|\d+,\d+ views|Tuning:|Capo:|Author|contributors|Difficulty:|Strumming|There is no strumming pattern|IQ|All rights reserved|Discover|Support|Legal|Terms|Privacy|DMCA|©|Ultimate-Guitar)/i
        )
      ) {
        inSongContent = false;
        continue;
      }

      // Skip social media, navigation, etc.
      if (
        line.match(
          /^(Font|Transpose|comment|Related tabs|All artists|#|apple store|google play|huawei store|About UG|Site Rules)/i
        )
      ) {
        inSongContent = false;
        continue;
      }

      // Skip lines with just numbers or symbols
      if (line.match(/^[\d\s+]+$/) || line === "X") {
        continue;
      }

      // Detect chord diagrams or tab lines - these indicate we're in song content
      const isTabLine = line.match(/^[a-gA-G][\|:]-+/);
      const isChordDefinition = line.match(
        /^[A-G][#b]?(m|maj|min|dim|sus|aug|add|2|4|5|6|7|9|11|13)?(\([^)]*\))?\s*=/
      );

      if (
        isTabLine ||
        isChordDefinition ||
        line.match(/\|-+\|/) ||
        line.match(/^[eADGBE]\|/)
      ) {
        inSongContent = true;
        songContentStarted = true;
        cleanedLines.push(line);
        continue;
      }

      // If we're in song content, or the line contains likely chord patterns, include it
      if (
        inSongContent ||
        line.match(
          /[A-G][#b]?(m|maj|min|dim|sus|aug|add|2|4|5|6|7|9|11|13)?(\([^)]*\))?/
        )
      ) {
        cleanedLines.push(line);
        songContentStarted = true;
        continue;
      }

      // If it looks like lyrics and we've already found song content sections
      if (songContentStarted && !line.match(/^[0-9.]+$/) && line.length > 5) {
        cleanedLines.push(line);
      }
    }

    // Join the cleaned content back together
    return cleanedLines.join("\n");
  }

  // Process text to add chord tags
  function processChords(text) {
    // First split into lines
    const lines = text.split(/\r?\n/);
    const processedLines = [];

    let inTabBlock = false;
    let inChordBlock = false;

    // Process each line
    for (const line of lines) {
      const trimmedLine = line.trim();

      // Handle tablature blocks differently - don't convert tabs to chords
      if (
        trimmedLine.startsWith("e|") ||
        trimmedLine.startsWith("B|") ||
        trimmedLine.startsWith("G|") ||
        trimmedLine.startsWith("D|") ||
        trimmedLine.startsWith("A|") ||
        trimmedLine.startsWith("E|")
      ) {
        inTabBlock = true;
        processedLines.push(line);
        continue;
      }

      // Check for end of tab block
      if (inTabBlock && trimmedLine === "") {
        inTabBlock = false;
      }

      if (inTabBlock) {
        processedLines.push(line);
        continue;
      }

      // If line starts with a section marker, keep as is
      if (trimmedLine.startsWith("[") && trimmedLine.includes("]")) {
        processedLines.push(line);
        continue;
      }

      // Check if this is a line of just chord names (short line with multiple chord patterns)
      const chordLine = trimmedLine.match(
        /^([A-G][#b]?(m|maj|min|dim|sus|aug|add|2|4|5|6|7|9|11|13)?(\([^)]*\))?\s*)+$/
      );
      if (chordLine && trimmedLine.length < 40) {
        inChordBlock = true;

        // Split by spaces and add chord tags to each chord
        const parts = trimmedLine.split(/\s+/);
        const taggedParts = parts.map((part) => {
          if (
            part.match(
              /^[A-G][#b]?(m|maj|min|dim|sus|aug|add|2|4|5|6|7|9|11|13)?(\([^)]*\))?$/
            )
          ) {
            return `[ch]${part}[/ch]`;
          }
          return part;
        });

        processedLines.push(taggedParts.join(" "));
        continue;
      }

      // Otherwise, add chord tags to any chord patterns in normal lines
      const chordsRegex =
        /\b([A-G][#b]?(m|maj|min|dim|sus|aug|add|2|4|5|6|7|9|11|13)?(?:\([^)]*\))?)\b/g;
      let processedLine = trimmedLine.replace(chordsRegex, "[ch]$1[/ch]");

      // Skip chord definition lines (like "Am = x02210")
      if (processedLine.includes(" = ") && processedLine.match(/\[ch\]/)) {
        continue;
      }

      processedLines.push(processedLine);
    }

    return processedLines.join("\n");
  }

  // Create song and pass to the teleprompter
  function createSong(songData) {
    // Get the main scraper functions
    if (typeof window.processSongFromBookmarklet === "function") {
      // Use the existing function from scraper.js
      window.processSongFromBookmarklet(songData);
    } else {
      // Fallback if the function isn't available
      const event = new CustomEvent("songExtracted", { detail: songData });
      document.dispatchEvent(event);
      alert("Song created! Use the scroll controls to start the teleprompter.");
    }
  }

  // Create a helpful info popup to show what's happening
  function showExtractionInfo() {
    const infoOverlay = document.createElement("div");
    infoOverlay.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #333;
      color: #fff;
      padding: 15px;
      border-radius: 5px;
      z-index: 9998;
      max-width: 300px;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    `;

    infoOverlay.innerHTML = `
      <h3 style="margin-top:0;color:#ff6b6b">Cleaning Tips</h3>
      <p>The pasted content is being cleaned to extract:</p>
      <ul style="padding-left:20px;margin:10px 0">
        <li>Song title and artist</li>
        <li>Chords and chord diagrams</li>
        <li>Lyrics and section markers</li>
        <li>Tab notation</li>
      </ul>
      <p>All advertisements, navigation elements, and other website clutter will be removed.</p>
      <button id="close-info" style="background:#ff6b6b;border:none;padding:5px 10px;color:#fff;cursor:pointer;border-radius:3px;margin-top:5px">OK, Got it</button>
    `;

    document.body.appendChild(infoOverlay);

    document
      .getElementById("close-info")
      .addEventListener("click", function () {
        document.body.removeChild(infoOverlay);
      });

    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (document.body.contains(infoOverlay)) {
        document.body.removeChild(infoOverlay);
      }
    }, 8000);
  }
});
