'use client'

import { useState } from 'react'
import axios from 'axios'
import WalletInputForm from '@/components/WalletInputForm'
import Leaderboard from '@/components/Leaderboard'

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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-3">
            Pol<span className="text-primary-400">Alfa</span>
          </h1>
          <p className="text-xl text-slate-300">
            Find the alpha wallets on Polymarket
          </p>
        </header>

        {/* Input Form */}
        <div className="max-w-4xl mx-auto mb-12">
          <WalletInputForm onSubmit={handleAnalyze} loading={loading} />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
            <p className="text-slate-300 mt-4">Analyzing wallets...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 text-center">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="max-w-6xl mx-auto">
            <Leaderboard data={results} />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-16 text-slate-400 text-sm">
          <p>
            Powered by{' '}
            <a
              href="https://polymarket.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 transition"
            >
              Polymarket
            </a>{' '}
            official APIs
          </p>
        </footer>
      </div>
    </main>
  )
}
