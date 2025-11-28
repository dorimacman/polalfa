# PolAlfa

**Find the alpha wallets on Polymarket**

A full-stack web app that analyzes Polymarket traders and ranks wallets by profitability and consistency.

## Overview

PolAlfa helps you identify the most successful traders on Polymarket by analyzing their trading history and computing performance metrics:

- **Hit Rate**: Win rate on resolved markets
- **ROI**: Return on investment
- **Trader Score**: Composite metric combining profitability, consistency, and activity
- **Detailed Market History**: View individual trades and outcomes

## Branding

- **Name**: PolAlfa
  - "Pol" = Polymarket
  - "Alfa" = crypto/DeFi slang for profitable edge
- **Tagline**: "Find the alpha wallets on Polymarket"
- **Theme**: Dark, clean, degen-friendly

## Tech Stack

### Backend
- **Python 3.10+**
- **FastAPI** - Modern async web framework
- **uvicorn** - ASGI server
- **aiohttp** - Async HTTP client

### Frontend
- **Next.js 14** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### Infrastructure
- Backend: Linux VPS with nginx reverse proxy
- Frontend: Vercel deployment
- No database for v1 (in-memory caching)

## Project Structure

```
polalfa/
├── backend/              # FastAPI backend
│   ├── main.py           # FastAPI app and routes
│   ├── polymarket_client.py   # Polymarket API client
│   ├── wallet_analyzer.py     # Analysis logic
│   ├── requirements.txt       # Python dependencies
│   └── README.md              # Backend documentation
│
├── frontend/             # Next.js frontend
│   ├── src/
│   │   ├── app/          # Next.js app router
│   │   └── components/   # React components
│   ├── package.json      # Node dependencies
│   └── README.md         # Frontend documentation
│
└── README.md             # This file
```

## Features

### v1 MVP
- ✅ Manual wallet input (1-10 addresses)
- ✅ Time range selection (7d, 30d, 90d)
- ✅ Performance metrics calculation
- ✅ Ranked leaderboard
- ✅ Expandable market details
- ✅ Responsive design

### Future Enhancements
- [ ] Automatic wallet discovery (find top traders)
- [ ] Database for historical tracking
- [ ] Real-time updates via WebSocket
- [ ] Portfolio tracking
- [ ] Alerts for top trader activity
- [ ] Social features (follow wallets)

## Quick Start

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend will run at `http://localhost:8000`

See [backend/README.md](backend/README.md) for full setup and deployment instructions.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local to set NEXT_PUBLIC_API_BASE_URL
npm run dev
```

Frontend will run at `http://localhost:3000`

See [frontend/README.md](frontend/README.md) for full setup and Vercel deployment.

## Deployment

### Backend on VPS

1. Clone repo to `/home/app/polalfa`
2. Set up Python virtual environment
3. Create systemd service
4. Configure nginx reverse proxy with SSL
5. Set backend URL: `https://api-polalfa.yourdomain.com`

Full instructions: [backend/README.md](backend/README.md)

### Frontend on Vercel

1. Push code to GitHub
2. Import project on Vercel
3. Set root directory to `frontend`
4. Add env var: `NEXT_PUBLIC_API_BASE_URL`
5. Deploy

Full instructions: [frontend/README.md](frontend/README.md)

## API Documentation

### Analyze Wallets

```
POST /api/analyze-wallets
```

**Request:**
```json
{
  "wallets": ["0xWallet1", "0xWallet2"],
  "range": "30d"
}
```

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
```
hit_rate = profitable_markets / resolved_markets
```
Percentage of resolved markets that were profitable.

### ROI (Return on Investment)
```
roi = realized_pnl / total_stake_on_resolved_markets
```
Realized profit/loss as percentage of capital deployed.

### Trader Score
```
trader_score = 0.4 × normalized_roi + 0.4 × hit_rate + 0.2 × recency_score
```
Composite metric combining:
- **normalized_roi**: ROI capped at 100%
- **hit_rate**: Win rate (0-1)
- **recency_score**: Exponential decay based on last trade

## Polymarket APIs Used

All data comes from official Polymarket APIs:

- **Gamma Markets API**: `https://gamma-api.polymarket.com`
  - Market metadata and details
- **Data API**: `https://data-api.polymarket.com`
  - Trades, activity, holders

Documentation: https://docs.polymarket.com

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend Development

```bash
cd frontend
npm run dev
```

App available at: `http://localhost:3000`

### Testing the Full Stack

1. Start backend on port 8000
2. Start frontend on port 3000
3. Enter test wallet addresses
4. Verify analysis results

## Contributing

This is a v1 MVP. Contributions welcome!

Areas for improvement:
- Better error handling
- Caching layer (Redis)
- Database integration
- More sophisticated metrics
- Wallet discovery algorithms
- UI/UX enhancements

## License

MIT

## Acknowledgments

- Built with official Polymarket APIs
- Inspired by the need to find alpha in prediction markets
- Designed for the crypto/DeFi community

---

**PolAlfa** - Find the alpha wallets on Polymarket
