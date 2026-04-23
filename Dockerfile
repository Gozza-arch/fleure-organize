# ─── Stage 1 : build du frontend ─────────────────────────────────────────────
FROM oven/bun:1-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/bun.lockb* ./
RUN bun install --frozen-lockfile

COPY frontend/ ./
RUN bun run build

# ─── Stage 2 : image de production ───────────────────────────────────────────
FROM oven/bun:1-alpine

WORKDIR /app

# Dépendances backend
COPY package.json bun.lockb* ./
RUN bun install --production --frozen-lockfile

# Code backend
COPY backend/ ./backend/

# Frontend buildé (depuis stage 1)
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Répertoire de données persistantes (monté via volume Railway)
RUN mkdir -p /data/uploads

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/data/fleure.db
ENV UPLOADS_DIR=/data/uploads

EXPOSE 3001

CMD ["bun", "backend/server.js"]
