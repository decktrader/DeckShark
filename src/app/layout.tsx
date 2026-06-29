import type { Metadata } from 'next'
import { Space_Grotesk, Figtree, Spline_Sans_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import './globals.css'

// Display / headings
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

// Body / UI
const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-figtree',
  display: 'swap',
})

// Data / numbers / timestamps
const splineMono = Spline_Sans_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-spline-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DeckShark',
  description: 'Trade Magic: The Gathering decks with players near you',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DeckShark',
  },
  themeColor: '#f4f0e8',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${figtree.variable} ${splineMono.variable}`}
    >
      <body>
        <Header />
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
