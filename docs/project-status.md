# Project Status

The canonical delivery status is maintained in [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md).

Official evaluator flow:

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
cp .env.example .env
docker compose up -d --build
make docker-demo
make smoke
```

Open `http://localhost:5173`.
