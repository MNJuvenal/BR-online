#!/bin/bash

echo "🏗️ Construction du frontend React..."

# Aller dans le dossier frontend
cd frontend

# Installer les dépendances
echo "📦 Installation des dépendances NPM..."
npm install

# Builder le frontend
echo "🔨 Build du frontend..."
npm run build

# Vérifier que le build a réussi
if [ -d "dist" ]; then
    echo "✅ Frontend buildé avec succès dans dist/"
    ls -la dist/
else
    echo "❌ Erreur: Le dossier dist n'a pas été créé"
    exit 1
fi

echo "🎉 Frontend prêt pour le déploiement!"
