'use client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
}

const features = [
  { icon: '', title: 'AI Chat', desc: 'Intelligent conversational assistant for all of your heath related doubts!', href: '/chat' },
  { icon: '', title: 'Symptom Analysis', desc: '3-model ML ensemble predicts top 3 conditions with confidence', href: '/symptoms' },
  { icon: '', title: 'Health Advice', desc: 'Personalised home care, diet guidance & wellness recommendations', href: '/advice' },
  { icon: '', title: 'Appointments', desc: 'Browse verified doctors and book consultations instantly', href: '/appointments' },
]

export default function LandingPage() {
  const [dismissed, setDismissed] = useState(false)

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0d1829',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: `
            radial-gradient(ellipse 65% 40% at 60% 20%, rgba(30,58,138,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 45% 60% at 20% 80%, rgba(90,127,196,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 80% 70%, rgba(201,169,110,0.05) 0%, transparent 60%)
          `,
        }}
      />

      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 44px',
          height: '64px',
          background: 'rgba(13,24,41,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(90,127,196,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(168,192,232,0.4), rgba(30,58,138,0.6))',
              border: '1px solid rgba(168,192,232,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              color: '#fff',
            }}
          >
          </div>
          <span
            style={{
              fontFamily: "'IM Fell English', serif",
              fontSize: '1.05rem',
              color: '#fff',
              letterSpacing: '0.5px',
            }}
          >
            Health <em style={{ fontStyle: 'italic', color: '#a8c0e8' }}>Buddy</em>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {[
            { label: 'Features', href: '#features' },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.62rem',
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                color: 'rgba(168,192,232,0.45)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              {label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
            <button
              style={{
                padding: '8px 20px',
                borderRadius: '4px',
                border: '1px solid rgba(90,127,196,0.25)',
                background: 'transparent',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.6rem',
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                color: 'rgba(168,192,232,0.6)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Sign In
            </button>
          </Link>
          <Link href="/auth/signup" style={{ textDecoration: 'none' }}>
            <button
              style={{
                padding: '8px 20px',
                borderRadius: '4px',
                border: '1px solid rgba(168,192,232,0.35)',
                background: 'rgba(30,58,138,0.35)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.6rem',
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                color: 'rgba(168,192,232,0.9)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      <section
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          padding: '80px 24px 0',
        }}
      >
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{ maxWidth: '800px', margin: '0 auto' }}
        >
          <motion.div variants={item} style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '1px', background: 'rgba(168,192,232,0.4)' }} />
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.6rem',
                  letterSpacing: '4px',
                  textTransform: 'uppercase',
                  color: 'rgba(168,192,232,0.55)',
                }}
              >
                AI-Assisted Health Guidance
              </span>
              <div style={{ width: '40px', height: '1px', background: 'rgba(168,192,232,0.4)' }} />
            </div>
          </motion.div>

          <motion.h1
            variants={item}
            style={{
              fontFamily: "'IM Fell English', serif",
              fontSize: 'clamp(4rem, 12vw, 9rem)',
              fontWeight: 400,
              lineHeight: 0.93,
              color: '#fff',
              marginBottom: '28px',
              letterSpacing: '-1px',
            }}
          >
            Health{' '}
            <em style={{ fontStyle: 'italic', color: '#a8c0e8' }}>Buddy</em>
          </motion.h1>

          <motion.p
            variants={item}
            style={{
              fontFamily: "'Crimson Pro', serif",
              fontStyle: 'italic',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              color: 'rgba(255,255,255,0.45)',
              marginBottom: '20px',
              maxWidth: '520px',
              margin: '0 auto 36px',
              lineHeight: 1.65,
            }}
          >
            Where care meets clarity, your intelligent health companion.
          </motion.p>

          <motion.div
            variants={item}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '44px',
            }}
          >
            <div style={{ height: '1px', width: '80px', background: 'linear-gradient(90deg, transparent, rgba(168,192,232,0.25))' }} />
            <span style={{ color: '#c9a96e', fontSize: '0.85rem' }}></span>
            <div style={{ height: '1px', width: '80px', background: 'linear-gradient(270deg, transparent, rgba(168,192,232,0.25))' }} />
          </motion.div>

          <motion.div
            variants={item}
            style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link href="/auth/signup" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.02, background: 'rgba(30,58,138,0.5)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '14px 44px',
                  borderRadius: '4px',
                  border: '1px solid rgba(168,192,232,0.35)',
                  background: 'rgba(30,58,138,0.35)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.68rem',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  color: 'rgba(168,192,232,0.9)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Begin Your Journey
              </motion.button>
            </Link>
            <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '14px 44px',
                  borderRadius: '4px',
                  border: '1px solid rgba(90,127,196,0.2)',
                  background: 'rgba(255,255,255,0.03)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.68rem',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  color: 'rgba(168,192,232,0.45)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Sign In
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute',
            bottom: '36px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.55rem',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: 'rgba(168,192,232,0.25)',
            }}
          >
            Explore
          </span>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(180deg, rgba(168,192,232,0.2), transparent)' }} />
        </motion.div>
      </section>

      <section
        id="features"
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '80px 24px 120px',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
          <div style={{ width: '28px', height: '1px', background: 'rgba(168,192,232,0.4)' }} />
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.58rem',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: 'rgba(168,192,232,0.45)',
          }}>
            What We Offer
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1px',
            border: '1px solid rgba(90,127,196,0.18)',
            borderRadius: '4px',
            overflow: 'hidden',
            background: 'rgba(90,127,196,0.1)',
          }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              whileHover={{ background: 'rgba(30,58,138,0.2)' }}
              style={{
                padding: '48px 36px',
                background: 'rgba(13,24,41,0.95)',
                cursor: 'default',
                transition: 'background 0.25s',
              }}
            >
              <div
                style={{
                  fontFamily: "'IM Fell English', serif",
                  fontSize: '1.3rem',
                  color: '#c9a96e',
                  marginBottom: '18px',
                  opacity: 0.85,
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.62rem',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  color: 'rgba(168,192,232,0.8)',
                  marginBottom: '12px',
                  fontWeight: 500,
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontFamily: "'Crimson Pro', serif",
                  fontSize: '1rem',
                  color: 'rgba(255,255,255,0.38)',
                  lineHeight: 1.7,
                }}
              >
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            marginTop: '48px',
            flexWrap: 'wrap',
          }}
        >
          {['Private', 'Local', 'Encrypted', 'Not a substitute for medical care'].map(label => (
            <span key={label} style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.52rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'rgba(168,192,232,0.2)',
            }}>
              {label}
            </span>
          ))}
        </motion.div>
      </section>

      <AnimatePresence>
        {!dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 1.5 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              maxWidth: '520px',
              width: 'calc(100% - 48px)',
              background: 'rgba(13,24,41,0.96)',
              border: '1px solid rgba(90,127,196,0.22)',
              borderRadius: '4px',
              padding: '14px 20px 14px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              backdropFilter: 'blur(20px)',
            }}
          >
            <span style={{ color: '#c9a96e', flexShrink: 0, marginTop: '1px' }}></span>
            <p
              style={{
                fontFamily: "'Crimson Pro', serif",
                fontSize: '0.92rem',
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.5,
                flex: 1,
              }}
            >
              Health Buddy is not a substitute for licensed medical care. If you are in immediate danger, please call emergency services.
            </p>
            <button
              onClick={() => setDismissed(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(168,192,232,0.35)',
                fontSize: '1.1rem',
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 768px) {
          nav { padding: 0 20px !important; }
          nav > div:nth-child(2) { display: none; }
        }
      ` }} />
    </main>
  )
}