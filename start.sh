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
    image: hyperflex/elastic-seamless-upgrade-backend:latest
    container_name: backend
    environment:
      MONGO_URI: mongodb://admin:admin123@mongodb:27017/
    depends_on:
      - mongodb
    ports:
      - '3000:3000'

  frontend:
    image: hyperflex/elastic-seamless-upgrade-frontend:latest
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
docker-compose up -d

echo "Deployment complete!"
echo "Frontend: http://localhost:8080"
echo "Backend: http://localhost:3000"
