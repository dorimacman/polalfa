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
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Wallet Input */}
        <div>
          <label htmlFor="wallets" className="block text-sm font-medium text-slate-200 mb-2">
            Wallet Addresses
            <span className="text-slate-400 ml-2">(1-10 addresses, comma or line separated)</span>
          </label>
          <textarea
            id="wallets"
            rows={4}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            placeholder="0x1234...&#10;0x5678...&#10;or comma-separated"
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Time Range Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-3">
            Time Range
          </label>
          <div className="flex gap-3">
            {[
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedRange(option.value)}
                disabled={loading}
                className={`
                  flex-1 py-2.5 px-4 rounded-lg font-medium transition
                  ${
                    selectedRange === option.value
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`
            w-full py-3.5 px-6 rounded-lg font-semibold text-white text-lg
            transition-all duration-200
            ${
              loading
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50'
            }
          `}
        >
          {loading ? 'Analyzing...' : 'Analyze Wallets'}
        </button>
      </form>
    </div>
  )
}
