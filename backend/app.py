from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import date
import database as db

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False
CORS(app)

ETATS_VALIDES = ('OK', 'Risque maladie', 'Maladie détectée', 'Stress hydrique')


# ══════════════════════════════════════════
#  HEADERS DE SÉCURITÉ
# ══════════════════════════════════════════

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options']        = 'DENY'
    response.headers['X-XSS-Protection']       = '1; mode=block'
    return response


# ══════════════════════════════════════════
#  PARCELLES
# ══════════════════════════════════════════

@app.route('/api/parcelles')
def get_parcelles():
    return jsonify(db.get_all_parcelles())


@app.route('/api/parcelles/<int:pid>')
def get_parcelle(pid):
    p = db.get_parcelle_by_id(pid)
    return jsonify(p) if p else (jsonify({'error': 'Introuvable'}), 404)


# ══════════════════════════════════════════
#  MÉTÉO
# ══════════════════════════════════════════

@app.route('/api/meteo')
def get_meteo():
    return jsonify(db.get_meteo(request.args.get('limit', 30, type=int)))


# ══════════════════════════════════════════
#  OBSERVATIONS
# ══════════════════════════════════════════

@app.route('/api/observations')
def get_observations():
    return jsonify(db.get_observations(request.args.get('parcelle_id', type=int)))


@app.route('/api/observations', methods=['POST'])
def add_observation():
    data = request.get_json()

    for champ in ['date', 'etat', 'parcelle_id']:
        if champ not in data:
            return jsonify({'error': f'Champ manquant : {champ}'}), 400

    if data['etat'] not in ETATS_VALIDES:
        return jsonify({'error': f"État invalide. Valeurs acceptées : {ETATS_VALIDES}"}), 400

    if not isinstance(data['parcelle_id'], int) or data['parcelle_id'] < 1:
        return jsonify({'error': 'parcelle_id invalide'}), 400

    db.insert_observation(data)

    if data['etat'] == 'Maladie détectée':
        db.insert_alerte({'date': data['date'], 'type': 'Maladie détectée',
                          'parcelle_id': data['parcelle_id'], 'niveau': 3, 'source': 'observation'})
    elif data['etat'] == 'Risque maladie':
        db.insert_alerte({'date': data['date'], 'type': 'Risque maladie',
                          'parcelle_id': data['parcelle_id'], 'niveau': 2, 'source': 'observation'})

    return jsonify({'success': True}), 201


# ══════════════════════════════════════════
#  ALERTES
# ══════════════════════════════════════════

@app.route('/api/alertes')
def get_alertes():
    return jsonify(db.get_alertes(request.args.get('niveau', type=int)))


@app.route('/api/alertes/analyser', methods=['POST'])
def analyser():
    meteo = db.get_meteo_latest()
    if not meteo:
        return jsonify({'error': 'Pas de données météo'}), 404

    temp  = float(meteo['temperature'])
    humid = float(meteo['humidite'])
    pluie = float(meteo['pluie_mm'])
    today = str(date.today())
    generees = []

    for p in db.get_all_parcelles():
        a = None
        if   humid > 90 and temp > 20: a = {'type': 'Risque maladie',   'niveau': 3}
        elif humid > 80 and temp > 18: a = {'type': 'Risque maladie',   'niveau': 2}
        elif humid > 70 and temp > 15: a = {'type': 'Risque maladie',   'niveau': 1}
        elif pluie > 25:               a = {'type': 'Excès eau',         'niveau': 2}
        elif humid < 35 and pluie == 0: a = {'type': 'Stress hydrique',  'niveau': 2}
        elif humid < 45 and pluie == 0: a = {'type': 'Stress hydrique',  'niveau': 1}
        if a:
            alerte = {**a, 'date': today, 'parcelle_id': p['id'], 'source': 'auto'}
            db.insert_alerte(alerte)
            generees.append(alerte)

    return jsonify({'alertes_generees': len(generees), 'meteo': meteo}), 201


# ══════════════════════════════════════════
#  DASHBOARD
# ══════════════════════════════════════════

@app.route('/api/dashboard/stats')
def stats():
    return jsonify(db.get_dashboard_stats())


# ══════════════════════════════════════════
#  AUTHENTIFICATION
# ══════════════════════════════════════════

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Inscription d'un nouvel utilisateur."""
    data = request.get_json()

    for field in ['nom', 'prenom', 'email', 'password']:
        if not data.get(field) or not str(data[field]).strip():
            return jsonify({'error': f"Le champ '{field}' est obligatoire."}), 400

    nom    = data['nom'].strip()
    prenom = data['prenom'].strip()
    email  = data['email'].strip().lower()
    pwd    = data['password']

    if '@' not in email or '.' not in email:
        return jsonify({'error': 'Adresse email invalide.'}), 400

    if len(pwd) < 6:
        return jsonify({'error': 'Le mot de passe doit contenir au moins 6 caractères.'}), 400

    user = db.create_user(nom, prenom, email, pwd)
    if user is None:
        return jsonify({'error': 'Cette adresse email est déjà utilisée.'}), 409

    return jsonify({
        'message': 'Compte créé avec succès.',
        'user': {
            'id':     user['id'],
            'nom':    user['nom'],
            'prenom': user['prenom'],
            'email':  user['email'],
            'role':   user['role']
        }
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Connexion d'un utilisateur existant."""
    data = request.get_json()

    email = (data.get('email') or '').strip().lower()
    pwd   = data.get('password') or ''

    if not email or not pwd:
        return jsonify({'error': 'Email et mot de passe requis.'}), 400

    user = db.get_user_by_email(email)
    if not user or not db.verify_password(pwd, user['password']):
        return jsonify({'error': 'Email ou mot de passe incorrect.'}), 401

    return jsonify({
        'message': 'Connexion réussie.',
        'user': {
            'id':     user['id'],
            'nom':    user['nom'],
            'prenom': user['prenom'],
            'email':  user['email'],
            'role':   user['role']
        }
    }), 200


@app.route('/api/auth/users', methods=['GET'])
def list_users():
    """Liste tous les utilisateurs inscrits (route admin)."""
    return jsonify(db.get_all_users()), 200


# ══════════════════════════════════════════
#  LANCEMENT
# ══════════════════════════════════════════

if __name__ == '__main__':
    print("AgroMetric API — http://localhost:5000")
    app.run(debug=False, host='0.0.0.0', port=5000)
