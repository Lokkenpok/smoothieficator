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
      if (!localStorage.getItem('extractionInfoShown')) {
        localStorage.setItem('extractionInfoShown', 'true');
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
    });se
  }nUltimateGuitarContent(content);

  // Process clipboard content to extract song information      // Try to extract the song title and artist
  function processClipboardContent(content) {
    try {
      // Try to extract the song title and artist
      let title = "Unknown Song"; cleaned text
      let artist = "Unknown Artist";t.match(/([^\n]+)\s+(?:Chords|Tabs)\s+by\s+([^\n]+)/i);
eMatch) {
      // Find title and artist in the text (common patterns on UG)
      const titleMatch = content.match(/(.*?)\s+by\s+(.*?)(?:\r?\n|\r|$)/);
      if (titleMatch) {
        title = titleMatch[1].trim();
        artist = titleMatch[2].trim();
      } else {\s*(tabs|chords|tab|chord)\s*$/i, "").trim();
        // Try to find H1 header style title
        const lines = content.split(/\r?\n/);he content to identify chords
        for (let i = 0; i < Math.min(10, lines.length); i++) { processedContent = processChords(cleanedContent);
          const line = lines[i].trim();
          if (line && line.length > 3 && line.length < 100) {/ Create a song object
            // Likely a title      createSong({
            title = line;
            break;
          }        content: processedContent,
        }
      }
      console.error("Error processing clipboard content:", e);
      // Clean up title if it has "tabs" or "chords" in it
      title = title.replace(/\s*(tabs|chords|tab|chord)\s*$/i, "").trim();cessing content. Please try again or use the manual method."

      // Process the content to identify chords
      const processedContent = processChords(content);

      // Create a song objectte Guitar pasted content to extract only tab/chord content
      createSong({
        title: title,e any HTML tags that might have been copied
        artist: artist,
        content: processedContent,
      });/ Split into lines for processing
    } catch (e) { const lines = content.split(/\r?\n/);
      console.error("Error processing clipboard content:", e);    const cleanedLines = [];
      alert(
        "Error processing content. Please try again or use the manual method."e actual song content
      );
    }
  }

  // Create song and pass to the teleprompterecutiveEmptyLines = 0;
  function createSong(songData) {
    // Get the main scraper functions
    if (typeof processSongFromBookmarklet === "function") {; i++) {
      const line = lines[i].trim();      // Use the existing function from scraper.js
      
      // Skip empty lines (but preserve some within song content) else {
      if (!line) {   // Fallback if the function isn't available
        if (songContentStarted) {      const event = new CustomEvent("songExtracted", { detail: songData });
          consecutiveEmptyLines++;
          if (consecutiveEmptyLines <= 1) {
            cleanedLines.push('');  // Preserve max one empty linee the scroll controls to start the teleprompter.");
          }
        }
        continue;
      } chord tags with improved detection
      {
      consecutiveEmptyLines = 0;

      // Detect intro or section header
      if (line.match(/^\[(Intro|Verse|Chorus|Bridge|Outro|Pre-chorus|Solo|Interlude)/i)) {
        songContentStarted = true; inTabBlock = false;
        inSongContent = true;    let inChordBlock = false;
        foundFirstSection = true;
        cleanedLines.push(line);
        continue;
      }
            
      // Skip lines with common UI elements/headerstly - don't convert tabs to chords
      if (line.match(/^(Winter Sale|Pro Access|days|hrs|min|sec|Tabs|Courses|Songbooks|Articles|Forums|Publish tab|Pro|More Versions|Ver \d+|\d+,\d+ views|Tuning:|Capo:|Author|contributors|Difficulty:|Strumming|There is no strumming pattern|IQ|All rights reserved|Discover|Support|Legal|Terms|Privacy|DMCA|©|Ultimate-Guitar)/i)) { if (trimmedLine.startsWith('e|') || trimmedLine.startsWith('B|') || 
        inSongContent = false;          trimmedLine.startsWith('G|') || trimmedLine.startsWith('D|') || 
        continue;) || trimmedLine.startsWith('E|')) {
      }     inTabBlock = true;
           processedLines.push(line);
      // Skip social media, navigation, etc.        continue;















































































});  }    return processedLines.join("\n");    }      processedLines.push(processedLine);      let processedLine = line.replace(chordsRegex, "[ch]$1[/ch]");        /\b([A-G][#b]?(m|maj|min|dim|sus|aug|add|2|4|5|6|7|9|11|13)?(?:\([^)]*\))?)\b/g;      const chordsRegex =      // Look for common chord patterns      }        continue;        processedLines.push(line);      if (line.trim().startsWith("[") && line.trim().includes("]")) {      // If line starts with a section marker, keep as is    for (const line of lines) {    // Process each line    const processedLines = [];    const lines = text.split(/\r?\n/);    // First split into lines  function processChords(text) {  // Process text to add chord tags (borrowed from scraper.js)  }    }      alert("Song created! Use the scroll controls to start the teleprompter.");      document.dispatchEvent(event);      const event = new CustomEvent("songExtracted", { detail: songData });      // Fallback if the function isn't available    } else {      processSongFromBookmarklet(songData);      // Use the existing function from scraper.js    if (typeof processSongFromBookmarklet === "function") {    // Get the main scraper functions  function createSong(songData) {  // Create song and pass to the teleprompter  }    return cleanedLines.join('\n');    // Join the cleaned content back together        }      }        cleanedLines.push(line);      if (songContentStarted && !line.match(/^[0-9.]+$/) && line.length > 5) {      // If it looks like lyrics and we've already found song content sections            }        continue;        songContentStarted = true;        cleanedLines.push(line);      if (inSongContent || line.match(/[A-G][#b]?(m|maj|min|dim|sus|aug|add|2|4|5|6|7|9|11|13)?(\([^)]*\))?/)) {      // If we're in song content, or the line contains likely chord patterns, include it            }        continue;        cleanedLines.push(line);        songContentStarted = true;        inSongContent = true;      if (isTabLine || isChordDefinition || line.match(/\|-+\|/) || line.match(/^[eADGBE]\|/)) {            const isChordDefinition = line.match(/^[A-G][#b]?(m|maj|min|dim|sus|aug|add|2|4|5|6|7|9|11|13)?(\([^)]*\))?\s*=/);      const isTabLine = line.match(/^[a-gA-G][\|:]-+/);      // Detect chord diagrams or tab lines - these indicate we're in song content      }        continue;      if (line.match(/^[\d\s+]+$/) || line === 'X') {      // Skip lines with just numbers or symbols      }        continue;        inSongContent = false;      if (line.match(/^(Font|Transpose|comment|Related tabs|All artists|#|apple store|google play|huawei store|About UG|Site Rules)/i)) {      }
      
      // Check for end of tab block
      if (inTabBlock && trimmedLine === '') {
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
      const chordLine = trimmedLine.match(/^([A-G][#b]?(m|maj|min|dim|sus|aug|add|2|4|5|6|7|9|11|13)?(\([^)]*\))?\s*)+$/);
      if (chordLine && trimmedLine.length < 40) {
        inChordBlock = true;
        
        // Split by spaces and add chord tags to each chord
        const parts = trimmedLine.split(/\s+/);
        const taggedParts = parts.map(part => {








































});  }    }, 8000);      }        document.body.removeChild(infoOverlay);      if (document.body.contains(infoOverlay)) {    setTimeout(() => {    // Auto-remove after 8 seconds        });      document.body.removeChild(infoOverlay);    document.getElementById('close-info').addEventListener('click', function() {
        document.body.appendChild(infoOverlay);        `;      <button id="close-info" style="background:#ff6b6b;border:none;padding:5px 10px;color:#fff;cursor:pointer;border-radius:3px;margin-top:5px">OK, Got it</button>





      <p>All advertisements, navigation elements, and other website clutter will be removed.</p>      </ul>        <li>Tab notation</li>        <li>Lyrics and section markers</li>        <li>Chords and chord diagrams</li>        <li>Song title and artist</li>      <ul style="padding-left:20px;margin:10px 0">      <p>The pasted content is being cleaned to extract:</p>      <h3 style="margin-top:0;color:#ff6b6b">Cleaning Tips</h3>    infoOverlay.innerHTML = `        `;



      box-shadow: 0 0 10px rgba(0,0,0,0.5);      max-width: 300px;      z-index: 9998;      border-radius: 5px;      padding: 15px;



      color: #fff;      background-color: #333;      right: 20px;      bottom: 20px;      position: fixed;    infoOverlay.style.cssText = `    const infoOverlay = document.createElement('div');  function showExtractionInfo() {  // Create a helpful info popup to show what's happening

  }    return processedLines.join("\n");    }      processedLines.push(processedLine);      }        continue;      if (processedLine.includes(" = ") && processedLine.match(/\[ch\]/)) {      // Skip chord definition lines (like "Am = x02210")            let processedLine = trimmedLine.replace(chordsRegex, "[ch]$1[/ch]");
      const chordsRegex = /\b([A-G][#b]?(m|maj|min|dim|sus|aug|add|2|4|5|6|7|9|11|13)?(?:\([^)]*\))?)\b/g;




      // Otherwise, add chord tags to any chord patterns in normal lines            }        continue;        processedLines.push(taggedParts.join(' '));




                });          return part;          }            return `[ch]${part}[/ch]`;          if (part.match(/^[A-G][#b]?(m|maj|min|dim|sus|aug|add|2|4|5|6|7|9|11|13)?(\([^)]*\))?$/)) {