# Stage 1: build server
FROM node:20-bookworm-slim AS builder-server
# WORKDIR is designed to launch all commands
# not from the root foolder of container to avoid system errors
WORKDIR /app
COPY ./server/package*.json ./
RUN npm ci
COPY server ./
RUN npm run build

# Stage 2: build client
FROM node:20-bookworm-slim AS builder-client
WORKDIR /app

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

COPY client/package*.json ./
RUN npm ci
COPY client ./
RUN npm run build

# Stage 3: production image
# bookworm-slim - official tag of Debian-based images
# Debian-based image has preinstalled OpenSSL
FROM node:20-bookworm-slim
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

# copy application code
COPY --from=builder-server /app/dist ./server/

# install all dependencies to proceed with prisma
COPY server/package*.json ./server/
COPY server/prisma ./server/prisma
# prune --omit=dev will clear all dev dependencies and save only production
RUN cd server \
 && npm ci \
 && npm run db:generate

# copy client
COPY --from=builder-client /app/build ./client/

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "server/index.js"]
