# syntax=docker/dockerfile:1.4
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install dependencies and NestJS CLI globally
RUN npm ci --prefer-offline --no-audit && \
    npm install -g @nestjs/cli

# Copy only necessary source files
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --prefer-offline --no-audit --only=production

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Set the command to run the optimized application
CMD ["node", "dist/main"]