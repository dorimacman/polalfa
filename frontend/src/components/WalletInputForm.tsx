'use client'

import { useState } from 'react'

interface WalletInputFormProps {
  onSubmit: (wallets: string[], range: string) => void
  loading: boolean
}

export default function WalletInputForm({ onSubmit, loading }: WalletInputFormProps) {
  const [walletInput, setWalletInput] = useState('')
  const [selectedRange, setSelectedRange] = useState('30d')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Parse wallet addresses (comma or newline separated)
    const wallets = walletInput
      .split(/[\n,]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0)

    if (wallets.length === 0) {
      alert('Please enter at least one wallet address')
      return
    }

    if (wallets.length > 10) {
      alert('Maximum 10 wallets allowed')
      return
    }

    onSubmit(wallets, selectedRange)
  }

  return (
    <div className="card-panel rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Analyze</p>
          <h3 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
            Check specific wallets
          </h3>
          <p className="text-sm text-foreground/70 mt-1">Run the classic PolAlfa analysis on up to 10 addresses.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="wallets" className="block text-sm font-semibold text-foreground mb-2">
            Wallet addresses
            <span className="text-foreground/60 ml-2">(comma or newline separated)</span>
          </label>
          <textarea
            id="wallets"
            rows={4}
            className="w-full px-4 py-3 bg-panel border border-border rounded-xl text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition shadow-inner"
            placeholder="0x1234...&#10;0x5678..."
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">Time range</label>
          <div className="flex gap-3">
            {[
              { value: '7d', label: '7 days' },
              { value: '30d', label: '30 days' },
              { value: '90d', label: '90 days' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedRange(option.value)}
                disabled={loading}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition border border-border ${
                  selectedRange === option.value
                    ? 'bg-primary text-primaryForeground shadow-glow'
                    : 'bg-panel text-foreground/80 hover:text-foreground'
                } ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-primaryForeground text-lg transition-all duration-200 ${
            loading
              ? 'bg-border cursor-not-allowed text-foreground/60'
              : 'bg-primary hover:shadow-glow'
          }`}
        >
          {loading ? 'Analyzing...' : 'Analyze wallets'}
        </button>
      </form>
    </div>
  )
}
