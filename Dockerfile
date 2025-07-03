# Dockerfile

FROM python:3.10-slim

# Installer les dépendances système essentielles
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    libgcc-s1 \
    && rm -rf /var/lib/apt/lists/*

# Définir le dossier de travail
WORKDIR /app

# Copier le fichier requirements.txt en premier pour optimiser le cache Docker
COPY backend/app/requirements.txt /app/requirements.txt

# Installer les dépendances Python
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code Python depuis backend/app
COPY backend/app /app

# Copier les données (data) au même niveau que /app
COPY data /data

# Exposer le port
EXPOSE 8080

# Variables d'environnement pour la production
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Commande de lancement avec gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8080", "--workers", "1", "--timeout", "120"]
