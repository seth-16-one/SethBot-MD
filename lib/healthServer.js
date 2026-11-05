// lib/healthServer.js
// Tiny built-in web server (Node's own http module, no extra dependency).
// Many hosts (Heroku "web" dynos, Render web services, Docker panels) expect the app to listen
// on $PORT and mark it as crashed if nothing answers. It also gives uptime monitors a URL to ping.
// It exposes nothing sensitive: no QR, no session, no config.
//
//   PORT=3000                 port to listen on (Heroku/Render set it for you)
//   DISABLE_WEB_SERVER=true   do not start it
const http = require('http');

const state = { status: 'starting', phone: null, since: Date.now() };

function setStatus(status, phone) {
    state.status = status;
    if (phone) state.phone = phone;
}

function startHealthServer(name = 'SethBot-MD') {
    if (String(process.env.DISABLE_WEB_SERVER || '').toLowerCase() === 'true') return null;

    const port = Number(process.env.PORT) || 3000;
    const server = http.createServer((req, res) => {
        const body = JSON.stringify({
            bot: name,
            status: state.status,
            uptimeSeconds: Math.round(process.uptime())
        });
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(req.method === 'HEAD' ? undefined : body);
    });

    // A busy port must never stop the bot itself.
    server.on('error', (err) => {
        console.error(`⚠️ Web server could not start on port ${port} (${err.code || err.message}). The bot keeps running without it.`);
    });
    server.listen(port, '0.0.0.0', () => console.log(`🌐 Web server listening on port ${port}`));
    server.unref();
    return server;
}

module.exports = { startHealthServer, setStatus };
