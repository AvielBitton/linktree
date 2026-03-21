import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import '@/src/index.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata = {
  title: 'Aviel Bitton | Running Dashboard',
  description: 'avielbitton - Live boldly as a FREE SPIRIT | Join my journey | MARATHON',
  icons: {
    icon: '/favicon.svg',
  },
}

export const viewport = {
  themeColor: '#000000',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
