import type { Metadata } from 'next'
import { Header } from '@/components/header'
import './globals.css'

export const metadata: Metadata = {
  title: 'DeckTrader',
  description: 'Trade Magic: The Gathering decks with players near you',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
