#!/bin/bash

# Define the docker-compose.yml content
cat <<EOF > docker-compose.yml

services:
  mongodb:
    image: mongo:6.0
    container_name: mongodb
    ports:
      - '27017:27017'
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
    volumes:
      - mongo-data:/data/db

  backend:
    image: hyperflex/elastic-seamless-upgrade-backend:dev
    container_name: backend
    environment:
      MONGO_URI: mongodb://admin:admin123@mongodb:27017/
    depends_on:
      - mongodb
    ports:
      - '3000:3000'

  frontend:
    image: hyperflex/elastic-seamless-upgrade-frontend:dev
    container_name: frontend
    ports:
      - '8080:80'
    depends_on:
      - backend

volumes:
  mongo-data:
EOF

# Start the services
echo "Starting the containers..."
docker-compose -p seamless-upgrade up -d

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
check_service "mongodb"
check_service "backend"
check_service "frontend"

echo "Seamless upgrade tool running on:"
echo "http://localhost:8080"
