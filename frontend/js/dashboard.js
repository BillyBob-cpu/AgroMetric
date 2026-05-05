document.getElementById('topbar-date').textContent =
  new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

async function loadKPIs() {
  const stats = await API.getStats();
  document.getElementById('kpi-parcelles').textContent = stats.total_parcelles;
  document.getElementById('kpi-alertes').textContent   = stats.total_alertes;
  document.getElementById('kpi-critiques').textContent = stats.alertes_critiques;
  document.getElementById('kpi-maladies').textContent  = stats.maladies;
  document.getElementById('kpi-ok').textContent        = stats.observations_ok;
}

async function loadChartMeteo() {
  const meteo = await API.getMeteo();
  new Chart(document.getElementById('chart-meteo'), {
    type: 'line',
    data: {
      labels: meteo.map(m => formatDate(m.date)),
      datasets: [
        {
          label: 'Température (°C)',
          data: meteo.map(m => m.temperature),
          borderColor: '#E63946',
          backgroundColor: 'rgba(230,57,70,0.08)',
          fill: true, tension: 0.4, pointRadius: 3,
        },
        {
          label: 'Humidité (%)',
          data: meteo.map(m => m.humidite),
          borderColor: '#457B9D',
          backgroundColor: 'rgba(69,123,157,0.08)',
          fill: true, tension: 0.4, pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position:'bottom', labels:{ font:{ size:12 } } } },
      scales: {
        y: { beginAtZero:false, grid:{ color:'rgba(0,0,0,0.05)' } },
        x: { grid:{ display:false }, ticks:{ font:{ size:11 } } },
      },
    },
  });
}

async function loadChartPluie() {
  const meteo = await API.getMeteo();
  new Chart(document.getElementById('chart-pluie'), {
    type: 'bar',
    data: {
      labels: meteo.map(m => formatDate(m.date)),
      datasets: [{
        label: 'Pluie (mm)',
        data: meteo.map(m => m.pluie_mm),
        backgroundColor: 'rgba(82,183,136,0.6)',
        borderColor: '#2D6A4F',
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend:{ display:false } },
      scales: {
        y: { beginAtZero:true, grid:{ color:'rgba(0,0,0,0.05)' } },
        x: { grid:{ display:false }, ticks:{ font:{ size:11 } } },
      },
    },
  });
}

async function loadAlertes() {
  const alertes = await API.getAlertes();
  const container = document.getElementById('alertes-container');
  if (!alertes.length) {
    container.innerHTML = '<p style="color:var(--text-muted)">Aucune alerte active.</p>';
    return;
  }
  alertes.sort((a, b) => b.niveau - a.niveau || new Date(b.date) - new Date(a.date));
  container.innerHTML = alertes.slice(0, 5).map(a => `
    <div class="alert-banner alert-${a.niveau}">
      <span>${a.niveau === 3 ? '🚨' : a.niveau === 2 ? '⚠️' : 'ℹ️'}</span>
      <strong>Parcelle ${a.parcelle_id}</strong> — ${a.type}
      <span style="margin-left:auto;font-size:12px;opacity:0.7">${formatDate(a.date)}</span>
    </div>
  `).join('');
}

async function loadObservations() {
  const obs = await API.getObservations();
  obs.sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById('obs-tbody').innerHTML = obs.slice(0, 8).map(o => `
    <tr>
      <td>${formatDate(o.date)}</td>
      <td>Parcelle ${o.parcelle_id}</td>
      <td>${BADGE_MAP[o.etat] || o.etat}</td>
      <td style="color:var(--text-secondary)">${o.commentaire}</td>
    </tr>
  `).join('');
}

(async () => {
  await Promise.all([loadKPIs(), loadChartMeteo(), loadChartPluie(), loadAlertes(), loadObservations()]);
})();