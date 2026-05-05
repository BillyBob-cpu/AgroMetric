from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import date
import database as db

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False 
CORS(app)

@app.route('/api/parcelles')
def get_parcelles():
    return jsonify(db.get_all_parcelles())

@app.route('/api/parcelles/<int:pid>')
def get_parcelle(pid):
    p = db.get_parcelle_by_id(pid)
    return jsonify(p) if p else (jsonify({'error':'Introuvable'}), 404)

@app.route('/api/meteo')
def get_meteo():
    return jsonify(db.get_meteo(request.args.get('limit', 30, type=int)))

@app.route('/api/observations')
def get_observations():
    return jsonify(db.get_observations(request.args.get('parcelle_id', type=int)))

@app.route('/api/observations', methods=['POST'])
def add_observation():
    data = request.get_json()
    for c in ['date','etat','parcelle_id']:
        if c not in data:
            return jsonify({'error': f'Champ manquant : {c}'}), 400
    db.insert_observation(data)
    if data['etat'] == 'Maladie détectée':
        db.insert_alerte({'date':data['date'],'type':'Maladie détectée','parcelle_id':data['parcelle_id'],'niveau':3,'source':'observation'})
    elif data['etat'] == 'Risque maladie':
        db.insert_alerte({'date':data['date'],'type':'Risque maladie','parcelle_id':data['parcelle_id'],'niveau':2,'source':'observation'})
    return jsonify({'success':True}), 201

@app.route('/api/alertes')
def get_alertes():
    return jsonify(db.get_alertes(request.args.get('niveau', type=int)))

@app.route('/api/alertes/analyser', methods=['POST'])
def analyser():
    meteo = db.get_meteo_latest()
    if not meteo:
        return jsonify({'error':'Pas de données météo'}), 404
    temp, humid, pluie = float(meteo['temperature']), float(meteo['humidite']), float(meteo['pluie_mm'])
    today = str(date.today())
    generees = []
    for p in db.get_all_parcelles():
        a = None
        if   humid > 90 and temp > 20: a = {'type':'Risque maladie',  'niveau':3}
        elif humid > 80 and temp > 18: a = {'type':'Risque maladie',  'niveau':2}
        elif humid > 70 and temp > 15: a = {'type':'Risque maladie',  'niveau':1}
        elif pluie > 25:               a = {'type':'Excès eau',        'niveau':2}
        elif humid < 35 and pluie==0:  a = {'type':'Stress hydrique',  'niveau':2}
        elif humid < 45 and pluie==0:  a = {'type':'Stress hydrique',  'niveau':1}
        if a:
            alerte = {**a, 'date':today, 'parcelle_id':p['id'], 'source':'auto'}
            db.insert_alerte(alerte)
            generees.append(alerte)
    return jsonify({'alertes_generees':len(generees), 'meteo':meteo}), 201

@app.route('/api/dashboard/stats')
def stats():
    return jsonify(db.get_dashboard_stats())

if __name__ == '__main__':
    print("AgroSuivi API — http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)