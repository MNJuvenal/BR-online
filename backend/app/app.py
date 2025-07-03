from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import cv2
import os
import tempfile
import json
import importlib
import sys

# S'assurer qu'on utilise le bon répertoire
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

import necklace2D

# Forcer le rechargement du module
importlib.reload(necklace2D)

app = Flask(__name__)
CORS(app)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
NECKLACE_PATH = os.path.join(PROJECT_ROOT, "data", "usefull_necklace", "necklace2k.png")

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
    if 'image' not in request.files:
        return jsonify({"error": "Aucune image reçue"}), 400

    try:
        necklace_name = request.form.get('necklace', 'necklace2k.png')
        necklace_path = os.path.join(PROJECT_ROOT, "data", "usefull_necklace", necklace_name)
        if not os.path.exists(necklace_path):
            return jsonify({"error": f"Collier introuvable: {necklace_name}"}), 400

        # Récupération des landmarks depuis le frontend
        landmarks_json = request.form.get("landmarks")
        if not landmarks_json:
            return jsonify({"error": "Aucun landmark reçu"}), 400

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
        print(f"Erreur lors du traitement: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    if os.path.exists(NECKLACE_PATH):
        print(f"✅ Image du collier trouvée: {NECKLACE_PATH}")
    else:
        print(f"⚠️ ATTENTION: L'image du collier n'a pas été trouvée à: {NECKLACE_PATH}")

    # Configuration pour production et développement
    port = int(os.environ.get('PORT', 10000))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    
    app.run(host='0.0.0.0', port=port, debug=debug)

