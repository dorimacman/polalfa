import os
import sys
import unittest
from typing import List, Dict, Optional

# Ensure backend modules are importable when running from repo root
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.join(CURRENT_DIR, "..", "backend")
sys.path.append(os.path.abspath(BACKEND_DIR))

from polymarket_client import PolymarketClient  # noqa: E402
from wallet_analyzer import WalletAnalyzer  # noqa: E402


class StubPolymarketClient(PolymarketClient):
    """Minimal PolymarketClient stub for testing analyzer logic."""

    def __init__(self):
        # Avoid initializing aiohttp session from the parent class
        self.rate_limit_delay = 0.0

    async def get_trades(
        self,
        market: Optional[str] = None,
        maker: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
        start_ts: Optional[int] = None,
        end_ts: Optional[int] = None,
    ) -> List[Dict]:
        return []

    async def get_activity(
        self, user: str, limit: int = 100, offset: int = 0
    ) -> List[Dict]:
        return []

    async def get_market_by_id(self, condition_id: str) -> Optional[Dict]:
        return None


class WalletAnalyzerTests(unittest.IsolatedAsyncioTestCase):
    async def test_analyze_wallet_returns_wallet_address_when_no_trades(self):
        analyzer = WalletAnalyzer(StubPolymarketClient())

        analysis = await analyzer.analyze_wallet("0xabc123", "7d")

        self.assertEqual(analysis["wallet"], "0xabc123")
        self.assertEqual(analysis["resolved_markets"], 0)
        self.assertEqual(analysis["profitable_markets"], 0)
        self.assertEqual(analysis["markets"], [])


if __name__ == "__main__":
    unittest.main()
