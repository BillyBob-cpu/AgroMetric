document.getElementById('topbar-date').textContent =
  new Date().toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', year:'numeric'});

document.getElementById('obs-date').value = new Date().toISOString().split('T')[0];

let allObs = [];
let allParcelles = [];

function showSpinner() {
  document.getElementById('obs-tbody').innerHTML = `
    <tr><td colspan="4" style="text-align:center;padding:40px;">
      <div style="display:inline-flex;align-items:center;gap:10px;color:var(--text-muted);font-size:14px;">
        <div style="width:18px;height:18px;border:2px solid var(--border);border-top-color:var(--color-primary);border-radius:50%;animation:spin 0.7s linear infinite;"></div>
        Chargement…
      </div>
    </td></tr>`;
}

async function init() {
  showSpinner();
  allParcelles = await API.getParcelles();
  allObs       = await API.getObservations();

  allParcelles.forEach(p => {
    ['obs-parcelle','filtre-parcelle'].forEach(id => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nom + ' — ' + p.localisation;
      document.getElementById(id).appendChild(opt);
    });
  });

  renderObs(allObs);
}

function renderObs(liste) {
  const tbody = document.getElementById('obs-tbody');
  const total = document.getElementById('obs-total');

  total.textContent = `Total : ${liste.length} observation(s)`;

  if (!liste.length) {
    tbody.innerHTML = `
      <tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted);">
        Aucune observation trouvée.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = [...liste].sort((a,b) => new Date(b.date)-new Date(a.date)).map(o => {
    const p = allParcelles.find(p => p.id === Number(o.parcelle_id));
    return `<tr>
      <td>${formatDate(o.date)}</td>
      <td>${p ? p.nom : 'Parcelle '+o.parcelle_id}</td>
      <td>${BADGE_MAP[o.etat]||o.etat}</td>
      <td style="color:var(--text-secondary);font-size:13px">${o.commentaire||'—'}</td>
    </tr>`;
  }).join('');
}

function filtrer() {
  const pid  = document.getElementById('filtre-parcelle').value;
  const etat = document.getElementById('filtre-etat').value;
  renderObs(allObs.filter(o =>
    (!pid  || String(o.parcelle_id) === pid) &&
    (!etat || o.etat === etat)
  ));
}

function resetFiltres() {
  document.getElementById('filtre-parcelle').value = '';
  document.getElementById('filtre-etat').value     = '';
  renderObs(allObs);
}

document.getElementById('filtre-parcelle').addEventListener('change', filtrer);
document.getElementById('filtre-etat').addEventListener('change', filtrer);

async function submitObservation() {
  const msgEl = document.getElementById('form-msg');
  const data  = {
    date:        document.getElementById('obs-date').value,
    parcelle_id: parseInt(document.getElementById('obs-parcelle').value),
    etat:        document.getElementById('obs-etat').value,
    commentaire: document.getElementById('obs-commentaire').value.trim(),
  };

  if (!data.date || !data.parcelle_id) {
    msgEl.style.cssText = 'display:block;background:#FEE2E2;color:#991B1B;padding:10px 14px;border-radius:6px;margin-bottom:14px;font-size:14px;';
    msgEl.textContent = 'Veuillez remplir la date et la parcelle.';
    return;
  }

  // Confirmation avant envoi
  const parcelle = allParcelles.find(p => p.id === data.parcelle_id);
  const nomParcelle = parcelle ? parcelle.nom : 'Parcelle ' + data.parcelle_id;
  const confirmer = confirm(`Confirmer l'observation ?\n\n📍 ${nomParcelle}\n📋 État : ${data.etat}\n📅 Date : ${data.date}`);
  if (!confirmer) return;

  if (USE_MOCK) {
    allObs.unshift({ id: Date.now(), ...data });
    renderObs(allObs);
    msgEl.style.cssText = 'display:block;background:#D1FAE5;color:#065F46;padding:10px 14px;border-radius:6px;margin-bottom:14px;font-size:14px;';
    msgEl.textContent = 'Observation enregistrée (mode démo).';
    document.getElementById('obs-commentaire').value = '';
    setTimeout(() => msgEl.style.display = 'none', 3000);
    return;
  }

  try {
    await fetch(API_BASE + '/observations', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data),
    });
    allObs = await API.getObservations();
    renderObs(allObs);
    msgEl.style.cssText = 'display:block;background:#D1FAE5;color:#065F46;padding:10px 14px;border-radius:6px;margin-bottom:14px;font-size:14px;';
    msgEl.textContent = 'Observation enregistrée !';
    document.getElementById('obs-commentaire').value = '';
    setTimeout(() => msgEl.style.display = 'none', 3000);
  } catch {
    msgEl.style.cssText = 'display:block;background:#FEE2E2;color:#991B1B;padding:10px 14px;border-radius:6px;margin-bottom:14px;font-size:14px;';
    msgEl.textContent = 'Erreur de connexion au serveur.';
  }
}

init();