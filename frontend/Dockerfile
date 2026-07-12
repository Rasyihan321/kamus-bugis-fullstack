# Dockerfile frontend — Next.js (multi-stage build)

# ---- Tahap build ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# PENTING: pada output "standalone", next.config.mjs dievaluasi SAAT BUILD,
# jadi BACKEND_URL harus tersedia di tahap ini (bukan hanya saat runtime).
ARG BACKEND_URL=http://backend:4000
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build

# ---- Tahap produksi (image ringkas dari output standalone) ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
