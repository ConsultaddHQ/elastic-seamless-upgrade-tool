# ====== Stage 1: Build the React app ======
FROM node:20.19.0 AS builder

WORKDIR /app

# Install dependencies separately for caching
COPY package.json ./
RUN yarn 

# Copy the rest of the application files
COPY . .

# Build the React app
RUN yarn build

# ====== Stage 2: Serve with Nginx ======
FROM nginx:alpine

WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

COPY --from=builder /app/build/client ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
