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
FROM --platform=$BUILDPLATFORM node:20-alpine AS build
ARG TARGETARCH
ARG VITE_APP_VERSION=dev
ARG VITE_GOOGLE_ANALYTICS_ID
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_GOOGLE_ANALYTICS_ID=$VITE_GOOGLE_ANALYTICS_ID
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
# Ensure build args are passed to the build command if needed by vite
RUN VITE_APP_VERSION=$VITE_APP_VERSION VITE_GOOGLE_ANALYTICS_ID=$VITE_GOOGLE_ANALYTICS_ID npm run build

# Create fallback config for latest assets
RUN LATEST_JS=$(basename $(ls dist/assets/index-*.js | head -n 1)) && \
    LATEST_CSS=$(basename $(ls dist/assets/index-*.css | head -n 1)) && \
    echo "set \$latest_index_js $LATEST_JS;" > dist/assets/latest.conf && \
    echo "set \$latest_index_css $LATEST_CSS;" >> dist/assets/latest.conf

FROM nginx:alpine AS prod
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist/ ./
# Basic nginx default config overwritten by compose mount
EXPOSE 8080

