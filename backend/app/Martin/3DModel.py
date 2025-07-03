import cv2
import mediapipe as mp
import numpy as np
import sys
import traceback

# ==== PyOpenGL imports ====
try:
    from OpenGL.GL import *
    from OpenGL.GLU import *
    from OpenGL.GLUT import *
    OPENGL_AVAILABLE = True
except ImportError as e:
    print("ERREUR: PyOpenGL n'est pas installé ou n'a pas pu être importé.")
    print("Essayez: pip install PyOpenGL PyOpenGL_accelerate")
    print("Exception:", e)
    OPENGL_AVAILABLE = False

# ===========================
# === Configuration globale =
# ===========================
WINDOW_WIDTH  = 1080
WINDOW_HEIGHT = 720

exit_app = False  # Indique si on doit fermer
necklace_pos = [0.0, 0.0, -1.0]  # Position (x,y,z) du collier 3D
necklace_rot = [0.0, 0.0, 0.0]   # Rotation (en degrés) du collier (x,y,z)

# ===========================
# === Mediapipe FaceMesh  ==
# ===========================
try:
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    print("[DEBUG] Mediapipe FaceMesh initialisé.")
except Exception as e:
    print("[ERREUR] Impossible d'initialiser Mediapipe FaceMesh.")
    traceback.print_exc()
    sys.exit(1)

# ===========================
# === Lecture du modèle .obj
# ===========================
def load_obj(filename):
    """Charge un modèle .obj (vertices, faces). Retourne (list_vertices, list_faces)."""
    vertices = []
    faces = []
    try:
        with open(filename, 'r') as f:
            for line in f:
                if line.startswith('v '):
                    parts = line.strip().split()
                    x, y, z = float(parts[1]), float(parts[2]), float(parts[3])
                    vertices.append((x, y, z))
                elif line.startswith('f '):
                    parts = line.strip().split()
                    f1 = int(parts[1].split('/')[0]) - 1
                    f2 = int(parts[2].split('/')[0]) - 1
                    f3 = int(parts[3].split('/')[0]) - 1
                    faces.append((f1, f2, f3))
        print(f"[DEBUG] Modèle {filename} chargé. Nombre de vertices={len(vertices)}, faces={len(faces)}")
    except FileNotFoundError:
        print(f"[ERREUR] Le fichier {filename} est introuvable.")
        traceback.print_exc()
        sys.exit(1)
    except Exception:
        print(f"[ERREUR] Problème lors du chargement du modèle {filename}.")
        traceback.print_exc()
        sys.exit(1)
    return vertices, faces

# ===========================
# === Chargement du collier =
# ===========================
OBJ_VERTICES, OBJ_FACES = load_obj("bleu-reflet-collier/backend/app/Martin/11777_necklace_v1_l3.obj")  # Assure-toi que le fichier est bien présent

# ===========================
# === Fonctions PyOpenGL  ===
# ===========================
def init_gl():
    """Initialise la fenêtre OpenGL."""
    glClearColor(0.1, 0.1, 0.1, 1.0)
    glEnable(GL_DEPTH_TEST)
    print("[DEBUG] init_gl() appelé, OpenGL initialisé.")

def reshape(width, height):
    """Gère le redimensionnement de la fenêtre."""
    glViewport(0, 0, width, height)
    glMatrixMode(GL_PROJECTION)
    glLoadIdentity()
    gluPerspective(45.0, float(width) / float(height), 0.1, 100.0)
    glMatrixMode(GL_MODELVIEW)

def display():
    """Fonction de rendu principal."""
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
    glLoadIdentity()

    # Position de la caméra
    gluLookAt(0, 0, 0,
              0, 0, -1,
              0, 1, 0)

    # Déplacement & rotation du collier
    glTranslatef(necklace_pos[0], necklace_pos[1], necklace_pos[2])
    glRotatef(necklace_rot[0], 1, 0, 0)
    glRotatef(necklace_rot[1], 0, 1, 0)
    glRotatef(necklace_rot[2], 0, 0, 1)

    glColor3f(1.0, 1.0, 1.0)
    glBegin(GL_TRIANGLES)
    for face in OBJ_FACES:
        for idx in face:
            vx, vy, vz = OBJ_VERTICES[idx]
            glVertex3f(vx, vy, vz)
    glEnd()

    glutSwapBuffers()

def idle():
    """Fonction appelée en boucle quand OpenGL est inactif."""
    global exit_app
    if exit_app:
        print("[DEBUG] idle() détecte exit_app=True, on quitte la boucle OpenGL.")
        glutLeaveMainLoop()
    glutPostRedisplay()

def keyboard(key, x, y):
    """Gère la fermeture via la touche échappement."""
    global exit_app
    if key == b'\x1b':  # ESC
        print("[DEBUG] Touche ESC détectée dans la fenêtre OpenGL.")
        exit_app = True

# ===========================
# === Détection Mediapipe  ==
# ===========================
def get_face_landmarks(image):
    """Retourne la liste des landmarks si un visage est détecté, sinon None."""
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_image)
    if results.multi_face_landmarks:
        return results.multi_face_landmarks[0].landmark
    return None

# ===========================
# === Mise à jour du collier
# ===========================
def update_necklace_position(landmarks, image_width, image_height):
    """
    Utilise les landmarks pour mettre à jour la position et la rotation du collier.
    """
    global necklace_pos, necklace_rot

    # Indices possibles (Mediapipe FaceMesh)
    left_ear_idx  = 234
    right_ear_idx = 454
    chin_idx      = 152

    try:
        left_ear  = landmarks[left_ear_idx]
        right_ear = landmarks[right_ear_idx]
        chin      = landmarks[chin_idx]
    except IndexError:
        print("[WARN] Certains indices de landmarks n'existent pas. (Mediapipe pourrait avoir changé.)")
        return

    lx, ly = int(left_ear.x * image_width),  int(left_ear.y * image_height)
    rx, ry = int(right_ear.x * image_width), int(right_ear.y * image_height)
    cx, cy = int(chin.x * image_width),      int(chin.y * image_height)

    dist_ears = np.sqrt((rx - lx) ** 2 + (ry - ly) ** 2)

    # Échelle empirique
    neck_width_3d = dist_ears / 200.0
    neck_height_3d = (cy - ly) / 200.0

    # Position en Z (plus le cou est large, plus on éloigne le modèle)
    necklace_pos[2] = -2.0 - (dist_ears / 100.0)
    necklace_pos[1] = -0.5 - neck_height_3d

    # Calcul de l'angle de rotation (oreille gauche -> oreille droite)
    angle = np.degrees(np.arctan2(ry - ly, rx - lx))
    necklace_rot[2] = angle

# ===========================
# === Boucle principale  ===
# ===========================
def main_loop():
    """
    Lance la capture vidéo OpenCV, détecte les landmarks,
    met à jour la position du collier, tout en maintenant
    la boucle d’affichage OpenGL dans un autre thread.
    """
    print("[DEBUG] main_loop() démarré. Ouverture de la webcam...")
    cap = cv2.VideoCapture(2)  # Webcam 0
    if not cap.isOpened():
        print("[ERREUR] Impossible d'ouvrir la webcam (index=0).")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[WARN] Impossible de lire une frame depuis la webcam.")
            break

        h, w, _ = frame.shape
        landmarks = get_face_landmarks(frame)
        if landmarks:
            update_necklace_position(landmarks, w, h)

        # Affiche un petit overlay dans la fenêtre OpenCV
        cv2.putText(frame, "Press ESC in the OpenGL window to quit.", (10,30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

        cv2.imshow("Webcam - (Appuie sur ESC dans la fenetre OpenGL pour quitter)", frame)
        if cv2.waitKey(1) & 0xFF == 27:
            print("[DEBUG] Touche ESC detectee dans la fenetre OpenCV (optionnel).")
            break

    print("[DEBUG] Fermeture de la capture webcam.")
    cap.release()
    cv2.destroyAllWindows()

def main():
    if not OPENGL_AVAILABLE:
        print("[ERREUR] PyOpenGL n'est pas disponible, on ne peut pas créer la fenetre 3D.")
        sys.exit(1)

    print("[DEBUG] Initialisation GLUT...")
    glutInit(sys.argv)
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH)
    glutInitWindowSize(WINDOW_WIDTH, WINDOW_HEIGHT)
    glutCreateWindow(b"3D Necklace Visualization")

    init_gl()
    glutReshapeFunc(reshape)
    glutDisplayFunc(display)
    glutIdleFunc(idle)
    glutKeyboardFunc(keyboard)

    # On ne veut pas bloquer la boucle OpenGL; on va la faire tourner dans un thread
    import threading

    def opengl_loop():
        try:
            while not exit_app:
                glutMainLoopEvent()  # Traite les evenements OpenGL
        except Exception as e:
            print("[ERREUR] Exception dans la boucle OpenGL:")
            traceback.print_exc()

    t = threading.Thread(target=opengl_loop)
    t.start()

    # Lance la détection Mediapipe + capture webcam
    try:
        main_loop()
    except Exception as e:
        print("[ERREUR] Exception dans la boucle main_loop():")
        traceback.print_exc()

    # Indique à la boucle OpenGL de se terminer
    global exit_app
    exit_app = True
    t.join()
    print("[DEBUG] Programme terminé correctement.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("[ERREUR] Exception inattendue dans main():")
        traceback.print_exc()
        sys.exit(1)
