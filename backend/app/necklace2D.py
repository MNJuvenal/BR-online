import os
import cv2
import numpy as np
from ultralytics import YOLO

# === Initialisation YOLO ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "Content", "model_vf4.pt")
model = YOLO(MODEL_PATH)


def detect_neck_mask(image_path, model, width, height):
    results = model.predict(image_path, conf=0.4, task="segment")[0]
    for i, box in enumerate(results.boxes):
        cls_id = int(box.cls[0])
        label = results.names[cls_id]
        if label.lower() == "neck":
            mask_data = results.masks.data[i].cpu().numpy()
            mask = (mask_data * 255).astype(np.uint8)
            return cv2.resize(mask, (width, height))
    return None


def find_vertical_intersection(mask_bin, point, height):
    x, y_start = int(point[0]), int(point[1])
    for y in range(y_start, height):
        if mask_bin[y, x] == 255:
            return (x, y)
    return None


def compute_collar_width(p1, p2):
    if p1 and p2:
        return int(np.linalg.norm(np.array(p1) - np.array(p2)))
    return 0


def overlay_collar(image, collar_path, p1, p2, chin):
    collar = cv2.imread(collar_path, cv2.IMREAD_UNCHANGED)
    if collar is None:
        raise Exception("❌ Problème lors du chargement du collier.")
    if collar.shape[2] != 4:
        raise Exception("❌ Le collier doit être un PNG avec canal alpha (RGBA).")

    width = compute_collar_width(p1, p2)
    if width <= 0:
        raise Exception("❌ Largeur du collier invalide.")

    scale = width / collar.shape[1]
    collar_height = int(collar.shape[0] * scale)
    collar = cv2.resize(collar, (width, collar_height), interpolation=cv2.INTER_AREA)
    h, w = collar.shape[:2]

    # Perspective transform
    src_pts = np.float32([[0, 0], [w, 0], [0, h], [w, h]])
    dy = abs(p2[1] - p1[1])
    bottom_left = (p1[0], p1[1] + h + dy)
    bottom_right = (p2[0], p2[1] + h + dy)
    dst_pts = np.float32([p1, p2, bottom_left, bottom_right])

    M = cv2.getPerspectiveTransform(src_pts, dst_pts)
    warped = cv2.warpPerspective(collar, M, (image.shape[1], image.shape[0]), borderMode=cv2.BORDER_TRANSPARENT)

    # Blend with alpha
    alpha = warped[:, :, 3] / 255.0
    blurred_alpha = cv2.GaussianBlur(alpha, (15, 15), sigmaX=5)
    for c in range(3):
        image[:, :, c] = (
            warped[:, :, c] * blurred_alpha + image[:, :, c] * (1 - blurred_alpha)
        ).astype(np.uint8)

    return image


def apply_necklace(
    image_path,
    necklace_path,
    landmarks,   # <--- Les landmarks sont passés depuis le frontend
    color_match=False,
    add_shadow=False,
    is_example=False
):
    print(f"🟢 apply_necklace appelée avec landmarks: {landmarks}")
    
    img = cv2.imread(image_path)
    if img is None:
        raise Exception("❌ Image introuvable.")

    h, w = img.shape[:2]

    # Récupération des points envoyés et conversion en entiers
    left_ear = (int(landmarks["left_ear"][0]), int(landmarks["left_ear"][1]))
    right_ear = (int(landmarks["right_ear"][0]), int(landmarks["right_ear"][1]))
    chin = (int(landmarks["chin"][0]), int(landmarks["chin"][1]))
    
    print(f"📍 Coordonnées converties - left_ear: {left_ear}, right_ear: {right_ear}, chin: {chin}")

    # Détection du masque YOLO
    mask = detect_neck_mask(image_path, model, w, h)
    left_inter = right_inter = None

    if mask is not None:
        mask_bin = (mask > 127).astype(np.uint8) * 255
        left_inter = find_vertical_intersection(mask_bin, left_ear, h)
        right_inter = find_vertical_intersection(mask_bin, right_ear, h)

        if left_inter and left_inter[1] < chin[1]:
            left_inter = (int(left_inter[0]), int(chin[1] + 10))
        if right_inter and right_inter[1] < chin[1]:
            right_inter = (int(right_inter[0]), int(chin[1] + 10))

    # Logique fallback
    if left_inter and right_inter:
        pass
    elif left_inter and left_inter[1] > chin[1]:
        right_inter = (int(right_ear[0]), int(left_inter[1]))
    elif right_inter and right_inter[1] > chin[1]:
        left_inter = (int(left_ear[0]), int(right_inter[1]))
    else:
        offset = 15
        left_inter = (int(left_ear[0]), int(chin[1] + offset))
        right_inter = (int(right_ear[0]), int(chin[1] + offset))

    # Vérification buste
    min_base_y = min(left_inter[1], right_inter[1])
    bust_height = min_base_y - chin[1]
    if bust_height < 8:
        raise Exception("❌ Buste trop court, impossible de placer le collier.")

    # Vérifier que le collier rentre
    collar_width = compute_collar_width(left_inter, right_inter)
    collar = cv2.imread(necklace_path, cv2.IMREAD_UNCHANGED)
    if collar is None:
        raise Exception("❌ Impossible de charger le collier.")

    scale = collar_width / collar.shape[1]
    collar_height = int(collar.shape[0] * scale)
    collar_bottom = min_base_y + collar_height

    if collar_bottom > img.shape[0]:
        raise Exception("❌ Le collier dépasserait de l'image.")
    else:
        print("✅ Le collier tient dans l'image.")

    # Appliquer le collier
    img = overlay_collar(img, necklace_path, left_inter, right_inter, chin)

    return img
