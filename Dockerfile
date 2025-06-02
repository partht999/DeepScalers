# Stage 1: Install Python dependencies
FROM python:3.12-slim-bookworm as builder  # Using newer bookworm base

WORKDIR /app

# Install system dependencies in a single layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libpq-dev \
    gcc \
    swig \
    libpulse-dev \
    portaudio19-dev \
    python3-pyaudio \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install build tools first
RUN python -m pip install --no-cache-dir --upgrade pip setuptools wheel

# Install requirements in groups with explicit versions
COPY backend/requirements.prod.txt .

# Core Django dependencies first
RUN python -m pip install --no-cache-dir \
    "Django==4.2.0" \
    "djangorestframework==3.14.0" \
    "django-cors-headers==4.3.0" \
    "gunicorn==21.2.0"

# Database and auth dependencies
RUN python -m pip install --no-cache-dir \
    "psycopg2-binary==2.9.9" \
    "django-allauth==0.57.0" \
    "djangorestframework-simplejwt==5.3.0"

# AI/ML dependencies (install numpy first)
RUN python -m pip install --no-cache-dir \
    "numpy==1.24.0" && \
    python -m pip install --no-cache-dir \
    "pandas==2.0.0" \
    "scikit-learn==1.3.0" \
    "sentence-transformers==2.2.2"

# Audio processing (install in separate layer)
RUN python -m pip install --no-cache-dir \
    "pydub==0.25.1" \
    "SpeechRecognition==3.14.2" \
    "pocketsphinx==5.0.4"

# Stage 2: Runtime image
FROM python:3.12-slim-bookworm

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libgomp1 \
    libpq5 \
    libpulse0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code (using .dockerignore to exclude unnecessary files)
COPY backend/ .

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=10000 \
    PYTHONPATH=/app \
    DJANGO_SETTINGS_MODULE=backend.settings \
    PATH="/root/.local/bin:${PATH}"

# Create necessary directories
RUN mkdir -p staticfiles media

# Collect static files (if needed)
RUN python manage.py collectstatic --noinput || echo "Static collection failed (might be expected in some cases)"

EXPOSE 10000

CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:10000"]