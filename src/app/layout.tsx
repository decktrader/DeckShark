import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Header } from '@/components/header'
import { FeedbackForm } from '@/components/feedback-form'
import './globals.css'

export const metadata: Metadata = {
  title: 'DeckShark',
  description: 'Trade Magic: The Gathering decks with players near you',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DeckShark',
  },
  themeColor: '#09090b',
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
        <footer
          id="feedback"
          className="border-t border-white/5 py-6 text-center"
        >
          <div className="text-muted-foreground flex items-center justify-center gap-3 text-xs">
            <FeedbackForm />
            <span className="text-white/20">|</span>
            <a
              href="/about"
              className="hover:text-foreground transition-colors"
            >
              About DeckShark
            </a>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
