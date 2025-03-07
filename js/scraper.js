// Song scraper functionality
document.addEventListener("DOMContentLoaded", () => {
  const songUrlInput = document.getElementById("song-url");
  const loadButton = document.getElementById("load-button");
  const songContent = document.getElementById("song-content");
  const loadingIndicator = document.getElementById("loading-indicator");
  const errorLoad = document.getElementById("error-load");
  const scrollControls = document.getElementById("scroll-controls");
  const teleprompter = document.getElementById("teleprompter");

  loadButton.addEventListener("click", loadSong);

  songUrlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      loadSong();
    }
  });

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

      // Use multiple CORS proxies with different approaches
      const corsProxies = [
        {
          url: "https://api.allorigins.win/raw?url=",
          transform: (url) => encodeURIComponent(url),
        },
        {
          url: "https://corsproxy.io/?",
          transform: (url) => encodeURIComponent(url),
        },
        {
          url: "https://api.codetabs.com/v1/proxy?quest=",
          transform: (url) => encodeURIComponent(url),
        },
        {
          url: "https://cors.eu.org/",
          transform: (url) => url,
        },
        {
          url: "https://cors-proxy.htmldriven.com/?url=",
          transform: (url) => encodeURIComponent(url),
        },
      ];

      let songData = null;
      let lastError = null;

      // Try each proxy with different fetch strategies
      for (const proxy of corsProxies) {
        if (songData) break;

        try {
          // Try fetch with default options
          const response = await fetch(proxy.url + proxy.transform(url), {
            headers: {
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.5",
              Referer: "https://www.ultimate-guitar.com/",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const html = await response.text();
          songData = parseUltimateGuitarHtml(html, url);

          if (!songData) {
            // Try alternative content-type
            const responseJson = await fetch(proxy.url + proxy.transform(url), {
              headers: {
                Accept: "application/json",
                Referer: "https://www.ultimate-guitar.com/",
              },
            });

            if (responseJson.ok) {
              const jsonData = await responseJson.json();
              const htmlContent =
                jsonData.contents ||
                jsonData.content ||
                jsonData.data ||
                jsonData;
              if (typeof htmlContent === "string") {
                songData = parseUltimateGuitarHtml(htmlContent, url);
              }
            }
          }
        } catch (e) {
          console.warn(`Proxy ${proxy.url} failed:`, e);
          lastError = e;
          continue;
        }
      }

      if (!songData) {
        throw (
          lastError ||
          new Error(
            "Unable to load the song. Please try a different song or try again later."
          )
        );
      }

      // Display the formatted song
      displaySong(songData);

      // Show scroll controls
      scrollControls.classList.remove("hidden");
    } catch (error) {
      console.error("Error loading song:", error);
      showError(
        `${error.message}. Try using a different song URL or try again in a few minutes.`
      );
    } finally {
      loadingIndicator.classList.add("hidden");
    }
  }

  function parseUltimateGuitarHtml(html, url) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Try multiple parsing strategies
      let songData = null;

      // Strategy 1: Look for JSON data in script tags
      const scripts = doc.querySelectorAll("script");
      for (const script of scripts) {
        const content = script.textContent;

        // Look for patterns that might contain song data
        const dataMatches = [
          content.match(/window\.UGAPP\.store\.page = (\{.+?\});/s),
          content.match(/\{"store":\{"page":([^}]+}\})}/s),
          content.match(/data: (\{.+?"tab":.+?\}),/s),
        ];

        for (const match of dataMatches) {
          if (!match || !match[1]) continue;

          try {
            const parsedData = JSON.parse(match[1]);
            const tab = parsedData.data?.tab || parsedData.tab;

            if (tab) {
              return {
                title: tab.song_name || extractTitleFromUrl(url),
                artist: tab.artist_name || "Unknown Artist",
                content: tab.content || tab.wiki_tab?.content || "",
                type: tab.type || "chords",
              };
            }
          } catch (e) {
            console.error("Error parsing script data:", e);
          }
        }
      }

      // Strategy 2: Look for tab content in HTML
      const tabContent = doc
        .querySelector(".js-tab-content")
        ?.getAttribute("data-content");
      if (tabContent) {
        try {
          const content = decodeHTMLEntities(tabContent);
          const title =
            doc
              .querySelector('meta[property="og:title"]')
              ?.getAttribute("content") || extractTitleFromUrl(url);
          const artist =
            doc
              .querySelector('meta[property="og:description"]')
              ?.getAttribute("content") || "Unknown Artist";

          return {
            title: title.split(" by ")[0] || "Unknown Song",
            artist: artist.split(" - ")[0] || "Unknown Artist",
            content,
            type: "chords",
          };
        } catch (e) {
          console.error("Error parsing tab content:", e);
        }
      }

      // Strategy 3: Extract from pre tag
      const preContent = doc.querySelector(".js-tab-content")?.textContent;
      if (preContent && preContent.length > 100) {
        const title =
          doc
            .querySelector('meta[property="og:title"]')
            ?.getAttribute("content") || extractTitleFromUrl(url);
        const artist =
          doc
            .querySelector('meta[property="og:description"]')
            ?.getAttribute("content") || "Unknown Artist";

        return {
          title: title.split(" by ")[0] || "Unknown Song",
          artist: artist.split(" - ")[0] || "Unknown Artist",
          content: preContent,
          type: "chords",
        };
      }

      return null;
    } catch (error) {
      console.error("Error parsing UG HTML:", error);
      return null;
    }
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
