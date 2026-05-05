import psycopg2
import psycopg2.extras
import csv
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

DB_CONFIG = {
    'host':     os.getenv('DB_HOST',     'localhost'),
    'port':     int(os.getenv('DB_PORT', 5432)),
    'dbname':   os.getenv('DB_NAME',     'agriculture_db'),
    'user':     os.getenv('DB_USER',     'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
}

def get_conn():
    return psycopg2.connect(**DB_CONFIG)

def create_tables():
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS parcelles (
            id SERIAL PRIMARY KEY, nom VARCHAR(100) NOT NULL,
            localisation VARCHAR(100) NOT NULL, surface_ha NUMERIC(6,2) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS cultures (
            id SERIAL PRIMARY KEY, type VARCHAR(100) NOT NULL,
            date_semis DATE NOT NULL, parcelle_id INTEGER NOT NULL
            REFERENCES parcelles(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS meteo (
            id SERIAL PRIMARY KEY, date DATE NOT NULL UNIQUE,
            temperature NUMERIC(5,2) NOT NULL, humidite NUMERIC(5,2) NOT NULL,
            pluie_mm NUMERIC(6,2) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS observations (
            id SERIAL PRIMARY KEY, date DATE NOT NULL,
            etat VARCHAR(50) NOT NULL CHECK(etat IN
                ('OK','Risque maladie','Maladie détectée','Stress hydrique')),
            parcelle_id INTEGER NOT NULL REFERENCES parcelles(id) ON DELETE CASCADE,
            commentaire TEXT
        );
        CREATE TABLE IF NOT EXISTS alertes (
            id SERIAL PRIMARY KEY, date DATE NOT NULL,
            type VARCHAR(100) NOT NULL,
            parcelle_id INTEGER NOT NULL REFERENCES parcelles(id) ON DELETE CASCADE,
            niveau INTEGER NOT NULL CHECK(niveau IN (1,2,3)),
            source VARCHAR(50) DEFAULT 'auto'
        );
    """)
    conn.commit(); cur.close(); conn.close()
    print("Tables créées.")

def import_csv():
    conn = get_conn(); cur = conn.cursor()
    with open(os.path.join(DATA_DIR,'parcelles.csv'), encoding='utf-8') as f:
        for r in csv.DictReader(f):
            cur.execute("INSERT INTO parcelles(id,nom,localisation,surface_ha) VALUES(%s,%s,%s,%s) ON CONFLICT(id) DO NOTHING",
                (r['id'],r['nom'],r['localisation'],r['surface_ha']))
    with open(os.path.join(DATA_DIR,'cultures.csv'), encoding='utf-8') as f:
        for r in csv.DictReader(f):
            cur.execute("INSERT INTO cultures(id,type,date_semis,parcelle_id) VALUES(%s,%s,%s,%s) ON CONFLICT(id) DO NOTHING",
                (r['id'],r['type'],r['date_semis'],r['parcelle_id']))
    with open(os.path.join(DATA_DIR,'meteo.csv'), encoding='utf-8') as f:
        for r in csv.DictReader(f):
            cur.execute("INSERT INTO meteo(date,temperature,humidite,pluie_mm) VALUES(%s,%s,%s,%s) ON CONFLICT(date) DO NOTHING",
                (r['date'],r['temperature'],r['humidite'],r['pluie_mm']))
    with open(os.path.join(DATA_DIR,'observations.csv'), encoding='utf-8') as f:
        for r in csv.DictReader(f):
            cur.execute("INSERT INTO observations(date,etat,parcelle_id,commentaire) VALUES(%s,%s,%s,%s)",
                (r['date'],r['etat'],r['parcelle_id'],r.get('commentaire','')))
    with open(os.path.join(DATA_DIR,'alertes.csv'), encoding='utf-8') as f:
        for r in csv.DictReader(f):
            cur.execute("INSERT INTO alertes(date,type,parcelle_id,niveau) VALUES(%s,%s,%s,%s)",
                (r['date'],r['type'],r['parcelle_id'],r['niveau']))
    conn.commit(); cur.close(); conn.close()
    print("Import CSV terminé.")

def get_all_parcelles():
    conn = get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT p.id, p.nom, p.localisation, p.surface_ha,
               c.type AS culture_type, c.date_semis::text,
               (SELECT etat FROM observations WHERE parcelle_id=p.id ORDER BY date DESC LIMIT 1) AS dernier_etat,
               (SELECT COUNT(*) FROM alertes WHERE parcelle_id=p.id AND niveau=3) AS alertes_critiques
        FROM parcelles p LEFT JOIN cultures c ON c.parcelle_id=p.id ORDER BY p.id
    """)
    rows = cur.fetchall(); cur.close(); conn.close()
    return [dict(r) for r in rows]

def get_parcelle_by_id(pid):
    conn = get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT p.*, c.type AS culture_type, c.date_semis::text
        FROM parcelles p LEFT JOIN cultures c ON c.parcelle_id=p.id WHERE p.id=%s
    """, (pid,))
    row = cur.fetchone(); cur.close(); conn.close()
    return dict(row) if row else None

def get_meteo(limit=30):
    conn = get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, date::text, temperature, humidite, pluie_mm FROM meteo ORDER BY date DESC LIMIT %s", (limit,))
    rows = cur.fetchall(); cur.close(); conn.close()
    return [dict(r) for r in reversed(rows)]

def get_meteo_latest():
    conn = get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, date::text, temperature, humidite, pluie_mm FROM meteo ORDER BY date DESC LIMIT 1")
    row = cur.fetchone(); cur.close(); conn.close()
    return dict(row) if row else None

def get_observations(parcelle_id=None):
    conn = get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    if parcelle_id:
        cur.execute("SELECT id, date::text, etat, parcelle_id, commentaire FROM observations WHERE parcelle_id=%s ORDER BY date DESC", (parcelle_id,))
    else:
        cur.execute("SELECT id, date::text, etat, parcelle_id, commentaire FROM observations ORDER BY date DESC")
    rows = cur.fetchall(); cur.close(); conn.close()
    return [dict(r) for r in rows]

def insert_observation(data):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("INSERT INTO observations(date,etat,parcelle_id,commentaire) VALUES(%s,%s,%s,%s)",
        (data['date'],data['etat'],data['parcelle_id'],data.get('commentaire','')))
    conn.commit(); cur.close(); conn.close()

def get_alertes(niveau=None):
    conn = get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    if niveau:
        cur.execute("SELECT id, date::text, type, parcelle_id, niveau, source FROM alertes WHERE niveau=%s ORDER BY date DESC", (niveau,))
    else:
        cur.execute("SELECT id, date::text, type, parcelle_id, niveau, source FROM alertes ORDER BY date DESC")
    rows = cur.fetchall(); cur.close(); conn.close()
    return [dict(r) for r in rows]

def insert_alerte(data):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("INSERT INTO alertes(date,type,parcelle_id,niveau,source) VALUES(%s,%s,%s,%s,%s)",
        (data['date'],data['type'],data['parcelle_id'],data['niveau'],data.get('source','auto')))
    conn.commit(); cur.close(); conn.close()

def get_dashboard_stats():
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM parcelles"); tp = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM alertes"); ta = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM alertes WHERE niveau=3"); ac = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM observations WHERE etat='Maladie détectée'"); ma = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM observations WHERE etat='OK'"); ok = cur.fetchone()[0]
    cur.close(); conn.close()
    return {'total_parcelles':tp,'total_alertes':ta,'alertes_critiques':ac,'maladies':ma,'observations_ok':ok}