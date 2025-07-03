#!/bin/bash
echo "🚀 Démarrage avec Gunicorn..."
echo "📁 Répertoire courant: $(pwd)"
echo "🌐 Port: $PORT"
cd backend
gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 120 --access-logfile - --error-logfile - wsgi:app
