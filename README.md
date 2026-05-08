# AgroSuivi — Plateforme de suivi agricole

> Projet Bachelor 2 · Sup de Vinci · 2025-2026  
> Commanditaire simulé : Chambre d'Agriculture

## Présentation

AgroSuivi permet aux acteurs agricoles de :
- Surveiller l'état de leurs **parcelles** en temps réel
- Visualiser les **données météo** (température, humidité, précipitations)
- Saisir des **observations terrain**
- Recevoir des **alertes automatiques** basées sur des règles métier

## Stack technique

| Couche         | Technologie             |
|----------------|-------------------------|
| Frontend       | HTML5 / CSS3 / JavaScript |
| Backend        | Python 3 · Flask        |
| Base de données | SQLite                 |
| Graphiques     | Chart.js 4              |
| Infrastructure | Ubuntu 22.04 (VM)       |
| Déploiement    | VirtualBox + Nginx      |

## Installation locale

```bash
# 1. Cloner le projet
git clone https://github.com/TONCOMPTE/agri-dashboard.git
cd agri-dashboard

# 2. Installer les dépendances
cd backend
pip install -r requirements.txt

# 3. Initialiser la base de données (1 seule fois)
python init_db.py

# 4. Lancer le backend
python app.py
# → API sur http://localhost:5000

# 5. Ouvrir le frontend
# Ouvrir frontend/index.html dans un navigateur
```

## Règles métier — Alertes automatiques

| Condition météo                        | Type            | Niveau |
|----------------------------------------|-----------------|--------|
| Humidité > 90 % ET Température > 20 °C | Risque maladie  | 3      |
| Humidité > 80 % ET Température > 18 °C | Risque maladie  | 2      |
| Humidité > 70 % ET Température > 15 °C | Risque maladie  | 1      |
| Pluie > 25 mm                          | Excès eau       | 2      |
| Humidité < 35 % ET Pluie = 0           | Stress hydrique | 2      |
| Humidité < 45 % ET Pluie = 0           | Stress hydrique | 1      |

## Routes API

| Méthode | Route                      | Description                    |
|---------|----------------------------|--------------------------------|
| GET     | /api/parcelles             | Liste toutes les parcelles     |
| GET     | /api/parcelles/:id         | Détail d'une parcelle          |
| GET     | /api/meteo                 | Données météo (30 derniers j.) |
| GET     | /api/observations          | Toutes les observations        |
| POST    | /api/observations          | Ajouter une observation        |
| GET     | /api/alertes               | Toutes les alertes             |
| POST    | /api/alertes/analyser      | Générer alertes depuis météo   |
| GET     | /api/dashboard/stats       | Statistiques tableau de bord   |

## Équipe

| Membre       | Rôle                         |
|--------------|------------------------------|
| Prénom NOM   | Chef de projet · Backend     |
| Prénom NOM   | Base de données · Data       |
| Prénom NOM   | Frontend · UX                |
| Prénom NOM   | Infrastructure · Déploiement |

## Architecture
```mermaid
flowchart TD
    %% Configuration des styles pour correspondre à ton image
    classDef nodeBox fill:#ffffff,stroke:#000066,stroke-width:1px,color:#000066;
    classDef invisible fill:none,stroke:none;

    U["Utilisateur Agriculteur\n(4G / WiFi)"]:::nodeBox

    subgraph Z_EXT ["INTERNET / PROTECTION EXTERNE"]
        direction LR
        WAF["WAF (Web Application Firewall) :\nFiltre les attaques (DDoS, SQLi)"]:::nodeBox
        SSL["SSL/TLS :\nChiffrement du flux\n(HTTPS)"]:::nodeBox
    end

    subgraph Z_PUB ["ZONE PUBLIQUE (DMZ)"]
        NGINX["SERVEUR NGINX\n(PROXY REVERSE)\nPoint d'entrée unique,\nLoad Balancing basique\n(en local), Protection"]:::nodeBox
    end

    subgraph Z_APP ["ZONE APPLICATIVE"]
        APP["APPLICATION AGRICOLE (MVP)\n- Instance Unique (Backend & Logiciel)\n- Python (Flask/FastAPI) ou Node.js/Express\n- Gestion des Parcelles, Cultures, & Observations\n- Météo & Système d'alertes & Analyse (Rules Engine)"]:::nodeBox
    end

    subgraph Z_PRIV ["ZONE PRIVÉE (ISOLÉE)"]
        BDD["BASE DE DONNÉES CENTRALE (PostgreSQL)\nStockage de TOUTES les données structurées (MCD/MLD)\nParcelles, Cultures, Météo, Historiques, Utilisateurs"]:::nodeBox
        S3["STOCKAGE ASSETS STATIQUES\n(S3 / Object Storage) -\nAuthentification"]:::nodeBox
        DIFF["Diffusion fluide"]:::nodeBox
        
        S3 --> DIFF
    end

    %% Définition des flux principaux entre les zones
    U --> Z_EXT
    Z_EXT --> Z_PUB
    Z_PUB --> Z_APP
    Z_APP -->|Flux Interne| Z_PRIV
```
