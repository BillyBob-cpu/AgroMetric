const USE_MOCK = true;
const API_BASE = 'http://localhost:5000/api';

const MOCK_PARCELLES = [
  { id:1,  nom:'Parcelle 1',  localisation:'Zone A', surface_ha:2.45, culture_type:'Orge',      date_semis:'2026-03-15', dernier_etat:'Maladie détectée', alertes_critiques:1 },
  { id:2,  nom:'Parcelle 2',  localisation:'Zone B', surface_ha:4.49, culture_type:'Tournesol', date_semis:'2026-03-20', dernier_etat:'Maladie détectée', alertes_critiques:0 },
  { id:3,  nom:'Parcelle 3',  localisation:'Zone C', surface_ha:2.15, culture_type:'Blé',       date_semis:'2026-03-19', dernier_etat:'OK',               alertes_critiques:2 },
  { id:4,  nom:'Parcelle 4',  localisation:'Zone D', surface_ha:2.49, culture_type:'Maïs',      date_semis:'2026-03-21', dernier_etat:'Risque maladie',   alertes_critiques:1 },
  { id:5,  nom:'Parcelle 5',  localisation:'Zone E', surface_ha:3.20, culture_type:'Blé',       date_semis:'2026-03-16', dernier_etat:'Stress hydrique',  alertes_critiques:0 },
  { id:6,  nom:'Parcelle 6',  localisation:'Zone A', surface_ha:4.06, culture_type:'Tournesol', date_semis:'2026-03-03', dernier_etat:'OK',               alertes_critiques:0 },
  { id:7,  nom:'Parcelle 7',  localisation:'Zone B', surface_ha:2.45, culture_type:'Orge',      date_semis:'2026-03-19', dernier_etat:'Stress hydrique',  alertes_critiques:1 },
  { id:8,  nom:'Parcelle 8',  localisation:'Zone C', surface_ha:3.88, culture_type:'Tournesol', date_semis:'2026-03-11', dernier_etat:'OK',               alertes_critiques:0 },
  { id:9,  nom:'Parcelle 9',  localisation:'Zone D', surface_ha:4.07, culture_type:'Colza',     date_semis:'2026-03-12', dernier_etat:'Maladie détectée', alertes_critiques:2 },
  { id:10, nom:'Parcelle 10', localisation:'Zone E', surface_ha:2.37, culture_type:'Colza',     date_semis:'2026-03-17', dernier_etat:'OK',               alertes_critiques:0 },
];

const MOCK_METEO = [
  { date:'2026-04-20', temperature:21, humidite:93, pluie_mm:5  },
  { date:'2026-04-21', temperature:13, humidite:85, pluie_mm:10 },
  { date:'2026-04-22', temperature:5,  humidite:50, pluie_mm:0  },
  { date:'2026-04-23', temperature:6,  humidite:89, pluie_mm:5  },
  { date:'2026-04-24', temperature:13, humidite:92, pluie_mm:20 },
  { date:'2026-04-25', temperature:14, humidite:91, pluie_mm:30 },
  { date:'2026-04-26', temperature:19, humidite:42, pluie_mm:0  },
  { date:'2026-04-27', temperature:15, humidite:65, pluie_mm:0  },
  { date:'2026-04-28', temperature:27, humidite:89, pluie_mm:0  },
  { date:'2026-04-29', temperature:23, humidite:56, pluie_mm:20 },
];

const MOCK_OBSERVATIONS = [
  { id:1,  date:'2026-04-28', etat:'OK',               parcelle_id:1,  commentaire:'Sol sec'          },
  { id:2,  date:'2026-04-27', etat:'Maladie détectée', parcelle_id:1,  commentaire:'Humidité élevée'  },
  { id:3,  date:'2026-04-19', etat:'Risque maladie',   parcelle_id:4,  commentaire:'Sol sec'          },
  { id:4,  date:'2026-04-19', etat:'Maladie détectée', parcelle_id:2,  commentaire:'Rien à signaler'  },
  { id:5,  date:'2026-04-19', etat:'Stress hydrique',  parcelle_id:7,  commentaire:'Feuilles jaunies' },
  { id:6,  date:'2026-04-18', etat:'Maladie détectée', parcelle_id:10, commentaire:'Humidité élevée'  },
  { id:7,  date:'2026-04-13', etat:'Maladie détectée', parcelle_id:3,  commentaire:'Sol sec'          },
  { id:8,  date:'2026-04-07', etat:'Maladie détectée', parcelle_id:3,  commentaire:'Feuilles jaunies' },
  { id:9,  date:'2026-03-15', etat:'Risque maladie',   parcelle_id:3,  commentaire:'Sol sec'          },
  { id:10, date:'2026-03-09', etat:'Maladie détectée', parcelle_id:2,  commentaire:'Humidité élevée'  },
  { id:11, date:'2026-03-02', etat:'OK',               parcelle_id:2,  commentaire:'Sol sec'          },
  { id:12, date:'2026-03-01', etat:'Stress hydrique',  parcelle_id:3,  commentaire:'Sol sec'          },
];

const MOCK_ALERTES = [
  { id:1,  date:'2026-04-25', type:'Risque maladie',  parcelle_id:3,  niveau:1, source:'auto'        },
  { id:2,  date:'2026-04-21', type:'Risque maladie',  parcelle_id:9,  niveau:3, source:'auto'        },
  { id:3,  date:'2026-04-21', type:'Risque maladie',  parcelle_id:3,  niveau:3, source:'auto'        },
  { id:4,  date:'2026-04-19', type:'Stress hydrique', parcelle_id:9,  niveau:2, source:'auto'        },
  { id:5,  date:'2026-04-19', type:'Risque maladie',  parcelle_id:7,  niveau:1, source:'auto'        },
  { id:6,  date:'2026-04-18', type:'Stress hydrique', parcelle_id:2,  niveau:1, source:'auto'        },
  { id:7,  date:'2026-04-17', type:'Stress hydrique', parcelle_id:3,  niveau:2, source:'auto'        },
  { id:8,  date:'2026-04-15', type:'Stress hydrique', parcelle_id:6,  niveau:2, source:'auto'        },
  { id:9,  date:'2026-04-14', type:'Stress hydrique', parcelle_id:4,  niveau:3, source:'auto'        },
  { id:10, date:'2026-04-14', type:'Risque maladie',  parcelle_id:7,  niveau:3, source:'auto'        },
  { id:11, date:'2026-04-12', type:'Stress hydrique', parcelle_id:1,  niveau:2, source:'observation' },
  { id:12, date:'2026-04-09', type:'Risque maladie',  parcelle_id:7,  niveau:3, source:'auto'        },
];

async function fetchData(endpoint, mockData) {
  if (USE_MOCK) return Promise.resolve(JSON.parse(JSON.stringify(mockData)));
  const res = await fetch(API_BASE + endpoint);
  if (!res.ok) throw new Error(`Erreur API ${res.status}`);
  return res.json();
}

const API = {
  getParcelles:    ()    => fetchData('/parcelles',    MOCK_PARCELLES),
  getParcelle:     (id)  => fetchData(`/parcelles/${id}`, MOCK_PARCELLES.find(p => p.id === id)),
  getMeteo:        ()    => fetchData('/meteo',        MOCK_METEO),
  getObservations: (pid) => fetchData(
    pid ? `/observations?parcelle_id=${pid}` : '/observations',
    pid ? MOCK_OBSERVATIONS.filter(o => o.parcelle_id === pid) : MOCK_OBSERVATIONS
  ),
  getAlertes:      ()    => fetchData('/alertes',      MOCK_ALERTES),
  getStats:        ()    => fetchData('/dashboard/stats', {
    total_parcelles:   10,
    total_alertes:     MOCK_ALERTES.length,
    alertes_critiques: MOCK_ALERTES.filter(a => a.niveau === 3).length,
    maladies:          MOCK_OBSERVATIONS.filter(o => o.etat === 'Maladie détectée').length,
    observations_ok:   MOCK_OBSERVATIONS.filter(o => o.etat === 'OK').length,
  }),
};

function formatDate(str) {
  return new Date(str).toLocaleDateString('fr-FR');
}

const BADGE_MAP = {
  'OK':               '<span class="badge badge-ok">OK</span>',
  'Risque maladie':   '<span class="badge badge-risk">Risque maladie</span>',
  'Maladie détectée': '<span class="badge badge-disease">Maladie détectée</span>',
  'Stress hydrique':  '<span class="badge badge-stress">Stress hydrique</span>',
};