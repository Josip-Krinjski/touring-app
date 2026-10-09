# Small Node.js 22 base image
FROM node:22-alpine

# All following commands happen inside /app
WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy backend source code
COPY . .

EXPOSE 3000

# Start Node directly - no nodemon inside production container
CMD ["node", "server.js"]