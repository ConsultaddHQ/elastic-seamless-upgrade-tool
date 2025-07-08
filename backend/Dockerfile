# Start with a Node.js base image
FROM node:18-bullseye AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN yarn

# Copy the rest of the application code
COPY . .

# Compile TypeScript code into JavaScript
RUN yarn build

# Stage 2: Production Stage
FROM node:18-bullseye

ENV ANSIBLE_PLAYBOOKS_PATH="/app/ansible"
ENV MONGO_URI=mongodb://admin:admin123@mongodb:27017
# Install dependencies and Ansible
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    python3 -m pip install ansible && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get install -y openssh-client && \
    pip3 install requests

# Verify installations
RUN node --version && yarn --version && ansible --version

# Set the working directory in the container
WORKDIR /app

# Copy only the compiled files from the build stage
COPY --from=builder /app/dist ./dist

# Copy package.json and package-lock.json to install production dependencies
COPY --from=builder /app/package*.json ./


#Copy ansible files
COPY --from=builder /app/ansible/ ./ansible/
RUN mkdir -p ansible/ini

# Copy prechecks.yaml file
COPY --from=builder /app/breaking-changes.py ./breaking-changes.py

RUN python3 breaking-changes.py

# Install only production dependencies
RUN yarn install --production

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
