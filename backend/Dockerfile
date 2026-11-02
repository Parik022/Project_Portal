# Production image for the ProjectFlow API.
FROM node:22-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 5000
USER node
# Apply pending migrations, then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
