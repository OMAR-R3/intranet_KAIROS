# ============================================================
# Dockerfile - Intranet Kairos (Next.js 15 Dashboard)
# Colocar este archivo en la raíz del repo del intranet
# renombrado simplemente como "Dockerfile"
# ============================================================

# ---- Etapa 1: Dependencias ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Etapa 2: Build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Etapa 3: Imagen final (runtime) ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3001

# El intranet corre "next start" en el puerto 3001, igual que en local
CMD ["npm", "run", "start", "--", "-p", "3001"]
