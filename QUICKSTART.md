# PolAlfa Quick Start Guide

Get PolAlfa running in 5 minutes!

## What is PolAlfa?

**PolAlfa** helps you find the most profitable traders on Polymarket by analyzing wallet performance and ranking them by profitability and consistency.

- **Pol** = Polymarket
- **Alfa** = profitable edge
- **PolAlfa** = find the alpha wallets on Polymarket

---

## Local Development (5 minutes)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd /home/app/polalfa/backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies (30 seconds)
pip install -r requirements.txt

# Start the server
./start.sh

# Backend now running at http://localhost:8000
# API docs: http://localhost:8000/docs
```

### 2. Frontend Setup

Open a **new terminal**:

```bash
# Navigate to frontend directory
cd /home/app/polalfa/frontend

# Install dependencies (1-2 minutes)
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev

# Frontend now running at http://localhost:3000
```

### 3. Test It Out

1. Open browser: http://localhost:3000
2. You'll see the PolAlfa interface
3. Enter test wallet addresses (get real ones from polymarket.com)
4. Click "Analyze Wallets"
5. View results!

**Note:** The backend fetches real data from Polymarket's official APIs, so you need real wallet addresses to test.

---

## Finding Test Wallet Addresses

1. Go to [polymarket.com](https://polymarket.com)
2. Click on any active market
3. Scroll to "Activity" or "Trades" tab
4. Copy wallet addresses from recent traders
5. Paste into PolAlfa

Example format: `0x1234567890abcdef1234567890abcdef12345678`

---

## Project Structure

```
polalfa/
├── backend/              FastAPI backend (Python)
│   ├── main.py           Main API routes
│   ├── polymarket_client.py   API client
│   ├── wallet_analyzer.py     Analysis logic
│   └── start.sh          Quick start script
│
├── frontend/             Next.js frontend (React)
│   └── src/
│       ├── app/          Pages and layouts
│       └── components/   UI components
│
├── README.md             Project overview
├── DEPLOYMENT.md         Full deployment guide
└── QUICKSTART.md         This file
```

---

## Key Files to Know

### Backend

- [backend/main.py](backend/main.py) - API endpoints
- [backend/polymarket_client.py](backend/polymarket_client.py) - Polymarket API integration
- [backend/wallet_analyzer.py](backend/wallet_analyzer.py) - Metrics calculation
- [backend/requirements.txt](backend/requirements.txt) - Python dependencies

### Frontend

- [frontend/src/app/page.tsx](frontend/src/app/page.tsx) - Main page
- [frontend/src/components/WalletInputForm.tsx](frontend/src/components/WalletInputForm.tsx) - Input form
- [frontend/src/components/Leaderboard.tsx](frontend/src/components/Leaderboard.tsx) - Results display

---

## Understanding the Metrics

### Trader Score (0.0 - 1.0)
Composite metric combining:
- **40%** ROI (return on investment)
- **40%** Hit Rate (win rate)
- **20%** Recency (how recent trades are)

Higher score = better trader

### Hit Rate
```
hit_rate = profitable_markets / resolved_markets
```
Percentage of markets where the trader made profit.

### ROI (Return on Investment)
```
roi = realized_pnl / total_stake
```
Profit/loss as a percentage of money invested.

### Realized PnL
Total profit or loss on resolved markets in dollars.

---

## API Endpoints

### Health Check
```bash
curl http://localhost:8000/health
```

### Analyze Wallets
```bash
curl -X POST http://localhost:8000/api/analyze-wallets \
  -H "Content-Type: application/json" \
  -d '{
    "wallets": ["0x1234..."],
    "range": "30d"
  }'
```

**Parameters:**
- `wallets`: Array of 1-10 wallet addresses
- `range`: `"7d"`, `"30d"`, or `"90d"`

---

## Common Issues

### Backend won't start

**Error:** `ModuleNotFoundError`
```bash
# Make sure you're in the virtual environment
source venv/bin/activate
pip install -r requirements.txt
```

**Error:** `Address already in use`
```bash
# Port 8000 is taken, kill the process
lsof -i :8000
kill -9 <PID>
```

### Frontend won't start

**Error:** `Cannot find module`
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

**Error:** `NEXT_PUBLIC_API_BASE_URL is not defined`
```bash
# Create .env.local file
cp .env.example .env.local
```

### Analysis returns no data

**Possible causes:**
- Wallet address is invalid or has no trading history
- Time range is too short (try 90d)
- Polymarket API rate limit (wait 60 seconds)

---

## Next Steps

### Local Development

1. **Explore the code**: Read through the backend and frontend files
2. **Customize the UI**: Edit Tailwind classes in components
3. **Add features**: Refer to TODO section in main README

### Production Deployment

1. **Backend**: Deploy to your VPS
2. **Frontend**: Deploy to Vercel
3. **Full guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Development Tips

### Backend

```bash
# Run with auto-reload
uvicorn main:app --reload

# View API docs
# Open http://localhost:8000/docs in browser

# Check logs
tail -f /var/log/polalfa/uvicorn.log
```

### Frontend

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Type checking
npm run lint
```

---

## Technology Stack

**Backend:**
- FastAPI - Modern Python web framework
- aiohttp - Async HTTP client
- Polymarket APIs - Official data source

**Frontend:**
- Next.js 14 - React framework
- TypeScript - Type safety
- Tailwind CSS - Styling

**Infrastructure:**
- Backend: Linux VPS + nginx
- Frontend: Vercel
- No database (v1 uses in-memory caching)

---

## Resources

- **Polymarket API Docs**: https://docs.polymarket.com
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com

---

## Getting Help

1. Check logs (backend and frontend console)
2. Review this guide and [DEPLOYMENT.md](DEPLOYMENT.md)
3. Check Polymarket API status
4. Open a GitHub issue

---

## What's Next?

Once you have it running locally, you can:

1. **Test with real wallets**: Find profitable traders on Polymarket
2. **Customize the branding**: Change colors, logo, copy
3. **Add features**: See the TODO section in main README
4. **Deploy to production**: Follow [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Happy hunting for alpha!** 🚀

**PolAlfa** - Find the alpha wallets on Polymarket
