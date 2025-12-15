const BASE = "https://tracker-s9qq.onrender.com";
const app = document.getElementById("app");
const search = document.getElementById("searchInput");
const results = document.getElementById("searchResults");
const logo = document.getElementById("logo");

const cache = new Map();
const scrollPositions = {};
let activeIndex = -1;

/* ---------------- API ---------------- */
async function api(path, retries = 2) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s

    const res = await fetch(BASE + path, {
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error("HTTP error");
    return await res.json();
  } catch (err) {
    if (retries > 0) {
      return api(path, retries - 1);
    }
    throw err;
  }
                 }

/* ---------------- ROUTING ---------------- */
function go(path) {
  scrollPositions[location.pathname] = window.scrollY;
  history.pushState({}, "", path);
  router();
}

window.onpopstate = router;
logo.onclick = () => go("/");

/* ---------------- SKELETON ---------------- */
function skeleton(count = 4) {
  app.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const s = document.createElement("div");
    s.className = "skeleton";
    app.appendChild(s);
  }
}

/* ---------------- ROUTER ---------------- */
async function router() {
  const path = location.pathname;
  results.innerHTML = "";
  activeIndex = -1;

  try {
    skeleton();
    if (path === "/") await home();
    else if (path.startsWith("/player/"))
      await player(decodeURIComponent(path.split("/player/")[1]));
    else if (path.startsWith("/match/"))
      await match(path.split("/match/")[1]);

    window.scrollTo(0, scrollPositions[path] || 0);
  } catch {
  app.innerHTML = `
    <div class="muted" style="padding:40px;text-align:center">
      Waking up server… please wait a moment.
    </div>
  `;
  }
}

/* ---------------- HOME ---------------- */
async function home() {
  const d = await api("/");
  app.innerHTML = "";

  const lb = document.createElement("div");
  lb.className = "section";
  lb.innerHTML = "<h2>Leaderboard</h2>";

  [...d.leaderboard]
    .sort((a, b) => b.wins - a.wins)
    .forEach(p => {
      const c = document.createElement("div");
      c.className = "card flex";
      c.innerHTML = `<strong>${p.display_name}</strong><span>${p.wins} wins</span>`;
      c.onclick = () => go(`/player/${encodeURIComponent(p.display_name)}`);
      lb.appendChild(c);
    });

  const rm = document.createElement("div");
  rm.className = "section";
  rm.innerHTML = "<h2>Recent Matches</h2>";

  d.recent_matches.forEach(m => {
    const c = document.createElement("div");
    c.className = "card";
    c.textContent = m.id;
    c.onclick = () => go(`/match/${m.id}`);
    rm.appendChild(c);
  });

  app.append(lb, rm);
}

/* ---------------- SEARCH ---------------- */
search.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    results.innerHTML = "";
    search.value = "";
  }
});

search.addEventListener("input", async () => {
  const q = search.value.trim();
  results.innerHTML = "";
  if (!q) return;

  const r = await api(`/search?q=${encodeURIComponent(q)}`);
  r.forEach((p, i) => {
    const d = document.createElement("div");
    d.className = "search-item";
    d.textContent = p.display_name;
    d.onclick = () => go(`/player/${encodeURIComponent(p.display_name)}`);
    results.appendChild(d);
  });
});

/* ---------------- PLAYER ---------------- */
async function player(name) {
  const d = await api(`/player/${encodeURIComponent(name)}`);
  app.innerHTML = "";

  const h = document.createElement("div");
  h.className = "section";
  h.innerHTML = `
    <h2>${d.profile.display_name}</h2>
    <div class="muted">
      Games ${d.profile.games_played} · Wins ${d.profile.wins}
      · Losses ${d.profile.losses} · Words ${d.profile.total_words}
    </div>`;

  const t = document.createElement("div");
  t.className = "section";
  t.innerHTML = "<h3>Timeline</h3>";

  d.timeline.forEach(m => {
    const c = document.createElement("div");
    c.className = "card flex";
    c.innerHTML = `
      <span>${m.match_id}</span>
      <span class="badge ${m.result}">${m.result}</span>
      <span class="muted">${m.ago}</span>`;
    c.onclick = () => go(`/match/${m.match_id}`);
    t.appendChild(c);
  });

  app.append(h, t);
}

/* ---------------- MATCH ---------------- */
async function match(id) {
  const m = await api(`/match/${id}`);
  app.innerHTML = "";

  const h = document.createElement("div");
  h.className = "section";
  h.innerHTML = `
    <h2>${m.id}</h2>
    <div class="muted">
      Winner ${m.winner} ·
      ${Math.floor(m.duration_sec / 60)}m ${m.duration_sec % 60}s
    </div>`;

  const p = document.createElement("div");
  p.className = "section";
  p.innerHTML = "<h3>Players</h3>";

  m.players.forEach(pl => {
    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `
      <div class="flex">
        <strong>${pl.name}</strong>
        <span class="badge ${pl.result}">${pl.result}</span>
      </div>
      <div class="muted">Words: ${pl.word_count}</div>
      <div class="toggle">Toggle words</div>
      <div class="words">${pl.words.join(", ")}</div>
    `;
    c.querySelector(".toggle").onclick = () =>
      c.querySelector(".words").classList.toggle("open");
    p.appendChild(c);
  });

  app.append(h, p);
}

/* ---------------- INIT ---------------- */
router();
