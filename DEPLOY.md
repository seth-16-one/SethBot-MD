# 🚀 SethBot-MD Deployment Guide

How to deploy SethBot-MD to a hosting panel, Docker, Heroku, Render or a VPS.
The pairing website is a separate repo and is not part of this bot.

Requirements: **Node.js 22 or newer** (the `baileys` package needs it). On a panel, pick the Node 22 (or newer) egg/runtime.

---

## 🔐 Authentication (SESSION_ID)

Each installation owns its own WhatsApp session. Nothing is sent to a central server.

**SESSION_ID (the supported way to deploy):** open the SethBot-MD pairing website, pair your number with the pairing code, copy the whole `TELMAS~...` value it gives you and set it as the `SESSION_ID` environment variable. The bot loads it and connects — no QR needed. The bot never generates Session IDs itself.

How the bot treats it:
- The value is validated on start (it must decode to a real, linked WhatsApp account). Quotes and line breaks added by copy/paste are tolerated; a cut or altered ID gets a clear error instead of a silent QR loop.
- **No SESSION_ID? Paste it in the console.** If `SESSION_ID` is missing, invalid or logged out, the bot asks you to paste it into the console (panel console, SSH or terminal) and starts as soon as it is valid. A paste that the console cuts into several lines is stitched together; type `reset` to start over.
- **If your host's console can't send input to the bot** (the bot prints "This host does not pass console input"), create a file named `session.txt` next to `index.js` in the host's file manager, paste the `SESSION_ID` into it and save. The bot checks every few seconds, starts as soon as it is valid, and deletes the file after reading it (the session is kept as credentials).
- Set `SESSION_PROMPT=false` to turn the prompt off. Treat the panel console like a password field: it shows what you paste.
- `ENABLE_QR=true` prints a QR in the terminal for local testing only.
- Using the **same** `SESSION_ID` again after a restart keeps the saved (fresher) credentials; supplying a **new** `SESSION_ID` replaces them.
- If WhatsApp logs the session out, the bot stops, prints `Generate a NEW SESSION_ID`, and will not retry that dead ID on restart (so a crash-restarting panel doesn't hammer WhatsApp).
- **One session = one running bot.** If the same `SESSION_ID` runs on two hosts, WhatsApp disconnects one with code 440; the bot stops instead of fighting. Stop the other deployment.

## 💾 Ephemeral storage

Many free/low-cost hosts (Heroku, Railway free tier, some panels) wipe the filesystem on every restart or redeploy. The WhatsApp **session** survives that because the bot logs in from `SESSION_ID` each time. Bot **settings** saved in `data/` (warnings, welcome messages, mode, ...) do not. If your host offers a persistent disk, mount it and point the bot at it:

```
SESSION_DIR=/data/session
DATA_DIR=/data/data
```

On a wiped disk, an occasional first message after a restart may need to be resent while chat encryption state is rebuilt.

## 🌐 Web server

The bot starts a tiny web server on `PORT` (default `3000`) that only answers `{"bot":"SethBot-MD","status":"online"}`. Heroku and Render need it; uptime monitors can ping it. It shows no QR, session or config. Set `DISABLE_WEB_SERVER=true` to turn it off.

---

## 🐳 Docker-based panels (Pterodactyl, Katabump, Railway, generic VPS panels)

A `Dockerfile` (Node 22) is included. Any panel that supports "deploy from Dockerfile" or "Docker image" will work:

1. Point the panel at this repo (or upload the zip without `node_modules`).
2. Set your environment variables in the panel's variables section — see `.env.example` (at minimum `SESSION_ID`).
3. The panel should auto-detect the `Dockerfile`. If it asks for a start command anyway, use `node index.js`.
4. Make sure the panel forwards port `3000` (or set `PORT` to whatever the panel requires).

Local Docker:

```bash
docker build -t sethbot .
docker run -e SESSION_ID="TELMAS~..." -p 3000:3000 sethbot
```

## ⚡ Katabump

1. Create a new Node.js (or Docker) server and choose **Node 22 or newer**.
2. Upload the files as a ZIP (without `node_modules`) or link GitHub.
3. Add `SESSION_ID` (and optionally `OWNER_NUMBER`) in the panel's variables.
4. Start. The panel runs `npm install` and then `npm start`. The first install takes a few minutes.

If the console does not accept input, use `session.txt` as described above.

## 🟣 Heroku

1. Push the code to a private GitHub repository (update `repository` in `app.json` first if you want the one-click button).
2. Create the app and connect the repository (Deploy tab).
3. Settings → Config Vars: add `SESSION_ID` (and optionally `OWNER_NUMBER`).
4. Deploy the branch, then make sure the `web` dyno is ON in the Resources tab.

## 🌐 Render

1. New **Web Service** pointed at the repo.
2. Build command `npm install`, start command `npm start` (or `node index.js`).
3. Add the environment variables from `.env.example` (at minimum `SESSION_ID`).
4. Render's free tier wipes the disk on redeploy — see the storage note above.

## 🖥️ VPS (Ubuntu/Linux) with PM2

```bash
git clone https://github.com/seth-16-one/SethBot-MD.git
cd SethBot-MD
npm install
cp .env.example .env
nano .env            # set SESSION_ID (and OWNER_NUMBER)
npm install -g pm2
pm2 start index.js --name sethbot
pm2 save && pm2 startup
pm2 logs sethbot
```

Hosting several customers from one codebase? See `ecosystem.example.cjs` and the README.

---

## 📦 About the lockfile

This package set was updated without a `package-lock.json`. After the first successful `npm install` on your machine or host, commit the generated `package-lock.json`; the Dockerfile then uses `npm ci` for repeatable builds.

## 🔑 Never commit

`.env`, `session.txt`, `session/` and `creds.json` are in `.gitignore` and `.dockerignore`. Anyone who has your `SESSION_ID` controls your WhatsApp account.
