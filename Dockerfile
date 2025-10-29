ARG MODE=dev

# Frontend dev image - runs Vite
FROM node:20-alpine AS dev
# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# Install dependencies and explicitly install rollup native bindings
RUN npm ci --no-audit --no-fund || true && \
    npm install --no-save @rollup/rollup-linux-arm64-musl && \
    npm cache clean --force
COPY . .
ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]

# Frontend prod image - builds then serves via nginx
FROM node:20-alpine AS build
# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# Install dependencies and explicitly install rollup native bindings
RUN npm ci --no-audit --no-fund || true && \
    npm install --no-save @rollup/rollup-linux-arm64-musl && \
    npm cache clean --force
COPY . .
RUN npm run build

FROM nginx:alpine AS prod
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist/ ./
# Basic nginx default config overwritten by compose mount
EXPOSE 80
