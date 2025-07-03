import cv2
import numpy as np
import os
from glob import glob
import mediapipe as mp
from ultralytics import YOLO

# === Chemins ===
IMAGE_DIR = os.path.expanduser("/home/juve/STAGE_BLUE_REFLET/bleu-reflet-collier-deploy (4)/data/raw/GDrive/Necks/image")
OUTPUT_DIR = os.path.expanduser("~/STAGE_BLUE_REFLET/teste/resultats")
MODEL_PATH = os.path.expanduser("~/STAGE_BLUE_REFLET/bleu-reflet-collier-deploy (4)/backend/app/Content/model_vf4.pt")
COLLAR_PATH = os.path.expanduser("~/STAGE_BLUE_REFLET/bleu-reflet-collier-deploy (4)/data/usefull_necklace/necklace_transparent_3.png")

# === Initialisation ===
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True)
model = YOLO(MODEL_PATH)

# === Fonctions ===

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
    x, y_start = point
    for y in range(y_start, height):
        if mask_bin[y, x] == 255:
            return (x, y)
    return None

def get_horizontal_hits(mask_bin, left_intersection, right_intersection, width):
    right_hit_from_left = left_hit_from_right = None

    if left_intersection:
        y_left = left_intersection[1]
        for x in range(left_intersection[0], width):
            if mask_bin[y_left, x] == 255:
                right_hit_from_left = (x, y_left)
                break

    if right_intersection:
        y_right = right_intersection[1]
        for x in range(right_intersection[0], 0, -1):
            if mask_bin[y_right, x] == 255:
                left_hit_from_right = (x, y_right)
                break

    return right_hit_from_left, left_hit_from_right

def infer_missing_hit(p1, mask_bin, width):
    if not p1:
        return None
    y = p1[1]
    xs = [x for x in range(width) if mask_bin[y, x] == 255]
    if not xs:
        return None
    if p1[0] < width // 2:
        return (max(xs), y)
    else:
        return (min(xs), y)

def compute_collar_width(p1, p2):
    if p1 and p2:
        return int(np.linalg.norm(np.array(p1) - np.array(p2)))
    return 0

def overlay_collar(image, collar_path, p1, p2, chin):
    collar = cv2.imread(collar_path, cv2.IMREAD_UNCHANGED)
    if collar is None or p1 is None or p2 is None:
        print("❌ Problème lors du chargement du collier")
        return image

    width = compute_collar_width(p1, p2)
    scale = width / collar.shape[1]
    collar = cv2.resize(collar, (width, int(collar.shape[0] * scale)), interpolation=cv2.INTER_AREA)
    h, w = collar.shape[:2]

    # Transformation perspective
    src_pts = np.float32([
        [0, 0],
        [w, 0],
        [0, h],
        [w, h]
    ])
    dy = abs(p2[1] - p1[1])
    bottom_left = (p1[0], p1[1] + h + dy)
    bottom_right = (p2[0], p2[1] + h + dy)

    dst_pts = np.float32([
        [p1[0], p1[1]],
        [p2[0], p2[1]],
        bottom_left,
        bottom_right
    ])

    M = cv2.getPerspectiveTransform(src_pts, dst_pts)
    warped = cv2.warpPerspective(collar, M, (image.shape[1], image.shape[0]), borderMode=cv2.BORDER_TRANSPARENT)

    if warped.shape[2] == 4:
        alpha = warped[:, :, 3] / 255.0
        blurred_alpha = cv2.GaussianBlur(alpha, (15, 15), sigmaX=5)

        for c in range(3):
            image[:, :, c] = (
                warped[:, :, c] * blurred_alpha + image[:, :, c] * (1 - blurred_alpha)
            ).astype(np.uint8)

    return image

def process_image(image_path, model, output_dir):
    image = cv2.imread(image_path)
    if image is None:
        return

    h, w = image.shape[:2]
    mask = detect_neck_mask(image_path, model, w, h)
    if mask is None:
        print(f"❌ Pas de masque cou : {image_path}")
        return

    mask_bin = (mask > 127).astype(np.uint8) * 255
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)

    if not result.multi_face_landmarks:
        print(f"❌ Pas de visage détecté : {image_path}")
        return

    landmarks = result.multi_face_landmarks[0].landmark
    left_ear = (int(landmarks[234].x * w), int(landmarks[234].y * h))
    right_ear = (int(landmarks[454].x * w), int(landmarks[454].y * h))
    chin = (int(landmarks[152].x * w), int(landmarks[152].y * h))

    left_inter = find_vertical_intersection(mask_bin, left_ear, h)
    right_inter = find_vertical_intersection(mask_bin, right_ear, h)

    # ➕ Complément ou correction des intersections
    right_hit_from_left, left_hit_from_right = get_horizontal_hits(mask_bin, left_inter, right_inter, w)
    left_inter = left_hit_from_right if left_hit_from_right else infer_missing_hit(left_inter, mask_bin, w)
    right_inter = right_hit_from_left if right_hit_from_left else infer_missing_hit(right_inter, mask_bin, w)

    # === Debug : Points de repère
    cv2.circle(image, left_ear, 8, (255, 0, 0), -1)
    cv2.circle(image, right_ear, 8, (0, 255, 0), -1)
    cv2.circle(image, chin, 8, (0, 0, 255), -1)
    if left_inter:
        cv2.circle(image, left_inter, 10, (255, 255, 0), -1)
    if right_inter:
        cv2.circle(image, right_inter, 10, (0, 255, 255), -1)

    if left_inter and right_inter and left_inter[1] > chin[1] and right_inter[1] > chin[1]:
        image = overlay_collar(image, COLLAR_PATH, left_inter, right_inter, chin)
        print(f"✅ Collier placé : {os.path.basename(image_path)}")
    else:
        print(f"⚠️ Intersections invalides ou trop hautes : {os.path.basename(image_path)}")

    output_path = os.path.join(output_dir, os.path.basename(image_path))
    os.makedirs(output_dir, exist_ok=True)
    cv2.imwrite(output_path, image)
    print(f"💾 Image sauvegardée : {output_path}")

def process_folder(image_dir, model, output_dir):
    image_paths = glob(os.path.join(image_dir, "*.jpg")) + \
                  glob(os.path.join(image_dir, "*.jpeg")) + \
                  glob(os.path.join(image_dir, "*.png"))
    for path in image_paths:
        process_image(path, model, output_dir)

if __name__ == "__main__":
    process_folder(IMAGE_DIR, model, OUTPUT_DIR)
