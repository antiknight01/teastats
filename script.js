const BASE = "https://tracker-s9qq.onrender.com";

// ---------- UTIL ----------
function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function api(path) {
  const res = await fetch(BASE + path);
  return await res.json();
}

// ---------- HOME ----------
async function loadHome() {
  const data = await api("/");
  const lb = document.getElementById("leaderboardList");
  const recent = document.getElementById("recentMatches");

  lb.innerHTML = "";
  data.leaderboard.forEach(p => {
    const div = document.createElement("div");
    div.className = "card leader";
    div.innerHTML = `
      <span>${p.display_name}</span>
      <span class="win">${p.wins}W</span>
    `;
    div.onclick = () => location.href = `/player.html?name=${p.display_name}`;
    lb.appendChild(div);
  });

  recent.innerHTML = "";
  data.recent_matches.forEach(m => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      Match • Winner: <b>${m.winner}</b>
      <div class="muted">${m.duration_sec}s</div>
    `;
    div.onclick = () => location.href = `/match.html?id=${m.id}`;
    recent.appendChild(div);
  });

  document.getElementById("searchBox").oninput = async e => {
    const q = e.target.value.trim();
    if (!q) return;
    const res = await api(`/search?q=${q}`);
    lb.innerHTML = "";
    res.forEach(p => {
      const d = document.createElement("div");
      d.className = "card";
      d.textContent = p.display_name;
      d.onclick = () => location.href = `/player.html?name=${p.display_name}`;
      lb.appendChild(d);
    });
  };
}

// ---------- PLAYER ----------
async function loadPlayer() {
  const name = qs("name");
  const data = await api(`/player/${name}`);

  const p = data.profile;
  document.getElementById("profile").innerHTML = `
    <h1>${p.display_name}</h1>
    <p>Games: ${p.games_played}</p>
    <p class="win">Wins: ${p.wins}</p>
    <p class="loss">Losses: ${p.losses}</p>
    <p>Total words: ${p.total_words}</p>
  `;

  const t = document.getElementById("timeline");
  data.timeline.forEach(m => {
    const d = document.createElement("div");
    d.className = "card";
    d.innerHTML = `
      ${m.result.toUpperCase()} • ${m.ago}
    `;
    d.onclick = () => location.href = `/match.html?id=${m.match_id}`;
    t.appendChild(d);
  });
}

// ---------- MATCH ----------
async function loadMatch() {
  const id = qs("id");
  const m = await api(`/match/${id}`);

  const el = document.getElementById("match");
  el.innerHTML = `
    <h1>Match</h1>
    <p>Winner: ${m.winner}</p>
    <p>Duration: ${m.duration_sec}s</p>
  `;

  m.players.forEach(p => {
    const d = document.createElement("div");
    d.className = "card";
    d.innerHTML = `
      <b>${p.name}</b> (${p.result})
      <div class="words">${p.words.join(", ")}</div>
    `;
    el.appendChild(d);
  });
}
