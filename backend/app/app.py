from flask import Flask, request, send_file, jsonify, send_from_directory, Response
from flask_cors import CORS
import cv2
import os
import tempfile
import json
import importlib
import sys

print("📦 Imports réussis")

# S'assurer qu'on utilise le bon répertoire
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

print(f"📁 Répertoire courant: {current_dir}")

import necklace2D

print("🧠 Module necklace2D importé")

# Forcer le rechargement du module
importlib.reload(necklace2D)

print("🔄 Module necklace2D rechargé")

# Configuration des chemins
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
NECKLACE_PATH = os.path.join(PROJECT_ROOT, "data", "usefull_necklace", "necklace2k.png")
FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend", "dist")

# Vérifier si le dossier dist existe
DIST_EXISTS = os.path.exists(FRONTEND_DIST)
print(f"📁 Dossier dist existe: {DIST_EXISTS}")
print(f"📁 Chemin dist: {FRONTEND_DIST}")

# Créer l'app Flask avec ou sans dossier static
if DIST_EXISTS:
    app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path='')
    print("✅ Flask configuré avec dossier static")
else:
    app = Flask(__name__)
    print("⚠️ Flask configuré sans dossier static")

CORS(app)

print("🌐 Application Flask initialisée")

# Route pour servir le frontend React (seulement si dist existe)
@app.route('/')
def serve_frontend():
    if DIST_EXISTS:
        try:
            return send_from_directory(FRONTEND_DIST, 'index.html')
        except Exception as e:
            print(f"❌ Erreur lors du service du frontend: {e}")
            return jsonify({"error": "Frontend non disponible", "message": str(e)}), 500
    else:
        return jsonify({
            "message": "Backend Flask opérationnel",
            "status": "Frontend non buildé",
            "endpoints": ["/health", "/apply-necklace"]
        })

# Route pour servir les assets du frontend (seulement si dist existe)
@app.route('/<path:filename>')
def serve_frontend_assets(filename):
    if DIST_EXISTS:
        try:
            return send_from_directory(FRONTEND_DIST, filename)
        except Exception as e:
            print(f"❌ Erreur lors du service de l'asset {filename}: {e}")
            return jsonify({"error": f"Asset {filename} non trouvé"}), 404
    else:
        return jsonify({"error": "Frontend non disponible"}), 404

@app.route("/health", methods=["GET"])
def health():
    necklace_exists = os.path.exists(NECKLACE_PATH)
    return jsonify({
        "status": "OK",
        "necklace_found": necklace_exists,
        "necklace_path": NECKLACE_PATH
    })

@app.route("/apply-necklace", methods=["POST"])
def apply_necklace_endpoint():
    try:
        if 'image' not in request.files:
            app.logger.error("Aucune image reçue dans la requête.")
            return jsonify({"error": "Aucune image reçue"}), 400

        # Vérification des autres paramètres
        necklace_name = request.form.get('necklace', 'necklace2k.png')
        landmarks_json = request.form.get("landmarks")

        if not landmarks_json:
            app.logger.error("Aucun landmark reçu dans la requête.")
            return jsonify({"error": "Aucun landmark reçu"}), 400

        # Log des données reçues
        app.logger.info(f"Requête reçue avec necklace: {necklace_name} et landmarks: {landmarks_json}")

        # Définir le chemin du collier
        necklace_path = os.path.join(PROJECT_ROOT, "data", "usefull_necklace", necklace_name)
        if not os.path.exists(necklace_path):
            app.logger.error(f"Collier introuvable: {necklace_name}")
            return jsonify({"error": f"Collier introuvable: {necklace_name}"}), 400

        # Charger les landmarks
        landmarks = json.loads(landmarks_json)

        uploaded_file = request.files['image']
        is_example = request.form.get('is_example', 'false').lower() == 'true'

        with tempfile.NamedTemporaryFile(suffix='.jpg') as temp_file:
            uploaded_file.save(temp_file.name)

            result_image = necklace2D.apply_necklace(
                temp_file.name,
                necklace_path=necklace_path,
                landmarks=landmarks,  # <-- Passage des landmarks
                color_match=False,
                add_shadow=False,
                is_example=is_example
            )

            with tempfile.TemporaryDirectory() as temp_dir:
                temp_output_path = os.path.join(temp_dir, "output.jpg")
                cv2.imwrite(temp_output_path, result_image)

                return send_file(
                    temp_output_path,
                    mimetype='image/jpeg',
                    as_attachment=True,
                    download_name='processed.jpg'
                )

    except Exception as e:
        app.logger.error(f"Erreur lors du traitement de la requête: {str(e)}")
        return jsonify({"error": "Erreur interne du serveur", "message": str(e)}), 500

@app.after_request
def log_response_details(response):
    app.logger.info(f"Réponse envoyée : Status {response.status_code}, Content-Length {response.headers.get('Content-Length')}")
    return response

if __name__ == "__main__":
    try:
        print("🚀 Démarrage de l'application Flask...")
        
        if os.path.exists(NECKLACE_PATH):
            print(f"✅ Image du collier trouvée: {NECKLACE_PATH}")
        else:
            print(f"⚠️ ATTENTION: L'image du collier n'a pas été trouvée à: {NECKLACE_PATH}")

        # Configuration pour production et développement
        port = int(os.environ.get('PORT', 10000))
        debug = os.environ.get('FLASK_ENV', 'development') == 'development'
        
        print(f"🌐 Démarrage sur le port: {port}")
        print(f"🔧 Mode debug: {debug}")
        
        app.run(host='0.0.0.0', port=port, debug=debug)
    except Exception as e:
        print(f"❌ Erreur lors du démarrage: {e}")
        import traceback
        traceback.print_exc()

