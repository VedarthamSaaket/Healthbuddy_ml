'use client'
// src/components/layout/Navigation.tsx

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { authAPI } from '@/lib/api'
import { useThemeStore } from '@/lib/themeStore'
import toast from 'react-hot-toast'
import Image from 'next/image'


const navLinks = [
  { href: '/chat', label: 'Chat', icon: '+' },
  { href: '/symptoms', label: 'Symptoms', icon: '*' },
  { href: '/advice', label: 'Advice', icon: '*' },
  { href: '/dashboard', label: 'Profile', icon: '°' },
]

const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  // 🌐 Global language state
  const { language, setLanguage } = useThemeStore()

  const handleSignOut = async () => {
    try {
      await authAPI.signout()
      toast.success('Signed out')
      router.push('/')
    } catch {
      router.push('/')
    }
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: '64px',
        background: 'rgba(244, 240, 231, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(4, 10, 18, 0.08)',
      }}
    >
      {/* Logo */}
<div
  style={{
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  <img
    src="/logo.png"
    alt="logo"
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    }}
  />
</div>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {navLinks.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                textDecoration: 'none',
                color: active ? '#0c121c' : 'rgba(16, 19, 24, 0.45)',
                transition: 'color 0.2s',
                position: 'relative',
                paddingBottom: '2px',
              }}
              className="hide-mobile nav-link"
            >
              <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>{icon}</span>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.7rem',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  fontWeight: active ? 500 : 400,
                }}
              >
                {label}
              </span>

              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: '#c9a96e',
                  }}
                />
              )}
            </Link>
          )
        })}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Crisis Button */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid rgba(192,57,43,0.3)',
            background: 'rgba(192,57,43,0.05)',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#c0392b',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.62rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#c0392b',
              fontWeight: 500,
            }}
          >
            Crisis
          </span>
        </motion.div>

        {/* 🌐 Language Selector (NEW) */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '4px',
            background: 'rgba(30,58,138,0.08)',
            color: '#0d1829',
            border: '1px solid rgba(13,24,41,0.15)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.65rem',
            letterSpacing: '1px',
            cursor: 'pointer',
          }}
        >
          {LANG_OPTIONS.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>

        {/* Theme toggle */}
        <div style={{ width: '36px', height: '20px', position: 'relative' }}>
          <ThemeToggle />
        </div>

        {/* Sign out */}
        <motion.button
          onClick={handleSignOut}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="hide-mobile"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.68rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(13,24,41,0.4)',
            padding: '4px 0',
          }}
        >
          Out
        </motion.button>
      </div>
    </motion.nav>
  )
}