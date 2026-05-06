# Public Demo via Cloudflare Tunnel

Cloudflare Tunnel exposes your local NodeScope instance to the internet without opening any ports or configuring a VPS. This is the fastest way to share a live demo from a laptop or development machine.

---

## Requirements

- A free Cloudflare account
- `cloudflared` CLI installed
- NodeScope running locally (`make backend` + `make frontend`)

---

## 1. Install cloudflared

**Linux:**
```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
cloudflared --version
```

**macOS:**
```bash
brew install cloudflared
```

---

## 2. Quick Tunnel (No Account Required)

For a temporary demo URL (valid for the session only):

```bash
# Expose the API
cloudflared tunnel --url http://localhost:8000

# In another terminal, expose the frontend
cloudflared tunnel --url http://localhost:5173
```

Cloudflare will print a random `.trycloudflare.com` URL for each service. Share the frontend URL with reviewers.

> The frontend Vite proxy routes `/health`, `/summary`, `/events/*`, etc. to `localhost:8000`. When accessed via a tunnel, this proxy works only in development mode (`npm run dev`). For a public demo, use the API tunnel URL directly or build the frontend with the correct API base URL.

---

## 3. Named Tunnel (Persistent URL)

For a stable demo URL using your own domain:

```bash
# Authenticate with Cloudflare
cloudflared tunnel login

# Create a named tunnel
cloudflared tunnel create nodescope-demo

# Route your domain to the tunnel
cloudflared tunnel route dns nodescope-demo demo.your-domain.com

# Configure the tunnel
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml <<'EOF'
tunnel: <your-tunnel-id>
credentials-file: /home/<user>/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: demo.your-domain.com
    service: http://localhost:8000
  - service: http_status:404
EOF

# Run the tunnel
cloudflared tunnel run nodescope-demo
```

Replace `<your-tunnel-id>` and `<user>` with your actual values from `cloudflared tunnel create`.

---

## 4. Demo Setup for Judges

When sharing a live demo:

1. Start NodeScope locally:
   ```bash
   make backend
   make monitor   # if Bitcoin Core is running
   make frontend
   ```

2. Start the tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```

3. Share the tunnel URL. Judges can access the API directly:
   ```bash
   curl https://<tunnel-url>/health | jq .
   curl https://<tunnel-url>/events/recent | jq .
   ```

4. For the dashboard, build the frontend with the tunnel URL as the API base:
   ```bash
   cd frontend
   VITE_API_PROXY_TARGET=https://<tunnel-url> npm run build
   # Then serve dist/ or open another tunnel for localhost:4173 (vite preview)
   ```

---

## Notes

- Free Cloudflare Tunnels have no bandwidth limits but may have latency overhead.
- Named tunnels require a Cloudflare-managed domain or a domain with Cloudflare nameservers.
- For the SSE stream to work through the tunnel, ensure the tunnel connection is not terminated by a proxy with buffering enabled. Cloudflare Tunnels support streaming by default.
- Always shut down the tunnel after the demo to avoid unintended access to your local node.
