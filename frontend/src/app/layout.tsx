// src/app/layout.tsx
import type { Metadata } from 'next'
import '@/styles/globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Health Buddy, AI Healthcare Assistant',
  description: 'AI-powered symptom analysis, health advice, and doctor appointments',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(250,248,244,0.98)',
                color: '#0d1829',
                border: '1px solid rgba(13,24,41,0.1)',
                backdropFilter: 'blur(20px)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.82rem',
                letterSpacing: '0.3px',
                boxShadow: '0 4px 24px rgba(13,24,41,0.08)',
                borderRadius: '10px',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}