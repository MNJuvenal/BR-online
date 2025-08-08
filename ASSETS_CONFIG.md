# Configuration des Assets - Mode Production et Développement

## Vue d'ensemble

Le système de rafraîchissement des assets détecte automatiquement s'il doit utiliser les assets depuis le dossier `frontend/dist/assets` (production) ou `frontend/public/assets` (développement).

## Détection automatique

### Mode Production (Automatique)
Le système passe automatiquement en mode production quand :
- ✅ Le dossier `frontend/dist` existe
- ✅ Le dossier `frontend/dist/assets/examples` contient des fichiers

### Mode Développement (Par défaut)
Le système utilise le mode développement quand :
- ❌ Le dossier `frontend/dist` n'existe pas
- ❌ Le dossier `frontend/dist/assets/examples` est vide
- 🔧 La variable `FORCE_DEV=true` est définie

## Variables d'environnement

### Pour forcer le mode développement
```bash
export FORCE_DEV=true
# Le système utilisera toujours frontend/public/assets même si dist existe
```

### Pour le déploiement normal
```bash
# Aucune variable nécessaire - détection automatique
# Le système choisit le bon dossier selon la disponibilité des assets
```

## Processus de build

### 1. Développement
```bash
# Les assets sont dans frontend/public/assets/
npm run dev
# ➜ Utilise frontend/public/assets/ automatiquement
```

### 2. Build de production
```bash
# Build du frontend qui copie les assets vers dist/
npm run build
# ➜ Utilise frontend/dist/assets/ automatiquement
```

### 3. Vérification du mode utilisé
Regardez les logs du backend au démarrage :
```
🔧 Mode développement : scan de frontend/public/assets
# ou
🚀 Mode production détecté : scan de frontend/dist/assets
```

## Dépannage

### Le rafraîchissement ne trouve pas les assets après le build
1. **Vérifiez que le build a bien copié les assets :**
   ```bash
   ls -la frontend/dist/assets/
   ```

2. **Vérifiez les logs du backend :**
   - Le mode détecté (dev/prod)
   - Les chemins utilisés
   - Les erreurs éventuelles

3. **Forcer le mode développement temporairement :**
   ```bash
   export FORCE_DEV=true
   # Relancer le backend
   ```

### Permissions d'accès aux assets
Assurez-vous que le backend a les droits de lecture sur :
- `frontend/public/assets/` (développement)
- `frontend/dist/assets/` (production)

## Structure recommandée

```
frontend/
├── public/
│   └── assets/
│       ├── examples/          # Modèles/mannequins
│       ├── colliers/          # Colliers disponibles
│       └── icons/             # Icônes de l'interface
├── dist/                      # Généré par le build
│   └── assets/
│       ├── examples/          # Copié depuis public/assets/examples/
│       └── colliers/          # Copié depuis public/assets/colliers/
└── src/
    └── hooks/
        └── useAssets.ts       # Hook de gestion des assets
```

## Formats supportés

Le scan des assets prend en charge tous les formats d'image courants :
- `.jpg`, `.jpeg`, `.png`, `.webp`
- `.bmp`, `.gif`, `.tiff`, `.tif`
- `.svg`, `.ico`, `.jfif`, `.avif`

## API de rafraîchissement

L'endpoint `/scan-assets` retourne maintenant des informations de debug :

```json
{
  "examples": [...],
  "colliers": [...],
  "total_examples": 5,
  "total_colliers": 8,
  "scan_timestamp": 1691234567,
  "scan_info": {
    "mode": "production",
    "examples_path": "frontend/dist/assets/examples",
    "colliers_path": "frontend/dist/assets/colliers", 
    "dist_available": true,
    "force_dev": false
  }
}
```
