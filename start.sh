#!/bin/bash

# Get the docker tag from the first argument, default to 'latest'
DOCKER_TAG="${1:-latest}"

# Paths
CERTS_DIR="./certs"
mkdir -p "$CERTS_DIR"

# Check if custom keystore exists
if [ -f "$CERTS_DIR/keystore.p12" ]; then
  TLS_ENV="
    environment:
      - SEAMLESS_UPGRADE_TOOL_TLS_KEY_STORE=/certs/keystore.p12
      - SEAMLESS_UPGRADE_TOOL_TLS_KEY_STORE_PASSWORD=${SEAMLESS_UPGRADE_TOOL_TLS_KEY_STORE_PASSWORD}
      - SEAMLESS_UPGRADE_TOOL_TLS_KEY_ALIAS=${SEAMLESS_UPGRADE_TOOL_TLS_KEY_ALIAS}"
else
  TLS_ENV=""
fi

# Define the docker-compose.yml content
cat <<EOF > docker-compose.yml

services:
  seamless-upgrade-mongodb:
    image: mongo:8.0
    container_name: mongodb
    ports:
      - '27017:27017'
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
    volumes:
      - seamless-upgrade-mongodb-data:/data/db

  seamless-upgrade-tool:
    image: hyperflex/elastic-seamless-upgrade-tool:$DOCKER_TAG
    container_name: tool
    pull_policy: always
    ports:
      - '8080:8080'
    volumes:
      - seamless-upgrade-tool:/output
      - $CERTS_DIR:/certs:ro
    depends_on:
      - seamless-upgrade-mongodb
$TLS_ENV

volumes:
  seamless-upgrade-tool:
  seamless-upgrade-mongodb-data:
EOF

# Start the services
echo "Starting the containers..."
docker compose -p seamless-upgrade up -d

# Function to check service status
check_service() {
    local service_name=$1
    local status=$(docker inspect --format='{{.State.Status}}' $service_name 2>/dev/null)
    if [ "$status" != "running" ]; then
        echo "$service_name failed to start. Logs:"
        docker logs $service_name
        exit 1
    fi
}

# Wait a few seconds before checking status
sleep 5

# Check each service
check_service "seamless-upgrade-mongodb"
check_service "seamless-upgrade-tool"

echo "Seamless upgrade tool running on:"
echo "http://localhost:8080"
