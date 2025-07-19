
# Use official Node.js 24 Alpine image as the build stage
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency definitions for npm install
COPY ./web/package.json ./web/package-lock.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy application source code
COPY ./web .

# Copy environment variables file
COPY ./.env ./.env

# Build the application
RUN npm run build


# Use a fresh Node.js 24 Alpine image for the runtime stage
FROM node:24-alpine AS runner

# Set working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Install the static file server globally
RUN npm install --no-cache -g serve

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy environment variables file
COPY --from=builder /app/.env ./.env

# Expose the port the app runs on
EXPOSE 6969

# Start the server
CMD [ "serve", "-s", "dist", "-p", "6969" ]
