const API_BASE = "https://tracker-s9qq.onrender.com";

async function loadPlayers() {
  const container = document.getElementById("content");
  container.innerHTML = "<p>Loading players…</p>";

  try {
    const res = await fetch(`${API_BASE}/api/players`);
    const data = await res.json();

    if (!data.players) {
      container.innerHTML = "<p>No player data yet.</p>";
      return;
    }

    let html = `
      <h2>Players</h2>
      <table>
        <tr>
          <th>Name</th>
          <th>Wins</th>
          <th>Losses</th>
          <th>Win %</th>
          <th>Words</th>
        </tr>
    `;

    data.players.forEach(p => {
      html += `
        <tr>
          <td>${p.name}</td>
          <td>${p.wins}</td>
          <td>${p.losses}</td>
          <td>${p.win_rate}%</td>
          <td>${p.total_words}</td>
        </tr>
      `;
    });

    html += "</table>";
    container.innerHTML = html;

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load data.</p>";
  }
}

loadPlayers();
