# Stage 1: Install Python dependencies
FROM python:3.12-slim-bullseye as builder

WORKDIR /app

# Install system dependencies and Python packages in a single layer
COPY backend/requirements.prod.txt .
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    && pip install --no-cache-dir -r requirements.prod.txt \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Create a lightweight runtime image
FROM python:3.12-slim-bullseye

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