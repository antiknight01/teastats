const API = "https://tracker-s9qq.onrender.com";
const app = document.getElementById("app");

/* -------------------------
   ROUTER
------------------------- */

window.onpopstate = () => render(location.pathname);

function navigate(path) {
  history.pushState({}, "", path);
  render(path);
}

function goHome() {
  navigate("/");
}

/* -------------------------
   FETCH HELPERS
------------------------- */

async function api(path) {
  const res = await fetch(API + path);
  return res.json();
}

/* -------------------------
   RENDER
------------------------- */

async function render(path) {
  if (path === "/") return renderHome();

  if (path.startsWith("/player/")) {
    const name = decodeURIComponent(path.split("/player/")[1]);
    return renderPlayer(name);
  }

  if (path.startsWith("/match/")) {
    const id = path.split("/match/")[1];
    return renderMatch(id);
  }
}

/* -------------------------
   HOME
------------------------- */

async function renderHome() {
  const data = await api("/");

  const leaderboard = data.leaderboard
    .sort((a, b) => b.wins - a.wins)
    .map(
      p => `
      <div class="leaderboard-item" onclick="navigate('/player/${encodeURIComponent(p.display_name)}')">
        <span>${p.display_name}</span>
        <span>🏆 ${p.wins}</span>
      </div>`
    )
    .join("");

  const recent = data.recent_matches
    .map(
      m => `
      <div class="card match" onclick="navigate('/match/${m.id}')">
        <b>${m.winner}</b> won • ${Math.floor(m.duration_sec / 60)} min
      </div>`
    )
    .join("");

  app.innerHTML = `
    <div class="card">
      <h2>Leaderboard</h2>
      ${leaderboard}
    </div>

    <div class="card">
      <h2>Recent Matches</h2>
      ${recent}
    </div>
  `;
}

/* -------------------------
   PLAYER
------------------------- */

async function renderPlayer(name) {
  const data = await api(`/player/${encodeURIComponent(name)}`);

  const timeline = data.timeline
    .map(
      t => `
      <div class="timeline-item" onclick="navigate('/match/${t.match_id}')">
        ${t.result.toUpperCase()} • ${t.ago}
      </div>`
    )
    .join("");

  app.innerHTML = `
    <div class="card">
      <h2>${data.profile.display_name}</h2>
      <p>Games: ${data.profile.games_played}</p>
      <p>Wins: ${data.profile.wins}</p>
      <p>Losses: ${data.profile.losses}</p>
      <p>Total Words: ${data.profile.total_words}</p>
    </div>

    <div class="card">
      <h2>Match Timeline</h2>
      ${timeline}
    </div>
  `;
}

/* -------------------------
   MATCH
------------------------- */

async function renderMatch(id) {
  const m = await api(`/match/${id}`);

  const players = m.players
    .map(
      p => `
      <div class="card">
        <b>${p.name}</b> — ${p.result.toUpperCase()}
        <div class="word-list">
          Words (${p.word_count}): ${p.words.join(", ")}
        </div>
      </div>`
    )
    .join("");

  app.innerHTML = `
    <div class="card">
      <h2>Match ${id}</h2>
      <p>Winner: ${m.winner}</p>
      <p>Duration: ${Math.floor(m.duration_sec / 60)} min</p>
    </div>

    ${players}
  `;
}

/* -------------------------
   SEARCH
------------------------- */

async function searchPlayers(q) {
  if (!q) return renderHome();

  const res = await api(`/search?q=${encodeURIComponent(q)}`);

  app.innerHTML = `
    <div class="card">
      <h2>Search Results</h2>
      ${res
        .map(
          p => `
          <div class="leaderboard-item" onclick="navigate('/player/${encodeURIComponent(p.display_name)}')">
            ${p.display_name}
          </div>`
        )
        .join("")}
    </div>
  `;
}

/* -------------------------
   INIT
------------------------- */

render(location.pathname);
