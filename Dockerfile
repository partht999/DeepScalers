# Stage 1: Install Python dependencies
# Using newer bookworm base
FROM python:3.12-slim-bookworm as builder

WORKDIR /app

# Install system dependencies
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

# Upgrade pip and install build tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy requirements file
COPY backend/requirements.prod.txt .

# Install core dependencies first
RUN pip install --no-cache-dir -v \
    Django==4.2.0 \
    djangorestframework==3.14.0 \
    django-cors-headers==4.3.0 \
    django-filter==23.2 \
    django-rest-auth==0.9.5 \
    django-allauth==0.57.0 \
    djangorestframework-simplejwt==5.3.0 \
    dj-database-url==2.1.0 \
    whitenoise==6.5.0 \
    gunicorn==21.2.0

# Install database dependencies
RUN pip install --no-cache-dir -v psycopg2-binary==2.9.9

# Install AI and ML dependencies
RUN pip install --no-cache-dir -v \
    numpy==1.24.0 \
    pandas==2.0.0 \
    scikit-learn==1.3.0 \
    sentence-transformers==2.2.2 \
    qdrant-client==1.6.0

# Install audio processing dependencies
RUN pip install --no-cache-dir -v \
    pydub==0.25.1 \
    SpeechRecognition==3.14.2 \
    pocketsphinx==5.0.4

# Install PDF processing dependencies
RUN pip install --no-cache-dir -v PyPDF2==3.0.1

# Install utility dependencies
RUN pip install --no-cache-dir -v \
    python-dotenv==1.0.0 \
    requests==2.31.0 \
    twilio==8.12.0

# Stage 2: Create a lightweight runtime image
FROM python:3.12-slim-bookworm

WORKDIR /app

# Copy only the necessary files from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy only the necessary backend files
COPY backend/manage.py .
COPY backend/backend/ ./backend/
COPY backend/student_assistance/ ./student_assistance/
COPY backend/student_auth/ ./student_auth/
COPY backend/authentication/ ./authentication/
COPY backend/faq_handler/ ./faq_handler/
COPY backend/voice_recognition/ ./voice_recognition/
COPY backend/gunicorn_config.py .
COPY backend/collect_static.py .

# Install only runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libgomp1 \
    libpq5 \
    libpulse0 \
    portaudio19-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p staticfiles media

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=10000 \
    PYTHONPATH=/app \
    DJANGO_SETTINGS_MODULE=backend.settings

# Collect static files
RUN python collect_static.py --noinput

# Expose the port Railway will use
EXPOSE 10000

# Run the application
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:10000", "--config", "gunicorn_config.py"]