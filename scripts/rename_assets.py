#!/usr/bin/env python3
"""
Script pour renommer automatiquement les images dans les dossiers examples et colliers
Usage: python rename_assets.py
"""

import os
import shutil
from pathlib import Path

def get_image_extensions():
    """Extensions d'images supportées"""
    return ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif']

def rename_files_in_directory(directory_path, prefix, start_index=1):
    """
    Renomme tous les fichiers d'images dans un dossier avec un préfixe et un index
    
    Args:
        directory_path: Chemin vers le dossier
        prefix: Préfixe pour les nouveaux noms (ex: "example", "collier")
        start_index: Index de départ (par défaut 1)
    
    Returns:
        Liste des fichiers renommés
    """
    if not os.path.exists(directory_path):
        print(f"❌ Dossier {directory_path} n'existe pas")
        return []
    
    # Obtenir tous les fichiers d'images
    image_extensions = get_image_extensions()
    image_files = []
    
    for file in os.listdir(directory_path):
        file_path = os.path.join(directory_path, file)
        if os.path.isfile(file_path):
            _, ext = os.path.splitext(file.lower())
            if ext in image_extensions:
                image_files.append(file)
    
    # Trier par nom pour avoir un ordre cohérent
    image_files.sort()
    
    renamed_files = []
    index = start_index
    
    print(f"📁 Traitement du dossier: {directory_path}")
    print(f"🖼️ {len(image_files)} images trouvées")
    
    for old_filename in image_files:
        old_path = os.path.join(directory_path, old_filename)
        _, ext = os.path.splitext(old_filename.lower())
        
        # Nouveau nom avec préfixe et index
        new_filename = f"{prefix}{index}{ext}"
        new_path = os.path.join(directory_path, new_filename)
        
        # Renommer seulement si le nom est différent
        if old_filename != new_filename:
            try:
                # Vérifier si le fichier de destination existe déjà
                if os.path.exists(new_path):
                    print(f"⚠️ {new_filename} existe déjà, on passe")
                else:
                    shutil.move(old_path, new_path)
                    print(f"✅ {old_filename} → {new_filename}")
                    renamed_files.append(new_filename)
            except Exception as e:
                print(f"❌ Erreur lors du renommage de {old_filename}: {e}")
        else:
            print(f"✓ {old_filename} déjà bien nommé")
            renamed_files.append(new_filename)
        
        index += 1
    
    return renamed_files

def main():
    """Fonction principale"""
    print("🔄 Démarrage du renommage automatique des assets...")
    
    # Chemin vers les dossiers
    project_root = Path(__file__).parent.parent
    examples_dir = project_root / "frontend" / "public" / "assets" / "examples"
    colliers_dir = project_root / "frontend" / "public" / "assets" / "colliers"
    
    print(f"📂 Dossier du projet: {project_root}")
    
    # Renommer les mannequins (examples)
    print("\n🧍 === MANNEQUINS ===")
    examples_files = rename_files_in_directory(str(examples_dir), "example", 1)
    
    # Renommer les colliers
    print("\n💎 === COLLIERS ===")
    colliers_files = rename_files_in_directory(str(colliers_dir), "collier", 1)
    
    # Résumé
    print(f"\n📊 === RÉSUMÉ ===")
    print(f"✅ {len(examples_files)} mannequins traités")
    print(f"✅ {len(colliers_files)} colliers traités")
    
    # Générer un fichier de configuration pour le frontend
    config = {
        "examples": examples_files,
        "colliers": colliers_files,
        "last_update": "2025-08-07"
    }
    
    config_path = project_root / "frontend" / "src" / "assets_config.json"
    
    import json
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Configuration sauvegardée dans: {config_path}")
    print("🎉 Renommage terminé !")

if __name__ == "__main__":
    main()
