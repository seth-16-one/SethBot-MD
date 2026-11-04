<div align="center">
<img src="https://raw.githubusercontent.com/seth-16-one/SethBot-MD/main/assets/bot_image.jpg" width="280"/>

### Powerful WhatsApp Multi-Device Bot
 src="https://readme-typing-svg.herokuapp.com?font=Orbitron&size=22&duration=2500&pause=1000&color=39FF14&center=true&vCenter=true&width=800&lines=WhatsApp+Multi+Device+Bot;Pairing+Code+Support;Oracle+VPS+Ready;Multi+Customer+Architecture;PM2+Ready;Built+By+Seth+Tech" />
</div>
<br>
<a href="https://knight-bot-paircode.onrender.com">
<img src="https://img.shields.io/badge/PAIRING-WEBSITE-25D366?style=for-the-badge&logo=whatsapp&logoColor=white">
</a><a href="https://github.com/seth-16-one/SethBot-MD">
<img src="https://img.shields.io/badge/GITHUB-REPOSITORY-black?style=for-the-badge&logo=github">
</a><br><br>

<img src="https://img.shields.io/badge/Node.js-20+-green?style=for-the-badge&logo=node.js">
<img src="https://img.shields.io/badge/Baileys-Latest-blue?style=for-the-badge">
<img src="https://img.shields.io/badge/Platform-WhatsApp-25D366?style=for-the-badge&logo=whatsapp"></div>---

🚀 Overview

SethBot-MD is a modern WhatsApp Multi-Device Bot built with Baileys and Node.js.

Designed for:

- Individual users
- Businesses
- Communities
- Multi-customer hosting
- VPS deployments
- WhatsApp automation

---

# 🧠 How It Works (Managed VPS / Multi-Customer Hosting)

SethBot-MD is built so that **one shared codebase + one `node_modules` tree
can host many WhatsApp customers on a single managed VPS** — without
duplicating the source code or running `npm install` for every customer.

This is the difference between the old, wasteful way and the way SethBot-MD
works:

```text
OLD WAY (one copy per customer — wasteful)        SETHBOT WAY (shared codebase)
┌──────────────────────────────────────┐          ┌──────────────────────────────────────┐
│ ~/customer1-bot/  (code + modules)   │          │ ~/whatsapp-bots/shared/sethbot/      │
│ ~/customer2-bot/  (code + modules)   │          │   index.js  main.js  commands/       │
│ ~/customer3-bot/  (code + modules)   │          │   lib/  node_modules/  package.json  │
│  × 3 codebases                        │          │   └─ ONE copy of everything          │
│  × 3 npm installs (≈600 pkgs each)    │          │   └─ ONE npm install                │
│  × 3 things to update                 │          │   └─ ONE thing to update            │
└──────────────────────────────────────┘          │                                       │
                                                  │ ~/whatsapp-bots/customers/           │
                                                  │   ├── seth/   data session temp tmp   │
                                                  │   ├── brayo/  data session temp tmp   │
                                                  │   └── .../    (only DATA, no code)    │
                                                  └──────────────────────────────────────┘
```

**How isolation is achieved with a single codebase:**

- Every customer runs as its **own PM2 process** (its own RAM, its own
  crash isolation, its own restart policy).
- Each process is told, through **environment variables**, where its own
  data, session, temp, and message-store files live. There is exactly **one
  copy of the source code** on disk; each process just points at a different
  set of customer folders.
- Per customer, the bot keeps **separate**:
  - WhatsApp auth session (`SESSION_DIR`) — so logins never mix
  - Message & contact store (`STORE_FILE`) — so chats never leak
  - Anti-delete media & sticker temp (`TMP_DIR`, `TEMP_DIR`) — so files never
    collide
  - Config, counters, sudo list, `owner.json` (`DATA_DIR`) — so settings and
    owners are per-customer
- The **owner** of each bot is resolved per-customer (`OWNER_NUMBER` env →
  `DATA_DIR/owner.json` → `settings.ownerNumber`), so each customer's owner
  is the only one who can run owner commands on their bot.

**Why this matters for a managed VPS:**

- **Disk:** one `node_modules` (~hundreds of MB) instead of one per customer.
  10 customers ≈ 1× the code, not 10×.
- **Updates:** `git pull && npm install` once in the shared folder updates
  every customer on the next `pm2 restart all`. No per-customer updates.
- **RAM:** each customer is its own lightweight Node process, so one
  customer crashing or being restarted does not affect the others.
- **Onboarding a new customer:** create 5 empty folders + run one PM2
  command. No clone, no install, no code copy.
- **Backward compatible:** set no environment variables and the bot uses the
  original single-customer defaults (`./data`, `./session`, …), so a normal
  one-user `node index.js` deployment keeps working exactly as before.

See the **👥 Multi-Customer Hosting** section below for the exact commands.

---

✨ Features

Feature| Status
Pairing Code Login| ✅
WhatsApp Multi Device| ✅
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
Games| ✅
Group Management| ✅
Multi Customer Support| ✅
----

# 📋 Command Categories

```text
General Commands
Admin Commands
Owner Commands
AI Commands
Downloader Commands
Fun Commands
Image Commands
Game Commands
Group Commands
```

Use:
.help
or
.menu

----

# 💬 Customer Support

Need a hosted bot?

Contact:

```text
WhatsApp:
+254717246928

Developer:
Seth Tech
```

----
# ⚡ Quick Installation (single customer)

For a normal, one-user deployment on your own machine or VPS:

```bash
git clone https://github.com/seth-16-one/SethBot-MD.git

cd SethBot-MD

npm install

node index.js --pairing-code
```

After pairing:

```bash
pm2 start index.js --name seth-bot

pm2 save
```

> Hosting **many** WhatsApp users on one managed VPS with a single shared
> codebase (no duplicated code, no per-user `node_modules`)? Skip ahead to
> **🧠 How It Works** and **👥 Multi-Customer Hosting** below.
---

🔐 Pairing Code Login

Generate a pairing code:

node index.js --pairing-code

Then on WhatsApp:

Settings
↓
Linked Devices
↓
Link a Device
↓
Enter Pairing Code

Pairing Website:

https://knight-bot-paircode.onrender.com

---

🖥 Oracle VPS Deployment

<details>
<summary>Click To Expand</summary>sudo dnf install git -y

sudo dnf install nodejs -y

git clone https://github.com/seth-16-one/SethBot-MD.git

cd SethBot-MD

npm install

node index.js --pairing-code

Production:

pm2 start index.js --name seth-bot

pm2 save

pm2 startup

</details>---

👥 Multi-Customer Hosting (Shared Codebase)

<details>
<summary>Click To Expand</summary>

**The managed-VPS model:** one shared codebase + one `node_modules` hosts
many WhatsApp customers. Each customer is its own PM2 process and writes only
to its own directories, so sessions, message stores, temp media and configs
never overlap. No source code is duplicated and no per-customer `npm install`
is needed. (See the *How It Works* section above for the full rationale.)

Recommended layout:

```text
~/whatsapp-bots/
├── shared/
│   └── sethbot/              # the single shared codebase + node_modules
│       ├── index.js
│       ├── main.js
│       ├── commands/
│       ├── lib/
│       ├── node_modules/
│       └── package.json
└── customers/
    ├── seth/
    │   ├── data/             # DATA_DIR    (configs, counters, sudo, owner.json)
    │   ├── session/          # SESSION_DIR (Baileys auth)
    │   ├── temp/             # TEMP_DIR    (download/transcode scratch)
    │   ├── tmp/              # TMP_DIR     (sticker/antidelete media cache)
    │   └── baileys_store.json# STORE_FILE  (message/contact store)
    └── brayo/
        ├── data/
        ├── session/
        ├── temp/
        ├── tmp/
        └── baileys_store.json
```

The directories are selected purely through environment variables — no source
code is duplicated and no per-customer `npm install` is needed.

Environment variables (all optional; defaults preserve single-customer behavior):

```env
CUSTOMER_ID=seth
DATA_DIR=/home/user/whatsapp-bots/customers/seth/data
SESSION_DIR=/home/user/whatsapp-bots/customers/seth/session
TEMP_DIR=/home/user/whatsapp-bots/customers/seth/temp
TMP_DIR=/home/user/whatsapp-bots/customers/seth/tmp
STORE_FILE=/home/user/whatsapp-bots/customers/seth/baileys_store.json
OWNER_NUMBER=2547XXXXXXXX
```

When a variable is omitted the original default (relative to the codebase)
is used, so a single-customer `node index.js` deployment keeps working
exactly as before.

### 1. Deploy the shared codebase (once)

```bash
mkdir -p ~/whatsapp-bots/shared
cd ~/whatsapp-bots/shared
git clone https://github.com/seth-16-one/SethBot-MD.git sethbot
cd sethbot
npm install
```

### 2. Create and pair a new customer

```bash
CUSTOMER=seth
OWNER=2547XXXXXXXX            # the customer's WhatsApp number, no +

mkdir -p ~/whatsapp-bots/customers/$CUSTOMER/{data,session,temp,tmp}

# (Optional) seed an owner.json so the bot knows the owner before pairing.
# The bot will never overwrite this file.
echo "[\"$OWNER\"]" > ~/whatsapp-bots/customers/$CUSTOMER/data/owner.json

cd ~/whatsapp-bots/shared/sethbot

# Pair interactively (prints a pairing code on the terminal):
CUSTOMER_ID=$CUSTOMER \
DATA_DIR=~/whatsapp-bots/customers/$CUSTOMER/data \
SESSION_DIR=~/whatsapp-bots/customers/$CUSTOMER/session \
TEMP_DIR=~/whatsapp-bots/customers/$CUSTOMER/temp \
TMP_DIR=~/whatsapp-bots/customers/$CUSTOMER/tmp \
STORE_FILE=~/whatsapp-bots/customers/$CUSTOMER/baileys_store.json \
OWNER_NUMBER=$OWNER \
node index.js --pairing-code
```

Open WhatsApp → Settings → Linked Devices → Link a Device → enter the code.
Once linked, stop the process (Ctrl+C) and start it under PM2 (next step).

### 3. Start the customer under PM2

Use the same `$CUSTOMER` variable for every path so the customer's folders
and PM2 process name always match:

```bash
CUSTOMER=seth
OWNER=2547XXXXXXXX

cd ~/whatsapp-bots/shared/sethbot

CUSTOMER_ID=$CUSTOMER \
DATA_DIR=~/whatsapp-bots/customers/$CUSTOMER/data \
SESSION_DIR=~/whatsapp-bots/customers/$CUSTOMER/session \
TEMP_DIR=~/whatsapp-bots/customers/$CUSTOMER/temp \
TMP_DIR=~/whatsapp-bots/customers/$CUSTOMER/tmp \
STORE_FILE=~/whatsapp-bots/customers/$CUSTOMER/baileys_store.json \
OWNER_NUMBER=$OWNER \
pm2 start index.js --name "$CUSTOMER-bot"
```

> Tip: store each customer's full command in a small script
> (`~/whatsapp-bots/start-seth.sh`, `start-brayo.sh`, …) so you can
> re-create the PM2 process in one line if needed. Or use the
> `ecosystem.example.cjs` file in the repo to declare all customers in one
> PM2 config (`pm2 start ecosystem.config.cjs`).

Repeat steps 2–3 for every customer (brayo, customer3, ...), giving each a
unique `CUSTOMER_ID`, its own directories and its own PM2 `--name`.

### 4. Persist PM2 across reboots (no sudo needed for the user's own services)

```bash
pm2 save
pm2 startup            # run the one-time command PM2 prints, then:
# (PM2 prints a single command to copy-paste; that line does need sudo once
#  to install the systemd unit, but running the bots themselves never does.)
```

### 5. Update the shared codebase (affects all customers on next restart)

```bash
cd ~/whatsapp-bots/shared/sethbot
git pull
npm install            # only if dependencies changed
pm2 restart all        # or restart customers individually
```

</details>---

⚙ Environment Variables

| Variable | Purpose | Default (single-customer) |
|---|---|---|
| `CUSTOMER_ID` | Label used in startup logs | `default` |
| `DATA_DIR` | Customer config/counters/`owner.json` | `./data` |
| `SESSION_DIR` | Baileys auth/session folder | `./session` |
| `TEMP_DIR` | Download/transcode scratch | `./temp` |
| `TMP_DIR` | Sticker/antidelete media cache | `./tmp` |
| `STORE_FILE` | Baileys message/contact store | `./baileys_store.json` |
| `OWNER_NUMBER` | Customer's owner number(s) (comma-separated allowed) | `settings.ownerNumber` / `DATA_DIR/owner.json` |

Owner resolution priority: `OWNER_NUMBER` env → `DATA_DIR/owner.json` →
`settings.ownerNumber`. The bot only ever *reads* `owner.json`; it never
creates or overwrites it.

---

📊 PM2 Commands

Single customer (legacy):

Start: `pm2 start index.js --name seth-bot`
Restart: `pm2 restart seth-bot`
Logs: `pm2 logs seth-bot`
Monitor: `pm2 monit`
Save: `pm2 save`

Multi-customer (one PM2 process per customer, shared codebase):

Start one customer (see the Multi-Customer Hosting section for the full
command with all env vars): `pm2 start index.js --name seth-bot`

Stop one customer: `pm2 stop seth-bot`
Restart one customer: `pm2 restart seth-bot`
Restart all customers: `pm2 restart all`
List all customers: `pm2 list`
Logs for one customer: `pm2 logs seth-bot`
Live monitor (all customers): `pm2 monit`
Save the process list (survives reboots): `pm2 save`

Note: never start two PM2 processes with the same `SESSION_DIR` — that would
make two processes share one WhatsApp session. Each customer must point at its
own `SESSION_DIR`.


# 🔑 SESSION_ID deployment

The bot can start from a **SESSION_ID** instead of a pairing code typed on the server. Pair on the pairing website (**Pair code** or **QR code**), copy the `SETHBOT~...` ID it shows (a copy also arrives in your own WhatsApp chat), then give it to the bot in one of two ways:

```bash
# 1) environment variable
SESSION_ID=SETHBOT~eyJ...

# 2) or a file named session.txt next to index.js containing only the ID
```

How it behaves:

- The ID is applied once; on restart the bot keeps the fresher credentials it has saved since.
- A **new** SESSION_ID replaces the old credentials.
- If WhatsApp logs the session out, the bot clears it and refuses that ID on the next restart (no crash loop). Generate a new ID.
- With no SESSION_ID the bot works as before (existing session folder, QR or pairing code).
- `PAIR_SERVER_URL` (optional) points the `.pair` command at your pairing server. See `.env.example`.

Keep the SESSION_ID private: it is a login for the WhatsApp account.

# 🏗 Architecture

```text
Shared Codebase
        │
        ├── Seth
        ├── Brayo
        ├── Rankyz
        ├── Khisa
        ├── Hannington
        └── Future Customers
```

Each customer has:

data/
session/

stored independently.

---

☁ Render Deployment

<details>
<summary>Click To Expand</summary>Build Command:

npm install

Start Command:

node index.js

Environment Variables:

OWNER_NUMBER=254700000000

</details>---

🚂 Railway Deployment

<details>
<summary>Click To Expand</summary>Connect Repository

Deploy Automatically

Environment Variables:

OWNER_NUMBER=254700000000

</details>---

🟣 Heroku Deployment

<details>
<summary>Click To Expand</summary>Install Heroku CLI:

heroku login

Create App:

heroku create your-app-name

Set Environment Variables:

heroku config:set OWNER_NUMBER=254700000000

Deploy:

git push heroku main

Logs:

heroku logs --tail

</details>---

☁ Koyeb Deployment

<details>
<summary>Click To Expand</summary>Connect Repository

Deploy Service

Add Variables:

OWNER_NUMBER=254700000000

</details>---

🔄 Updating

Single customer:

```bash
git pull
npm install            # only if dependencies changed
pm2 restart all
```

Shared-codebase (multi-customer) — update once, every customer picks it up on
the next restart:

```bash
cd ~/whatsapp-bots/shared/sethbot
git pull
npm install            # only if dependencies changed
pm2 restart all        # restarts every customer process at once
```

No per-customer clone, install, or copy is ever needed.

---

📞 Support

Developer: Seth Tech

GitHub:

https://github.com/seth-16-one

Pairing Website:

https://knight-bot-paircode.onrender.com

---

⚠ Disclaimer

This project is intended for educational purposes only.

Users are responsible for complying with WhatsApp Terms of Service and all applicable laws.

---

<div align="center">⚡ BUILT WITH ❤️ BY SETH TECH ⚡
# 📸 Preview

<img src="https://raw.githubusercontent.com/seth-16-one/SethBot-MD/main/assets/bot_image.jpg" width="500"/>
<img src="https://readme-typing-svg.herokuapp.com?font=Orbitron&size=18&duration=2500&pause=1000&color=39FF14&center=true&vCenter=true&width=500&lines=Thank+You+For+Using+SethBot-MD;Fast+•+Secure+•+Powerful;WhatsApp+Automation+Made+Easy" /></div>
