import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/components/shared/LanguageProvider'
import { Navbar } from '@/components/shared/Navbar'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'AI Slide — Create Professional Presentations with AI',
  description: 'Create stunning AI-powered presentations in seconds with Google Gemini. Export to PowerPoint or PDF.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ky" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#0f172a] text-gray-900 antialiased`} suppressHydrationWarning>
        <LanguageProvider>
          <Navbar />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
