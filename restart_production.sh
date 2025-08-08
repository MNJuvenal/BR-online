#!/bin/bash

echo "🔄 Redémarrage de l'application en production avec PM2..."

# 1. Arrêter l'application PM2
echo "⏹️ Arrêt de l'application backend via PM2..."
pm2 stop backend || true
pm2 delete backend || true

# 2. Attendre que le processus s'arrête complètement
sleep 2

# 3. Vérifier qu'aucun processus gunicorn n'est encore actif sur le port 8000
echo "🔍 Vérification du port 8000..."
if lsof -ti:8000; then
    echo "⚠️ Un processus utilise encore le port 8000, tentative d'arrêt forcé..."
    sudo kill -9 $(lsof -ti:8000) || true
    sleep 1
fi

# 4. Configurer les variables d'environnement pour PM2
echo "🔧 Configuration des variables d'environnement..."
export PRODUCTION_ASSETS_PATH="/var/www/necklace-frontend/dist/assets"
export NODE_ENV="production"
export FLASK_ENV="production"

# 5. Redémarrer l'application avec PM2
echo "🚀 Redémarrage du backend via PM2..."
cd /home/ubuntu/necklace
pm2 start ecosystem.config.js --env production

# 6. Attendre le démarrage
sleep 5

# 7. Afficher le statut PM2
echo "📊 Statut PM2:"
pm2 status

# 8. Afficher les logs récents
echo "📝 Logs récents du backend:"
pm2 logs backend --lines 10 --nostream

# 8. Afficher les logs récents
echo "📝 Logs récents du backend:"
pm2 logs backend --lines 10 --nostream

# 9. Tester les endpoints
echo "✅ Test des endpoints..."
echo "Health check (direct):"
curl -s http://localhost:8000/api/health | head -c 200
echo -e "\n"

echo "Scan assets (direct):"
curl -s http://localhost:8000/api/scan-assets | head -c 200
echo -e "\n"

echo "Health check (via nginx):"
curl -s http://localhost/api/health | head -c 200
echo -e "\n"

echo "Scan assets (via nginx):"
curl -s http://localhost/api/scan-assets | head -c 200
echo -e "\n"

echo "🎉 Redémarrage terminé!"
echo "💡 Pour voir les logs en temps réel: pm2 logs backend"
echo "💡 Pour le statut: pm2 status"
echo "💡 Pour redémarrer: pm2 restart backend"
