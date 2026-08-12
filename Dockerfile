FROM node:22.15.1-bookworm-slim

WORKDIR /app

RUN npm install -g pnpm@11.20.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/client/package.json ./apps/client/package.json

RUN pnpm install --frozen-lockfile

COPY apps/server ./apps/server

RUN pnpm --filter server build

EXPOSE 5000

CMD ["pnpm", "--filter", "server", "start"]