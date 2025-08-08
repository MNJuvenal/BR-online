# 💎 BLUEREFLET - Application d'Essayage Virtuel de Colliers

Application web d'intelligence artificielle permettant d'essayer virtuellement des colliers en temps réel sur des photos.

## 🎯 Aperçu

Cette application utilise l'IA pour :
- **Détecter automatiquement** les visages sur les photos
- **Positionner précisément** des colliers selon la morphologie
- **Ajuster automatiquement** la luminosité et les ombres
- **Fournir un rendu réaliste** en temps réel

### 🚀 Démo rapide
1. Uploadez une photo ou choisissez un exemple
2. Sélectionnez un collier dans la galerie
3. L'IA applique automatiquement le collier
4. Téléchargez le résultat

## 🛠️ Technologies

- **Frontend** : React + TypeScript + Vite + TailwindCSS
- **Backend** : Python Flask + OpenCV + MediaPipe
- **IA** : MediaPipe (détection faciale) + YOLO (positionnement)
- **Déploiement** : Nginx + PM2 + Gunicorn

## 📋 Installation Rapide

### Prérequis
- Node.js ≥ 18
- Python ≥ 3.8
- Git

### Démarrage en 30 secondes
```bash
# 1. Cloner le projet
git clone <votre-repo>
cd BR-deploy-main

# 2. Installation automatique
cd backend/app && pip install -r requirements.txt
cd ../../frontend && npm install

# 3. Démarrage automatique
chmod +x restart_local.sh
./restart_local.sh
```

**➜ Application disponible sur http://localhost:5000**

## 📚 Documentation

- **[📖 README_DEV.md](README_DEV.md)** - Documentation complète pour développeurs
- **[⚡ QUICKSTART.md](QUICKSTART.md)** - Guide de démarrage rapide
- **[🔧 ASSETS_CONFIG.md](ASSETS_CONFIG.md)** - Configuration des assets
- **[🌐 NGINX_DEPLOYMENT.md](NGINX_DEPLOYMENT.md)** - Guide de déploiement

## 🎨 Fonctionnalités

### ✨ Interface Utilisateur
- Upload de photos par glisser-déposer
- Galerie d'exemples de mannequins
- Sélection intuitive de colliers
- Aperçu en temps réel
- Téléchargement des résultats

### 🧠 Intelligence Artificielle
- **Détection faciale haute précision** (MediaPipe)
- **Reconnaissance des points clés** (oreilles, menton, épaules)
- **Positionnement automatique** des colliers
- **Ajustement luminosité** selon l'éclairage
- **Rendu réaliste** avec ombres et reflets

### 🔄 Gestion d'Assets
- **Scan automatique** des colliers et exemples
- **Refresh dynamique** sans redémarrage
- **Support multi-environnements** (dev/prod)
- **API de gestion** des assets

## 🚀 Scripts Disponibles

| Script | Description | Utilisation |
|--------|-------------|-------------|
| `restart_local.sh` | Redémarrage développement | `./restart_local.sh` |
| `restart_production.sh` | Déploiement production | `sudo ./restart_production.sh` |
| `clean_project.sh` | Nettoyage GitLab | `./clean_project.sh` |

## 📊 API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/health` | GET | État du serveur |
| `/api/scan-assets` | GET | Liste des assets |
| `/api/apply-necklace` | POST | Application de collier |

## 🌍 Déploiement

### Développement Local
```bash
./restart_local.sh
# ➜ Backend: http://localhost:5000
# ➜ Frontend: http://localhost:5173
```

### Production
```bash
sudo ./restart_production.sh
# ➜ Application: http://yourdomain.com
# ➜ API: http://yourdomain.com/api/
```

## 🤝 Contribution

```bash
# 1. Créer une branche
git checkout -b feature/nouvelle-fonctionnalite

# 2. Développer
# Voir README_DEV.md pour les détails

# 3. Tester
./restart_local.sh
curl http://localhost:5000/api/health

# 4. Commit et push
git add .
git commit -m "feat: description"
git push origin feature/nouvelle-fonctionnalite
```

## 📞 Support

### 🔍 Debug Rapide
```bash
# Vérifier l'API
curl http://localhost:5000/api/health

# Voir les logs
pm2 logs backend          # Production
tail -f logs/backend.log  # Développement

# Tester les assets
curl http://localhost:5000/api/scan-assets
```

### 📋 Problèmes Courants
- **Port occupé** : Le script `restart_local.sh` libère automatiquement les ports
- **Assets non trouvés** : Vérifier `/frontend/public/assets/`
- **MediaPipe erreur** : Vérifier la connexion internet (CDN)
- **404 API** : Vérifier la configuration nginx (production)

## 📈 Performances

- **Temps de traitement** : ~2-5 secondes par image
- **Précision détection** : >85% (visage frontal)
- **Formats supportés** : JPG, PNG, WEBP
- **Taille max** : 20MB par image

## 🔮 Roadmap

- [ ] Support multi-colliers simultanés
- [ ] Mode réalité augmentée
- [ ] API de recommandation IA
- [ ] Interface d'administration
- [ ] Application mobile

---

**Version** : 1.0.0  
**Dernière mise à jour** : 8 août 2025  

🎨 **Créé par l'équipe BLUEREFLET**  
📧 **Support** : Créer une issue sur GitLab
