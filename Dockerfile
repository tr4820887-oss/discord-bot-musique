FROM node:24-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10

WORKDIR /app

COPY . .

RUN pnpm install --filter @workspace/discord-bot

CMD ["pnpm", "--filter", "@workspace/discord-bot", "run", "start"]
