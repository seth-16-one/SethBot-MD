
<div align="center">" <img src="https://raw.githubusercontent.com/seth-16-one/SethBot-MD/main/assets/bot_image.jpg" width="280"/>⚡ SETHBOT-MD ⚡

Powerful WhatsApp Multi-Device Bot

<p align="center">

<a href="https://knight-bot-paircode.onrender.com">
<img src="https://img.shields.io/badge/PAIR-NOW-success?style=for-the-badge&logo=whatsapp">
</a>

<a href="https://github.com/seth-16-one/SethBot-MD">
<img src="https://img.shields.io/badge/GITHUB-Repository-black?style=for-the-badge&logo=github">
</a>

</p><p align="center">
<img src="https://readme-typing-svg.herokuapp.com?font=Orbitron&size=24&duration=3000&pause=1000&center=true&vCenter=true&width=700&lines=SETHBOT-MD;WhatsApp+Multi+Device+Bot;Pairing+Code+Support;Multi-Customer+Architecture;Powered+by+Seth+Tech" />
</p>""PAIR NOW" (https://img.shields.io/badge/PAIR-NOW-success?style=for-the-badge&logo=whatsapp)" (https://knight-bot-paircode.onrender.com)

""GITHUB" (https://img.shields.io/badge/GITHUB-Repository-black?style=for-the-badge&logo=github)" (https://github.com/seth-16-one/SethBot-MD)

</div>---

✨ Features

- Pairing Code Login
- WhatsApp Multi Device
- Auto Read
- Auto Typing
- Auto Status View
- Status Reactions
- Anti Delete
- Anti Link
- Anti Badword
- PM Blocker
- Anti Call
- AI Commands
- Downloaders
- Games
- Group Management
- Stickers
- Image Tools
- Multi-Customer Architecture
- PM2 Ready
- VPS Ready

---

📦 Installation

Clone Repository

```bash
git clone https://github.com/seth-16-one/SethBot-MD.git
cd SethBot-MD
```

Install Packages

```bash
npm install
```

Start Bot

```bash
node index.js
```

---

🔗 Pairing Code Login

```bash
node index.js --pairing-code
```

Then:

WhatsApp → Settings → Linked Devices → Link a Device

---

🖥 VPS Deployment

```bash
npm install
pm2 start index.js --name seth-bot
pm2 save
pm2 startup
```

---

☁️ Render Deployment

Build Command:

```
npm install
```

Start Command:

```
node index.js
```

Environment Variables:

```env
OWNER_NUMBER=254700000000
```

---

🚂 Railway Deployment

Environment Variables:

```env
OWNER_NUMBER=254700000000
```

---

🔥 Heroku Deployment

Create App:

```bash
heroku create your-app-name
```

Set Variables:

```bash
heroku config:set OWNER_NUMBER=254700000000
```

Deploy:

```bash
git push heroku main
```

---

🖥 Oracle VPS Deployment

Install Node:

```bash
sudo dnf install nodejs -y
```

Clone:

```bash
git clone https://github.com/seth-16-one/SethBot-MD.git
cd SethBot-MD
```

Install:

```bash
npm install
```

Pair:

```bash
node index.js --pairing-code
```

Production:

```bash
pm2 start index.js --name seth-bot
pm2 save
```

---

👥 Multi-Customer Setup

Create folders:

```bash
mkdir -p /opt/whatsapp-bots/customers/customer1/data
mkdir -p /opt/whatsapp-bots/customers/customer1/session
```

Copy data:

```bash
cp -a data/. /opt/whatsapp-bots/customers/customer1/data/
```

Run customer:

```bash
DATA_DIR=/opt/whatsapp-bots/customers/customer1/data 
SESSION_DIR=/opt/whatsapp-bots/customers/customer1/session 
OWNER_NUMBER=254700000000 
pm2 start index.js --name customer1-bot
```

---

⚙ Environment Variables

```env
OWNER_NUMBER=254700000000
DATA_DIR=./data
SESSION_DIR=./session
PORT=3000
```

---

🔄 Updating

```bash
git pull
npm install
pm2 restart all
```

---

👨‍💻 Developer

Seth Tech

GitHub:
https://github.com/seth-16-one

Pairing Website:
https://knight-bot-paircode.onrender.com

---

⚠ Disclaimer

This project is for educational purposes only. Users are responsible for complying with WhatsApp Terms of Service and applicable laws.

<div align="center">⚡ Built With Passion By Seth Tech ⚡

</div>
