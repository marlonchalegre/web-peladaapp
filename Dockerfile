# Frontend dev image - runs Vite
FROM node:20-alpine AS dev
ARG TARGETARCH
WORKDIR /app
# Use BuildKit cache for npm
RUN --mount=type=cache,target=/root/.npm \
    npm install -g npm@11.8.0
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund
COPY . .
ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]

# Frontend prod image - builds then serves via nginx
FROM node:20-alpine AS build
ARG TARGETARCH
ARG VITE_APP_VERSION=dev
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV NODE_OPTIONS=--max-old-space-size=4096
WORKDIR /app
# Use BuildKit cache for npm
RUN --mount=type=cache,target=/root/.npm \
    npm install -g npm@11.8.0
COPY package.json package-lock.json .npmrc ./
# Use npm ci for faster, deterministic installs and mount the cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:alpine AS prod
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist/ ./
# Basic nginx default config overwritten by compose mount
EXPOSE 80
