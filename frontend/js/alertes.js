document.getElementById('topbar-date').textContent =
  new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

const NIVEAU_CFG = {
  1: { label:'Vigilance', cls:'badge-stress',  icon:'ℹ️' },
  2: { label:'Important', cls:'badge-risk',    icon:'⚠️' },
  3: { label:'Critique',  cls:'badge-disease', icon:'🚨' },
};

let allAlertes = [];

function renderAlertes(liste) {
  document.getElementById('count-1').textContent = liste.filter(a => a.niveau == 1).length;
  document.getElementById('count-2').textContent = liste.filter(a => a.niveau == 2).length;
  document.getElementById('count-3').textContent = liste.filter(a => a.niveau == 3).length;

  const tbody = document.getElementById('alertes-tbody');
  if (!liste.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px;">Aucune alerte.</td></tr>';
    return;
  }
  liste.sort((a, b) => b.niveau - a.niveau || new Date(b.date) - new Date(a.date));
  tbody.innerHTML = liste.map(a => {
    const n = NIVEAU_CFG[a.niveau] || NIVEAU_CFG[1];
    return `<tr>
      <td><span class="badge ${n.cls}">${n.icon} Niv. ${a.niveau} — ${n.label}</span></td>
      <td style="font-weight:500;">${a.type}</td>
      <td>Parcelle ${a.parcelle_id}</td>
      <td>${formatDate(a.date)}</td>
      <td style="color:var(--text-muted);font-size:12px;">${a.source || 'auto'}</td>
    </tr>`;
  }).join('');
}

function filtrer() {
  const niveau = document.getElementById('filtre-niveau').value;
  const type   = document.getElementById('filtre-type').value;
  renderAlertes(allAlertes.filter(a =>
    (!niveau || String(a.niveau) === niveau) &&
    (!type   || a.type === type)
  ));
}

document.getElementById('filtre-niveau').addEventListener('change', filtrer);
document.getElementById('filtre-type').addEventListener('change', filtrer);

async function lancerAnalyse() {
  const msg = document.getElementById('analyse-msg');
  msg.textContent = 'Analyse en cours…';

  if (USE_MOCK) {
    msg.textContent = '✅ Mode démo : connexion backend requise pour l\'analyse réelle.';
    return;
  }

  try {
    const res  = await fetch(`${API_BASE}/alertes/analyser`, { method:'POST' });
    const json = await res.json();
    msg.textContent = `✅ ${json.alertes_generees} alerte(s) générée(s).`;
    allAlertes = await API.getAlertes();
    filtrer();
  } catch {
    msg.textContent = '❌ Impossible de joindre le serveur.';
  }
}

(async () => {
  allAlertes = await API.getAlertes();
  renderAlertes(allAlertes);
})();