import cv2

collier_path = r'C:\Users\Alexi\OneDrive\Bureau\bleu-reflet-collier\data\raw\GDrive\Necks\1988.jpg'  # Remplacez par le chemin exact
image = cv2.imread(collier_path, cv2.IMREAD_UNCHANGED)

if image is None:
    print("L'image n'a pas été trouvée ou le chemin est incorrect.")
else:
    print("L'image a été chargée avec succès.")
