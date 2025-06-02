# Stage 1: Install Python dependencies
FROM python:3.12-slim as builder

WORKDIR /app

# Install system dependencies (needed for some Python packages)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Create a lightweight runtime image
FROM python:3.12-slim

WORKDIR /app

# Copy only installed Python packages from builder
COPY --from=builder /root/.local /root/.local
COPY backend/ .

# Ensure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Install runtime system dependencies (if needed, e.g., for OpenCV, Postgres, etc.)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libgomp1 \
    # Add other runtime deps here (e.g., libpq5 for Postgres)
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=10000

# Expose the port Railway will use
EXPOSE 10000

# Run the application
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:10000"]