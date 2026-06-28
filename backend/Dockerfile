# Stage 1: Build
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build TypeScript
RUN npm run db:generate
RUN npm run build

# Stage 2: Production Run
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy package files and Prisma folder
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production

# Generate Prisma Client for the production environment
RUN npm run db:generate

# Copy the built code from the builder stage
COPY --from=builder /app/dist ./dist

# Ensure the port is dynamically assigned by Cloud Run
ENV PORT=8080
EXPOSE 8080

# Start the Node.js server
CMD ["npm", "run", "start"]
