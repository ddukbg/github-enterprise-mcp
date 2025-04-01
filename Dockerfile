FROM node:18-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Run application
CMD ["node", "dist/index.js", "--transport", "http"] 