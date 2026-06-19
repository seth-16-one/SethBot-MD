
SethBot-MD

A powerful WhatsApp Multi-Device bot built with Baileys and Node.js.

Features

- Pairing Code Login
- Multi-Device Support
- Auto Read
- Auto Status View
- Auto Status Reactions
- Anti Delete
- Anti Link
- Anti Bad Word
- PM Blocker
- Anti Call
- AI Commands
- Media Downloaders
- Group Management
- Games & Fun Commands
- Multi-Customer Support
- VPS Ready
- PM2 Ready

---

Requirements

- Node.js 20+
- Git
- PM2
- Linux VPS (Ubuntu, Debian, Oracle Linux)

---

Installation

Clone Repository

git clone https://github.com/seth-16-one/SethBot-MD.git
cd SethBot-MD

Install Dependencies

npm install

Start Bot

node index.js

---

Pairing Code Login

node index.js --pairing-code

Enter your WhatsApp number when prompted.

Then open:

Settings → Linked Devices → Link a Device

and enter the pairing code.

---

VPS Deployment

Start with PM2

pm2 start index.js --name seth-bot

Save PM2

pm2 save

Enable Startup

pm2 startup

---

Multi-Customer Deployment

Create customer folders:

mkdir -p /opt/whatsapp-bots/customers/customer1/data
mkdir -p /opt/whatsapp-bots/customers/customer1/session

Copy default data:

cp -a data/. /opt/whatsapp-bots/customers/customer1/data/

Run customer:

DATA_DIR=/opt/whatsapp-bots/customers/customer1/data \
SESSION_DIR=/opt/whatsapp-bots/customers/customer1/session \
OWNER_NUMBER=254700000000 \
pm2 start index.js --name customer1-bot

---

Environment Variables

Supported Variables:

OWNER_NUMBER=254700000000
DATA_DIR=./data
SESSION_DIR=./session
PORT=3000

---

Render Deployment

1. Fork repository
2. Create a Web Service
3. Connect GitHub repository

Build Command:

npm install

Start Command:

node index.js

Environment Variables:

OWNER_NUMBER=254700000000

---

Heroku Deployment

Install Heroku CLI:

heroku login

Create App:

heroku create your-app-name

Set Environment Variables:

heroku config:set OWNER_NUMBER=254700000000

Deploy:

git push heroku main

View Logs:

heroku logs --tail

---

Railway Deployment

1. Create Railway Project
2. Connect GitHub Repository
3. Deploy Automatically

Environment Variables:

OWNER_NUMBER=254700000000

---

Koyeb Deployment

1. Create Service
2. Connect Repository
3. Deploy

Environment Variables:

OWNER_NUMBER=254700000000

---

Oracle VPS Deployment

Install Node.js:

sudo dnf install nodejs -y

Clone Repository:

git clone https://github.com/seth-16-one/SethBot-MD.git

Install Dependencies:

npm install

Run Bot:

node index.js --pairing-code

Production:

pm2 start index.js --name seth-bot
pm2 save

---

Updating

git pull
npm install
pm2 restart all

---

Support

Developer: Seth Tech

GitHub:
https://github.com/seth-16-one

---

Disclaimer

This project is intended for educational purposes. Users are responsible for complying with WhatsApp Terms of Service and all applicable laws.
