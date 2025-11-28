"""
Wallet Analysis Logic
Computes profitability, hit rate, and trader score for Polymarket wallets
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from polymarket_client import PolymarketClient

logger = logging.getLogger(__name__)


class WalletAnalyzer:
    """
    Analyzes Polymarket wallet performance.

    Computes:
    - Hit rate (% of resolved markets that were profitable)
    - ROI (realized PnL / total stake on resolved markets)
    - Trader score (composite metric)
    """

    def __init__(self, client: PolymarketClient):
        self.client = client

    def _get_time_range_timestamps(self, time_range: str) -> tuple[int, int]:
        """
        Convert time range string to Unix timestamps.

        Args:
            time_range: "7d", "30d", or "90d"

        Returns:
            (start_ts, end_ts) in seconds
        """
        now = datetime.utcnow()
        end_ts = int(now.timestamp())

        days_map = {"7d": 7, "30d": 30, "90d": 90}
        days = days_map.get(time_range, 30)

        start = now - timedelta(days=days)
        start_ts = int(start.timestamp())

        return start_ts, end_ts

    async def rank_wallets(
        self,
        time_range: str,
        limit: int = 50,
        offset: int = 0,
        min_resolved_markets: int = 3,
        min_volume: float = 50.0,
        max_single_market_weight: float = 0.6,
    ) -> List[Dict]:
        """
        Discover and rank wallets over a period using existing analysis logic.

        Strategy (MVP, on-the-fly):
        1. Pull a recent slice of trades in the given time window.
        2. Aggregate by maker to find active wallets (using volume + trade count).
        3. Analyze the most active wallets with the existing per-wallet analysis.
        4. Filter out noisy wallets (low volume, too few resolved markets, or
           performance dominated by one lucky market).
        5. Rank by trader_score, then ROI and hit rate as tie-breakers.

        Args:
            time_range: Supported ranges "7d", "30d", "90d".
            limit: Number of wallets to return.
            offset: Wallet-level offset for pagination.
            min_resolved_markets: Minimum resolved markets to be considered copy-worthy.
            min_volume: Minimum notional volume traded in the window.
            max_single_market_weight: If a single market accounts for more than this
                fraction of resolved stake, the wallet is discarded to avoid
                one-off lucky wins.
        """
        start_ts, end_ts = self._get_time_range_timestamps(time_range)

        # Grab a slice of recent trades to discover active makers.
        trade_slice = await self.client.get_trades(
            limit=1000,
            offset=offset,
            start_ts=start_ts,
            end_ts=end_ts,
        )

        maker_volume: Dict[str, float] = defaultdict(float)

        for trade in trade_slice:
            maker = trade.get("maker")
            if not maker:
                continue
            size = float(trade.get("size", 0))
            price = float(trade.get("price", 1.0))
            maker_volume[maker] += size * price

        # Take the most active makers as candidates (oversample to reduce noise).
        sorted_makers = sorted(
            maker_volume.items(), key=lambda item: item[1], reverse=True
        )
        candidate_wallets = [maker for maker, _ in sorted_makers[: limit * 3]]

        analyses: List[Dict] = []
        for wallet in candidate_wallets:
            try:
                analysis = await self.analyze_wallet(wallet_address=wallet, time_range=time_range)

                # Filter: minimum activity and resolution depth
                if analysis["resolved_markets"] < min_resolved_markets:
                    continue
                if analysis["total_volume_traded"] < min_volume:
                    continue

                # Filter: guard against single lucky market dominating results
                resolved_markets = [m for m in analysis["markets"] if m["resolved"]]
                if resolved_markets:
                    stakes = [m["stake"] for m in resolved_markets]
                    total_stake = sum(stakes)
                    if total_stake > 0:
                        if max(stakes) / total_stake > max_single_market_weight:
                            continue

                analyses.append(analysis)
            except Exception as exc:  # noqa: PERF203 - keep broad catch for resilience
                logger.warning(f"Skipping wallet {wallet} during ranking: {exc}")
                continue

        ranked = sorted(
            analyses,
            key=lambda a: (a["trader_score"], a["roi"], a["hit_rate"]),
            reverse=True,
        )

        return ranked[offset : offset + limit]

    async def analyze_wallet(
        self,
        wallet_address: str,
        time_range: str
    ) -> Dict:
        """
        Analyze a single wallet's performance.

        Args:
            wallet_address: Polymarket proxy wallet address
            time_range: "7d", "30d", or "90d"

        Returns:
            Dictionary with wallet analysis metrics
        """
        logger.info(f"Analyzing wallet {wallet_address} for range {time_range}")

        # Get time range
        start_ts, end_ts = self._get_time_range_timestamps(time_range)

        # Fetch trades for this wallet in the time range
        trades = await self.client.get_trades(
            maker=wallet_address,
            limit=1000,  # Fetch up to 1000 trades
            start_ts=start_ts,
            end_ts=end_ts
        )

        logger.info(f"Found {len(trades)} trades for wallet {wallet_address}")

        # Fetch activity to get more context
        activity = await self.client.get_activity(
            user=wallet_address,
            limit=1000
        )

        # Group trades by market
        markets_data = await self._group_trades_by_market(trades, activity)

        # Fetch market metadata for resolved markets
        markets_with_metadata = await self._enrich_with_market_metadata(markets_data)

        # Calculate metrics
        metrics = self._calculate_metrics(
            markets_with_metadata,
            trades,
            wallet_address=wallet_address
        )

        return metrics

    async def _group_trades_by_market(
        self,
        trades: List[Dict],
        activity: List[Dict]
    ) -> Dict[str, Dict]:
        """
        Group trades by market and calculate per-market stats.

        Returns:
            Dict[market_id, market_data]
        """
        markets = defaultdict(lambda: {
            "trades": [],
            "total_stake": 0.0,
            "pnl": 0.0,
            "resolved": False,
            "outcome": None,
        })

        for trade in trades:
            # Parse trade data
            # Expected fields from Polymarket Data API /trades endpoint:
            # - market (condition_id)
            # - asset_id
            # - side (BUY/SELL)
            # - size (amount)
            # - price
            # - timestamp
            # - maker, taker
            market_id = trade.get("market") or trade.get("condition_id")
            if not market_id:
                continue

            size = float(trade.get("size", 0))
            price = float(trade.get("price", 0))
            side = trade.get("side", "")

            markets[market_id]["trades"].append(trade)

            # Calculate stake (approximation)
            # For BUY: stake = size * price
            # For SELL: stake is the size being sold
            if side == "BUY":
                markets[market_id]["total_stake"] += size * price
            else:
                markets[market_id]["total_stake"] += size

        return dict(markets)

    async def _enrich_with_market_metadata(
        self,
        markets_data: Dict[str, Dict]
    ) -> List[Dict]:
        """
        Fetch market metadata and enrich market data.

        Returns:
            List of enriched market dictionaries
        """
        enriched_markets = []

        for market_id, data in markets_data.items():
            # Fetch market info from Gamma API
            market_info = await self.client.get_market_by_id(market_id)

            if not market_info:
                # Skip markets we can't find metadata for
                logger.warning(f"No metadata found for market {market_id}")
                continue

            # Extract market details
            # Expected fields from Gamma Markets API:
            # - question (title)
            # - description
            # - tokens (outcome tokens)
            # - closed, resolved
            # - outcome (resolution outcome if resolved)
            # - etc.
            title = market_info.get("question", "Unknown Market")
            category = market_info.get("category", "uncategorized")
            resolved = market_info.get("resolved", False)
            outcome = market_info.get("outcome")
            closed = market_info.get("closed", False)

            # Calculate PnL for resolved markets
            pnl = 0.0
            if resolved and outcome:
                pnl = self._calculate_market_pnl(
                    trades=data["trades"],
                    outcome=outcome,
                    market_info=market_info
                )

            # Get last trade time
            last_trade = None
            if data["trades"]:
                last_trade = max(
                    data["trades"],
                    key=lambda t: t.get("timestamp", 0)
                )

            # Get entry/exit prices (approximation)
            entry_price = 0.0
            exit_price = None

            if data["trades"]:
                # Average entry price (weighted by size)
                total_buy_size = 0.0
                weighted_price_sum = 0.0

                for trade in data["trades"]:
                    if trade.get("side") == "BUY":
                        size = float(trade.get("size", 0))
                        price = float(trade.get("price", 0))
                        total_buy_size += size
                        weighted_price_sum += size * price

                if total_buy_size > 0:
                    entry_price = weighted_price_sum / total_buy_size

                # Exit price: if resolved, outcome determines final price
                if resolved:
                    exit_price = 1.0 if outcome else 0.0

            enriched_markets.append({
                "market_id": market_id,
                "title": title,
                "category": category,
                "resolved": resolved,
                "outcome": outcome,
                "stake": data["total_stake"],
                "pnl": pnl,
                "entry_price": entry_price,
                "exit_price": exit_price,
                "resolved_at": market_info.get("end_date_iso") if resolved else None,
                "last_trade_time": last_trade.get("timestamp") if last_trade else None,
            })

        return enriched_markets

    def _calculate_market_pnl(
        self,
        trades: List[Dict],
        outcome: str,
        market_info: Dict
    ) -> float:
        """
        Calculate PnL for a resolved market.

        Simplified calculation:
        - Sum up all BUY trades (negative cash flow)
        - Sum up all SELL trades (positive cash flow)
        - If outcome matches what was bought, add value of holdings

        This is an approximation. Real PnL would require tracking exact positions.

        Args:
            trades: List of trades for this market
            outcome: Resolution outcome (e.g., "YES", "NO", or token index)
            market_info: Market metadata

        Returns:
            Estimated PnL
        """
        # Track net position per outcome token
        positions = defaultdict(float)
        cash_flow = 0.0

        for trade in trades:
            side = trade.get("side", "")
            size = float(trade.get("size", 0))
            price = float(trade.get("price", 0))
            asset_id = trade.get("asset_id", "")

            if side == "BUY":
                # Bought tokens
                positions[asset_id] += size
                cash_flow -= size * price  # Cash out
            elif side == "SELL":
                # Sold tokens
                positions[asset_id] -= size
                cash_flow += size * price  # Cash in

        # Determine winning token
        # Outcome can be YES/NO or a token index
        # For binary markets, outcome might be the winning token ID
        # This is a simplified approximation
        tokens = market_info.get("tokens", [])

        # Find which token won
        winning_token_id = None
        if isinstance(outcome, str) and outcome.upper() in ["YES", "NO"]:
            # Find token with matching outcome
            for token in tokens:
                if token.get("outcome") == outcome.upper():
                    winning_token_id = token.get("token_id")
                    break

        # Calculate final value
        final_value = 0.0
        for token_id, position in positions.items():
            if position > 0:  # We hold tokens
                if token_id == winning_token_id:
                    # Winning tokens redeem at $1
                    final_value += position * 1.0
                # Losing tokens are worth $0

        pnl = cash_flow + final_value
        return pnl

    def _calculate_metrics(
        self,
        markets: List[Dict],
        all_trades: List[Dict],
        wallet_address: str
    ) -> Dict:
        """
        Calculate aggregate metrics for the wallet.

        Metrics:
        - resolved_markets: count of resolved markets
        - profitable_markets: count of resolved markets with positive PnL
        - hit_rate: profitable_markets / resolved_markets
        - total_volume_traded: sum of all trade sizes
        - realized_pnl: sum of PnL on resolved markets
        - roi: realized_pnl / total_stake_on_resolved
        - trader_score: composite score

        Args:
            markets: List of enriched market dictionaries
            all_trades: All trades for this wallet

        Returns:
            Dictionary with calculated metrics
        """
        # Filter resolved markets
        resolved_markets = [m for m in markets if m["resolved"]]
        profitable_markets = [m for m in resolved_markets if m["pnl"] > 0]

        resolved_count = len(resolved_markets)
        profitable_count = len(profitable_markets)

        # Hit rate
        hit_rate = profitable_count / resolved_count if resolved_count > 0 else 0.0

        # Total volume traded
        total_volume = sum(
            float(trade.get("size", 0)) * float(trade.get("price", 1.0))
            for trade in all_trades
        )

        # Realized PnL (sum of PnL on resolved markets)
        realized_pnl = sum(m["pnl"] for m in resolved_markets)

        # Total stake on resolved markets
        total_stake_resolved = sum(m["stake"] for m in resolved_markets)

        # ROI
        roi = realized_pnl / total_stake_resolved if total_stake_resolved > 0 else 0.0

        # Last trade time
        last_trade_time = None
        if all_trades:
            latest = max(all_trades, key=lambda t: t.get("timestamp", 0))
            timestamp = latest.get("timestamp")
            if timestamp:
                # Convert to ISO format
                last_trade_time = datetime.fromtimestamp(timestamp).isoformat() + "Z"

        # Trader Score
        # Formula: 0.4 * normalized_roi + 0.4 * hit_rate + 0.2 * recency_score
        #
        # Normalized ROI: cap at 100% ROI -> score of 1.0
        # ROI of 50% -> score of 0.5, etc.
        normalized_roi = min(roi, 1.0) if roi > 0 else max(roi / 2.0, -1.0)

        # Recency score: trades in last 7 days = 1.0, exponential decay
        recency_score = 0.5  # Default moderate recency
        if last_trade_time:
            try:
                last_trade_dt = datetime.fromisoformat(last_trade_time.replace("Z", ""))
                days_since = (datetime.utcnow() - last_trade_dt).days

                # Exponential decay: score = e^(-days/7)
                import math
                recency_score = math.exp(-days_since / 7.0)
            except Exception as e:
                logger.warning(f"Error calculating recency: {e}")

        trader_score = (
            0.4 * normalized_roi +
            0.4 * hit_rate +
            0.2 * recency_score
        )

        # Build market details for response
        market_details = [
            {
                "market_id": m["market_id"],
                "title": m["title"],
                "category": m["category"],
                "resolved": m["resolved"],
                "outcome": m["outcome"],
                "stake": round(m["stake"], 2),
                "pnl": round(m["pnl"], 2),
                "entry_price": round(m["entry_price"], 4),
                "exit_price": round(m["exit_price"], 4) if m["exit_price"] else None,
                "resolved_at": m["resolved_at"],
            }
            for m in markets
        ]

        wallet_id = (
            all_trades[0].get("maker")
            if all_trades and all_trades[0].get("maker")
            else wallet_address
        )

        return {
            "wallet": wallet_id,
            "hit_rate": round(hit_rate, 4),
            "roi": round(roi, 4),
            "realized_pnl": round(realized_pnl, 2),
            "total_volume_traded": round(total_volume, 2),
            "last_trade_time": last_trade_time,
            "trader_score": round(trader_score, 4),
            "resolved_markets": resolved_count,
            "profitable_markets": profitable_count,
            "markets": market_details,
        }
