// Song scraper functionality
document.addEventListener('DOMContentLoaded', () => {
    const songUrlInput = document.getElementById('song-url');
    const loadButton = document.getElementById('load-button');
    const songContent = document.getElementById('song-content');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorLoad = document.getElementById('error-load');
    const scrollControls = document.getElementById('scroll-controls');
    const teleprompter = document.getElementById('teleprompter');
    
    // API base URL - point this to your VPS endpoint
    const API_BASE_URL = 'https://your-vps-domain.com/api/song-data';
    
    loadButton.addEventListener('click', loadSong);
    
    // Also load song when pressing Enter in the URL input field
    songUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadSong();
        }
    });
    
    async function loadSong() {
        const url = songUrlInput.value.trim();
        
        if (!url) {
            showError('Please enter a URL');
            return;
        }
        
        if (!url.includes('ultimate-guitar.com')) {
            showError('Please enter a valid Ultimate Guitar URL');
            return;
        }
        
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        errorLoad.classList.add('hidden');
        scrollControls.classList.add('hidden');
        songContent.innerHTML = '';
        
        try {
            // For development, check if we should use mock data
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                const songId = extractSongIdFromUrl(url);
                if (url.includes('2272453') || songId === '2272453') {
                    // Use mock data for the example song
                    displaySong(createMockSong('Bones', 'Low Roar', mockContent.bones));
                    scrollControls.classList.remove('hidden');
                    return;
                }
            }
            
            // Make request to backend API
            const encodedUrl = encodeURIComponent(url);
            const apiUrl = `${API_BASE_URL}?url=${encodedUrl}`;
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to fetch song data' }));
                throw new Error(errorData.message || `Server responded with status: ${response.status}`);
            }
            
            const songData = await response.json();
            
            if (!songData || !songData.content) {
                throw new Error('Could not retrieve song data');
            }
            
            // Display the formatted song
            displaySong(songData);
            
            // Show scroll controls
            scrollControls.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error loading song:', error);
            showError(`${error.message}. Try again later.`);
        } finally {
            loadingIndicator.classList.add('hidden');
        }
    }
    
    function extractSongIdFromUrl(url) {
        // Try different patterns for Ultimate Guitar URLs
        const patterns = [
            /tabs\.ultimate-guitar\.com\/tab\/.*-(\d+)$/,
            /tabs\.ultimate-guitar\.com\/tab\/.*-(\d+)[?#]/,
            /ultimate-guitar\.com\/.*tab\/.*-(\d+)$/,
            /tab\/[^/]+\/[^/]+\/[^/]+-(\d+)$/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        // Last resort - look for any number at the end of URL
        const lastResort = url.match(/(\d+)[^/]*$/);
        return lastResort ? lastResort[1] : null;
    }
    
    function showError(message) {
        errorLoad.textContent = message;
        errorLoad.classList.remove('hidden');
        scrollControls.classList.add('hidden');
    }
    
    function createMockSong(title, artist, content) {
        return {
            title: title,
            artist: artist,
            content: content,
            type: 'chords'
        };
    }
    
    // Mock content for development only
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
   You see nothing`
    };
    
    function displaySong(song) {
        // Clear any existing content
        songContent.innerHTML = '';
        
        // Add song title and artist
        const header = document.createElement('div');
        header.classList.add('song-header');
        header.innerHTML = `<h2>${song.title}</h2><h3>by ${song.artist}</h3>`;
        songContent.appendChild(header);
        
        // Process the song content
        let content = song.content;
        
        // Replace [ch] tags with spans for chord styling
        content = content.replace(/\[ch\](.*?)\[\/ch\]/g, '<span class="chord">$1</span>');
        
        // Identify and mark up sections like Verse, Chorus, etc.
        const sections = [
            { name: 'Verse', regex: /\[Verse[^\]]*\]/g },
            { name: 'Chorus', regex: /\[Chorus[^\]]*\]/g },
            { name: 'Bridge', regex: /\[Bridge[^\]]*\]/g },
            { name: 'Intro', regex: /\[Intro[^\]]*\]/g },
            { name: 'Outro', regex: /\[Outro[^\]]*\]/g },
            { name: 'Pre-Chorus', regex: /\[Pre-Chorus[^\]]*\]/g }
        ];
        
        for (const section of sections) {
            content = content.replace(section.regex, `<div class="section-title">${section.name}</div>`);
        }
        
        // Replace newlines with <br> for HTML display
        content = content.replace(/\n/g, '<br>');
        
        // Add the formatted content to the song content div
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('song-body');
        contentDiv.innerHTML = content;
        songContent.appendChild(contentDiv);
        
        // Scroll to the top of the content
        teleprompter.scrollTop = 0;
        
        // Dispatch event that song has loaded
        window.dispatchEvent(new CustomEvent('songLoaded'));
    }
});
