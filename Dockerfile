ARG MODE=dev

# Frontend dev image - runs Vite
FROM node:20-alpine AS dev
ARG TARGETARCH
# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++
RUN npm install -g npm@11.8.0
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# Install dependencies and explicitly install rollup native bindings
RUN npm install --no-audit --no-fund && \
    (case ${TARGETARCH} in \
        "arm64") npm install --no-save @rollup/rollup-linux-arm64-musl;; \
        "amd64") npm install --no-save @rollup/rollup-linux-x64-musl;; \
    esac) && \
    npm cache clean --force
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
# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++
RUN npm install -g npm@11.8.0
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# Install dependencies and explicitly install rollup native bindings
RUN npm install --no-audit --no-fund && \
    (case ${TARGETARCH} in \
        "arm64") npm install --no-save @rollup/rollup-linux-arm64-musl;; \
        "amd64") npm install --no-save @rollup/rollup-linux-x64-musl;; \
    esac) && \
    npm cache clean --force
COPY . .
RUN npm run build

FROM nginx:alpine AS prod
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist/ ./
# Basic nginx default config overwritten by compose mount
EXPOSE 80
