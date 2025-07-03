#!/bin/bash

# Active conda
source /root/miniconda3/etc/profile.d/conda.sh
conda activate py310

# Lance gunicorn
exec gunicorn -w 4 -b 127.0.0.1:8000 app:app

