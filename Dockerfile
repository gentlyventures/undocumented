# ==========================================
# Stage 1: Build the React + Vite Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend source files
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Build the FastAPI + Python Backend
# ==========================================
FROM python:3.11-slim AS backend-server
WORKDIR /app

# Install system dependencies needed for python packages (like psycopg2, gcc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir google-antigravity

# Copy backend source code
COPY backend/ ./backend

# Copy compiled static frontend assets to backend static folder
COPY --from=frontend-builder /app/frontend/dist ./backend/static

WORKDIR /app/backend
EXPOSE 8080

# Environment variables for Cloud Run
ENV PORT=8080
ENV HOST=0.0.0.0
ENV PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python

# Start the uvicorn API server which also serves the React UI at the root
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
