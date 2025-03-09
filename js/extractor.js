document.addEventListener("DOMContentLoaded", function () {
  // Tab functionality
  const tabButtons = document.querySelectorAll(".tab-button");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons
      tabButtons.forEach((btn) => btn.classList.remove("active"));

      // Hide all content sections
      document.getElementById("copy-paste-content").classList.add("hidden");
      document.getElementById("manual-method-content").classList.add("hidden");

      // Add active class to clicked button and show corresponding content
      button.classList.add("active");
      const tabId = button.getAttribute("data-tab");
      document.getElementById(tabId + "-content").classList.remove("hidden");
    });
  });

  // Dropdown toggle
  const extractDropdownBtn = document.querySelector(
    "#extract-dropdown .dropdown-button"
  );
  const extractDropdownContent = document.querySelector(
    "#extract-dropdown .dropdown-content"
  );

  if (extractDropdownBtn && extractDropdownContent) {
    extractDropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
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

      // Close shortcuts popup if open
      const shortcutsPopup = document.getElementById("shortcuts-popup");
      if (shortcutsPopup && !shortcutsPopup.classList.contains("hidden")) {
        shortcutsPopup.classList.add("hidden");
      }
    });
  }

  // Close dropdowns when clicking elsewhere
  document.addEventListener("click", (e) => {
    const dropdowns = document.querySelectorAll(".dropdown-content");
    dropdowns.forEach((dropdown) => {
      if (
        !dropdown.contains(e.target) &&
        !e.target.closest(".dropdown-button")
      ) {
        dropdown.classList.add("hidden");
      }
    });

    // Also close shortcuts popup
    const shortcutsPopup = document.getElementById("shortcuts-popup");
    if (
      shortcutsPopup &&
      !shortcutsPopup.classList.contains("hidden") &&
      !e.target.closest("#show-shortcuts")
    ) {
      shortcutsPopup.classList.add("hidden");
    }
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

      // Create a container for paste area and button
      const pasteContainer = document.createElement("div");
      pasteContainer.style.position = "fixed";
      pasteContainer.style.left = "0";
      pasteContainer.style.top = "0";
      pasteContainer.style.width = "100%";
      pasteContainer.style.height = "100%";
      pasteContainer.style.background = "#1a1a1a";
      pasteContainer.style.zIndex = "9999";
      pasteContainer.style.display = "flex";
      pasteContainer.style.flexDirection = "column";
      document.body.appendChild(pasteContainer);

      // Create a textarea for the user to paste into
      const pasteArea = document.createElement("textarea");
      pasteArea.style.width = "100%";
      pasteArea.style.height = "calc(100% - 60px)";
      pasteArea.style.padding = "20px";
      pasteArea.style.background = "#1a1a1a";
      pasteArea.style.color = "#fff";
      pasteArea.style.border = "none";
      pasteArea.style.resize = "none";
      pasteArea.style.outline = "none";
      pasteArea.style.boxSizing = "border-box";
      pasteArea.placeholder =
        "Paste the copied content from Ultimate Guitar Print View here (https://tabs.ultimate-guitar.com/tab/print?...), then press Ctrl+Enter or click the Confirm button below";
      pasteContainer.appendChild(pasteArea);

      // Create a button container
      const buttonContainer = document.createElement("div");
      buttonContainer.style.padding = "10px 20px";
      buttonContainer.style.textAlign = "center";

      // Create confirm button
      const confirmButton = document.createElement("button");
      confirmButton.textContent = "Confirm";
      confirmButton.style.padding = "10px 20px";
      confirmButton.style.margin = "0 10px";
      confirmButton.style.backgroundColor = "#4CAF50"; // Green
      confirmButton.style.color = "white";
      confirmButton.style.border = "none";
      confirmButton.style.borderRadius = "4px";
      confirmButton.style.cursor = "pointer";
      confirmButton.style.fontSize = "16px";

      // Create cancel button
      const cancelButton = document.createElement("button");
      cancelButton.textContent = "Cancel";
      cancelButton.style.padding = "10px 20px";
      cancelButton.style.margin = "0 10px";
      cancelButton.style.backgroundColor = "#f44336"; // Red
      cancelButton.style.color = "white";
      cancelButton.style.border = "none";
      cancelButton.style.borderRadius = "4px";
      cancelButton.style.cursor = "pointer";
      cancelButton.style.fontSize = "16px";

      // Add buttons to container
      buttonContainer.appendChild(confirmButton);
      buttonContainer.appendChild(cancelButton);
      pasteContainer.appendChild(buttonContainer);

      // Focus the textarea so the user can paste immediately
      pasteArea.focus();

      // Use a flag to track if the textarea has been removed
      let isRemoved = false;

      // Function to process the content and remove the paste container
      const processContent = () => {
        if (isRemoved) return;

        const content = pasteArea.value;
        isRemoved = true;
        document.body.removeChild(pasteContainer);

        if (content) {
          processClipboardContent(content);
        }
      };

      // Function to just remove the paste container
      const cancelPaste = () => {
        if (isRemoved) return;

        isRemoved = true;
        document.body.removeChild(pasteContainer);
      };

      // Add event listeners
      confirmButton.addEventListener("click", processContent);
      cancelButton.addEventListener("click", cancelPaste);

      pasteArea.addEventListener("keydown", (e) => {
        // Ctrl+Enter to confirm
        if (e.ctrlKey && e.key === "Enter") {
          processContent();
        }
        // Escape to cancel
        if (e.key === "Escape") {
          cancelPaste();
        }
      });

      // Hide the dropdown after clicking the button
      const extractDropdownContent = document.querySelector(
        "#extract-dropdown .dropdown-content"
      );
      if (extractDropdownContent) {
        extractDropdownContent.classList.add("hidden");
      }
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
        content: processChords(content, true),
      });

      // Clear the form
      document.getElementById("song-title").value = "";
      document.getElementById("song-artist").value = "";
      document.getElementById("song-content-input").value = "";

      // Hide the dropdown after creating the song
      const extractDropdownContent = document.querySelector(
        "#extract-dropdown .dropdown-content"
      );
      if (extractDropdownContent) {
        extractDropdownContent.classList.add("hidden");
      }
    });
  }

  // Show keyboard shortcuts popup
  const showShortcutsBtn = document.getElementById("show-shortcuts");
  const shortcutsPopup = document.getElementById("shortcuts-popup");

  if (showShortcutsBtn && shortcutsPopup) {
    showShortcutsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      shortcutsPopup.classList.toggle("hidden");

      // Close any open dropdowns
      const dropdowns = document.querySelectorAll(".dropdown-content");
      dropdowns.forEach((dropdown) => {
        dropdown.classList.add("hidden");
      });
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

      // The print view typically has a clean header with title and artist
      const printViewTitleMatch = content.match(/^(.+?)\s*by\s*(.+?)\s*$/m);
      if (printViewTitleMatch) {
        title = printViewTitleMatch[1].trim();
        artist = printViewTitleMatch[2].trim();
      } else {
        // Fallback to original title extraction methods
        const titleMatch = cleanedContent.match(
          /([^\n]+)\s+(?:Chords|Tabs)\s+by\s+([^\n]+)/i
        );
        if (titleMatch) {
          title = titleMatch[1].trim();
          artist = titleMatch[2].trim();
        } else {
          // Second attempt: look for common Ultimate Guitar patterns
          const titlePatterns = [
            /^([^\n]+) by ([^\n]+)/i,
            /^([^\n]+)\s*-\s*([^\n]+)/i,
          ];

          for (const pattern of titlePatterns) {
            const match = cleanedContent.match(pattern);
            if (match) {
              title = match[1].trim();
              artist = match[2].trim();
              break;
            }
          }
        }
      }

      // Clean up title if it has "tabs" or "chords" in it
      title = title.replace(/\s*(tabs|chords|tab|chord)\s*$/i, "").trim();

      // Process the content to identify chords with preserved positioning
      const processedContent = processChords(cleanedContent, true);

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
    // Check if this appears to be from the print view (simpler format)
    const isPrintView =
      rawContent.includes("https://tabs.ultimate-guitar.com/tab/print") ||
      rawContent.match(/^.+?\s*by\s*.+?\s*$/m) ||
      !rawContent.includes("Ultimate-Guitar.Com");

    if (isPrintView) {
      return cleanPrintViewContent(rawContent);
    } else {
      return cleanStandardViewContent(rawContent);
    }
  }

  // Clean content specifically from the print view
  function cleanPrintViewContent(rawContent) {
    // Remove any HTML tags that might have been copied
    let content = rawContent.replace(/<[^>]*>/g, "");

    // Split into lines for processing
    const lines = content.split(/\r?\n/);
    const cleanedLines = [];

    // Skip the first few lines if they contain URL or site info
    let startIdx = 0;
    while (
      startIdx < lines.length &&
      (lines[startIdx].includes("https://") ||
        lines[startIdx].includes("ultimate-guitar") ||
        !lines[startIdx].trim())
    ) {
      startIdx++;
    }

    // Process the rest of the content
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines at the beginning
      if (cleanedLines.length === 0 && !line) {
        continue;
      }

      // Skip footer lines
      if (
        line.includes("Ultimate Guitar") ||
        (line.includes("UG") && line.length < 20) ||
        line.match(/^\d+$/)
      ) {
        continue;
      }

      cleanedLines.push(lines[i]); // Keep original spacing for chord alignment
    }

    return cleanedLines.join("\n");
  }

  // Original cleaning function for the standard view
  function cleanStandardViewContent(rawContent) {
    // Remove any HTML tags that might have been copied
    let content = rawContent.replace(/<[^>]*>/g, "");

    // Split into lines for processing
    const lines = content.split(/\r?\n/);
    const cleanedLines = [];

    // Track when we're inside the actual song content
    let inSongContent = false;
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
          /^\[(Intro|Verse|Chorus|Bridge|Outro|Pre-chorus|Solo|Interlude|Instrumental)/i
        )
      ) {
        songContentStarted = true;
        inSongContent = true;
        cleanedLines.push(line);
        continue;
      }

      // Skip lines with common UI elements/headers
      if (
        line.match(
          /^(Winter Sale|Pro Access|days|hrs|min|sec|Tabs|Courses|Songbooks|Articles|Forums|Publish tab|Pro|More Versions|Ver \d+|\d+,\d+ views|Tuning:|Capo:|Author|contributors|Difficulty:|Strumming|There is no strumming pattern|IQ|All rights reserved|Discover|Support|Legal|Terms|Privacy|DMCA|©|Ultimate-Guitar|Report|Recommended songs|Search|Favorite|Share)/i
        )
      ) {
        inSongContent = false;
        continue;
      }

      // Skip social media, navigation, etc.
      if (
        line.match(
          /^(Font|Transpose|comment|Related tabs|All artists|#|apple store|google play|huawei store|About UG|Site Rules|Print|Rate|Correct)/i
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

  // Process text to add chord tags - now with position preservation
  function processChords(text, preservePosition = true) {
    // First split into lines
    const lines = text.split(/\r?\n/);
    const processedLines = [];
    let inTabBlock = false;

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
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

      // Check for chord lines
      // In the print view, chord lines are typically alone on their own line
      // above the corresponding lyric line
      if (
        preservePosition &&
        isChordOnlyLine(trimmedLine) &&
        i + 1 < lines.length &&
        lines[i + 1].trim().length > 0 &&
        !isChordOnlyLine(lines[i + 1].trim())
      ) {
        // We need to preserve the spaces between chords
        const chordLine = convertSpacedChordLine(line);
        processedLines.push(chordLine);
        continue;
      }

      // Standard chord processing for mixed lines (lyrics with chords)
      // Enhanced regex to match more complex chord formats
      const chordsRegex =
        /\b([A-G][#b]?(?:m|maj|min|dim|sus|aug|add|M)?(?:[\d\/]+)?(?:[^\s]*)?(?:\([^)]*\))?)\b/g;
      let processedLine = line.replace(chordsRegex, "[ch]$1[/ch]");

      // Skip chord definition lines (like "Am = x02210")
      if (processedLine.includes(" = ") && processedLine.match(/\[ch\]/)) {
        continue;
      }

      processedLines.push(processedLine);
    }

    // Special processing to handle pairs of chord/lyric lines
    return processedLines.join("\n");
  }

  // Check if a line contains only chord patterns (with possible spacing)
  function isChordOnlyLine(line) {
    if (!line || line.length === 0) return false;

    // Remove all potential chords and spaces
    // Enhanced pattern to match more complex chord formats
    const nonChordContent = line.replace(
      /\s*[A-G][#b]?(?:m|maj|min|dim|sus|aug|add|M)?(?:[\d\/]+)?(?:[^\s]*)?(?:\([^)]*\))?\s*/g,
      ""
    );

    // If nothing remains, it was a chord-only line
    return nonChordContent.length === 0;
  }

  // Convert a line with spaced chords to preserve positions
  function convertSpacedChordLine(line) {
    // Match all chord patterns - enhanced to catch more variations
    const chordRegex =
      /[A-G][#b]?(?:m|maj|min|dim|sus|aug|add|M)?(?:[\d\/]+)?(?:[^\s]*)?(?:\([^)]*\))?/g;
    let result = line;
    let match;
    let offset = 0; // Track position offset from string modifications

    // Replace each chord with tagged version while preserving position
    while ((match = chordRegex.exec(line)) !== null) {
      const chord = match[0];
      const pos = match.index;

      // Calculate the position considering the added tags and previous modifications
      const taggedChord = `[ch]${chord}[/ch]`;
      const posDiff = taggedChord.length - chord.length;

      // Replace at exact position (accounting for all previous replacements)
      result =
        result.substring(0, pos + offset) +
        taggedChord +
        result.substring(pos + offset + chord.length);

      // Keep track of total offset from all replacements
      offset += posDiff;
    }

    return result;
  }

  // Create song and pass to the teleprompter
  function createSong(songData) {
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
      <h3 style="margin-top:0;color:#ffc107">Cleaning Tips</h3>
      <p>For best results, use the Ultimate Guitar Print View:</p>
      <ol style="padding-left:20px;margin:10px 0">
        <li>Go to the Ultimate Guitar song page</li>
        <li>Click the "Print" button at the top</li>
        <li>In the print page, press Ctrl+A to select all content</li>
        <li>Press Ctrl+C to copy</li>
      </ol>
      <p>This will preserve chord positions above lyrics for better readability.</p>
      <button id="close-info" style="background:#ffc107;border:none;padding:5px 10px;color:#1a1a1a;cursor:pointer;border-radius:3px;margin-top:5px">OK, Got it</button>
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
