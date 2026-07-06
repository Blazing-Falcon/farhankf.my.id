# syntax=docker/dockerfile:1
# Build stage. STRAPI_URL/STRAPI_TOKEN are NOT needed here: src/lib/strapi.ts
# reads them from process.env at runtime, and output:'server' means no page
# fetches happen during the build.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# Runtime stage: the standalone node adapter still resolves deps (sharp, react,
# marked, ...) from node_modules, so production node_modules come along.
FROM node:22-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
