"""
PolAlfa Backend API
FastAPI application for analyzing Polymarket trader wallets
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging

from polymarket_client import PolymarketClient
from wallet_analyzer import WalletAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PolAlfa API",
    description="Analyze Polymarket traders and rank wallets by profitability",
    version="1.0.0"
)

# CORS configuration - allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.ngrok\.io|https://.*\.ngrok-free\.app|https://polalfa\.vercel\.app|http://localhost:3000",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
polymarket_client = PolymarketClient()
wallet_analyzer = WalletAnalyzer(polymarket_client)


class AnalyzeWalletsRequest(BaseModel):
    wallets: List[str]
    range: str  # "7d", "30d", or "90d"


class TopWallet(BaseModel):
    wallet: str
    hit_rate: float
    roi: float
    trader_score: float
    realized_pnl: float
    resolved_markets: int
    last_trade_time: Optional[str]


class TopWalletsResponse(BaseModel):
    range: str
    wallets: List[TopWallet]


class MarketDetail(BaseModel):
    market_id: str
    title: str
    category: str
    resolved: bool
    outcome: Optional[str]
    stake: float
    pnl: float
    entry_price: float
    exit_price: Optional[float]
    resolved_at: Optional[str]


class WalletAnalysis(BaseModel):
    wallet: str
    hit_rate: float
    roi: float
    realized_pnl: float
    total_volume_traded: float
    last_trade_time: Optional[str]
    trader_score: float
    resolved_markets: int
    profitable_markets: int
    markets: List[MarketDetail]


class AnalyzeWalletsResponse(BaseModel):
    range: str
    wallets: List[WalletAnalysis]


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "PolAlfa API",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.post("/api/analyze-wallets", response_model=AnalyzeWalletsResponse)
async def analyze_wallets(request: AnalyzeWalletsRequest):
    """
    Analyze multiple wallets for profitability and consistency.

    Args:
        request: Contains list of wallet addresses and time range

    Returns:
        Analysis results with metrics and trader scores
    """
    try:
        # Validate inputs
        if not request.wallets:
            raise HTTPException(status_code=400, detail="No wallets provided")

        if len(request.wallets) > 10:
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 wallets allowed per request"
            )

        if request.range not in ["7d", "30d", "90d"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid range. Must be '7d', '30d', or '90d'"
            )

        logger.info(f"Analyzing {len(request.wallets)} wallets for range {request.range}")

        # Analyze each wallet
        results = []
        for wallet in request.wallets:
            try:
                analysis = await wallet_analyzer.analyze_wallet(
                    wallet_address=wallet.strip(),
                    time_range=request.range
                )
                results.append(analysis)
            except Exception as e:
                logger.error(f"Error analyzing wallet {wallet}: {str(e)}")
                # Continue with other wallets even if one fails
                continue

        # Sort by trader_score descending
        results.sort(key=lambda x: x["trader_score"], reverse=True)

        return AnalyzeWalletsResponse(
            range=request.range,
            wallets=results
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in analyze_wallets: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/top-wallets", response_model=TopWalletsResponse)
async def top_wallets(
    range: str = Query("30d", pattern="^(7d|30d|90d)$"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Rank and return top-performing wallets for a time window."""
    try:
        logger.info(f"Ranking top wallets for range {range} with limit {limit} offset {offset}")
        ranked = await wallet_analyzer.rank_wallets(
            time_range=range,
            limit=limit,
            offset=offset,
        )

        return TopWalletsResponse(range=range, wallets=ranked)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in top_wallets: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
