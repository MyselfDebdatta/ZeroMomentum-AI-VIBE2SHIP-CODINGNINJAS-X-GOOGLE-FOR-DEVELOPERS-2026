# Stage 1: Build the Vite application
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve the static files with Nginx
FROM nginx:alpine

# Copy the custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080 as expected by Cloud Run
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
