FROM node:20-slim

# Install Python 3, pip, and ffmpeg (no libgl needed for opencv-python-headless)
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  python3-pip \
  ffmpeg \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install production Node dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Python requirements and install (allow breaking system packages in Debian 12 container)
COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy application source
COPY . .

# Ensure storage directories exist and have proper permissions
RUN mkdir -p storage/uploads storage/results && \
  chmod -R 777 storage

# Expose the API port
ENV PORT=3001
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => { if (r.statusCode !== 200) process.exit(1); process.exit(0); })"

# Run the backend
CMD ["npm", "start"]
