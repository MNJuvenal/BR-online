import sys
import os

# Ajouter le dossier app au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import app

if __name__ == "__main__":
    app.run()
