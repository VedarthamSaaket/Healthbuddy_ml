'use client'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/lib/themeStore'

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore()
  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="w-9 h-9 rounded-full glass flex items-center justify-center text-lg"
      style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
      title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
    >
      {theme === 'dark' ? '' : '◑'}
    </motion.button>
  )
}
