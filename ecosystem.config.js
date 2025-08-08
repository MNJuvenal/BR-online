module.exports = {
  apps: [
    {
      name: "backend",
      script: "gunicorn",
      args: "wsgi:app -w 3 -b 127.0.0.1:8000 --timeout 120 --keep-alive 2",
      interpreter: "none",
      cwd: "/home/ubuntu/necklace/backend",
      env: {
        NODE_ENV: "development",
        FLASK_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production",
        FLASK_ENV: "production",
        PRODUCTION_ASSETS_PATH: "/var/www/necklace-frontend/dist/assets"
      },
      error_file: "/home/ubuntu/necklace/logs/backend-error.log",
      out_file: "/home/ubuntu/necklace/logs/backend-out.log",
      log_file: "/home/ubuntu/necklace/logs/backend-combined.log",
      time: true,
      autorestart: true,
      max_restarts: 5,
      min_uptime: "10s"
    }
  ]
}