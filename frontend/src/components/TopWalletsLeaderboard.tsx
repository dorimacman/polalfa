'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

export interface TopWallet {
  wallet: string
  hit_rate: number
  roi: number
  trader_score: number
  realized_pnl: number
  resolved_markets: number
  last_trade_time: string | null
}

interface Props {
  defaultRange?: '7d' | '30d' | '90d'
  limit?: number
}

const RANGE_OPTIONS: Array<{ value: '7d' | '30d' | '90d'; label: string }> = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
]

export default function TopWalletsLeaderboard({ defaultRange = '30d', limit = 20 }: Props) {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>(defaultRange)
  const [wallets, setWallets] = useState<TopWallet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    []
  )

  const shorten = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`
  const percent = (value: number) => `${(value * 100).toFixed(1)}%`

  useEffect(() => {
    const fetchWallets = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await axios.get<{ range: string; wallets: TopWallet[] }>(
          `${apiUrl}/api/top-wallets`,
          {
            params: { range, limit },
          }
        )
        setWallets(response.data.wallets)
      } catch (err: any) {
        const detail = err.response?.data?.detail || err.message || 'Failed to load top wallets'
        setError(detail)
      } finally {
        setLoading(false)
      }
    }

    fetchWallets()
  }, [apiUrl, range, limit])

  return (
    <div className="card-panel rounded-2xl p-6 retro-grid">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Top wallets</p>
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
            Copy-worthy leaderboard
          </h2>
          <p className="text-sm text-foreground/70 mt-1">
            Ranked by trader score with ROI and hit rate tie-breakers.
          </p>
        </div>
        <div className="flex gap-2 bg-panel/60 rounded-xl p-1 border border-border">
          {RANGE_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setRange(option.value)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition shadow-sm border border-transparent ${
                range === option.value
                  ? 'bg-primary text-primaryForeground shadow-glow'
                  : 'text-foreground/70 hover:text-foreground hover:border-border'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="border border-red-500/50 bg-red-900/20 text-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-accent">
          <span className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin"></span>
          Loading wallets...
        </div>
      ) : wallets.length === 0 ? (
        <div className="text-foreground/70">No wallets surfaced for this range yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-foreground/60 border-b border-border/70">
              <tr>
                <th className="py-2 pr-3 text-left">Rank</th>
                <th className="py-2 pr-3 text-left">Wallet</th>
                <th className="py-2 pr-3 text-right">Trader score</th>
                <th className="py-2 pr-3 text-right">Hit rate</th>
                <th className="py-2 pr-3 text-right">ROI</th>
                <th className="py-2 pr-3 text-right">Realized PnL</th>
                <th className="py-2 text-right">Last trade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {wallets.map((wallet, idx) => (
                <tr key={wallet.wallet} className="hover:bg-panel/60 transition">
                  <td className="py-3 pr-3 font-bold text-accent">#{idx + 1}</td>
                  <td className="py-3 pr-3 font-mono text-foreground">{shorten(wallet.wallet)}</td>
                  <td className="py-3 pr-3 text-right font-semibold text-primary">
                    {wallet.trader_score.toFixed(3)}
                  </td>
                  <td className="py-3 pr-3 text-right">{percent(wallet.hit_rate)}</td>
                  <td className="py-3 pr-3 text-right">{percent(wallet.roi)}</td>
                  <td className="py-3 pr-3 text-right">
                    ${wallet.realized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right text-foreground/70">
                    {wallet.last_trade_time
                      ? new Date(wallet.last_trade_time).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
