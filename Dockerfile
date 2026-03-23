FROM node:24-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --break-system-packages yt-dlp

RUN npm install -g pnpm@10

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY artifacts/discord-bot/package.json ./artifacts/discord-bot/package.json

RUN pnpm install --filter @workspace/discord-bot

COPY . .

ENV YTDLP_PATH=/usr/local/bin/yt-dlp

CMD ["pnpm", "--filter", "@workspace/discord-bot", "run", "start"]
