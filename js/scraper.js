// Song scraper functionality
document.addEventListener("DOMContentLoaded", () => {
  const songUrlInput = document.getElementById("song-url");
  const loadButton = document.getElementById("load-button");
  const songContent = document.getElementById("song-content");
  const loadingIndicator = document.getElementById("loading-indicator");
  const errorLoad = document.getElementById("error-load");
  const scrollControls = document.getElementById("scroll-controls");
  const teleprompter = document.getElementById("teleprompter");

  // List of CORS proxies to try
  const CORS_PROXIES = [
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/raw?url=',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://corsproxy.io/?'
  ];

  // Retry configuration
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  loadButton.addEventListener("click", loadSong);
  songUrlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      loadSong();
    }
  });

  // Sleep function for delays between retries
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Function to try different proxies
  async function fetchWithProxy(url, proxyIndex = 0, retryCount = 0) {
    if (proxyIndex >= CORS_PROXIES.length) {
      if (retryCount < MAX_RETRIES) {
        // If we've tried all proxies, wait and start over
        await sleep(RETRY_DELAY);
        return fetchWithProxy(url, 0, retryCount + 1);
      }
      throw new Error("All proxies failed");
    }

    try {
      const proxyUrl = CORS_PROXIES[proxyIndex] + encodeURIComponent(url);
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.warn(`Proxy ${CORS_PROXIES[proxyIndex]} failed:`, error);
      // Try next proxy
      return fetchWithProxy(url, proxyIndex + 1, retryCount);
    }
  }

  async function loadSong() {
    const url = songUrlInput.value.trim();
    if (!url) {
      showError("Please enter a URL");
      return;
    }
    if (!url.includes("ultimate-guitar.com")) {
      showError("Please enter a valid Ultimate Guitar URL");
      return;
    }

    // Show loading indicator
    loadingIndicator.classList.remove("hidden");
    errorLoad.classList.add("hidden");
    scrollControls.classList.add("hidden");
    songContent.innerHTML = "";

    try {
      // For development/testing, check if we should use mock data
      if (url.includes("2272453")) {
        displaySong(createMockSong("Bones", "Low Roar", mockContent.bones));
        scrollControls.classList.remove("hidden");
        return;
      }

      // Try to fetch with proxy system
      const html = await fetchWithProxy(url);
      
      // Extract title and artist from meta tags
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      
      let title = doc.querySelector('meta[property="og:title"]')?.content || '';
      let artist = doc.querySelector('meta[property="og:description"]')?.content || '';
      
      // Clean up title and artist
      title = title.split(' by ')[0] || extractTitleFromUrl(url);
      artist = artist.split(' - ')[0] || "Unknown Artist";
      
      // Parse the content
      const content = parseUltimateGuitarHtml(html);
      
      if (!content) {
        throw new Error("Could not extract song content from the page");
      }

      displaySong({
        title,
        artist,
        content,
        type: "chords"
      });
      scrollControls.classList.remove("hidden");
      
      // Store successful proxy index in localStorage for future use
      const successfulProxy = CORS_PROXIES.findIndex(proxy => html.includes(proxy));
      if (successfulProxy !== -1) {
        localStorage.setItem('lastSuccessfulProxy', successfulProxy.toString());
      }

    } catch (error) {
      console.error("Error loading song:", error);
      if (error.message.includes('All proxies failed')) {
        showError("All CORS proxies failed. Please try again later or try the example song (ID: 2272453)");
      } else {
        showError("Error loading song. Please try again or use the example song (ID: 2272453)");
      }
    } finally {
      loadingIndicator.classList.add("hidden");
    }
  }

  function parseUltimateGuitarHtml(html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      
      // Try to find the tab content in the page
      const tabContentElement = doc.querySelector('.js-tab-content');
      const tabContent = tabContentElement ? tabContentElement.textContent : '';
      
      if (!tabContent) return null;

      // Clean up the content
      let cleanContent = tabContent
        // Remove tab characters and multiple spaces
        .replace(/\t/g, '')
        .replace(/\s+/g, ' ')
        // Clean up line endings
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
          // Keep only lines that:
          // 1. Start with a section marker [Verse], [Chorus], etc.
          // 2. Contain chords [ch]
          // 3. Contain actual lyrics (non-empty lines that don't start with [ and aren't just whitespace)
          return line.startsWith('[') || 
                 line.includes('[ch]') || 
                 (line && !line.startsWith('[') && !/^\s*$/.test(line));
        })
        .join('\n');

      // Remove any non-essential sections
      const unwantedSections = [
        /\[tab\][\s\S]*?\[\/tab\]/gi,
        /\[Song Info\][\s\S]*?\n\[/g,
        /\[Basic Chord Structure\][\s\S]*?\n\[/g,
        /\[Note\][\s\S]*?\n\[/g,
        /\[Common Chord Progressions\][\s\S]*?\n\[/g,
        /\[Tips\][\s\S]*?\n\[/g
      ];

      unwantedSections.forEach(regex => {
        cleanContent = cleanContent.replace(regex, '[');
      });

      return cleanContent;
    } catch (e) {
      console.error("Error parsing HTML:", e);
      return null;
    }
  }

  function parseUltimateGuitarUrl(url) {
    try {
      // Extract the tab ID and song info from the URL
      const urlParts = url.split("/");
      const tabPart = urlParts[urlParts.length - 1];
      const songParts = tabPart.split("-");

      // The last part is usually the tab ID
      const tabId = songParts.pop();

      // Remove common suffixes and join the remaining parts
      const titleParts = [];
      const artistParts = [];
      let foundBy = false;

      for (const part of songParts) {
        if (
          part === "by" ||
          part === "chords" ||
          part === "tab" ||
          part === "tabs"
        ) {
          foundBy = true;
          continue;
        }
        if (!foundBy) {
          titleParts.push(part);
        } else {
          artistParts.push(part);
        }
      }

      // Clean up the title and artist
      const title = titleParts
        .join(" ")
        .replace(/-/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const artist = artistParts
        .join(" ")
        .replace(/-/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Generate a basic chord structure based on the title
      // This is a fallback when we can't fetch the actual tab
      const content = generateBasicChordStructure(title, artist);

      return {
        title,
        artist: artist || "Unknown Artist",
        content,
      };
    } catch (e) {
      console.error("Error parsing URL:", e);
      return null;
    }
  }

  function generateBasicChordStructure(title, artist) {
    return `[Song Info]
Title: ${title}
Artist: ${artist}

[Basic Chord Structure]
[ch]C[/ch]    [ch]G[/ch]    [ch]Am[/ch]    [ch]F[/ch]

[Note]
This is a basic chord structure.
For the full tab, please visit Ultimate Guitar's website directly.

[Common Chord Progressions]
1. [ch]C[/ch]    [ch]G[/ch]    [ch]Am[/ch]    [ch]F[/ch]
2. [ch]Am[/ch]    [ch]F[/ch]    [ch]C[/ch]    [ch]G[/ch]
3. [ch]C[/ch]    [ch]Am[/ch]    [ch]F[/ch]    [ch]G[/ch]

[Tips]
- Try these basic chord progressions
- Adjust the tempo to match the song
- Experiment with different strumming patterns`;
  }

  function decodeHTMLEntities(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }

  function extractTitleFromUrl(url) {
    try {
      const parts = url.split("/");
      const songPart = parts[parts.length - 1].split("-");

      // Remove the ID at the end and join with spaces
      songPart.pop();
      return songPart.join(" ").replace(/-/g, " ");
    } catch (e) {
      return "Unknown Song";
    }
  }

  function showError(message) {
    errorLoad.textContent = message;
    errorLoad.classList.remove("hidden");
    scrollControls.classList.add("hidden");
  }

  function createMockSong(title, artist, content) {
    return {
      title: title,
      artist: artist,
      content: content,
      type: "chords",
    };
  }

  // Mock content for development/testing
  const mockContent = {
    bones: `[Intro]
[ch]Em[/ch]    [ch]G[/ch]    [ch]D[/ch]    [ch]Em[/ch]
[ch]Em[/ch]    [ch]G[/ch]    [ch]D[/ch]    [ch]Em[/ch]

[Verse 1]
[ch]Em[/ch]          [ch]G[/ch]                      [ch]D[/ch]
   Some days I barely feel alive
[ch]Em[/ch]
   When will this end?
[ch]Em[/ch]               [ch]G[/ch]                    [ch]D[/ch]
   Myself is lost, still I am searching
[ch]Em[/ch]
   Pile of bones

[Chorus]
[ch]Am[/ch]                  [ch]G[/ch]
   I keep it together, then I fall apart,
[ch]Em[/ch]                   [ch]D[/ch]
   I turn to a stranger frequently
[ch]Am[/ch]               [ch]G[/ch]
   I see a reflection in you,
[ch]Em[/ch]        [ch]D[/ch]
   You see nothing

[Verse 2]
[ch]Em[/ch]         [ch]G[/ch]                       [ch]D[/ch]
   Some days I fade into myself
[ch]Em[/ch]
   Don't even try
[ch]Em[/ch]           [ch]G[/ch]                 [ch]D[/ch]
   I'm holding on for one last breath
[ch]Em[/ch]
   Here I reside

[Chorus]
[ch]Am[/ch]                  [ch]G[/ch]
   I keep it together, then I fall apart,
[ch]Em[/ch]                   [ch]D[/ch]
   I turn to a stranger frequently
[ch]Am[/ch]               [ch]G[/ch]
   I see a reflection in you,
[ch]Em[/ch]        [ch]D[/ch]
   You see nothing

[Bridge]
[ch]Em[/ch]         [ch]C[/ch]            [ch]G[/ch]        [ch]D[/ch]
   Will you never know what we've lost now?
[ch]Em[/ch]         [ch]C[/ch]            [ch]G[/ch]        [ch]D[/ch]
   Will you never know what we've lost now?

[Chorus]
[ch]Am[/ch]                  [ch]G[/ch]
   I keep it together, then I fall apart,
[ch]Em[/ch]                   [ch]D[/ch]
   I turn to a stranger frequently
[ch]Am[/ch]               [ch]G[/ch]
   I see a reflection in you,
[ch]Em[/ch]        [ch]D[/ch]
   You see nothing`,
  };

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

    // Dispatch event that song has loaded
    window.dispatchEvent(new CustomEvent("songLoaded"));
  }
});
