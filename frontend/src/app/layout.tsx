import type { Metadata } from 'next'
import { Inter, Space_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const mono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'PolAlfa - Copy top-performing Polymarket wallets',
  description: 'Discover and copy the most consistent Polymarket traders.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable} bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  )
}
