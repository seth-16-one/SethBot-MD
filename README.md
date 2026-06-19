SethBot-MD

<div align="center"><img src="https://raw.githubusercontent.com/seth-16-one/SethBot-MD/main/assets/bot-image.jpg" width="280"/>⚡ SETHBOT-MD ⚡

Powerful WhatsApp Multi-Device Bot

<p align="center">
<img src="https://img.shields.io/github/stars/seth-16-one/SethBot-MD?style=for-the-badge">
<img src="https://img.shields.io/github/forks/seth-16-one/SethBot-MD?style=for-the-badge">
<img src="https://img.shields.io/github/license/seth-16-one/SethBot-MD?style=for-the-badge">
</p><p align="center">
<img src="https://readme-typing-svg.herokuapp.com?font=Orbitron&size=24&duration=3000&pause=1000&center=true&vCenter=true&width=850&lines=WhatsApp+Multi+Device+Bot;Pairing+Code+Support;Oracle+VPS+Ready;PM2+Ready;Multi+Customer+Architecture;Built+with+Node.js+and+Baileys" />
</p><p align="center">
<a href="https://knight-bot-paircode.onrender.com">
<img src="https://img.shields.io/badge/PAIR-NOW-25D366?style=for-the-badge&logo=whatsapp&logoColor=white">
</a><a href="https://github.com/seth-16-one/SethBot-MD">
<img src="https://img.shields.io/badge/GITHUB-REPOSITORY-black?style=for-the-badge&logo=github">
</a>
</p></div>---

🚀 Overview

SethBot-MD is a modern WhatsApp Multi-Device bot built with Baileys and Node.js.

The bot supports:

- Pairing Code Login
- WhatsApp Multi Device
- AI Commands
- Group Management
- Media Downloaders
- Auto Status Features
- Anti Delete
- Anti Link
- Anti Badword
- PM Blocker
- Multi-Customer Deployment
- Oracle VPS Hosting
- PM2 Process Management

---

✨ Features

Feature| Supported
Pairing Code Login| ✅
Multi Device| ✅
Auto Read| ✅
Auto Typing| ✅
Auto Status View| ✅
Status Reactions| ✅
Anti Delete| ✅
Anti Link| ✅
Anti Badword| ✅
PM Blocker| ✅
Anti Call| ✅
AI Commands| ✅
Downloaders| ✅
Stickers| ✅
Games| ✅
Group Management| ✅
VPS Hosting| ✅
Multi Customer Support| ✅

---

🔗 Pairing Website

Generate pairing codes instantly:

https://knight-bot-paircode.onrender.com

---

📦 Installation

Clone Repository

git clone https://github.com/seth-16-one/SethBot-MD.git
cd SethBot-MD

Install Dependencies

npm install

Start Bot

node index.js

---

🔐 Pairing Code Login

Run:

node index.js --pairing-code

Enter your WhatsApp number without the plus sign.

Example:

254712345678

Open WhatsApp:

Settings → Linked Devices → Link a Device

Enter the generated pairing code.

---

🖥 Oracle VPS Deployment

Install Node.js:

sudo dnf install nodejs -y

Clone Repository:

git clone https://github.com/seth-16-one/SethBot-MD.git
cd SethBot-MD

Install packages:

npm install

Pair account:

node index.js --pairing-code

Start with PM2:

pm2 start index.js --name seth-bot

Save PM2:

pm2 save

Enable startup:

pm2 startup

---

☁️ Render Deployment

Build Command:

npm install

Start Command:

node index.js

Environment Variables:

OWNER_NUMBER=254700000000

---

🚂 Railway Deployment

Environment Variables:

OWNER_NUMBER=254700000000

Deploy directly from GitHub repository.

---

🔥 Heroku Deployment

Install Heroku CLI.

Login:

heroku login

Create App:

heroku create your-app-name

Set Variables:

heroku config:set OWNER_NUMBER=254700000000

Deploy:

git push heroku main

Logs:

heroku logs --tail

---

🚀 Koyeb Deployment

1. Create Service
2. Connect GitHub Repository
3. Add Environment Variables
4. Deploy

Environment Variables:

OWNER_NUMBER=254700000000

---

👥 Multi-Customer Deployment

SethBot-MD supports multiple customers using a single shared codebase.

Create Customer

mkdir -p /opt/whatsapp-bots/customers/customer1/data
mkdir -p /opt/whatsapp-bots/customers/customer1/session

Copy default data:

cp -a data/. /opt/whatsapp-bots/customers/customer1/data/

Run customer:

DATA_DIR=/opt/whatsapp-bots/customers/customer1/data \
SESSION_DIR=/opt/whatsapp-bots/customers/customer1/session \
OWNER_NUMBER=254700000000 \
pm2 start index.js --name customer1-bot

Each customer gets:

- Independent Session
- Independent Settings
- Independent Owner
- Independent Auto Status
- Independent PM Blocker
- Independent Anti Delete
- Independent Auto Read

---

⚙ Environment Variables

OWNER_NUMBER=254700000000
DATA_DIR=./data
SESSION_DIR=./session
PORT=3000

---

📊 PM2 Commands

Start:

pm2 start index.js --name seth-bot

Restart:

pm2 restart seth-bot

View Logs:

pm2 logs seth-bot

Monitor:

pm2 monit

Save:

pm2 save

---

🔄 Updating

git pull
npm install
pm2 restart all

---

🤝 Contributing

Contributions are welcome.

1. Fork Repository
2. Create Branch
3. Make Changes
4. Commit Changes
5. Submit Pull Request

---

👨‍💻 Developer

Seth Tech

GitHub:
https://github.com/seth-16-one

Pairing Website:
https://knight-bot-paircode.onrender.com

---

⚠ Disclaimer

This project is intended for educational purposes only.

Users are responsible for complying with WhatsApp Terms of Service and local laws.

The developer assumes no responsibility for misuse of this software.

---

<div align="center">⚡ Built with ❤️ by Seth Tech ⚡

</div>