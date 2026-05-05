document.getElementById('topbar-date').textContent =
  new Date().toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', year:'numeric'});

async function init() {
  const [alertes, obs, meteo] = await Promise.all([
    API.getAlertes(),
    API.getObservations(),
    API.getMeteo(),
  ]);

  // KPIs
  document.getElementById('kpi-parcelles').textContent = 10;
  document.getElementById('kpi-alertes').textContent   = alertes.length;
  document.getElementById('kpi-critiques').textContent = alertes.filter(a => a.niveau === 3).length;
  document.getElementById('kpi-maladies').textContent  = obs.filter(o => o.etat === 'Maladie détectée').length;
  document.getElementById('kpi-ok').textContent        = obs.filter(o => o.etat === 'OK').length;

  // Alertes récentes
  const sorted = [...alertes].sort((a,b) => b.niveau - a.niveau || new Date(b.date) - new Date(a.date));
  document.getElementById('alertes-container').innerHTML = sorted.slice(0,5).map(a => `
    <div class="alert-banner alert-${a.niveau}">
      <span>${a.niveau===3?'🚨':a.niveau===2?'⚠️':'ℹ️'}</span>
      <strong>Parcelle ${a.parcelle_id}</strong> — ${a.type}
      <span style="margin-left:auto;font-size:12px;opacity:.7">${formatDate(a.date)}</span>
    </div>
  `).join('');

  // Observations
  const obsSort = [...obs].sort((a,b) => new Date(b.date) - new Date(a.date));
  document.getElementById('obs-tbody').innerHTML = obsSort.slice(0,8).map(o => `
    <tr>
      <td>${formatDate(o.date)}</td>
      <td>Parcelle ${o.parcelle_id}</td>
      <td>${BADGE_MAP[o.etat] || o.etat}</td>
      <td style="color:var(--text-secondary)">${o.commentaire}</td>
    </tr>
  `).join('');

  // Graphiques
  if (typeof Chart !== 'undefined') {
    const labels = meteo.map(m => formatDate(m.date));

    new Chart(document.getElementById('chart-meteo'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label:'Température (°C)', data:meteo.map(m=>m.temperature), borderColor:'#E63946', backgroundColor:'rgba(230,57,70,0.08)', fill:true, tension:0.4, pointRadius:3 },
          { label:'Humidité (%)',      data:meteo.map(m=>m.humidite),    borderColor:'#457B9D', backgroundColor:'rgba(69,123,157,0.08)', fill:true, tension:0.4, pointRadius:3 },
        ],
      },
      options: {
        responsive:true,
        plugins:{ legend:{ position:'bottom', labels:{ font:{ size:12 } } } },
        scales:{
          y:{ beginAtZero:false, grid:{ color:'rgba(0,0,0,0.05)' } },
          x:{ grid:{ display:false }, ticks:{ font:{ size:11 } } },
        },
      },
    });

    new Chart(document.getElementById('chart-pluie'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label:'Pluie (mm)', data:meteo.map(m=>m.pluie_mm), backgroundColor:'rgba(82,183,136,0.6)', borderColor:'#2D6A4F', borderWidth:1, borderRadius:4 }],
      },
      options: {
        responsive:true,
        plugins:{ legend:{ display:false } },
        scales:{
          y:{ beginAtZero:true, grid:{ color:'rgba(0,0,0,0.05)' } },
          x:{ grid:{ display:false }, ticks:{ font:{ size:11 } } },
        },
      },
    });
  }
}

init();