# Build stage for Node.js
FROM node:18 AS frontend-builder

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
RUN npm run build

# Python backend stage
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

# Copy built frontend files
COPY --from=frontend-builder /app/dist /app/static

# Collect static files
RUN python manage.py collectstatic --noinput

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=10000

# Expose port
EXPOSE 10000

# Run the application
CMD gunicorn backend.wsgi:application --bind 0.0.0.0:10000 