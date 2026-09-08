FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci

COPY . .
RUN npm run build -w backend

EXPOSE 5022
CMD ["npm", "run", "start", "-w", "backend"]