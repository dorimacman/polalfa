'use client'

import { useState } from 'react'
import type { AnalysisResponse, WalletAnalysis } from '@/app/page'

interface LeaderboardProps {
  data: AnalysisResponse
}

export default function Leaderboard({ data }: LeaderboardProps) {
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null)

  const toggleWallet = (wallet: string) => {
    setExpandedWallet(expandedWallet === wallet ? null : wallet)
  }

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`
  }

  const formatCurrency = (value: number) => {
    return value.toFixed(2)
  }

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-400'
    if (score >= 0.5) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getRoiColor = (roi: number) => {
    if (roi > 0) return 'text-green-400'
    if (roi < 0) return 'text-red-400'
    return 'text-slate-400'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
          Analyzed wallets
          <span className="text-foreground/60 text-lg ml-3">({data.range})</span>
        </h2>
        <div className="text-foreground/60 text-sm">
          {data.wallets.length} wallet{data.wallets.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-3">
        {data.wallets.map((wallet, index) => (
          <div
            key={wallet.wallet}
            className="card-panel rounded-xl overflow-hidden hover:shadow-glow transition"
          >
            {/* Summary Row */}
            <button
              onClick={() => toggleWallet(wallet.wallet)}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-panel/80 transition text-left"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 text-center">
                <span className="text-2xl font-bold text-accent">#{index + 1}</span>
              </div>

              {/* Wallet Address */}
              <div className="flex-shrink-0 w-32">
                <div className="font-mono text-foreground">{formatWallet(wallet.wallet)}</div>
              </div>

              {/* Trader Score */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400 mb-1">Trader Score</div>
                <div className={`text-xl font-bold ${getScoreColor(wallet.trader_score)}`}>
                  {wallet.trader_score.toFixed(3)}
                </div>
              </div>

              {/* Hit Rate */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400 mb-1">Hit Rate</div>
                <div className="text-lg font-semibold text-foreground">
                  {formatPercent(wallet.hit_rate)}
                </div>
              </div>

              {/* ROI */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-foreground/60 mb-1">ROI</div>
                <div className={`text-lg font-semibold ${getRoiColor(wallet.roi)}`}>
                  {formatPercent(wallet.roi)}
                </div>
              </div>

              {/* Realized PnL */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-foreground/60 mb-1">Realized PnL</div>
                <div className={`text-lg font-semibold ${getRoiColor(wallet.realized_pnl)}`}>
                  ${formatCurrency(wallet.realized_pnl)}
                </div>
              </div>

              {/* Volume */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-foreground/60 mb-1">Volume</div>
                <div className="text-lg font-semibold text-foreground">
                  ${formatCurrency(wallet.total_volume_traded)}
                </div>
              </div>

              {/* Expand Icon */}
              <div className="flex-shrink-0">
                <svg
                  className={`w-5 h-5 text-foreground/60 transition-transform ${
                    expandedWallet === wallet.wallet ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedWallet === wallet.wallet && (
              <div className="px-6 pb-6 border-t border-border/50">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-4">
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">Resolved Markets</div>
                    <div className="text-lg font-semibold text-foreground">{wallet.resolved_markets}</div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">Profitable Markets</div>
                    <div className="text-lg font-semibold text-green-400">
                      {wallet.profitable_markets}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">Last Trade</div>
                    <div className="text-sm text-foreground">
                      {wallet.last_trade_time
                        ? new Date(wallet.last_trade_time).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">Full Address</div>
                    <div className="text-xs font-mono text-foreground truncate" title={wallet.wallet}>
                      {wallet.wallet}
                    </div>
                  </div>
                </div>

                {/* Markets Table */}
                {wallet.markets.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                      Markets ({wallet.markets.length})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-foreground/60 border-b border-border/70">
                            <th className="pb-2 pr-4">Market</th>
                            <th className="pb-2 pr-4">Category</th>
                            <th className="pb-2 pr-4">Status</th>
                            <th className="pb-2 pr-4 text-right">Stake</th>
                            <th className="pb-2 pr-4 text-right">PnL</th>
                            <th className="pb-2 text-right">Entry</th>
                          </tr>
                        </thead>
                        <tbody className="text-foreground">
                          {wallet.markets.slice(0, 10).map((market) => (
                            <tr
                              key={market.market_id}
                              className="border-b border-border/50 hover:bg-panel/70"
                            >
                              <td className="py-2 pr-4 max-w-xs truncate" title={market.title}>
                                {market.title}
                              </td>
                              <td className="py-2 pr-4">
                                <span className="text-xs bg-panel px-2 py-1 rounded border border-border">
                                  {market.category}
                                </span>
                              </td>
                              <td className="py-2 pr-4">
                                {market.resolved ? (
                                  <span className="text-xs text-green-400">Resolved</span>
                                ) : (
                                  <span className="text-xs text-yellow-400">Open</span>
                                )}
                              </td>
                              <td className="py-2 pr-4 text-right">${market.stake.toFixed(2)}</td>
                              <td
                                className={`py-2 pr-4 text-right font-semibold ${getRoiColor(
                                  market.pnl
                                )}`}
                              >
                                ${market.pnl.toFixed(2)}
                              </td>
                              <td className="py-2 text-right">
                                {market.entry_price.toFixed(3)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {wallet.markets.length > 10 && (
                        <div className="text-xs text-foreground/60 mt-2 text-center">
                          Showing first 10 of {wallet.markets.length} markets
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {data.wallets.length === 0 && (
        <div className="text-center py-12 text-foreground/60">No wallet data available</div>
      )}
    </div>
  )
}
