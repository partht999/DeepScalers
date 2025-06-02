# Build stage for Node.js
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy frontend source
COPY . .

# Create voice recognition directory and copy voice client
RUN mkdir -p dist/static/voice_recognition/js && \
    cp static/voice_recognition/js/voice_client.js dist/static/voice_recognition/js/

# Build frontend with production mode
ENV NODE_ENV=production
RUN npm run build && \
    # Clean up unnecessary files
    rm -rf node_modules && \
    rm -rf src && \
    rm -rf public && \
    rm -rf .git && \
    rm -rf .github && \
    rm -rf tests && \
    rm -rf docs

# Python backend stage
FROM python:3.12-slim

WORKDIR /app

# Install only necessary system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && rm -rf /var/cache/apt/*

# Copy backend files
COPY backend/requirements.prod.txt requirements.txt

# Install Python dependencies and clean up
RUN pip install --no-cache-dir -r requirements.txt && \
    rm -rf /root/.cache/pip/* && \
    rm -rf /root/.cache/pytest/* && \
    rm -rf /root/.cache/mypy/*

# Copy backend source
COPY backend/ .

# Copy built frontend files
COPY --from=frontend-builder /app/dist /app/static

# Collect static files and clean up
RUN python manage.py collectstatic --noinput && \
    find /app -type d -name "__pycache__" -exec rm -r {} + && \
    find /app -type f -name "*.pyc" -delete && \
    find /app -type f -name "*.pyo" -delete && \
    find /app -type f -name "*.pyd" -delete && \
    find /app -type f -name "*.so" -delete && \
    find /app -type f -name "*.egg" -delete && \
    find /app -type f -name "*.egg-info" -delete && \
    find /app -type d -name "*.egg-info" -delete && \
    find /app -type d -name "*.egg" -delete && \
    find /app -type d -name "tests" -exec rm -r {} + && \
    find /app -type d -name "test" -exec rm -r {} + && \
    find /app -type d -name "docs" -exec rm -r {} + && \
    find /app -type d -name "examples" -exec rm -r {} + && \
    find /app -type d -name "*.dist-info" -exec rm -r {} + && \
    find /app -type d -name "*.egg-info" -exec rm -r {} + && \
    find /app -type f -name "*.pyi" -delete && \
    find /app -type f -name "*.pyx" -delete && \
    find /app -type f -name "*.pxd" -delete && \
    find /app -type f -name "*.pyd" -delete && \
    find /app -type f -name "*.so" -delete && \
    find /app -type f -name "*.dylib" -delete && \
    find /app -type f -name "*.dll" -delete && \
    find /app -type f -name "*.exe" -delete && \
    find /app -type f -name "*.bat" -delete && \
    find /app -type f -name "*.sh" -delete && \
    find /app -type f -name "*.ps1" -delete && \
    find /app -type f -name "*.cmd" -delete && \
    find /app -type f -name "*.ini" -delete && \
    find /app -type f -name "*.cfg" -delete && \
    find /app -type f -name "*.conf" -delete && \
    find /app -type f -name "*.log" -delete && \
    find /app -type f -name "*.tmp" -delete && \
    find /app -type f -name "*.temp" -delete && \
    find /app -type f -name "*.bak" -delete && \
    find /app -type f -name "*.swp" -delete && \
    find /app -type f -name "*.swo" -delete && \
    find /app -type f -name "*.swn" -delete && \
    find /app -type f -name "*.sublime-workspace" -delete && \
    find /app -type f -name "*.sublime-project" -delete && \
    find /app -type f -name "*.vscode" -delete && \
    find /app -type f -name "*.idea" -delete && \
    find /app -type f -name "*.iml" -delete && \
    find /app -type f -name "*.ipr" -delete && \
    find /app -type f -name "*.iws" -delete && \
    find /app -type f -name "*.project" -delete && \
    find /app -type f -name "*.classpath" -delete && \
    find /app -type f -name "*.settings" -delete && \
    find /app -type f -name "*.factorypath" -delete && \
    find /app -type f -name "*.launch" -delete && \
    find /app -type f -name "*.tmproj" -delete && \
    find /app -type f -name "*.xcodeproj" -delete && \
    find /app -type f -name "*.xcworkspace" -delete && \
    find /app -type f -name "*.pbxproj" -delete && \
    find /app -type f -name "*.xcscheme" -delete && \
    find /app -type f -name "*.xcuserstate" -delete && \
    find /app -type f -name "*.xcuserdatad" -delete && \
    find /app -type f -name "*.xcuserdata" -delete && \
    find /app -type f -name "*.xcworkspacedata" -delete && \
    find /app -type f -name "*.xcworkspacedata" -delete && \
    find /app -type f -name "*.xcuserdatad" -delete && \
    find /app -type f -name "*.xcuserdata" -delete && \
    find /app -type f -name "*.xcuserstate" -delete && \
    find /app -type f -name "*.xcscheme" -delete && \
    find /app -type f -name "*.pbxproj" -delete && \
    find /app -type f -name "*.xcworkspace" -delete && \
    find /app -type f -name "*.xcodeproj" -delete && \
    find /app -type f -name "*.tmproj" -delete && \
    find /app -type f -name "*.launch" -delete && \
    find /app -type f -name "*.factorypath" -delete && \
    find /app -type f -name "*.settings" -delete && \
    find /app -type f -name "*.classpath" -delete && \
    find /app -type f -name "*.project" -delete && \
    find /app -type f -name "*.iws" -delete && \
    find /app -type f -name "*.ipr" -delete && \
    find /app -type f -name "*.iml" -delete && \
    find /app -type f -name "*.idea" -delete && \
    find /app -type f -name "*.vscode" -delete && \
    find /app -type f -name "*.sublime-project" -delete && \
    find /app -type f -name "*.sublime-workspace" -delete && \
    find /app -type f -name "*.swn" -delete && \
    find /app -type f -name "*.swo" -delete && \
    find /app -type f -name "*.swp" -delete && \
    find /app -type f -name "*.temp" -delete && \
    find /app -type f -name "*.tmp" -delete && \
    find /app -type f -name "*.log" -delete && \
    find /app -type f -name "*.conf" -delete && \
    find /app -type f -name "*.cfg" -delete && \
    find /app -type f -name "*.ini" -delete && \
    find /app -type f -name "*.cmd" -delete && \
    find /app -type f -name "*.ps1" -delete && \
    find /app -type f -name "*.sh" -delete && \
    find /app -type f -name "*.bat" -delete && \
    find /app -type f -name "*.exe" -delete && \
    find /app -type f -name "*.dll" -delete && \
    find /app -type f -name "*.dylib" -delete && \
    find /app -type f -name "*.so" -delete && \
    find /app -type f -name "*.pyd" -delete && \
    find /app -type f -name "*.pxd" -delete && \
    find /app -type f -name "*.pyx" -delete && \
    find /app -type f -name "*.pyi" -delete && \
    find /app -type d -name "*.egg-info" -exec rm -r {} + && \
    find /app -type d -name "*.dist-info" -exec rm -r {} + && \
    find /app -type d -name "examples" -exec rm -r {} + && \
    find /app -type d -name "docs" -exec rm -r {} + && \
    find /app -type d -name "test" -exec rm -r {} + && \
    find /app -type d -name "tests" -exec rm -r {} + && \
    find /app -type f -name "*.egg-info" -delete && \
    find /app -type d -name "*.egg" -delete && \
    find /app -type f -name "*.egg" -delete && \
    find /app -type f -name "*.so" -delete && \
    find /app -type f -name "*.pyd" -delete && \
    find /app -type f -name "*.pyo" -delete && \
    find /app -type f -name "*.pyc" -delete && \
    find /app -type d -name "__pycache__" -exec rm -r {} +

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=10000
ENV NODE_ENV=production
ENV DJANGO_SETTINGS_MODULE=backend.settings

# Expose port
EXPOSE 10000

# Run the application
CMD gunicorn backend.wsgi:application --bind 0.0.0.0:10000