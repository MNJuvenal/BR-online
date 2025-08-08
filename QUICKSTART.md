# 🚀 Guide de Démarrage Rapide - BLUEREFLET

## ⚡ Lancement en 5 minutes

### 1. Prérequis
- Node.js ≥ 18
- Python ≥ 3.8
- Git

### 2. Installation
```bash
# Cloner et installer
git clone <votre-repo>
cd BR-deploy-main

# Backend
cd backend/app
pip install -r requirements.txt

# Frontend  
cd ../../frontend
npm install
```

### 3. Démarrage développement

#### Option A : Script automatisé (Recommandé)
```bash
# Redémarrage complet en développement
chmod +x restart_local.sh
./restart_local.sh
# ➜ Backend: http://localhost:5000
# ➜ Tests automatiques des endpoints
```

#### Option B : Démarrage manuel

#### Terminal 1 - Backend
```bash
cd backend/app
export FORCE_DEV=true
python3 app.py
# ➜ http://localhost:5000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev  
# ➜ http://localhost:5173
```

### 4. Test
1. Ouvrir http://localhost:5173
2. Cliquer "Commencer"
3. Choisir un mannequin ou uploader une photo
4. Sélectionner un collier
5. Cliquer "Commencer" pour voir le résultat

## 🔧 Commands utiles

### Développement
```bash
# Restart complet local
./restart_local.sh

# Vérifier l'API
curl http://localhost:5000/api/health

# Voir les assets
curl http://localhost:5000/api/scan-assets
```

### Production
```bash
# Déploiement production complet
sudo ./restart_production.sh

# Build manuel frontend
cd frontend && npm run build

# Test production
curl http://yourdomain.com/api/health
```

### Nettoyage
```bash
# Nettoyer avant push GitLab
chmod +x clean_project.sh
./clean_project.sh
```

## 📁 Structure minimale

```
BR-deploy-main/
├── frontend/
│   ├── src/components/PhotoTestView.tsx  # Interface principale
│   ├── src/hooks/useAssets.ts           # Gestion assets
│   └── public/assets/                   # Images (examples + colliers)
├── backend/app/
│   ├── app.py                          # API Flask
│   └── necklace2D.py                   # IA colliers
└── README_DEV.md                       # Documentation complète
```

## 🐛 Problèmes courants

**❌ 404 sur /api/scan-assets**
```bash
# Vérifier que le backend tourne
curl http://localhost:5000/api/health
```

**❌ MediaPipe non chargé**
→ Attendre le chargement des scripts CDN

**❌ Collier mal positionné**  
→ Photo avec visage bien visible et épaules droites

## 📖 Documentation complète
Voir `README_DEV.md` pour les détails techniques complets.

---
*🎯 Objectif : Essayage virtuel de colliers avec IA*
