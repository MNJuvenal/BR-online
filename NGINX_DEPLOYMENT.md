# Configuration Nginx - Déploiement Production

## 📋 Configuration actuelle

Votre configuration nginx :
```nginx
server {
    listen 80;
    server_name 54.36.189.250;
    client_max_body_size 20M;
    root /var/www/necklace-frontend/dist;
    index index.html;

    # Frontend (SPA)
    location / {
        try_files $uri /index.html;
    }

    # API Flask via Gunicorn
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🚀 Déploiement automatique avec détection nginx

Le backend détecte maintenant automatiquement l'environnement nginx selon cette priorité :

### 1. **Variable d'environnement (Recommandé)**
```bash
export PRODUCTION_ASSETS_PATH="/var/www/necklace-frontend/dist/assets"
```

### 2. **Auto-détection nginx**
Le système cherche automatiquement dans ces dossiers :
- `/var/www/necklace-frontend/dist/assets` ⭐ (votre config)
- `/var/www/html/dist/assets`
- `/var/www/html/assets`
- `/var/www/assets`
- `/srv/www/assets`

### 3. **Fallback local**
- `frontend/dist/assets` (si présent)
- `frontend/public/assets` (développement)

## 📦 Script de déploiement

Créez ce script pour automatiser le déploiement :

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Déploiement Necklace App..."

# 1. Arrêter les services
echo "⏹️ Arrêt des services..."
sudo systemctl stop gunicorn-necklace || true
sudo systemctl stop nginx || true

# 2. Build du frontend
echo "🔨 Build du frontend..."
cd frontend
npm install
npm run build

# 3. Copier vers nginx
echo "📁 Copie vers nginx..."
sudo rm -rf /var/www/necklace-frontend/dist/*
sudo cp -r dist/* /var/www/necklace-frontend/dist/
sudo chown -R www-data:www-data /var/www/necklace-frontend/

# 4. Configurer les variables d'environnement pour le backend
echo "🔧 Configuration backend..."
sudo tee /etc/systemd/system/gunicorn-necklace.service > /dev/null <<EOF
[Unit]
Description=Gunicorn instance to serve Necklace App
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/your/backend
Environment="PRODUCTION_ASSETS_PATH=/var/www/necklace-frontend/dist/assets"
Environment="NODE_ENV=production"
Environment="FLASK_ENV=production"
ExecStart=/usr/local/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 5. Redémarrer les services
echo "🔄 Redémarrage des services..."
sudo systemctl daemon-reload
sudo systemctl enable gunicorn-necklace
sudo systemctl start gunicorn-necklace
sudo systemctl start nginx

# 6. Vérification
echo "✅ Vérification du déploiement..."
curl -f http://localhost/api/health || echo "❌ Backend non accessible"
curl -f http://localhost/ || echo "❌ Frontend non accessible"
curl -f http://localhost/api/scan-assets || echo "❌ Assets non accessibles"

echo "🎉 Déploiement terminé!"
```

## 🔍 Vérification du déploiement

### Vérifier que les assets sont détectés :
```bash
# Test de l'API de scan (NOUVELLE URL)
curl http://54.36.189.250/api/scan-assets

# Devrait retourner quelque chose comme :
{
  "scan_info": {
    "mode": "production-nginx-auto",
    "examples_path": "/var/www/necklace-frontend/dist/assets/examples",
    "nginx_detected": true
  }
}
```

### **🚨 Important** : Toutes les routes API doivent commencer par `/api/`

Pour que nginx fasse correctement le proxy vers Flask, toutes vos routes backend doivent être préfixées par `/api/` :

- ✅ `/api/scan-assets` → Proxied vers Flask
- ✅ `/api/apply-necklace` → Proxied vers Flask  
- ✅ `/api/health` → Proxied vers Flask
- ❌ `/scan-assets` → Servi par nginx comme fichier frontend

### Vérifier les logs du backend :
```bash
sudo journalctl -u gunicorn-necklace -f
```

Vous devriez voir :
```
🌐 Assets nginx détectés dans: /var/www/necklace-frontend/dist/assets
🌐 Mode nginx auto-détecté : scan depuis /var/www/necklace-frontend/dist/assets
```

## 🛠️ Structure des fichiers

Assurez-vous que votre structure est correcte :

```
/var/www/necklace-frontend/dist/
├── index.html
├── assets/
│   ├── examples/          # Modèles/mannequins
│   │   ├── model1.jpg
│   │   └── model2.jpg
│   ├── colliers/          # Colliers disponibles
│   │   ├── collier1.png
│   │   └── collier2.png
│   └── icons/             # Icônes interface
└── static/                # Autres assets Vite
```

## 🔧 Variables d'environnement disponibles

```bash
# Forcer un chemin spécifique
export PRODUCTION_ASSETS_PATH="/var/www/necklace-frontend/dist/assets"

# Forcer le mode développement (pour debug)
export FORCE_DEV="true"

# Mode production
export NODE_ENV="production"
export FLASK_ENV="production"
```

## ⚠️ Dépannage

### 1. Assets non trouvés
```bash
# Vérifier les permissions
ls -la /var/www/necklace-frontend/dist/assets/
sudo chown -R www-data:www-data /var/www/necklace-frontend/
```

### 2. API non accessible
```bash
# Vérifier gunicorn
sudo systemctl status gunicorn-necklace
sudo journalctl -u gunicorn-necklace --no-pager -l
```

### 3. Forcer le mode développement temporairement
```bash
export FORCE_DEV="true"
sudo systemctl restart gunicorn-necklace
```

### 4. Debug nginx routing
```bash
# Tester les routes directement
curl -v http://54.36.189.250/api/health
curl -v http://54.36.189.250/api/scan-assets
curl -v http://54.36.189.250/api/apply-necklace

# Vérifier les logs nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 5. Routes API corrigées
Toutes les routes API Flask utilisent maintenant le préfixe `/api/` :
- ✅ `/api/health`
- ✅ `/api/apply-necklace` 
- ✅ `/api/scan-assets`

Le système va maintenant détecter automatiquement votre configuration nginx et utiliser `/var/www/necklace-frontend/dist/assets` pour les assets !
