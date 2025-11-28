'use client'

import { useState } from 'react'
import axios from 'axios'
import WalletInputForm from '@/components/WalletInputForm'
import Leaderboard from '@/components/Leaderboard'
import TopWalletsLeaderboard from '@/components/TopWalletsLeaderboard'

export interface MarketDetail {
  market_id: string
  title: string
  category: string
  resolved: boolean
  outcome: string | null
  stake: number
  pnl: number
  entry_price: number
  exit_price: number | null
  resolved_at: string | null
}

export interface WalletAnalysis {
  wallet: string
  hit_rate: number
  roi: number
  realized_pnl: number
  total_volume_traded: number
  last_trade_time: string | null
  trader_score: number
  resolved_markets: number
  profitable_markets: number
  markets: MarketDetail[]
}

export interface AnalysisResponse {
  range: string
  wallets: WalletAnalysis[]
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<AnalysisResponse | null>(null)

  const handleAnalyze = async (wallets: string[], range: string) => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
      const response = await axios.post<AnalysisResponse>(
        `${apiUrl}/api/analyze-wallets`,
        {
          wallets,
          range,
        }
      )
      setResults(response.data)
    } catch (err: any) {
      console.error('Error analyzing wallets:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to analyze wallets'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent">PolAlfa</p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight" style={{ fontFamily: 'var(--font-mono)' }}>
              Discover wallets worth copying
            </h1>
            <p className="text-foreground/70 mt-3 max-w-2xl">
              A retro-inspired dashboard that surfaces the most consistent Polymarket traders. Copy their moves or dive into a
              focused analysis of any address.
            </p>
          </div>
          <div className="card-panel rounded-2xl px-6 py-4 max-w-sm text-sm text-foreground/80">
            <p className="font-semibold text-accent mb-2">MVP flow</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Leaderboard pulls recent trades and ranks by trader score.</li>
              <li>Filters out low-activity or one-off lucky wallets.</li>
              <li>Analyze panel reuses the classic /api/analyze-wallets endpoint.</li>
            </ul>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TopWalletsLeaderboard />
          </div>
          <div>
            <WalletInputForm onSubmit={handleAnalyze} loading={loading} />
          </div>
        </section>

        {error && (
          <div className="card-panel rounded-2xl p-4 border border-red-500/50 bg-red-900/10 text-red-100">
            {error}
          </div>
        )}

        {results && !loading && (
          <section className="space-y-4">
            <Leaderboard data={results} />
          </section>
        )}
      </div>
    </main>
  )
}
