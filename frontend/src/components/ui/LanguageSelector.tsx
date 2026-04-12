'use client'
import { useThemeStore } from '@/lib/themeStore'
import type { Language } from '@/types'

const LANGS: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'te', label: 'తె' },
  { code: 'kn', label: 'ಕ' },
]

export function LanguageSelector() {
  const { language, setLanguage } = useThemeStore()
  return (
    <div className="flex items-center gap-1">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLanguage(l.code)}
          className={`lang-pill px-2 py-1 rounded-lg text-xs font-future font-semibold glass`}
          style={{
            border: '1px solid var(--border-subtle)',
            color: language === l.code ? 'var(--text-primary)' : 'var(--text-muted)',
            background: language === l.code
              ? 'linear-gradient(135deg, rgba(43,210,255,0.2), rgba(43,255,136,0.15))'
              : 'var(--bg-glass)',
            borderColor: language === l.code ? 'rgba(43,210,255,0.4)' : undefined,
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
