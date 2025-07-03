import cv2
import numpy as np
import os
from glob import glob
import mediapipe as mp
from ultralytics import YOLO

# === Chemins ===
IMAGE_DIR = "/home/juve/STAGE_BLUE_REFLET/bleu-reflet-collier-deploy (4)/data/raw/GDrive/Necks/image"
OUTPUT_DIR = os.path.expanduser("~/STAGE_BLUE_REFLET/teste/resultats")
MODEL_PATH = os.path.expanduser("~/STAGE_BLUE_REFLET/bleu-reflet-collier-deploy (4)/backend/app/Content/model_vf4.pt")
COLLAR_PATH = os.path.expanduser("/home/juve/Downloads/necklace_transparent_7(1).png")

# === Initialisation ===
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True)
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
    x, y_start = point
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
        print("❌ Problème lors du chargement du collier")
        return image

    width = compute_collar_width(p1, p2)
    scale = width / collar.shape[1]
    collar = cv2.resize(collar, (width, int(collar.shape[0] * scale)), interpolation=cv2.INTER_AREA)
    h, w = collar.shape[:2]

    src_pts = np.float32([[0, 0], [w, 0], [0, h], [w, h]])
    dy = abs(p2[1] - p1[1])
    bottom_left = (p1[0], p1[1] + h + dy)
    bottom_right = (p2[0], p2[1] + h + dy)
    dst_pts = np.float32([p1, p2, bottom_left, bottom_right])

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
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)

    if not result.multi_face_landmarks:
        print(f"❌ Pas de visage détecté : {image_path}")
        return

    landmarks = result.multi_face_landmarks[0].landmark
    left_ear = (int(landmarks[234].x * w), int(landmarks[234].y * h))
    right_ear = (int(landmarks[454].x * w), int(landmarks[454].y * h))
    chin = (int(landmarks[152].x * w), int(landmarks[152].y * h))

    mask = detect_neck_mask(image_path, model, w, h)
    left_inter = right_inter = None

    if mask is not None:
        mask_bin = (mask > 127).astype(np.uint8) * 255
        left_inter = find_vertical_intersection(mask_bin, left_ear, h)
        right_inter = find_vertical_intersection(mask_bin, right_ear, h)

        # Si un des points est au-dessus du menton, on l’abaisse juste en dessous
        if left_inter and left_inter[1] < chin[1]:
            left_inter = (left_inter[0], chin[1] + 10)
        if right_inter and right_inter[1] < chin[1]:
            right_inter = (right_inter[0], chin[1] + 10)

    # === Logique conditionnelle progressive ===
    if left_inter and right_inter:
        pass  # Les deux points sont bons
    elif left_inter and left_inter[1] > chin[1]:
        right_inter = (right_ear[0], left_inter[1])  # même horizontale
    elif right_inter and right_inter[1] > chin[1]:
        left_inter = (left_ear[0], right_inter[1])  # même horizontale
    else:
        # Aucun point détecté ou utilisable → fallback
        offset = 15
        left_inter = (left_ear[0], chin[1] + offset)
        right_inter = (right_ear[0], chin[1] + offset)
        print("⚠️ Aucun point d’intersection utilisable, placement par défaut")

    # === Affichage Debug ===
    cv2.circle(image, left_ear, 6, (255, 0, 0), -1)
    cv2.circle(image, right_ear, 6, (0, 255, 0), -1)
    cv2.circle(image, chin, 6, (0, 0, 255), -1)
    if left_inter: cv2.circle(image, left_inter, 6, (255, 255, 0), -1)
    if right_inter: cv2.circle(image, right_inter, 6, (0, 255, 255), -1)

    image = overlay_collar(image, COLLAR_PATH, left_inter, right_inter, chin)
    print(f"✅ Collier placé : {os.path.basename(image_path)}")

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
    test_image = "/home/juve/STAGE_BLUE_REFLET/bleu-reflet-collier-deploy (4)/frontend/public/assets/examples/example2.jpg"
    process_image(test_image, model, OUTPUT_DIR)

    # Affichage du résultat 5 secondes
    import cv2
    import os
    result_path = os.path.join(OUTPUT_DIR, os.path.basename(test_image))
    img = cv2.imread(result_path)
    if img is not None:
        cv2.imshow("Résultat", img)
        cv2.waitKey(5000)
        cv2.destroyAllWindows()
