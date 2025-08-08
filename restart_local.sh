#!/bin/bash

echo "🔄 Redémarrage de l'application en LOCAL..."

# 1. Arrêter tous les processus python/flask sur le port 5000 ou 8000
echo "⏹️ Arrêt des processus existants..."
sudo pkill -f "python.*app.py" || true
sudo pkill -f "flask" || true
sudo pkill -f "gunicorn" || true
sleep 2

# 2. Vérifier les ports
echo "🔍 Vérification des ports..."
if lsof -ti:5000; then
    echo "⚠️ Port 5000 encore utilisé, arrêt forcé..."
    sudo kill -9 $(lsof -ti:5000) || true
fi
if lsof -ti:8000; then
    echo "⚠️ Port 8000 encore utilisé, arrêt forcé..."
    sudo kill -9 $(lsof -ti:8000) || true
fi

# 3. Aller dans le répertoire backend local
echo "📁 Navigation vers le répertoire backend local..."
cd /home/juve/STAGE_BLUE_REFLET/A/bleu-reflet-necklaces/BR-deploy-main/backend/app

# 4. Configurer les variables d'environnement pour le développement
echo "🔧 Configuration des variables d'environnement LOCAL..."
export FLASK_ENV="development"
export FLASK_DEBUG="1"
export FORCE_DEV="true"  # Force le mode développement

# 5. Vérifier la structure des fichiers
echo "🔍 Vérification de la structure locale..."
if [ ! -f "app.py" ]; then
    echo "❌ Fichier app.py non trouvé dans $(pwd)"
    echo "Contenu du répertoire:"
    ls -la
    exit 1
fi

# 6. Vérifier les routes dans app.py
echo "🔍 Vérification des routes..."
if grep -q "/api/scan-assets" app.py; then
    echo "✅ Route /api/scan-assets trouvée"
else
    echo "❌ Route /api/scan-assets non trouvée"
fi

# 7. Démarrer Flask en mode développement
echo "🚀 Démarrage de Flask en mode développement..."
echo "📍 Répertoire courant: $(pwd)"
echo "🌐 Démarrage sur http://localhost:5000"

# Option 1: Flask en mode développement direct
python3 app.py &
FLASK_PID=$!

# Attendre le démarrage
echo "⏳ Attente du démarrage (5 secondes)..."
sleep 5

# 8. Tester les endpoints
echo "✅ Test des endpoints locaux..."

echo "Health check (direct sur port 5000):"
curl -s -w "\nStatus: %{http_code}\n" http://localhost:5000/api/health | head -c 300
echo -e "\n"

echo "Scan assets (direct sur port 5000):"
curl -s -w "\nStatus: %{http_code}\n" http://localhost:5000/api/scan-assets | head -c 300
echo -e "\n"

# 9. Afficher les informations de debug
echo "🔧 Informations de debug:"
echo "PID Flask: $FLASK_PID"
echo "📊 Processus actifs:"
ps aux | grep -E "(python|flask)" | grep -v grep

echo "🎉 Démarrage local terminé!"
echo "💡 L'application tourne sur http://localhost:5000"
echo "💡 Pour arrêter: kill $FLASK_PID"
echo "💡 Ou utilisez Ctrl+C dans ce terminal"

# Garder le script actif
echo "🔄 Application en cours d'exécution... Appuyez sur Ctrl+C pour arrêter"
wait $FLASK_PID
