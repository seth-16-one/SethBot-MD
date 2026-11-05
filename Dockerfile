FROM node:22-slim

WORKDIR /app

# Install deps first for better layer caching.
# Uses the lockfile when there is one (npm ci); otherwise a normal install.
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev --no-audit --no-fund; \
    else npm install --omit=dev --no-audit --no-fund; fi

COPY . .

# session/ holds the WhatsApp login, data/ the bot settings - see .gitignore
RUN mkdir -p session data tmp temp

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "index.js"]
