# BleuReflet - Test Photo de Colliers

Ce projet contient uniquement la fonctionnalité de test photo pour essayer virtuellement des colliers.

## Fonctionnalités

- Upload d'image ou utilisation d'exemples prédéfinis
- Détection automatique des points du visage avec MediaPipe
- Superposition de colliers virtuels sur l'image
- Interface simple et épurée

## Installation et utilisation

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev

# Build de production
npm run build
```

## Structure

- `src/components/PhotoTestView.tsx` - Composant principal pour le test photo
- `src/assets/necklaces/` - Images des colliers disponibles
- `public/assets/examples/` - Images d'exemple pour les tests

## Technologies utilisées

- React + TypeScript
- MediaPipe pour la détection de visage
- TensorFlow.js pour l'IA
- Tailwind CSS pour le style
- Vite pour le build
