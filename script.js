const BASE_URL = "https://tracker-s9qq.onrender.com";

// helpers
function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ---------------- HOME ----------------
async function loadHome() {
  const res = await fetch(`${BASE_URL}/`);
  const data = await res.json();

  const lb = document.getElementById("leaderboard");
  data.leaderboard.forEach(p => {
    lb.innerHTML += `
      <div class="card" onclick="location.href='player.html?name=${p.display_name}'">
        ${p.display_name} — 🏆 ${p.wins}
      </div>`;
  });

  const recent = document.getElementById("recent");
  data.recent_matches.forEach(m => {
    recent.innerHTML += `
      <div class="card" onclick="location.href='match.html?id=${m.id}'">
        ${m.winner} won • ${m.duration_sec}s
      </div>`;
  });

  document.getElementById("search").addEventListener("input", async e => {
    const q = e.target.value;
    if (!q) return;

    const r = await fetch(`${BASE_URL}/search?q=${q}`);
    const list = await r.json();
    lb.innerHTML = "";
    list.forEach(p => {
      lb.innerHTML += `
        <div class="card" onclick="location.href='player.html?name=${p.display_name}'">
          ${p.display_name}
        </div>`;
    });
  });
}

// ---------------- PLAYER ----------------
async function loadPlayer() {
  const name = qs("name");
  document.getElementById("name").innerText = name;

  const res = await fetch(`${BASE_URL}/player/${name}`);
  const data = await res.json();

  const s = document.getElementById("stats");
  s.innerHTML = `
    Games: ${data.profile.games_played}<br>
    Wins: ${data.profile.wins}<br>
    Losses: ${data.profile.losses}<br>
    Words Used: ${data.profile.total_words}
  `;

  const t = document.getElementById("timeline");
  data.timeline.forEach(m => {
    t.innerHTML += `
      <div class="card" onclick="location.href='match.html?id=${m.match_id}'">
        ${m.result.toUpperCase()} • ${m.ago}
      </div>`;
  });
}

// ---------------- MATCH ----------------
async function loadMatch() {
  const id = qs("id");

  const res = await fetch(`${BASE_URL}/match/${id}`);
  const m = await res.json();

  const div = document.getElementById("match");
  div.innerHTML = `
    🏆 Winner: ${m.winner}<br>
    ⏱ Duration: ${m.duration_sec}s<br><br>
  `;

  m.players.forEach(p => {
    div.innerHTML += `
      <div class="card">
        <b>${p.name}</b> (${p.result})<br>
        Words (${p.word_count}): ${p.words.join(", ")}
      </div>`;
  });
}
