import os
import torch
from ultralytics import YOLO

# Chemin vers ton modèle .pt
MODEL_PATH = "/home/juve/STAGE_BLUE_REFLET/A/bleu-reflet-necklaces/BR-deploy-main/backend/app/Content/model_vf4.pt"
ONNX_PATH = "model_vf4.onnx"
IMGSZ = 640  # adapte si besoin

# Vérifie que le fichier modèle existe avant de charger
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"❌ Fichier modèle introuvable : {MODEL_PATH}")

# Charger le modèle YOLO Ultralytics
model = YOLO(MODEL_PATH)

# Exporter vers ONNX (Ultralytics YOLOv8 standard export)
model.export(format="onnx", imgsz=IMGSZ, dynamic=True, simplify=True, opset=12, half=False, optimize=True, verbose=True)

# Renommer le fichier exporté si besoin
if os.path.exists("model.onnx"):
    os.rename("model.onnx", ONNX_PATH)

print(f"✅ Export terminé : {ONNX_PATH}")
# Conversion IR version si besoin
onnx_model = onnx.load(ONNX_PATH)
if onnx_model.ir_version > 10:
    try:
        from onnx import version_converter
        print(f"⚠️ Conversion IR version {onnx_model.ir_version} → 10 pour compatibilité onnxruntime")
        onnx_model = version_converter.convert_version(onnx_model, 11)
        # Corrige le champ ir_version explicitement
        onnx_model.ir_version = 11
        onnx.save(onnx_model, ONNX_PATH)
    except Exception as e:
        print(f"❌ Conversion IR version échouée : {e}")
        print("Essayez de mettre à jour onnxruntime ou d'utiliser une version plus récente.")
        exit(1)

print(f"✅ Export terminé : {ONNX_PATH}")
