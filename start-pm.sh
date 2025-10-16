#!/bin/bash
set -eu

# Get the docker tag from the first argument, default to 'latest'
DOCKER_TAG="${1:-latest}"

# Paths
APP_DIR="./seamless-upgrade-tool"
CERTS_DIR="$APP_DIR/certs"
mkdir -p "$CERTS_DIR"

# Define the docker-compose.yml content
cat <<EOF > docker-compose.yml

services:
  seamless-upgrade-mongodb:
    image: mongo:8.0
    container_name: seamless-upgrade-mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
    volumes:
      - seamless-upgrade-mongodb-data:/data/db

  seamless-upgrade-tool:
    image: hyperflex/elastic-seamless-upgrade-tool:$DOCKER_TAG
    container_name: seamless-upgrade-tool
    pull_policy: always
    ports:
      - '8080:8080'
    volumes:
      - $APP_DIR:/output
      - $CERTS_DIR:/certs:ro
    depends_on:
      - seamless-upgrade-mongodb
volumes:
  seamless-upgrade-mongodb-data:
EOF

# Function to start containers
start_containers() {
    echo "Starting the containers..."

    if command -v podman >/dev/null 2>&1; then
        if podman compose version >/dev/null 2>&1; then
            podman compose up -d
        elif command -v podman-compose >/dev/null 2>&1; then
            podman-compose up -d
        else
            echo "Error: Neither 'podman compose' nor 'podman-compose' is available."
            exit 1
        fi
    else
        echo "Error: Podman is not installed."
        exit 1
    fi
}

# Start containers
start_containers

# Wait a few seconds before checking status
sleep 5

echo "Seamless upgrade tool running on:"
echo "http://localhost:8080"
