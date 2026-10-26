# syntax=docker/dockerfile:1.7
# ------------------------------------------------------------------
# Frontend image — TanStack Start + Nitro (`node-server` preset).
#
# Build:   docker build -t rox-web .
# Run:     docker run --rm -p 3000:3000 \
#            -e VITE_API_URL=https://api.rox.ma \
#            rox-web
#
# Notes:
#   • `VITE_API_URL` is a *build-time* env baked into the SSR bundle
#     (Vite inlines `import.meta.env.*` at build). Pass it as a build
#     arg, not a runtime env:
#         docker build --build-arg VITE_API_URL=https://api.rox.ma -t rox-web .
#   • The runtime reads `PORT` (default 3000) and `HOST` (default
#     0.0.0.0). Set these via Dokploy env / docker run -e.
#   • Bun.lock isn't present, npm is used. Swap to Bun later if you
#     adopt it.
# ------------------------------------------------------------------

# ---- Build stage -------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Lock deps for reproducible layer caching.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# Full source. `.dockerignore` filters out node_modules / .output / etc.
COPY tsconfig*.json vite.config.ts ./
COPY public ./public
COPY src ./src

# Baked at build time — Vite inlines this into the SSR bundle so
# both the Node server (SSR loaders) and the browser use the same
# backend URL.
ARG VITE_API_URL=http://localhost:8090
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build
# Produces .output/ (server/index.mjs + public/) thanks to
# `nitro: { preset: "node-server" }` in vite.config.ts.

# ---- Runtime stage -----------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Just the built artifact — no node_modules, no sources.
COPY --from=build /app/.output ./

EXPOSE 3000
ENV PORT=3000 \
    HOST=0.0.0.0

# Nitro's node-server preset reads PORT/HOST from env.
CMD ["node", "server/index.mjs"]
