# PolAlfa Backend API

FastAPI backend for analyzing Polymarket trader wallets.

## Overview

PolAlfa analyzes Polymarket wallets to rank traders by profitability and consistency. The backend:

- Fetches data from official Polymarket APIs (Gamma Markets API + Data API)
- Analyzes wallet trading history and performance
- Calculates key metrics: hit rate, ROI, trader score
- Returns ranked wallet analysis

## Tech Stack

- **Python 3.10+**
- **FastAPI** - Modern async web framework
- **aiohttp** - Async HTTP client for Polymarket APIs
- **uvicorn** - ASGI server

## API Endpoints

### Health Check

```
GET /
GET /health
```

Returns service status.

### Analyze Wallets

```
POST /api/analyze-wallets
```

**Request Body:**
```json
{
  "wallets": ["0xWallet1", "0xWallet2"],
  "range": "30d"
}
```

- `wallets`: List of 1-10 wallet addresses (proxy wallets)
- `range`: Time window - "7d", "30d", or "90d"

**Response:**
```json
{
  "range": "30d",
  "wallets": [
    {
      "wallet": "0x...",
      "hit_rate": 0.72,
      "roi": 0.35,
      "realized_pnl": 123.45,
      "total_volume_traded": 987.65,
      "last_trade_time": "2025-11-20T12:34:56Z",
      "trader_score": 0.81,
      "resolved_markets": 25,
      "profitable_markets": 18,
      "markets": [...]
    }
  ]
}
```

## Metrics Explained

### Hit Rate
Percentage of resolved markets that were profitable.
```
hit_rate = profitable_markets / resolved_markets
```

### ROI (Return on Investment)
Realized profit/loss as percentage of capital deployed.
```
roi = realized_pnl / total_stake_on_resolved_markets
```

### Trader Score
Composite metric combining profitability, consistency, and activity:
```
trader_score = 0.4 × normalized_roi + 0.4 × hit_rate + 0.2 × recency_score
```

- **normalized_roi**: ROI capped at 100% (1.0)
- **hit_rate**: Win rate on resolved markets (0.0-1.0)
- **recency_score**: Exponential decay based on days since last trade

## Polymarket APIs Used

All endpoints are from official Polymarket documentation:
- **Docs**: https://docs.polymarket.com
- **Rate Limits**: 100 requests per 60 seconds per IP

### Gamma Markets API
Base URL: `https://gamma-api.polymarket.com`

- `GET /markets` - List markets
- `GET /markets/{condition_id}` - Get market details

### Data API
Base URL: `https://data-api.polymarket.com`

- `GET /trades` - Trade history (filtered by maker/market)
- `GET /activity` - Wallet on-chain activity
- `GET /holders` - Top holders for a market

## Installation

### 1. Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Linux/Mac
# or
venv\Scripts\activate  # On Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env if needed (optional for v1)
```

## Running Locally

### Development Mode

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Deployment on VPS

### Prerequisites

- Linux VPS with Python 3.10+
- nginx for reverse proxy
- SSL certificate (Let's Encrypt)

### 1. Clone Repository

```bash
cd /home/app
git clone <your-repo-url> polalfa
cd polalfa/backend
```

### 2. Set Up Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Create Systemd Service

Create `/etc/systemd/system/polalfa.service`:

```ini
[Unit]
Description=PolAlfa FastAPI Backend
After=network.target

[Service]
Type=simple
User=app
WorkingDirectory=/home/app/polalfa/backend
Environment="PATH=/home/app/polalfa/backend/venv/bin"
ExecStart=/home/app/polalfa/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 4. Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable polalfa
sudo systemctl start polalfa
sudo systemctl status polalfa
```

### 5. Configure Nginx Reverse Proxy

Add to nginx config (e.g., `/etc/nginx/sites-available/polalfa`):

```nginx
server {
    listen 80;
    server_name api-polalfa.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and reload nginx:

```bash
sudo ln -s /etc/nginx/sites-available/polalfa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Add SSL with Let's Encrypt

```bash
sudo certbot --nginx -d api-polalfa.yourdomain.com
```

### 7. Update CORS in Production

Edit `main.py` to allow only your frontend domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://polalfa.vercel.app"],  # Your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Restart the service:

```bash
sudo systemctl restart polalfa
```

## Monitoring

### View Logs

```bash
# Service logs
sudo journalctl -u polalfa -f

# Follow uvicorn logs
tail -f /var/log/polalfa/uvicorn.log
```

### Check Status

```bash
sudo systemctl status polalfa
```

## Development Notes

### Rate Limiting

The client includes built-in rate limiting (600ms between requests) to stay within Polymarket's limits (100 req/60s).

### Error Handling

- API errors are logged but don't crash the entire analysis
- If one wallet fails, others continue processing
- HTTP errors return appropriate status codes with error messages

### TODO for Production

- [ ] Add caching layer (Redis) for market metadata
- [ ] Implement request rate limiting middleware
- [ ] Add monitoring/metrics (Prometheus)
- [ ] Database for storing historical analysis
- [ ] Background jobs for periodic wallet tracking
- [ ] Authentication/API keys if needed

## License

MIT
