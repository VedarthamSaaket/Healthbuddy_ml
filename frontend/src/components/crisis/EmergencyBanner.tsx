'use client'
// src/components/crisis/EmergencyBanner.tsx
import { motion } from 'framer-motion'

export function EmergencyBanner() {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="emergency-banner fixed top-0 left-0 right-0 z-[100] px-6 py-4 text-center"
    >
      <div className="max-w-3xl mx-auto">
        <p className="font-future font-bold text-sm tracking-wider uppercase mb-1">
          Emergency Detected. Please Seek Immediate Help
        </p>
        <p className="font-body text-sm">
          Call <strong>112</strong> (India Emergency) · <strong>102</strong> (Ambulance) ·{' '}
          <strong>iCall: 9152987821</strong> · US: <strong>911</strong>
        </p>
      </div>
    </motion.div>
  )
}
