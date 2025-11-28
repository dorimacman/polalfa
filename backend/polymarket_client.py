"""
Polymarket API Client
Uses official Polymarket endpoints from https://docs.polymarket.com
"""
import aiohttp
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import asyncio

logger = logging.getLogger(__name__)


class PolymarketClient:
    """
    Client for interacting with Polymarket's official APIs:
    - Gamma Markets API: https://docs.polymarket.com/developers/gamma-markets-api/overview
    - Data API: https://docs.polymarket.com (Core endpoints)
    """

    # Base URLs from official docs
    GAMMA_API_BASE = "https://gamma-api.polymarket.com"
    DATA_API_BASE = "https://data-api.polymarket.com"

    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        # Rate limiting: 100 requests per 60 seconds per IP
        # https://docs.polymarket.com/quickstart/introduction/rate-limits
        self.rate_limit_delay = 0.6  # 600ms between requests to stay safe

    async def _ensure_session(self):
        """Ensure aiohttp session is created"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()

    async def _get(self, url: str, params: Optional[Dict] = None) -> Dict:
        """
        Make GET request with rate limiting.

        Rate limits: 100 requests per 60 seconds per IP
        https://docs.polymarket.com/quickstart/introduction/rate-limits
        """
        await self._ensure_session()

        # Apply rate limiting delay
        await asyncio.sleep(self.rate_limit_delay)

        try:
            async with self.session.get(url, params=params) as response:
                response.raise_for_status()
                return await response.json()
        except aiohttp.ClientResponseError as e:
            logger.error(f"HTTP error {e.status} for {url}: {e.message}")
            raise
        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            raise

    async def get_markets(
        self,
        limit: int = 100,
        offset: int = 0,
        active: Optional[bool] = None
    ) -> List[Dict]:
        """
        Get markets from Gamma Markets API.

        Endpoint: GET https://gamma-api.polymarket.com/markets
        Docs: https://docs.polymarket.com/developers/gamma-markets-api/overview

        Returns list of market objects with:
        - condition_id, question_id, market_slug
        - question (title)
        - description
        - tokens (outcome tokens)
        - etc.
        """
        params = {
            "limit": limit,
            "offset": offset,
        }
        if active is not None:
            params["active"] = str(active).lower()

        url = f"{self.GAMMA_API_BASE}/markets"
        logger.info(f"Fetching markets from Gamma API: {url}")

        try:
            response = await self._get(url, params)
            # Response is a list of market objects
            return response if isinstance(response, list) else []
        except Exception as e:
            logger.error(f"Error fetching markets: {str(e)}")
            return []

    async def get_market_by_id(self, condition_id: str) -> Optional[Dict]:
        """
        Get a single market by condition_id from Gamma Markets API.

        Endpoint: GET https://gamma-api.polymarket.com/markets/{condition_id}
        """
        url = f"{self.GAMMA_API_BASE}/markets/{condition_id}"
        logger.info(f"Fetching market {condition_id}")

        try:
            return await self._get(url)
        except Exception as e:
            logger.error(f"Error fetching market {condition_id}: {str(e)}")
            return None

    async def get_trades(
        self,
        market: Optional[str] = None,
        maker: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
        start_ts: Optional[int] = None,
        end_ts: Optional[int] = None
    ) -> List[Dict]:
        """
        Get trades from Data API.

        Endpoint: GET https://data-api.polymarket.com/trades
        Docs: https://docs.polymarket.com

        Query params:
        - market: condition_id (optional)
        - maker: wallet address (optional)
        - limit, offset: pagination
        - start_ts, end_ts: Unix timestamps in seconds

        Returns list of trade objects with:
        - id, market, asset_id
        - maker, taker
        - size, price
        - side (BUY/SELL)
        - timestamp
        - etc.
        """
        params = {
            "limit": limit,
            "offset": offset,
        }
        if market:
            params["market"] = market
        if maker:
            params["maker"] = maker
        if start_ts:
            params["start_ts"] = start_ts
        if end_ts:
            params["end_ts"] = end_ts

        url = f"{self.DATA_API_BASE}/trades"
        logger.info(f"Fetching trades for maker={maker}, market={market}")

        try:
            response = await self._get(url, params)
            return response if isinstance(response, list) else []
        except Exception as e:
            logger.error(f"Error fetching trades: {str(e)}")
            return []

    async def get_activity(
        self,
        user: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict]:
        """
        Get on-chain activity for a wallet.

        Endpoint: GET https://data-api.polymarket.com/activity
        Docs: https://docs.polymarket.com

        Query params:
        - user: wallet address (required)
        - limit, offset: pagination

        Returns list of activity events with:
        - type (e.g., "trade", "mint", "redeem")
        - timestamp
        - market info
        - etc.
        """
        params = {
            "user": user,
            "limit": limit,
            "offset": offset,
        }

        url = f"{self.DATA_API_BASE}/activity"
        logger.info(f"Fetching activity for user {user}")

        try:
            response = await self._get(url, params)
            return response if isinstance(response, list) else []
        except Exception as e:
            logger.error(f"Error fetching activity for {user}: {str(e)}")
            return []

    async def get_holders(
        self,
        market: str,
        limit: int = 100
    ) -> List[Dict]:
        """
        Get top holders for a market.

        Endpoint: GET https://data-api.polymarket.com/holders
        Docs: https://docs.polymarket.com

        Query params:
        - market: condition_id (required)
        - limit: number of holders

        Returns list of holder objects with:
        - user: wallet address
        - balance: token balance
        - etc.
        """
        params = {
            "market": market,
            "limit": limit,
        }

        url = f"{self.DATA_API_BASE}/holders"
        logger.info(f"Fetching holders for market {market}")

        try:
            response = await self._get(url, params)
            return response if isinstance(response, list) else []
        except Exception as e:
            logger.error(f"Error fetching holders for market {market}: {str(e)}")
            return []

    async def close(self):
        """Close the aiohttp session"""
        if self.session and not self.session.closed:
            await self.session.close()
