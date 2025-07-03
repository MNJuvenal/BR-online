#!/bin/bash

# Script de build et déploiement Docker pour Bleu Reflet

echo "🔨 Construction de l'image Docker..."

# Build de l'image
docker build -t bleu-reflet-backend:latest .

if [ $? -eq 0 ]; then
    echo "✅ Image construite avec succès!"
    
    echo "🚀 Démarrage du conteneur..."
    
    # Arrêter le conteneur existant s'il existe
    docker stop bleu-reflet-container 2>/dev/null || true
    docker rm bleu-reflet-container 2>/dev/null || true
    
    # Démarrer le nouveau conteneur
    docker run -d \
        --name bleu-reflet-container \
        -p 8080:8080 \
        bleu-reflet-backend:latest
    
    if [ $? -eq 0 ]; then
        echo "✅ Conteneur démarré sur le port 8080"
        echo "🌐 Application accessible sur: http://localhost:8080"
        echo "❤️  Health check: http://localhost:8080/health"
    else
        echo "❌ Erreur lors du démarrage du conteneur"
        exit 1
    fi
else
    echo "❌ Erreur lors de la construction de l'image"
    exit 1
fi
