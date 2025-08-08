# 📚 Documentation Développeur - BLUEREFLET Necklace App

## 🎯 Vue d'ensemble

Application d'essayage virtuel de colliers utilisant l'intelligence artificielle pour détecter les visages et positionner des colliers en temps réel.

### Technologies utilisées
- **Frontend** : React + TypeScript + Vite + TailwindCSS
- **Backend** : Python Flask + OpenCV + MediaPipe + YOLO
- **Déploiement** : Nginx + PM2 + Gunicorn
- **IA** : MediaPipe (détection faciale) + YOLO (détection d'objets)

---

## 🏗️ Architecture du projet

```
BR-deploy-main/
├── 📂 frontend/               # Interface utilisateur React
│   ├── src/
│   │   ├── components/        # Composants React
│   │   ├── hooks/            # Hooks personnalisés
│   │   └── styles/           # Styles CSS
│   ├── public/assets/        # Assets statiques
│   │   ├── examples/         # Photos de mannequins
│   │   ├── colliers/         # Images de colliers
│   │   └── icons/           # Icônes interface
│   └── dist/                # Build de production
│
├── 📂 backend/               # API Python Flask
│   ├── app/
│   │   ├── app.py           # Application Flask principale
│   │   ├── necklace2D.py    # Logique d'application de colliers
│   │   └── Content/         # Modèles IA (YOLO)
│   └── wsgi.py             # Point d'entrée production
│
├── 📂 data/                 # Données et assets
│   └── usefull_necklace/   # Colliers par défaut
│
├── 📂 scripts/             # Scripts utilitaires
│   └── rename_assets.py    # Renommage automatique des assets
│
├── 📂 docs/               # Documentation
├── 📂 logs/              # Logs de production
│
├── 🔧 restart_local.sh    # Script de redémarrage développement
├── 🚀 restart_production.sh # Script de déploiement production
├── 🧹 clean_project.sh    # Script de nettoyage pour GitLab
└── ⚙️ ecosystem.config.js # Configuration PM2
```

---

## 🚀 Installation et Configuration

### Prérequis
- **Node.js** ≥ 18.0
- **Python** ≥ 3.8
- **Git**
- **Nginx** (pour la production)

### 1. Cloner le projet
```bash
git clone <votre-repo>
cd BR-deploy-main
```

### 2. Configuration Backend
```bash
cd backend/app

# Installer les dépendances Python
pip install -r requirements.txt

# Variables d'environnement de développement
export FLASK_ENV=development
export FORCE_DEV=true
```

### 3. Configuration Frontend
```bash
cd frontend

# Installer les dépendances Node.js
npm install

# Copier les variables d'environnement
cp .env.example .env.local
```

---

## 🔧 Développement Local

### Scripts de gestion automatisés

#### 🔄 Script de redémarrage local
```bash
# Redémarrage automatique en développement
./restart_local.sh
```

**Fonctionnalités :**
- Arrêt automatique des processus existants (ports 5000/8000)
- Configuration des variables d'environnement de développement
- Vérification de la structure des fichiers
- Démarrage de Flask en mode développement
- Tests automatiques des endpoints `/api/health` et `/api/scan-assets`
- Affichage du PID pour arrêt manuel

#### 🚀 Script de redémarrage production
```bash
# Redémarrage en production avec PM2
./restart_production.sh
```

**Fonctionnalités :**
- Arrêt des processus PM2 existants
- Build automatique du frontend
- Copie des fichiers vers `/var/www/necklace-frontend/`
- Démarrage via PM2 avec configuration production
- Rechargement de Nginx
- Tests des endpoints en production

### Démarrage manuel

#### Terminal 1 - Backend
```bash
cd backend/app
export FORCE_DEV=true
python3 app.py
# ➜ Backend sur http://localhost:5000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
# ➜ Frontend sur http://localhost:5173
```

### Configuration Vite (Proxy API)

Le fichier `frontend/vite.config.ts` configure automatiquement le proxy :

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

---

## 🧠 Fonctionnalités IA

### 1. Détection faciale (MediaPipe)
- **Localisation** : `frontend/src/components/PhotoTestView.tsx`
- **Fonction** : `detectLandmarks()`
- **Points détectés** : Oreilles, menton, épaules (estimées)

```typescript
const LANDMARK_INDICES = {
  left_ear: 234,    // Oreille gauche
  right_ear: 454,   // Oreille droite
  chin: 175,        // Menton
};
```

### 2. Application de colliers (YOLO + OpenCV)
- **Localisation** : `backend/app/necklace2D.py`
- **Modèle** : `backend/app/Content/model_vf4.pt`
- **Traitement** : Redimensionnement, rotation, ombrage automatique

### 3. Ajustement automatique de luminosité
```python
def adjustNecklaceBrightness(imageBrightness):
    """
    Ajuste la luminosité du collier selon l'éclairage de l'image
    """
    if imageBrightness < 0.2:
        return 1.6 + (0.2 - imageBrightness) * 3  # Éclaircir
    elif imageBrightness > 0.8:
        return 0.8 - (imageBrightness - 0.8) * 1.5  # Assombrir
    return 1  # Éclairage optimal
```

---

## 📡 API Backend

### Endpoints principaux

#### `GET /api/health`
Vérification de l'état du serveur
```json
{
  "status": "OK",
  "necklace_found": true,
  "necklace_path": "/path/to/necklace.png"
}
```

#### `GET /api/scan-assets`
Scan des assets disponibles
```json
{
  "examples": [...],
  "colliers": [...],
  "total_examples": 7,
  "total_colliers": 10,
  "scan_info": {
    "mode": "development|production-nginx-auto",
    "examples_path": "frontend/public/assets/examples",
    "nginx_detected": false
  }
}
```

#### `POST /api/apply-necklace`
Application d'un collier sur une image

**Paramètres :**
- `image`: Fichier image
- `necklace`: Nom du fichier collier
- `brightness`: Ajustement luminosité (float)
- `landmarks`: Points faciaux (JSON)

**Réponse :** Image JPEG avec collier appliqué

---

## 🎨 Frontend - Composants

### PhotoTestView.tsx (Principal)
Composant principal d'essayage virtuel

**États principaux :**
```typescript
const [image, setImage] = useState<string | null>(null);
const [processedImage, setProcessedImage] = useState<string | null>(null);
const [selectedNecklace, setSelectedNecklace] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);
```

**Fonctions clés :**
- `processImage()` : Lance l'analyse IA
- `detectLandmarks()` : Détection faciale MediaPipe
- `calculateImageBrightness()` : Analyse luminosité
- `saveImage()` : Téléchargement résultat

### useAssets.ts (Hook)
Gestion dynamique des assets

```typescript
export const useAssets = () => {
  const [assets, setAssets] = useState<AssetsData>({
    examples: [],
    colliers: [],
    total_examples: 0,
    total_colliers: 0
  });

  const fetchAssets = async () => {
    const response = await fetch('/api/scan-assets');
    const data = await response.json();
    setAssets(data);
  };

  return { assets, loading, error, refetch: fetchAssets };
};
```

---

## 🔄 Gestion des Assets

### Détection automatique d'environnement

Le backend détecte automatiquement l'environnement :

1. **Production (nginx)** : `/var/www/necklace-frontend/dist/assets`
2. **Production (local)** : `frontend/dist/assets`
3. **Développement** : `frontend/public/assets`

```python
# Variables d'environnement
PRODUCTION_ASSETS_PATH="/custom/path"  # Chemin personnalisé
FORCE_DEV="true"                       # Force mode développement
```

### Refresh des assets
```typescript
// Frontend - Actualisation dynamique
const { refetch } = useAssets();
await refetch(); // Recharge la liste
```

### Script de renommage
```bash
cd scripts
python3 rename_assets.py
# ➜ Renomme automatiquement : example1.jpg, collier1.png, etc.
```

---

## 🚀 Déploiement Production

### 1. Build Frontend
```bash
cd frontend
npm run build
# ➜ Génère frontend/dist/
```

### 2. Configuration Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    client_max_body_size 20M;
    root /var/www/necklace-frontend/dist;

    # Frontend SPA
    location / {
        try_files $uri /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Configuration PM2
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: "backend",
    script: "gunicorn",
    args: "wsgi:app -w 3 -b 127.0.0.1:8000",
    cwd: "/path/to/backend",
    env_production: {
      NODE_ENV: "production",
      PRODUCTION_ASSETS_PATH: "/var/www/necklace-frontend/dist/assets"
    }
  }]
}
```

### 4. Déploiement
```bash
# Copier les fichiers
sudo cp -r frontend/dist/* /var/www/necklace-frontend/dist/

# Démarrer les services
pm2 start ecosystem.config.js --env production
sudo systemctl reload nginx
```

---

## 🛠️ Scripts Utilitaires

### restart_local.sh - Développement
Script complet pour redémarrer l'application en mode développement local.

```bash
# Utilisation
chmod +x restart_local.sh
./restart_local.sh
```

**Actions automatiques :**
1. **Nettoyage des processus** : Arrêt de tous les processus Python/Flask
2. **Libération des ports** : Force l'arrêt des ports 5000/8000
3. **Variables d'environnement** : Configuration automatique pour le développement
4. **Vérifications** : Structure des fichiers et routes API
5. **Démarrage Flask** : Lancement sur http://localhost:5000
6. **Tests endpoints** : Vérification automatique des API
7. **Informations debug** : Affichage du PID et processus actifs

### restart_production.sh - Production
Script de déploiement automatisé pour la production avec PM2.

```bash
# Utilisation
sudo ./restart_production.sh
```

**Actions automatiques :**
1. **Arrêt PM2** : Stop des applications existantes
2. **Build frontend** : `npm run build` automatique
3. **Déploiement fichiers** : Copie vers `/var/www/necklace-frontend/`
4. **Démarrage PM2** : Configuration production avec ecosystem.config.js
5. **Reload Nginx** : Rechargement de la configuration
6. **Tests production** : Vérification des endpoints publics

### clean_project.sh - Nettoyage
Script de nettoyage pour préparer le push GitLab.

```bash
# Utilisation
chmod +x clean_project.sh
./clean_project.sh
```

**Supprime automatiquement :**
- Dossiers `node_modules/`, `dist/`, `build/`
- Cache Python `__pycache__/`, `.pyc`
- Logs temporaires et fichiers de debug
- Sauvegardes et fichiers système

### Scripts de développement rapide

#### start_dev.sh - Démarrage complet
```bash
#!/bin/bash
# Démarre frontend + backend en parallèle
./start_backend_dev.sh &
./start_frontend_dev.sh &
wait
```

#### start_backend_dev.sh - Backend seul
```bash
#!/bin/bash
cd backend/app
export FORCE_DEV=true
python3 app.py
```

#### start_frontend_dev.sh - Frontend seul
```bash
#!/bin/bash
cd frontend
npm run dev
```

---

## 🧪 Tests et Debug

### Vérification Backend
```bash
# Test direct API
curl http://localhost:5000/api/health
curl http://localhost:5000/api/scan-assets

# En production
curl http://yourdomain.com/api/health
```

### Debug Frontend
```typescript
// Console logs automatiques dans useAssets
console.log("✅ Assets chargés:", {
  examples: data.total_examples,
  colliers: data.total_colliers,
  mode: data.scan_info?.mode
});
```

### Logs Production
```bash
# PM2 logs
pm2 logs backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔧 Configuration Avancée

### Variables d'environnement

#### Backend
```bash
# Développement
export FLASK_ENV=development
export FORCE_DEV=true

# Production
export NODE_ENV=production
export PRODUCTION_ASSETS_PATH=/custom/path
export FLASK_ENV=production
```

#### Frontend
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:5000
VITE_ENABLE_DEBUG=true
```

### Optimisations Performance

#### Frontend
```typescript
// Lazy loading des composants
const PhotoTestView = lazy(() => import('./components/PhotoTestView'));

// Optimisation MediaPipe
const faceMesh = new FaceMesh({
  maxNumFaces: 1,           // Une seule personne
  refineLandmarks: true,    // Précision élevée
  minDetectionConfidence: 0.5
});
```

#### Backend
```python
# Cache des modèles IA
@lru_cache(maxsize=1)
def load_yolo_model():
    return YOLO("model_vf4.pt")

# Optimisation images
cv2.setNumThreads(4)  # Multi-threading OpenCV
```

---

## 🐛 Problèmes Courants

### 1. Erreur 404 sur /api/scan-assets
**Cause :** Configuration nginx incorrecte
**Solution :**
```nginx
# Corriger le proxy_pass
location /api/ {
    proxy_pass http://127.0.0.1:8000/api/;  # Avec /api/ à la fin
}
```

### 2. MediaPipe non chargé
**Cause :** Scripts CDN non accessibles
**Solution :**
```html
<!-- Vérifier dans index.html -->
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"></script>
```

### 3. Assets non trouvés
**Cause :** Chemin incorrect
**Debug :**
```bash
# Vérifier les chemins
curl http://localhost:5000/api/scan-assets
# Regarder scan_info.examples_path
```

### 4. Collier mal positionné
**Cause :** Landmarks incorrects
**Debug :**
```typescript
console.log("🎯 Landmarks détectés:", landmarks);
// Vérifier left_ear, right_ear, chin
```

---

## 📈 Monitoring et Performance

### Métriques importantes
- **Temps de traitement IA** : ~2-5 secondes
- **Taille max upload** : 20MB (nginx)
- **Mémoire backend** : ~200-500MB
- **Précision détection** : >85% (visage frontal)

### Monitoring
```bash
# Ressources système
pm2 monit

# Performance réseau
curl -w "%{time_total}" http://localhost/api/health
```

---

## 🤝 Contribution

### Workflow Git
```bash
# Créer une branche feature
git checkout -b feature/nouvelle-fonctionnalite

# Développer et tester
npm run test
python -m pytest backend/tests/

# Commit et push
git add .
git commit -m "feat: description de la feature"
git push origin feature/nouvelle-fonctionnalite
```

### Standards de code

#### TypeScript/React
```typescript
// Composants en PascalCase
const PhotoTestView: React.FC = () => { };

// Hooks en camelCase avec "use"
const useAssets = () => { };

// Props typées
interface Props {
  onImageSelect: (image: string) => void;
}
```

#### Python
```python
# PEP 8 compliance
def apply_necklace(image_path: str, necklace_path: str) -> Tuple[np.ndarray, str]:
    """
    Applique un collier sur une image.
    
    Args:
        image_path: Chemin vers l'image
        necklace_path: Chemin vers le collier
        
    Returns:
        Tuple contenant l'image traitée et le statut
    """
    pass
```

---

## 📞 Support

### Logs utiles
```bash
# Backend
tail -f logs/backend-combined.log

# Frontend (développement)
# Ouvrir DevTools > Console

# Nginx
sudo tail -f /var/log/nginx/error.log
```

### Commandes de diagnostic
```bash
# Vérifier les services
pm2 status
sudo systemctl status nginx

# Tester l'API
curl -v http://localhost/api/health

# Vérifier les assets
ls -la frontend/public/assets/examples/
ls -la frontend/public/assets/colliers/
```

---

## 🔮 Roadmap

### Prochaines fonctionnalités
- [ ] Support multi-colliers
- [ ] Mode réalité augmentée
- [ ] API de recommandation IA
- [ ] Interface d'administration
- [ ] Cache Redis pour performances
- [ ] Tests automatisés complets

### Améliorations techniques
- [ ] Migration vers TypeScript backend
- [ ] Containerisation Docker
- [ ] CI/CD GitLab
- [ ] Monitoring Prometheus
- [ ] CDN pour les assets

---

*Documentation mise à jour le 7 août 2025*
*Version du projet : 1.0.0*

**Pour toute question technique :**
- 📧 Créer une issue sur GitLab
- 📚 Consulter les logs de débogage
- 🔧 Utiliser les outils de diagnostic fournis
