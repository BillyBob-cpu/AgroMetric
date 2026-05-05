document.getElementById('topbar-date').textContent =
  new Date().toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', year:'numeric'});

let allParcelles = [];

// Couleur de fond selon l'état
const ETAT_BG = {
  'Maladie détectée': 'rgba(230,57,70,0.06)',
  'Risque maladie':   'rgba(244,162,97,0.08)',
  'Stress hydrique':  'rgba(69,123,157,0.07)',
  'OK':               'rgba(42,157,143,0.06)',
};

// Spinner de chargement
function showSpinner(containerId) {
  document.getElementById(containerId).innerHTML = `
    <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;padding:60px;gap:12px;color:var(--text-muted);font-size:14px;">
      <div style="width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--color-primary);border-radius:50%;animation:spin 0.7s linear infinite;"></div>
      Chargement des parcelles…
    </div>`;
}

function renderParcelles(liste) {
  const grid = document.getElementById('parcelles-grid');
  if (!liste.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
        <div style="font-size:32px;margin-bottom:12px;">🔍</div>
        <p style="color:var(--text-muted);font-size:14px;">Aucune parcelle trouvée.</p>
        <button onclick="resetFiltres()" style="margin-top:12px;padding:8px 16px;background:var(--color-primary);color:#fff;border:none;border-radius:var(--radius-sm);font-size:13px;cursor:pointer;">
          Réinitialiser les filtres
        </button>
      </div>`;
    return;
  }

  grid.innerHTML = liste.map(p => {
    const badge   = BADGE_MAP[p.dernier_etat] || `<span class="badge">${p.dernier_etat||'—'}</span>`;
    const alerte  = p.alertes_critiques > 0
      ? `<div style="font-size:12px;color:var(--color-danger);font-weight:600;margin-top:8px;">🚨 ${p.alertes_critiques} alerte(s) critique(s)</div>` : '';
    const bgColor = ETAT_BG[p.dernier_etat] || 'transparent';

    return `
      <div class="card" style="cursor:pointer;transition:transform .15s;background:${bgColor};"
        onmouseenter="this.style.transform='translateY(-3px)'"
        onmouseleave="this.style.transform='translateY(0)'"
        onclick="openModal(${p.id})">
        <div class="card-header" style="background:rgba(0,0,0,0.03);">
          <span>${p.nom}</span>
          <span style="font-size:12px;font-weight:400;color:var(--text-muted)">${p.localisation}</span>
        </div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;justify-content:space-between;">
            <span style="font-size:13px;color:var(--text-secondary)">Culture</span>
            <strong style="font-size:13px">${p.culture_type||'—'}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="font-size:13px;color:var(--text-secondary)">Surface</span>
            <strong style="font-size:13px">${p.surface_ha} ha</strong>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="font-size:13px;color:var(--text-secondary)">Semis</span>
            <strong style="font-size:13px">${p.date_semis ? formatDate(p.date_semis) : '—'}</strong>
          </div>
          <div style="border-top:1px solid var(--border);padding-top:10px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;color:var(--text-secondary)">Dernier état</span>
            ${badge}
          </div>
          ${alerte}
        </div>
      </div>`;
  }).join('');
}

function filtrer() {
  const zone    = document.getElementById('filtre-zone').value;
  const culture = document.getElementById('filtre-culture').value;
  const search  = document.getElementById('filtre-search').value.toLowerCase();
  renderParcelles(allParcelles.filter(p =>
    (!zone    || p.localisation === zone) &&
    (!culture || p.culture_type === culture) &&
    (!search  || p.nom.toLowerCase().includes(search))
  ));
}

function resetFiltres() {
  document.getElementById('filtre-zone').value    = '';
  document.getElementById('filtre-culture').value = '';
  document.getElementById('filtre-search').value  = '';
  renderParcelles(allParcelles);
}

document.getElementById('filtre-zone').addEventListener('change', filtrer);
document.getElementById('filtre-culture').addEventListener('change', filtrer);
document.getElementById('filtre-search').addEventListener('input', filtrer);

async function openModal(pid) {
  const overlay = document.getElementById('modal-overlay');
  overlay.style.display = 'flex';
  document.getElementById('modal-body').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;padding:40px;gap:12px;color:var(--text-muted);font-size:14px;">
      <div style="width:18px;height:18px;border:2px solid var(--border);border-top-color:var(--color-primary);border-radius:50%;animation:spin 0.7s linear infinite;"></div>
      Chargement…
    </div>`;

  const [p, obs] = await Promise.all([API.getParcelle(pid), API.getObservations(pid)]);
  document.getElementById('modal-title').textContent = p.nom;

  const rows = obs.slice(0,5).map(o => `
    <tr>
      <td>${formatDate(o.date)}</td>
      <td>${BADGE_MAP[o.etat]||o.etat}</td>
      <td style="color:var(--text-secondary);font-size:13px">${o.commentaire||'—'}</td>
    </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:16px">Aucune observation</td></tr>';

  document.getElementById('modal-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
      ${[['Zone',p.localisation],['Surface',p.surface_ha+' ha'],['Culture',p.culture_type||'—'],['Semis',p.date_semis?formatDate(p.date_semis):'—']].map(([l,v])=>`
        <div style="background:var(--bg-page);padding:12px;border-radius:var(--radius-sm);">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">${l.toUpperCase()}</div>
          <div style="font-weight:600;">${v}</div>
        </div>`).join('')}
    </div>
    <div style="font-weight:600;margin-bottom:10px;">Dernières observations</div>
    <table class="data-table">
      <thead><tr><th>Date</th><th>État</th><th>Commentaire</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target.id === 'modal-overlay') closeModal();
});

(async () => {
  showSpinner('parcelles-grid');
  allParcelles = await API.getParcelles();
  renderParcelles(allParcelles);
})();