import os
import cv2
import numpy as np
from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "Content", "model_vf4.pt")

print(f"🔍 Recherche du modèle YOLO à: {MODEL_PATH}")

if os.path.exists(MODEL_PATH):
    print("✅ Modèle YOLO trouvé, chargement...")
    model = YOLO(MODEL_PATH)
    print("🧠 Modèle YOLO chargé avec succès")
else:
    print("⚠️ ATTENTION: Modèle YOLO non trouvé, utilisation du modèle par défaut")
    model = None


def detect_neck_mask(image_path, model, width, height):
    if model is None:
        print("⚠️ Modèle YOLO non disponible, retour de masque vide")
        return None
    try:
        results = model.predict(image_path, conf=0.4, task="segment")[0]
        for i, box in enumerate(results.boxes):
            cls_id = int(box.cls[0])
            label = results.names[cls_id]
            if label.lower() == "neck":
                mask_data = results.masks.data[i].cpu().numpy()
                mask = (mask_data * 255).astype(np.uint8)
                return cv2.resize(mask, (width, height))
    except Exception as e:
        print(f"⚠️ Erreur lors de la détection YOLO: {e}")
    return None


def find_vertical_intersection(mask_bin, point, height):
    x, y_start = int(point[0]), int(point[1])
    for y in range(y_start, height):
        if mask_bin[y, x] == 255:
            return (x, y)
    return None


def compute_collar_width(p1, p2):
    """Calcule la largeur adaptée du collier basée sur la distance entre les oreilles."""
    distance = np.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
    # Largeur exacte égale à la distance entre intersections
    width = int(distance * 1)  # Exactement la distance oreille-oreille
    print(f"🎯 [DYNAMIC SIZE] Distance oreilles: {distance:.1f}px → Largeur collier: {width}px")
    return width


def add_warning_overlay(image, message):
    """
    Ajoute un overlay d'avertissement centre sur l'image
    """
    h, w = image.shape[:2]
    overlay = image.copy()
    
    # Rectangle encore plus grand et centre
    rect_height = 200
    rect_width = w - 60
    rect_x = 30
    rect_y = (h - rect_height) // 2  # Centre vertical

    # Fond blanc opaque
    cv2.rectangle(image, (rect_x, rect_y), (rect_x + rect_width, rect_y + rect_height), (255, 255, 255), -1)
    
    # Bordure noire
    cv2.rectangle(image, (rect_x, rect_y), (rect_x + rect_width, rect_y + rect_height), (0, 0, 0), 4)

    # Texte principal encore plus grand, noir sur blanc
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 3  # Encore plus grand
    font_thickness = 10
    text_color = (0, 0, 0)  # Noir

    # Message principal
    text_size = cv2.getTextSize(message, font, font_scale, font_thickness)[0]
    text_x = (w - text_size[0]) // 2
    text_y = rect_y + rect_height // 2 - 20

    cv2.putText(image, message, (text_x, text_y), font, font_scale, text_color, font_thickness)

    # Message secondaire "changer d'image svp"
    message2 = "Changer d'image svp"
    font_scale2 = 1.8
    text_size2 = cv2.getTextSize(message2, font, font_scale2, font_thickness)[0]
    text_x2 = (w - text_size2[0]) // 2
    text_y2 = text_y + 60

    cv2.putText(image, message2, (text_x2, text_y2), font, font_scale2, text_color, font_thickness)

    # Icone d'alerte simple, noire
    icon_text = "!"
    icon_size = cv2.getTextSize(icon_text, font, 3.0, font_thickness)[0]
    icon_x = rect_x + 20
    icon_y = rect_y + rect_height // 2
    cv2.putText(image, icon_text, (icon_x, icon_y), font, 3.0, (0, 0, 0), font_thickness)

    return image


def overlay_collar(image, collar_path, p1, p2, chin):
    collar = cv2.imread(collar_path, cv2.IMREAD_UNCHANGED)
    if collar is None:
        raise Exception("❌ Problème lors du chargement du collier.")
    # Si le collier n'a pas de canal alpha, on en ajoute un (opaque)
    if collar.shape[2] == 3:
        print("⚠️ Collier sans canal alpha, ajout d'un canal alpha opaque.")
        alpha_channel = np.ones((collar.shape[0], collar.shape[1], 1), dtype=collar.dtype) * 255
        collar = np.concatenate([collar, alpha_channel], axis=2)
    elif collar.shape[2] != 4:
        raise Exception("❌ Le collier doit être une image RGB ou RGBA.")

    width = compute_collar_width(p1, p2)
    scale = width / collar.shape[1]
    collar_height = int(collar.shape[0] * scale)
    collar_resized = cv2.resize(collar, (width, collar_height), interpolation=cv2.INTER_AREA)

    center_x = (p1[0] + p2[0]) // 2
    center_y = (p1[1] + p2[1]) // 2
    start_x = center_x - width // 2
    start_y = center_y

    if start_x < 0:
        start_x = 0
    if start_x + width > image.shape[1]:
        start_x = image.shape[1] - width
    if start_y < 0:
        start_y = 0

    max_y = min(collar_height, image.shape[0] - start_y)
    max_x = min(width, image.shape[1] - start_x)

    # Vectorized alpha blending (remplace la boucle pixel)
    roi = image[start_y:start_y+max_y, start_x:start_x+max_x]
    collar_rgb = collar_resized[:max_y, :max_x, :3]
    alpha = collar_resized[:max_y, :max_x, 3:4] / 255.0
    image[start_y:start_y+max_y, start_x:start_x+max_x, :3] = (
        alpha * collar_rgb + (1 - alpha) * roi
    )

    return image


def apply_necklace(
    image_path,
    necklace_path,
    landmarks
):
    print(f"🟢 apply_necklace appelée avec landmarks: {landmarks}")

    img = cv2.imread(image_path)
    if img is None:
        raise Exception("❌ Image introuvable.")

    h, w = img.shape[:2]

    left_ear = (int(landmarks["left_ear"][0]), int(landmarks["left_ear"][1]))
    right_ear = (int(landmarks["right_ear"][0]), int(landmarks["right_ear"][1]))
    chin = (int(landmarks["chin"][0]), int(landmarks["chin"][1]))

    mask = detect_neck_mask(image_path, model, w, h)
    left_inter = right_inter = None

    if mask is not None:
        mask_bin = (mask > 127).astype(np.uint8) * 255
        left_inter = find_vertical_intersection(mask_bin, left_ear, h)
        right_inter = find_vertical_intersection(mask_bin, right_ear, h)

        if left_inter and left_inter[1] < chin[1]:
            left_inter = (left_inter[0], chin[1] + 10)
        if right_inter and right_inter[1] < chin[1]:
            right_inter = (right_inter[0], chin[1] + 10)

    # Vérification finale : les points doivent être en dessous du menton
    if left_inter and left_inter[1] < chin[1]:
        left_inter = (left_inter[0], chin[1] + 10)
    if right_inter and right_inter[1] < chin[1]:
        right_inter = (right_inter[0], chin[1] + 10)

    if left_inter and right_inter:
        pass
    elif left_inter:
        right_inter = (right_ear[0], left_inter[1])
    elif right_inter:
        left_inter = (left_ear[0], right_inter[1])
    else:
        # YOLO n'a rien détecté = photo pas conforme
        img = add_warning_overlay(img, "Photo pas conforme")
        return img, "error_photo_not_conform"

    min_base_y = min(left_inter[1], right_inter[1])

    # Vérifier que le collier rentre - méthode plus robuste
    available_height = img.shape[0] - min_base_y

    collar_width = compute_collar_width(left_inter, right_inter)
    collar = cv2.imread(necklace_path, cv2.IMREAD_UNCHANGED)
    if collar is None:
        img = add_warning_overlay(img, "Erreur : collier introuvable ou invalide")
        return img, "error_no_collar"
    # Ajout d'un canal alpha si besoin
    if len(collar.shape) == 3 and collar.shape[2] == 3:
        print("⚠️ Collier sans canal alpha, ajout d'un canal alpha opaque.")
        alpha_channel = np.ones((collar.shape[0], collar.shape[1], 1), dtype=collar.dtype) * 255
        collar = np.concatenate([collar, alpha_channel], axis=2)
    elif len(collar.shape) != 3 or collar.shape[2] != 4:
        img = add_warning_overlay(img, "Erreur : format collier non supporté")
        return img, "error_no_collar"

    scale = collar_width / collar.shape[1]
    collar_height = int(collar.shape[0] * scale)

    # Vérification simple : le collier doit rentrer entièrement
    if available_height < collar_height:
        img = add_warning_overlay(img, "Buste trop court pour placer le collier")
        return img, "error_bust_too_short"

    # On passe le chemin, la fonction overlay_collar gère aussi l'alpha
    img = overlay_collar(img, necklace_path, left_inter, right_inter, chin)

    return img, "success"

# Le code utilise la classe YOLO d'Ultralytics (PyTorch), pas yoloonnx.
# Si tu veux utiliser un modèle ONNX (par exemple exporté avec yoloonnx), il faut remplacer l'utilisation de ultralytics.YOLO
# par un moteur d'inférence ONNX comme onnxruntime.
    if available_height < collar_height:
        img = add_warning_overlay(img, "Buste trop court pour placer le collier")
        return img, "error_bust_too_short"

    # On passe le chemin, la fonction overlay_collar gère aussi l'alpha
    img = overlay_collar(img, necklace_path, left_inter, right_inter, chin)

    return img, "success"

# Le code utilise la classe YOLO d'Ultralytics (PyTorch), pas yoloonnx.
# Si tu veux utiliser un modèle ONNX (par exemple exporté avec yoloonnx), il faut remplacer l'utilisation de ultralytics.YOLO
# par un moteur d'inférence ONNX comme onnxruntime.
