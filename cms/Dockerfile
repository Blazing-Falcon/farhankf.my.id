# syntax=docker/dockerfile:1
# Build stage: compile TS + admin panel, then strip dev deps.
FROM node:22-bookworm-slim AS build
# Toolchain for better-sqlite3's native build (used only if no prebuilt binary matches).
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build && npm prune --omit=dev

# Runtime stage: dist + production node_modules only.
FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
# tsconfig.json is how Strapi detects a TS project at runtime — without it,
# `strapi start` looks for ./config instead of ./dist/config and boots with an
# empty database config.
COPY --from=build /app/tsconfig.json ./
COPY --from=build /app/favicon.png ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
# Mount points for persistent state (sqlite db + media). docker-compose binds these.
RUN mkdir -p data public/uploads database/migrations
EXPOSE 1337
CMD ["npx", "strapi", "start"]
