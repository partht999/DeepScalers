# Build stage for Node.js
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY . .

# Create voice recognition directory and copy voice client
RUN mkdir -p dist/static/voice_recognition/js && \
    cp static/voice_recognition/js/voice_client.js dist/static/voice_recognition/js/

# Build frontend
RUN npm run build && \
    # Clean up unnecessary files
    rm -rf node_modules && \
    rm -rf src && \
    rm -rf public

# Python backend stage
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies and clean up in one layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy backend files
COPY backend/requirements.txt .

# Install Python dependencies and clean up
RUN pip install --no-cache-dir -r requirements.txt && \
    rm -rf /root/.cache/pip/*

# Copy backend source
COPY backend/ .

# Copy built frontend files
COPY --from=frontend-builder /app/dist /app/static

# Collect static files and clean up
RUN python manage.py collectstatic --noinput && \
    find /app -type d -name "__pycache__" -exec rm -r {} + && \
    find /app -type f -name "*.pyc" -delete

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=10000

# Expose port
EXPOSE 10000

# Run the application
CMD gunicorn backend.wsgi:application --bind 0.0.0.0:10000 