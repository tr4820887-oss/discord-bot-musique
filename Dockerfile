FROM node:24-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY artifacts/discord-bot/package.json ./artifacts/discord-bot/package.json

RUN pnpm install --filter @workspace/discord-bot --frozen-lockfile || pnpm install --filter @workspace/discord-bot

COPY . .

RUN node -e "const p=require('./artifacts/discord-bot/node_modules/@distube/yt-dlp/dist/index.js'); console.log('yt-dlp ok')" 2>/dev/null || true

CMD ["pnpm", "--filter", "@workspace/discord-bot", "run", "start"]
