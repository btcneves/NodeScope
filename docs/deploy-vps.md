# Deploying NodeScope on a VPS

This guide covers deploying NodeScope on a Linux VPS with nginx as a reverse proxy and systemd for service management.

> **Important:** NodeScope's Phase 1 API has no authentication. Follow all security steps below before exposing any port beyond localhost.

---

## Requirements

- Ubuntu 22.04 or Debian 12 (tested)
- Python 3.12+, Node.js 18+, Git
- Bitcoin Core 26+ installed and synced (regtest or signet)
- Domain name with DNS pointing to your server (for TLS)
- Ports 80 and 443 open in your firewall

---

## 1. Firewall Setup

```bash
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 8000/tcp       # API — served via proxy only
ufw deny 5173/tcp       # Frontend — served via proxy only
ufw deny 18443/tcp      # Bitcoin Core RPC — never expose
ufw deny 28332/tcp      # ZMQ rawblock — loopback only
ufw deny 28333/tcp      # ZMQ rawtx — loopback only
ufw enable
```

---

## 2. Bitcoin Core Setup

Configure Bitcoin Core to listen on loopback only:

```bash
mkdir -p ~/.bitcoin
cp bitcoin.conf.example ~/.bitcoin/bitcoin.conf
```

Edit `~/.bitcoin/bitcoin.conf`:
```ini
regtest=1
server=1
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
rpcuser=nodescope
rpcpassword=<strong-random-password>
zmqpubrawtx=tcp://127.0.0.1:28333
zmqpubrawblock=tcp://127.0.0.1:28332
txindex=1
fallbackfee=0.0001
```

Replace `<strong-random-password>` and update `.env` accordingly.

Start Bitcoin Core:

```bash
bitcoind -daemon
bitcoin-cli -regtest getblockchaininfo
```

---

## 3. NodeScope Setup

```bash
git clone https://github.com/btcneves/NodeScope.git /opt/nodescope
cd /opt/nodescope
cp .env.example .env
# Edit .env with your Bitcoin Core credentials
make setup
```

---

## 4. Systemd Services

**API service** — `/etc/systemd/system/nodescope-api.service`:

```ini
[Unit]
Description=NodeScope API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/nodescope
EnvironmentFile=/opt/nodescope/.env
ExecStart=/opt/nodescope/.venv/bin/python scripts/run_api.py --host 127.0.0.1 --port 8000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Monitor service** — `/etc/systemd/system/nodescope-monitor.service`:

```ini
[Unit]
Description=NodeScope ZMQ Monitor
After=network.target nodescope-api.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/nodescope
EnvironmentFile=/opt/nodescope/.env
ExecStart=/opt/nodescope/.venv/bin/python monitor.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nodescope-api nodescope-monitor
sudo systemctl status nodescope-api nodescope-monitor
```

---

## 5. Frontend Build

For production, build the static frontend and serve it via nginx:

```bash
cd /opt/nodescope/frontend
npm ci
npm run build
# Output: frontend/dist/
```

---

## 6. nginx Configuration

Install nginx and Certbot:

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/nodescope`:

```nginx
server {
    server_name your-domain.example.com;

    # Static frontend
    location / {
        root /opt/nodescope/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # SSE stream — disable buffering
    location /events/stream {
        proxy_pass http://127.0.0.1:8000/events/stream;
        proxy_set_header Host $host;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        chunked_transfer_encoding on;
    }

    listen 80;
}
```

Enable and get TLS certificate:

```bash
ln -s /etc/nginx/sites-available/nodescope /etc/nginx/sites-enabled/
nginx -t
certbot --nginx -d your-domain.example.com
systemctl reload nginx
```

---

## 7. Verification

```bash
curl https://your-domain.example.com/health | jq '{status, rpc_ok}'
```

Expected: `{"status": "ok", "rpc_ok": true}`.

---

## Notes

- The API has no authentication in Phase 1. For any public deployment, add HTTP Basic Auth at the nginx level using `auth_basic` directives, or place an API key middleware in front.
- Rotate the NDJSON logs periodically using `logrotate` if running long-term.
- Monitor disk usage in `/opt/nodescope/logs/` — each daily file grows with node activity.
