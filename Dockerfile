FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY scripts ./scripts
RUN npm ci

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY scripts ./scripts
RUN npm ci --omit=dev
RUN npx playwright install --with-deps chromium

COPY --from=build /app/dist ./dist
COPY public ./public
COPY favicon.ico ./favicon.ico

EXPOSE 8788
CMD ["node", "dist/index.js"]
