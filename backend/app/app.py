from flask import Flask, request, send_file, jsonify, send_from_directory, Response
from flask_cors import CORS
import cv2
import os
import tempfile
import json
import importlib
import sys
import time

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
FRONTEND_PUBLIC = os.path.join(PROJECT_ROOT, "frontend", "public")

# Vérifier si le dossier dist existe
DIST_EXISTS = os.path.exists(FRONTEND_DIST)
print(f"📁 Dossier dist existe: {DIST_EXISTS}")
print(f"📁 Chemin dist: {FRONTEND_DIST}")
print(f"📁 Chemin public: {FRONTEND_PUBLIC}")

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

# Routes pour servir les fichiers en mode développement
@app.route('/data/<path:filename>')
def serve_data_files(filename):
    try:
        data_path = os.path.join(PROJECT_ROOT, "data")
        return send_from_directory(data_path, filename)
    except Exception as e:
        print(f"❌ Erreur lors du service du fichier data {filename}: {e}")
        return jsonify({"error": f"Fichier data {filename} non trouvé"}), 404

@app.route('/assets/<path:filename>')
def serve_public_assets(filename):
    try:
        # D'abord essayer depuis public/assets
        assets_path = os.path.join(FRONTEND_PUBLIC, "assets")
        if os.path.exists(os.path.join(assets_path, filename)):
            return send_from_directory(assets_path, filename)
        
        # Sinon essayer depuis public
        if os.path.exists(os.path.join(FRONTEND_PUBLIC, filename)):
            return send_from_directory(FRONTEND_PUBLIC, filename)
            
        return jsonify({"error": f"Asset {filename} non trouvé"}), 404
    except Exception as e:
        print(f"❌ Erreur lors du service de l'asset {filename}: {e}")
        return jsonify({"error": f"Asset {filename} non trouvé"}), 404

@app.route("/api/health", methods=["GET"])
def health():
    necklace_exists = os.path.exists(NECKLACE_PATH)
    return jsonify({
        "status": "OK",
        "necklace_found": necklace_exists,
        "necklace_path": NECKLACE_PATH
    })

@app.route("/api/apply-necklace", methods=["POST"])
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

            result_image, status = necklace2D.apply_necklace(
                temp_file.name,
                necklace_path=necklace_path,
                landmarks=landmarks  # <-- Passage des landmarks
            )

            # Log du statut retourné
            app.logger.info(f"📊 Statut de traitement retourné: {status}")

            with tempfile.TemporaryDirectory() as temp_dir:
                temp_output_path = os.path.join(temp_dir, "output.jpg")
                cv2.imwrite(temp_output_path, result_image)

                # Créer une réponse simple
                response = send_file(
                    temp_output_path,
                    mimetype='image/jpeg',
                    as_attachment=True,
                    download_name='processed.jpg'
                )
                
                response.headers['X-Processing-Info'] = status
                app.logger.info(f"📤 Header X-Processing-Info défini avec: {status}")
                
                return response

    except Exception as e:
        app.logger.error(f"Erreur lors du traitement de la requête: {str(e)}")
        return jsonify({"error": "Erreur interne du serveur", "message": str(e)}), 500

@app.after_request
def log_response_details(response):
    app.logger.info(f"Réponse envoyée : Status {response.status_code}, Content-Length {response.headers.get('Content-Length')}")
    return response

@app.route("/api/scan-assets", methods=["GET"])
def scan_assets():
    """Scanne les dossiers d'assets et retourne la liste des fichiers disponibles"""
    try:
        # Extensions d'images supportées - tous les formats courants
        image_extensions = {
            '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', 
            '.tiff', '.tif', '.svg', '.ico', '.jfif', '.avif',
            '.JPG', '.JPEG', '.PNG', '.WEBP', '.BMP', '.GIF',
            '.TIFF', '.TIF', '.SVG', '.ICO', '.JFIF', '.AVIF'
        }
        
        # Chemins vers les dossiers selon le mode - Détection automatique intelligente
        
        # Priorité 1: Variable d'environnement pour chemin personnalisé (nginx/production)
        production_assets_path = os.environ.get('PRODUCTION_ASSETS_PATH')
        
        # Priorité 2: Détecter automatiquement l'environnement nginx
        def detect_nginx_assets():
            """Détecte les chemins d'assets typiques nginx"""
            nginx_paths = [
                "/var/www/necklace-frontend/dist/assets",
                "/var/www/html/dist/assets",
                "/var/www/html/assets",
                "/var/www/assets",
                "/srv/www/assets"
            ]
            
            for path in nginx_paths:
                if os.path.exists(path):
                    examples_path = os.path.join(path, "examples")
                    colliers_path = os.path.join(path, "colliers")
                    if os.path.exists(examples_path) or os.path.exists(colliers_path):
                        print(f"🌐 Assets nginx détectés dans: {path}")
                        return path
            return None
        
        # Priorité 3: Utiliser dist/assets si disponible et complet (mode production local)
        dist_examples_dir = os.path.join(FRONTEND_DIST, "assets", "examples") if DIST_EXISTS else None
        dist_colliers_dir = os.path.join(FRONTEND_DIST, "assets", "colliers") if DIST_EXISTS else None
        
        # Priorité 4: Fallback vers public/assets (mode développement)
        public_examples_dir = os.path.join(PROJECT_ROOT, "frontend", "public", "assets", "examples")
        public_colliers_dir = os.path.join(PROJECT_ROOT, "frontend", "public", "assets", "colliers")
        
        # Variable d'environnement pour forcer le mode développement
        force_dev = os.environ.get('FORCE_DEV', '').lower() == 'true'
        
        if force_dev:
            # Force le mode développement même si dist existe
            examples_dir = public_examples_dir
            colliers_dir = public_colliers_dir
            print(f"🔧 Mode développement forcé : scan de frontend/public/assets")
        elif production_assets_path and os.path.exists(production_assets_path):
            # Utiliser le chemin spécifié en production (nginx)
            examples_dir = os.path.join(production_assets_path, "examples")
            colliers_dir = os.path.join(production_assets_path, "colliers")
            print(f"🚀 Mode production nginx : scan depuis {production_assets_path}")
        elif detect_nginx_assets():
            # Auto-détection nginx
            nginx_assets = detect_nginx_assets()
            if nginx_assets:  # Vérification supplémentaire pour éviter l'erreur de type
                examples_dir = os.path.join(nginx_assets, "examples")
                colliers_dir = os.path.join(nginx_assets, "colliers")
                print(f"🌐 Mode nginx auto-détecté : scan depuis {nginx_assets}")
            else:
                # Fallback si la détection échoue
                examples_dir = public_examples_dir
                colliers_dir = public_colliers_dir
                print(f"🔧 Fallback développement : nginx non détecté")
        elif DIST_EXISTS and dist_examples_dir and os.path.exists(dist_examples_dir):
            # Mode production automatique : dist existe et contient des assets
            examples_dir = dist_examples_dir
            colliers_dir = dist_colliers_dir if (dist_colliers_dir and os.path.exists(dist_colliers_dir)) else public_colliers_dir
            print(f"🚀 Mode production local : scan de frontend/dist/assets")
        else:
            # Mode développement : utiliser public/assets par défaut
            examples_dir = public_examples_dir
            colliers_dir = public_colliers_dir
            print(f"🔧 Mode développement : scan de frontend/public/assets")
        
        def scan_directory(directory_path, prefix):
            """Scanne un dossier et retourne la liste des images"""
            files = []
            print(f"🔍 Scan de {directory_path}")
            
            if not os.path.exists(directory_path):
                print(f"❌ Dossier {directory_path} n'existe pas")
                return files
                
            try:
                all_files = sorted(os.listdir(directory_path))
                print(f"📁 Fichiers trouvés: {all_files}")
                
                for filename in all_files:
                    file_path = os.path.join(directory_path, filename)
                    if os.path.isfile(file_path):
                        _, ext = os.path.splitext(filename.lower())
                        if ext in image_extensions:
                            files.append({
                                "name": f"{prefix.title()} {len(files) + 1}",
                                "path": filename,
                                "original_name": filename
                            })
                            print(f"✅ Fichier image ajouté: {filename}")
                        else:
                            print(f"⏭️ Fichier ignoré (format non supporté): {filename}")
                            
            except PermissionError:
                print(f"❌ Permission refusée pour accéder à {directory_path}")
            except Exception as e:
                print(f"❌ Erreur lors du scan de {directory_path}: {str(e)}")
                
            print(f"📊 {len(files)} fichiers image trouvés dans {directory_path}")
            return files
        
        # Scanner les dossiers
        examples = scan_directory(examples_dir, "example")
        colliers = scan_directory(colliers_dir, "collier")
        
        # Informations de debug pour le frontend
        mode_detected = "development"
        if production_assets_path and os.path.exists(production_assets_path):
            mode_detected = "production-nginx-env"
        elif detect_nginx_assets():
            mode_detected = "production-nginx-auto"
        elif DIST_EXISTS and "dist" in examples_dir:
            mode_detected = "production-local"
        elif force_dev:
            mode_detected = "development-forced"
        
        scan_info = {
            "mode": mode_detected,
            "examples_path": examples_dir.replace(PROJECT_ROOT, "").lstrip("/"),
            "colliers_path": colliers_dir.replace(PROJECT_ROOT, "").lstrip("/"),
            "dist_available": DIST_EXISTS,
            "force_dev": force_dev,
            "nginx_detected": detect_nginx_assets() is not None,
            "production_assets_env": production_assets_path
        }
        
        app.logger.info(f"📊 Assets scannés: {len(examples)} examples, {len(colliers)} colliers")
        app.logger.info(f"🔧 Configuration: {scan_info}")
        
        return jsonify({
            "examples": examples,
            "colliers": colliers,
            "total_examples": len(examples),
            "total_colliers": len(colliers),
            "scan_timestamp": int(time.time()),
            "scan_info": scan_info
        })
        
    except Exception as e:
        app.logger.error(f"Erreur lors du scan des assets: {str(e)}")
        return jsonify({"error": "Erreur lors du scan des assets", "message": str(e)}), 500

if __name__ == "__main__":
    try:
        print("🚀 Démarrage de l'application Flask...")
        
        if os.path.exists(NECKLACE_PATH):
            print(f"✅ Image du collier trouvée: {NECKLACE_PATH}")
        else:
            print(f"⚠️ ATTENTION: L'image du collier n'a pas été trouvée à: {NECKLACE_PATH}")

        # Configuration pour production et développement
        port = int(os.environ.get('PORT', 5000))  # Port 5000 pour le développement local
        debug = os.environ.get('FLASK_ENV', 'development') == 'development'
        
        print(f"🌐 Démarrage sur le port: {port}")
        print(f"🔧 Mode debug: {debug}")
        
        app.run(host='0.0.0.0', port=port, debug=debug)
    except Exception as e:
        print(f"❌ Erreur lors du démarrage: {e}")
        import traceback
        traceback.print_exc()

