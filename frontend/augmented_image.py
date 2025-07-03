import cv2
import numpy as np
import os
from PIL import Image, ImageEnhance

def process_necklace_image(input_path, output_dir, angle, translation, index, target_size=(800, 800)):
    """
    Traite une image de collier avec une rotation et translation spécifiques.
    """
    try:
        # Charger l'image avec PIL
        image = Image.open(input_path)
        
        # Convertir en RGBA si ce n'est pas déjà le cas
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        # Redimensionner l'image en conservant les proportions
        image.thumbnail(target_size, Image.Resampling.LANCZOS)
        
        # Créer une nouvelle image avec fond transparent
        new_image = Image.new('RGBA', target_size, (0, 0, 0, 0))
        
        # Calculer la position pour centrer l'image avec la translation
        x = (target_size[0] - image.size[0]) // 2 + int(translation[0] * index)
        y = (target_size[1] - image.size[1]) // 2 + int(translation[1] * index)
        
        # Coller l'image centrée
        new_image.paste(image, (x, y), image)
        
        # Améliorer le contraste et la netteté
        enhancer = ImageEnhance.Contrast(new_image)
        new_image = enhancer.enhance(1.2)
        
        enhancer = ImageEnhance.Sharpness(new_image)
        new_image = enhancer.enhance(1.1)

        # Rotation de l'image
        rotated = new_image.rotate(angle * index, expand=True, resample=Image.Resampling.BICUBIC)
        
        # Créer une nouvelle image avec fond transparent pour la rotation
        final_size = (int(target_size[0] * 1.5), int(target_size[1] * 1.5))  # Plus grand pour éviter le rognage
        final_image = Image.new('RGBA', final_size, (0, 0, 0, 0))
        
        # Centrer l'image rotée
        paste_x = (final_size[0] - rotated.size[0]) // 2
        paste_y = (final_size[1] - rotated.size[1]) // 2
        final_image.paste(rotated, (paste_x, paste_y), rotated)
        
        # Redimensionner à la taille cible
        final_image = final_image.resize(target_size, Image.Resampling.LANCZOS)
        
        # Sauvegarder l'image avec le nouveau numéro
        output_path = os.path.join(output_dir, f'soo-{index:04d}-Photoroom.png')
        final_image.save(output_path, 'PNG', optimize=True)
        print(f"Image générée (angle {angle * index:.1f}°) : {output_path}")
        
    except Exception as e:
        print(f"Erreur lors du traitement de l'image {input_path}: {str(e)}")

def process_all_necklaces():
    """
    Génère une nouvelle séquence d'images avec un angle progressif de -150.5 degrés.
    """
    # Chemins absolus
    current_dir = os.path.dirname(os.path.abspath(__file__))
    input_dir = os.path.join(current_dir, "src", "assets", "raw_images")
    output_dir = os.path.join(current_dir, "src", "assets", "processed_images")
    
    print(f"Dossier d'entrée : {input_dir}")
    print(f"Dossier de sortie : {output_dir}")
    
    # Créer le dossier de sortie s'il n'existe pas
    os.makedirs(output_dir, exist_ok=True)
    
    # Image de base à utiliser
    base_image = "soo-0000-Photoroom.png"
    input_path = os.path.join(input_dir, base_image)
    
    if not os.path.exists(input_path):
        print(f"Erreur : L'image de base n'existe pas : {input_path}")
        return
    
    # Paramètres de transformation
    angle_increment = -150.5 / 10  # Angle entre chaque image
    translation = (-0.14 * 20, -0.08 * 20)  # Vecteur de translation multiplié pour plus d'effet
    
    print("\nDébut de la génération des nouvelles images...")
    # Générer 10 nouvelles images (de 0011 à 0020)
    for i in range(10):
        index = i + 11  # Commencer à 11
        print(f"\nGénération de l'image {index}...")
        process_necklace_image(input_path, output_dir, angle_increment, translation, i + 1)

if __name__ == "__main__":
    print("Démarrage du traitement des images...")
    process_all_necklaces()
    print("\nTraitement terminé. Vérifiez le dossier processed_images pour les résultats.")
