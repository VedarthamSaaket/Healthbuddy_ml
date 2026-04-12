'use client'
// src/app/dashboard/page.tsx
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navigation } from '@/components/layout/Navigation'
import { useEffect, useState } from 'react'
import { authAPI, chatAPI } from '@/lib/api'
import type { User } from '@/types'

const BASE_URL = "http://localhost:5000" // your FastAPI URL

credentials: 'include'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } }
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } }

const cards = [
  { href: '/chat', icon: '✦', title: 'AI Chat', desc: 'Talk to Health Buddy about your symptoms' },
  { href: '/symptoms', icon: '◈', title: 'Symptom Check', desc: 'ML ensemble ; top 3 predictions with confidence' },
  { href: '/advice', icon: '❋', title: 'Medication Guide', desc: 'Symptom-based medication & care recommendations' },
  //{ href: '/appointments', icon: '◎', title: 'Appointments', desc: 'Browse and book verified doctors' },
]

interface ChatSession { session_id: string; title: string; created_at: string }
interface SymptomLogEntry { id: string; symptoms: any; predictions: any[]; raw_text: string; created_at: string }
interface MedEntry { id: string; condition: string; recommendations: string; created_at: string }
interface AppointmentEntry { id: string; doctor_name: string; specialty: string; status: string; note?: string; created_at: string }




export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [symptomLogs, setSymptomLogs] = useState<SymptomLogEntry[]>([])
  const [medHistory, setMedHistory] = useState<MedEntry[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const userRes = await authAPI.me().catch(() => null)
        if (userRes) setUser(userRes.data)

        try {
          const sessRes = await (chatAPI as any).getSessions?.()
          if (sessRes?.data) setChatSessions(sessRes.data.slice(0, 5))
        } catch { }

        try {
          const symRes = await fetch(`${BASE_URL}/api/medication/symptom-logs`, {
  credentials: 'include'
}).then(r => r.json())
          if (Array.isArray(symRes)) setSymptomLogs(symRes.slice(0, 5))
        } catch { }

        try {
          const medRes = await fetch(`${BASE_URL}/api/medication/history`, {
  credentials: 'include'
}).then(r => r.json())
          if (Array.isArray(medRes)) setMedHistory(medRes.slice(0, 3))
        } catch { }

        // try {
        //   const apptRes = await appointmentsAPI.myAppointments()
        //   if (apptRes?.data) setAppointments(apptRes.data)
        // } catch { }
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  const stats = [
    { label: 'Chat Sessions', value: loading ? '—' : String(chatSessions.length), color: '#a8c0e8' },
    { label: 'Symptom Checks', value: loading ? '—' : String(symptomLogs.length), color: '#c9a96e' },
    { label: 'Med Logs', value: loading ? '—' : String(medHistory.length), color: '#5a7fc4' },
    //{ label: 'Appointments', value: loading ? '—' : String(appointments.length), color: '#2b6cb0' },
  ]

  const symptomsLabel = (log: SymptomLogEntry) => {
    if (Array.isArray(log.symptoms) && log.symptoms.length) return log.symptoms.slice(0, 3).join(', ')
    if (typeof log.symptoms === 'string') return (log.symptoms as string).slice(0, 55)
    return log.raw_text?.slice(0, 55) || 'Symptom check'
  }


  return (
    <main style={{ minHeight: '100vh', background: '#0d1829', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 65% 40% at 60% 20%, rgba(30,58,138,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 45% 60% at 20% 80%, rgba(90,127,196,0.10) 0%, transparent 60%)
        `,
      }} />

      <Navigation />

      <div style={{ position: 'relative', zIndex: 10, paddingTop: '96px', paddingBottom: '80px', paddingLeft: '48px', paddingRight: '48px', maxWidth: '1100px', margin: '0 auto' }}>
        <motion.div variants={container} initial="hidden" animate="show">

          {/* Header */}
          <motion.div variants={item} style={{ marginBottom: '44px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '28px', height: '1px', background: 'rgba(168,192,232,0.5)' }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.62rem', letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.6)' }}>Dashboard</span>
            </div>
            <h1 style={{ fontFamily: "'IM Fell English', serif", fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 400, lineHeight: 0.95, color: '#fff', marginBottom: '10px' }}>
              {loading ? 'Loading…' : user
                ? <>Welcome back, <em style={{ fontStyle: 'italic', color: '#a8c0e8' }}>{user.full_name?.split(' ')[0] || 'friend'}</em></>
                : <>Your <em style={{ fontStyle: 'italic', color: '#a8c0e8' }}>Profile</em></>}
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', color: 'rgba(168,192,232,0.3)', letterSpacing: '0.5px' }}>
              {user?.email || '—'}<span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>member since {memberSince}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(90,127,196,0.18)', borderRadius: '4px', padding: '24px 20px' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.52rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)', marginBottom: '12px' }}>{s.label}</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.6rem', fontWeight: 300, color: s.color, lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Quick Access */}
          <motion.div variants={item} style={{ marginBottom: '24px' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.52rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)', marginBottom: '14px' }}>Quick Access</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {cards.map(c => (
                <Link key={c.href} href={c.href} style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{ y: -3, background: 'rgba(30,58,138,0.18)', borderColor: 'rgba(168,192,232,0.28)' } as any}
                    transition={{ duration: 0.18 }}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(90,127,196,0.18)', borderRadius: '4px', padding: '22px 18px', cursor: 'pointer', height: '100%' }}
                  >
                    <div style={{ color: '#c9a96e', fontSize: '1.1rem', marginBottom: '12px', opacity: 0.8 }}>{c.icon}</div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.75)', marginBottom: '8px', fontWeight: 500 }}>{c.title}</p>
                    <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.88rem', color: 'rgba(255,255,255,0.32)', lineHeight: 1.55 }}>{c.desc}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Chat sessions + Appointments */}
          <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>

            {/* Chat sessions */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(90,127,196,0.18)', borderRadius: '4px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.52rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)' }}>Recent Conversations</p>
                <Link href="/chat" style={{ textDecoration: 'none' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.5rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)', cursor: 'pointer' }}>+ New</span>
                </Link>
              </div>
              {loading ? (
                <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)' }}>Loading…</p>
              ) : chatSessions.length === 0 ? (
                <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)', lineHeight: 1.65 }}>
                  No conversations yet. Start chatting with Health Buddy.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {chatSessions.map(s => (
                    <Link key={s.session_id} href="/chat" style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '10px 12px', borderRadius: '4px', border: '1px solid rgba(90,127,196,0.12)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                        <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.92rem', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>{s.title}…</p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.48rem', letterSpacing: '1px', color: 'rgba(168,192,232,0.2)' }}>
                          {new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Appointments
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(90,127,196,0.18)', borderRadius: '4px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.52rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)' }}>Appointments</p>
                <Link href="/appointments" style={{ textDecoration: 'none' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.5rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)', cursor: 'pointer' }}>Book →</span>
                </Link>
              </div>
              {loading ? (
                <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)' }}>Loading…</p>
              ) : appointments.length === 0 ? (
                <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)', lineHeight: 1.65 }}>
                  No appointments booked yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {appointments.slice(0, 4).map(a => (
                    <div key={a.id} style={{
                      padding: '10px 12px', borderRadius: '4px',
                      border: `1px solid ${a.status === 'confirmed' ? 'rgba(168,192,232,0.2)' : a.status === 'pending' ? 'rgba(201,169,110,0.2)' : 'rgba(90,127,196,0.1)'}`,
                      background: 'rgba(255,255,255,0.02)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.95rem', color: 'rgba(255,255,255,0.65)', marginBottom: '2px' }}>{a.doctor_name}</p>
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: '0.46rem', letterSpacing: '1.5px', textTransform: 'uppercase',
                          color: a.status === 'confirmed' ? '#a8c0e8' : a.status === 'pending' ? '#c9a96e' : 'rgba(255,255,255,0.2)',
                          padding: '2px 6px', border: '1px solid currentColor', borderRadius: '2px',
                        }}>{a.status}</span>
                      </div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.48rem', letterSpacing: '1px', color: 'rgba(168,192,232,0.2)' }}>
                        {a.specialty} · {new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div> */}
          </motion.div>

          {/* Symptom Logs + Medication History */}
          <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

            {/* Recent symptom checks */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(90,127,196,0.18)', borderRadius: '4px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.52rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)' }}>Recent Symptom Checks</p>
                <Link href="/symptoms" style={{ textDecoration: 'none' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.5rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)', cursor: 'pointer' }}>New →</span>
                </Link>
              </div>
              {loading ? (
                <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)' }}>Loading…</p>
              ) : symptomLogs.length === 0 ? (
                <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)', lineHeight: 1.65 }}>
                  No symptom checks yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {symptomLogs.map(log => (
                    <Link key={log.id} href="/symptoms" style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '10px 12px', borderRadius: '4px', border: '1px solid rgba(90,127,196,0.12)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                        <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.92rem', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
                          {symptomsLabel(log)}
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {log.predictions?.[0] && (
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.48rem', letterSpacing: '1px', color: 'rgba(168,192,232,0.35)' }}>
                              {log.predictions[0].disease} · {log.predictions[0].confidence}%
                            </span>
                          )}
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.48rem', letterSpacing: '1px', color: 'rgba(168,192,232,0.2)' }}>
                            {new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Medication history */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(90,127,196,0.18)', borderRadius: '4px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.52rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)' }}>Medication Logs</p>
                <Link href="/advice" style={{ textDecoration: 'none' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.5rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)', cursor: 'pointer' }}>View all →</span>
                </Link>
              </div>
              {loading ? (
                <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)' }}>Loading…</p>
              ) : medHistory.length === 0 ? (
                <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)', lineHeight: 1.65 }}>
                  No medication guidance generated yet. Visit the Medication Guide after a Symptom Check.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {medHistory.map((a, i) => (
                    <div key={a.id} style={{
                      paddingBottom: i < medHistory.length - 1 ? '16px' : 0,
                      borderBottom: i < medHistory.length - 1 ? '1px solid rgba(90,127,196,0.1)' : 'none',
                    }}>
                      {a.condition && (
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.52rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.4)', marginBottom: '4px' }}>
                          {a.condition}
                        </p>
                      )}
                      <p style={{
                        fontFamily: "'Crimson Pro', serif", fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '4px',
                      } as React.CSSProperties}>{a.recommendations}</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.48rem', letterSpacing: '1.5px', color: 'rgba(168,192,232,0.2)' }}>
                        {new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Doctor Portal */}
          {/* {user?.role === 'doctor' && (
            <motion.div variants={item} style={{
              background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.22)',
              borderRadius: '4px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px',
            }}>
              <span style={{ color: '#c9a96e', fontSize: '1.2rem' }}>◎</span>
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.55rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#c9a96e', fontWeight: 500, marginBottom: '4px' }}>Doctor Portal</p>
                <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.95rem', color: 'rgba(255,255,255,0.38)' }}>
                  Manage your appointments from the{' '}
                  <Link href="/appointments" style={{ color: '#c9a96e', textDecoration: 'none' }}>Appointments page</Link>.
                </p>
              </div>
            </motion.div>
          )} */}

          {/* Disclaimer */}
          <motion.p variants={item} style={{
            textAlign: 'center', marginTop: '40px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.5rem', letterSpacing: '1.5px',
            textTransform: 'uppercase', color: 'rgba(168,192,232,0.15)',
          }}>
            ⚕ Health Buddy provides general information only, not a substitute for professional medical advice.
          </motion.p>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .two-col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .card-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-pad { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>
    </main>
  )
}