// =========================================================
// Configuration & Utilities
// =========================================================

const BASE_URL = "https://tracker-s9qq.onrender.com"; // Use your actual backend URL

const content = document.getElementById('content');
const searchInput = document.getElementById('search-input');
const searchResultsContainer = document.getElementById('search-results');

/**
 * Utility function for making API calls.
 * @param {string} endpoint - The API path (e.g., '/', '/player/name').
 * @returns {Promise<Object|Array|null>} The parsed JSON data or null on error.
 */
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status} for ${endpoint}`);
            // Display a user-friendly error message on the main content area
            content.innerHTML = `<div class="error-message">Error fetching data from server for ${endpoint}. Status: ${response.status}</div>`;
            return null; // Defensive check
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch failed:', error);
        content.innerHTML = `<div class="error-message">Network error: Could not connect to the backend at ${BASE_URL}</div>`;
        return null; // Defensive check
    }
}

/**
 * Converts seconds to a user-friendly duration string (Xm Ys).
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatDuration(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
}

// =========================================================
// Routing
// =========================================================

/**
 * Handles all client-side navigation.
 * @param {string} url - The new URL path (e.g., '/', '/player/JohnDoe').
 * @param {boolean} [doPushState=true] - Whether to use history.pushState.
 */
function router(url, doPushState = true) {
    if (doPushState) {
        history.pushState(null, '', url);
    }
    
    // Clear old content and show loading state
    content.innerHTML = '<p class="loading-message">Loading content...</p>';
    
    const path = url.split('?')[0]; // Ignore query params for path matching
    const urlParams = new URLSearchParams(url.split('?')[1] || '');

    if (path === '/') {
        renderHomePage();
    } else if (path.startsWith('/player/')) {
        const playerName = path.substring('/player/'.length);
        renderPlayerPage(playerName);
    } else if (path.startsWith('/match/')) {
        const matchId = path.substring('/match/'.length);
        renderMatchPage(matchId);
    } else {
        content.innerHTML = '<div class="empty-state"><h3>404 Not Found</h3><p>The requested page does not exist.</p></div>';
    }
}

/**
 * Intercepts clicks on internal links (links with data-route attribute or specific classes)
 */
function attachRouteListeners() {
    document.body.addEventListener('click', (e) => {
        // Find the closest ancestor <a> tag
        let link = e.target.closest('a[data-route]');
        if (link) {
            // Internal link clicked
            const href = link.getAttribute('href');
            if (href.startsWith('/')) { // Only handle internal paths
                e.preventDefault(); // Stop default browser navigation
                router(href);
            }
        }
    });
}

// Listen for back/forward button presses
window.addEventListener('popstate', () => {
    router(location.pathname + location.search, false); // Do not push state again
});


// =========================================================
// Page Rendering Functions
// =========================================================

/**
 * Renders the Home Page: Leaderboard and Recent Matches.
 */
async function renderHomePage() {
    const data = await fetchData('/');
    if (!data) return; // Error handled by fetchData

    const { leaderboard, recent_matches } = data;
    
    // 1. Sort Leaderboard: MOST WINS (descending)
    const sortedLeaderboard = (leaderboard || [])
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 10); // Limit to top 10 for cleaner display

    let html = '';

    // --- Leaderboard Section ---
    html += `
        <section class="card" id="leaderboard-section">
            <h2 class="section-title">🏆 Top Players Leaderboard</h2>
            ${sortedLeaderboard.length === 0 
                ? '<div class="empty-state">No leaderboard data available.</div>'
                : `<ul class="data-list">
                    ${sortedLeaderboard.map((player, index) => `
                        <li class="data-list-item" data-route>
                            <span class="leaderboard-rank">#${index + 1}</span>
                            <a href="/player/${player.display_name}" data-route class="leaderboard-name">${player.display_name}</a>
                            <span class="leaderboard-wins">${player.wins} Wins</span>
                        </li>
                    `).join('')}
                </ul>`}
        </section>
    `;

    // --- Recent Matches Section ---
    html += `
        <section class="card" id="recent-matches-section">
            <h2 class="section-title">⏱️ Recent Matches</h2>
            ${(recent_matches || []).length === 0 
                ? '<div class="empty-state">No recent matches found.</div>'
                : `<ul class="data-list">
                    ${(recent_matches || []).map(match => `
                        <li class="data-list-item" data-route>
                            <a href="/match/${match.id}" data-route>Match ID: ${match.id}</a>
                            <span>Winner: <span class="match-winner">${match.winner}</span></span>
                            <span>Played: ${new Date(match.played_at).toLocaleDateString()}</span>
                            <span>Duration: ${formatDuration(match.duration_sec)}</span>
                        </li>
                    `).join('')}
                </ul>`}
        </section>
    `;

    content.innerHTML = html;
}

/**
 * Renders the Player Profile Page.
 * @param {string} name - The display_name of the player.
 */
async function renderPlayerPage(name) {
    const data = await fetchData(`/player/${name}`);
    if (!data) return;

    const { profile, timeline } = data;

    if (!profile) {
        content.innerHTML = `<div class="empty-state"><h3>Player Not Found</h3><p>Could not load profile for player: ${name}.</p></div>`;
        return;
    }

    // --- Profile Stats Card ---
    let html = `
        <header class="match-detail-header">
            <h2>👤 Player Profile: ${profile.display_name}</h2>
        </header>
        
        <section class="card profile-stats-card">
            <div class="profile-stats">
                <div class="stat-box">
                    <div class="stat-value">${profile.games_played}</div>
                    <div class="stat-label">Games Played</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${profile.wins}</div>
                    <div class="stat-label">Wins</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${profile.losses}</div>
                    <div class="stat-label">Losses</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${profile.total_words}</div>
                    <div class="stat-label">Total Words Used</div>
                </div>
            </div>
        </section>
    `;

    // --- Timeline Section ---
    html += `
        <section class="card" id="timeline-section">
            <h2 class="section-title">📜 Lifetime Match Timeline</h2>
            ${(timeline || []).length === 0
                ? '<div class="empty-state">No match history found for this player.</div>'
                : `<ul class="data-list timeline-list">
                    ${(timeline || []).map(item => `
                        <li class="timeline-item" data-route>
                            <a href="/match/${item.match_id}" data-route>Match ID: ${item.match_id}</a>
                            <span class="timeline-item-status match-${item.result}">${item.result.toUpperCase()}</span>
                            <span class="timeline-item-ago">${item.ago}</span>
                        </li>
                    `).join('')}
                </ul>`}
        </section>
    `;

    content.innerHTML = html;
}

/**
 * Renders the Match Detail Page.
 * @param {string} matchId - The ID of the match.
 */
async function renderMatchPage(matchId) {
    const match = await fetchData(`/match/${matchId}`);
    if (!match) return;

    // Defensive check for structure
    if (!match.id || !match.players) {
        content.innerHTML = `<div class="empty-state"><h3>Match Data Incomplete</h3><p>Match ID ${matchId} has missing required data.</p></div>`;
        return;
    }

    // --- Match Header ---
    let html = `
        <header class="match-detail-header">
            <h2>🎮 Match ${match.id}</h2>
            <p>Played at: ${new Date(match.played_at).toLocaleString()}</p>
            <p>Duration: **${formatDuration(match.duration_sec)}**</p>
            <p>Winner: <span class="match-winner">${match.winner}</span></p>
        </header>
        
        <section class="card">
            <h3 class="section-title">Players & Statistics</h3>
            <div class="player-match-stats">
                ${match.players.map(player => `
                    <div class="card player-card ${player.result === 'win' ? 'winner' : ''}">
                        <h4>
                            <a href="/player/${player.name}" data-route>${player.name}</a>
                            <span class="match-status match-${player.result}">${player.result.toUpperCase()}</span>
                        </h4>
                        <p>Words Used: **${player.word_count}**</p>
                        
                        <button class="word-list-toggle" data-player-words="${player.name}">
                            Show Words Used (${player.words ? player.words.length : 0})
                        </button>
                        
                        <ul class="word-list" id="words-${player.name}">
                            ${(player.words || []).map(word => `<li>${word}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </section>
    `;

    content.innerHTML = html;
    
    // Attach listener for word expansion
    document.querySelectorAll('.word-list-toggle').forEach(button => {
        button.addEventListener('click', (e) => {
            const playerName = e.target.getAttribute('data-player-words');
            const wordList = document.getElementById(`words-${playerName}`);
            
            if (wordList) {
                const isHidden = wordList.style.display === 'none' || wordList.style.display === '';
                wordList.style.display = isHidden ? 'flex' : 'none'; // 'flex' for inline-block wrapping
                e.target.textContent = isHidden 
                    ? `Hide Words Used (${player.words ? player.words.length : 0})` 
                    : `Show Words Used (${player.words ? player.words.length : 0})`;
            }
        });
    });
}


// =========================================================
// Search Functionality
// =========================================================

let searchTimeout;

/**
 * Handles the search API call and result rendering.
 */
async function handleSearch() {
    const query = searchInput.value.trim();
    if (query.length < 2) {
        searchResultsContainer.innerHTML = '';
        searchResultsContainer.style.display = 'none';
        return;
    }

    const results = await fetchData(`/search?q=${query}`);
    
    if (!results || results.length === 0) {
        searchResultsContainer.innerHTML = '<div class="empty-state" style="padding: 10px;">No players found.</div>';
    } else {
        searchResultsContainer.innerHTML = results.map(player => `
            <a href="/player/${player.display_name}" class="search-result-item" data-route>
                ${player.display_name} (${player.wins} Wins)
            </a>
        `).join('');
    }
    searchResultsContainer.style.display = 'block';
}

// Event listener for search input with debounce
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(handleSearch, 300); // Debounce for 300ms
});

// Hide search results when clicking outside
document.addEventListener('click', (e) => {
    if (!searchResultsContainer.contains(e.target) && e.target !== searchInput) {
        searchResultsContainer.style.display = 'none';
    }
});


// =========================================================
// Initialization
// =========================================================

/**
 * Initial setup on page load.
 */
function init() {
    attachRouteListeners(); // Make all internal links work with the router
    router(location.pathname + location.search, false); // Load the initial page based on URL
}

init();
       
