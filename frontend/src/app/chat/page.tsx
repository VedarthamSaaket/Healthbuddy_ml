'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation } from '@/components/layout/Navigation'
import { EmergencyBanner } from '@/components/crisis/EmergencyBanner'
import { chatAPI } from '@/lib/api'
import { useThemeStore } from '@/lib/themeStore'
import type { Message, Prediction } from '@/types'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

const LANG_OPTIONS = [
  { code: 'en', label: 'English', short: 'EN', nativeLabel: 'English' },
  { code: 'hi', label: 'हिन्दी', short: 'HI', nativeLabel: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు', short: 'TE', nativeLabel: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ', short: 'KN', nativeLabel: 'ಕನ್ನಡ' },
]

const LANG_SR: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', te: 'te-IN', kn: 'kn-IN',
}

const INITIAL_MESSAGES: Record<string, string> = {
  en: "What's on your mind? Describe any symptoms or health concerns you have.",
  hi: "आपके मन में क्या है? अपने लक्षण या स्वास्थ्य समस्या बताइए।",
  te: "మీకు ఏమి సమస్య ఉంది? మీ లక్షణాలను వివరించండి.",
  kn: "ನಿಮ್ಮ ಸಮಸ್ಯೆ ಏನು? ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ವಿವరಿಸಿ.",
}

const PLACEHOLDER: Record<string, string> = {
  en: "Describe your symptoms or health concern…",
  hi: "अपने लक्षण या समस्या बताइए…",
  te: "మీ లక్షణాలను వివరించండి…",
  kn: "ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ…",
}

// SVG mic icon
const MicIcon = ({ listening }: { listening: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect
      x="9" y="2" width="6" height="11" rx="3"
      stroke={listening ? '#e87878' : 'rgba(168,192,232,0.55)'}
      strokeWidth="1.5"
      fill={listening ? 'rgba(232,120,120,0.12)' : 'none'}
    />
    <path
      d="M5 10a7 7 0 0 0 14 0"
      stroke={listening ? '#e87878' : 'rgba(168,192,232,0.4)'}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line x1="12" y1="19" x2="12" y2="22" stroke={listening ? '#e87878' : 'rgba(168,192,232,0.35)'} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="22" x2="15" y2="22" stroke={listening ? '#e87878' : 'rgba(168,192,232,0.35)'} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// SVG speaker icon
const SpeakerIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11 5L6 9H2v6h4l5 4V5z"
      stroke={active ? '#a8c0e8' : 'rgba(168,192,232,0.4)'}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={active ? 'rgba(168,192,232,0.12)' : 'none'}
    />
    {active && (
      <>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#a8c0e8" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="rgba(168,192,232,0.45)" strokeWidth="1.5" strokeLinecap="round" />
      </>
    )}
    {!active && (
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="rgba(168,192,232,0.3)" strokeWidth="1.5" strokeLinecap="round" />
    )}
  </svg>
)

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

// Tag format: [AUDIO-xx] transcript
const AUDIO_TAG_RE = /^\[AUDIO-([a-z]{2})\]\s*/

interface ExtendedMessage extends Message {
  isAudioMessage?: boolean
  audioLang?: string
  suggestSymptomCheck?: boolean
}

export default function ChatPage() {
  const { language } = useThemeStore()
  const [messages, setMessages] = useState<ExtendedMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: INITIAL_MESSAGES[language] ?? INITIAL_MESSAGES['en'],
      timestamp: new Date(),
      isAudioMessage: false,
    },
  ])

  // Reset chat on language change
  useEffect(() => {
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: INITIAL_MESSAGES[language] ?? INITIAL_MESSAGES['en'],
        timestamp: new Date(),
        isAudioMessage: false,
      },
    ])
  }, [language])

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [emergency, setEmergency] = useState(false)
  const [listening, setListening] = useState(false)
  const [ttsOn, setTtsOn] = useState(false)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [audioLang, setAudioLang] = useState(language)
  const [translatingMsgId, setTranslatingMsgId] = useState<string | null>(null)
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({})

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const langPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatAPI.getHistory?.().then((res: any) => {
      if (res?.data?.length) {
        const loaded: ExtendedMessage[] = res.data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at),
          isAudioMessage: false,
        }))
        setMessages(loaded)
      }
    }).catch(() => { })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langPickerRef.current && !langPickerRef.current.contains(e.target as Node)) {
        setShowLangPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Keep audioLang in sync with global language
  useEffect(() => {
    setAudioLang(language)
  }, [language])

  const speak = useCallback((text: string) => {
    if (!ttsOn || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = LANG_SR[language] || 'en-IN'
    utt.rate = 0.95
    window.speechSynthesis.speak(utt)
  }, [ttsOn, language])

  /**
   * Core send function.
   *
   * @param overrideContent  Raw content string. If it starts with [AUDIO-xx],
   *                         the tag is stripped for display but `xx` is sent
   *                         to the backend as `audio_language`.
   */
  const sendMessage = async (overrideContent?: string) => {
    const raw = overrideContent || input.trim()
    if (!raw || loading) return

    // --- Extract audio language tag if present ---
    const tagMatch = raw.match(AUDIO_TAG_RE)
    const detectedAudioLang = tagMatch ? tagMatch[1] : null          // e.g. "te", "kn", null
    const displayContent = tagMatch ? raw.replace(AUDIO_TAG_RE, '') : raw   // Clean text for display

    const userMsg: ExtendedMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: displayContent,   // Show clean text in the bubble
      timestamp: new Date(),
      isAudioMessage: !!detectedAudioLang,
      audioLang: detectedAudioLang ?? undefined,
    }

    setMessages(prev => [...prev, userMsg])
    if (!overrideContent) setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))

      // --- Pass audio_language so the backend prepends the right system prompt ---
      const res = await chatAPI.sendMessage(
        raw,                          // Send raw (with tag) so backend can also inspect if needed
        history,
        language,
        detectedAudioLang ?? '',      // audio_language field
      )

      const { response, predictions, emergency: isEmergency, suggest_symptom_check } = res.data

      if (isEmergency) setEmergency(true)

      const assistantMsg: ExtendedMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        predictions,
        suggestSymptomCheck: suggest_symptom_check,
        isAudioMessage: false,
        audioLang: detectedAudioLang ?? undefined,  // Track origin lang for translation UI
      }

      setMessages(prev => [...prev, assistantMsg])
      speak(response)

    } catch {
      toast.error('Connection error')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  /**
   * Starts speech recognition for a given language code and immediately
   * sends the result tagged so sendMessage can route it correctly.
   */
  const startListeningForLang = (lang: string) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('Voice input not supported in this browser.'); return }

    const rec = new SR()
    rec.lang = LANG_SR[lang] || 'en-IN'
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => { setListening(false); toast.error('Voice input error.') }

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      // Always tag so sendMessage knows the origin language
      const tagged = `[AUDIO-${lang}] ${transcript}`
      sendMessage(tagged)
    }

    recognitionRef.current = rec
    rec.start()
  }

  const handleMicClick = () => {
    if (listening) { stopListening(); return }
    setShowLangPicker(p => !p)
  }

  const handleLangSelect = (lang: string) => {
    setAudioLang(lang)
    setShowLangPicker(false)
    setTimeout(() => startListeningForLang(lang), 100)
  }

  const handleTranslate = async (msgId: string, text: string, targetLang: string) => {
    if (translations[msgId]?.[targetLang]) return
    setTranslatingMsgId(msgId)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chat/translate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, target_language: targetLang }),
          credentials: 'include',
        }
      )
      const data = await res.json()
      setTranslations(prev => ({
        ...prev,
        [msgId]: { ...(prev[msgId] || {}), [targetLang]: data.translated },
      }))
    } catch {
      toast.error('Translation failed.')
    } finally {
      setTranslatingMsgId(null)
    }
  }

  const startNewConversation = () => {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: INITIAL_MESSAGES[language] ?? INITIAL_MESSAGES['en'],
      timestamp: new Date(),
    }])
    setEmergency(false)
  }

  const isEnglishOutput = (msg: ExtendedMessage) => {
    if (msg.role !== 'assistant') return false
    if (msg.audioLang && msg.audioLang !== 'en') return false
    return true
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0d1829', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: emergency
          ? 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(192,57,43,0.18) 0%, transparent 60%)'
          : `radial-gradient(ellipse 65% 40% at 60% 20%, rgba(30,58,138,0.18) 0%, transparent 60%),
             radial-gradient(ellipse 45% 60% at 20% 80%, rgba(90,127,196,0.10) 0%, transparent 60%)`,
      }} />

      <Navigation />
      {emergency && <EmergencyBanner />}

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed', top: '64px', left: 0, bottom: 0, width: '240px',
          borderRight: '1px solid rgba(90,127,196,0.15)',
          background: 'rgba(13,24,41,0.92)', backdropFilter: 'blur(20px)',
          zIndex: 20, display: 'flex', flexDirection: 'column', padding: '20px 16px', overflowY: 'auto',
        }}
        className="hide-mobile"
      >
        <button
          onClick={startNewConversation}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '4px',
            border: '1px solid rgba(168,192,232,0.2)', background: 'rgba(30,58,138,0.18)',
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.62rem', letterSpacing: '2.5px',
            textTransform: 'uppercase', color: 'rgba(168,192,232,0.7)', cursor: 'pointer',
            textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '28px', transition: 'all 0.2s',
          }}
        >
          <span style={{ color: '#a8c0e8', fontSize: '0.9rem' }}>+</span> New conversation
        </button>

        {messages.length <= 1 ? (
          <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.88rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)', padding: '0 4px' }}>
            Your conversation history will appear here.
          </p>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.55rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)', marginBottom: '10px', padding: '0 4px' }}>
              This Session
            </p>
            <div style={{ padding: '8px 10px', borderRadius: '4px', border: '1px solid rgba(90,127,196,0.2)', background: 'rgba(30,58,138,0.12)' }}>
              <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {messages.find(m => m.role === 'user')?.content?.slice(0, 40) || 'Current conversation'}
              </p>
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(90,127,196,0.12)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['Private', 'Local', 'Encrypted'].map(label => (
            <span key={label} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.52rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.2)' }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div
        style={{ flex: 1, marginLeft: '240px', paddingTop: emergency ? '144px' : '96px', paddingBottom: '160px', paddingLeft: '32px', paddingRight: '32px', position: 'relative', zIndex: 10 }}
        className="chat-main-offset"
      >
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <motion.div variants={container} initial="hidden" animate="show" style={{ marginBottom: '44px' }}>
            <motion.div variants={item} style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '28px', height: '1px', background: 'rgba(168,192,232,0.5)' }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.62rem', letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.6)' }}>AI Health Companion</span>
            </motion.div>
            <motion.h1 variants={item} style={{ fontFamily: "'IM Fell English', serif", fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 400, lineHeight: 0.95, color: '#fff', marginBottom: '12px' }}>
              Health <em style={{ fontStyle: 'italic', color: '#a8c0e8' }}>Buddy</em>
            </motion.h1>
            <motion.p variants={item} style={{ fontFamily: "'Crimson Pro', serif", fontSize: '1rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.45)' }}>
              Share your symptoms or health concerns. I'll listen and help guide you.
            </motion.p>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  {msg.role === 'assistant' && (
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, marginRight: '10px', marginTop: '2px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: msg.emergency ? 'linear-gradient(135deg, #c0392b, #7f1d1d)' : 'rgba(30,58,138,0.6)',
                      border: msg.emergency ? '1px solid rgba(192,57,43,0.4)' : '1px solid rgba(168,192,232,0.25)',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="rgba(168,192,232,0.6)" />
                      </svg>
                    </div>
                  )}

                  {msg.role === 'user' && msg.isAudioMessage && msg.audioLang && msg.audioLang !== 'en' && (
                    <div style={{ alignSelf: 'center', marginRight: '8px', opacity: 0.5 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <rect x="9" y="2" width="6" height="11" rx="3" stroke="#a8c0e8" strokeWidth="1.5" />
                        <path d="M5 10a7 7 0 0 0 14 0" stroke="#a8c0e8" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}

                  <div style={{ maxWidth: '76%' }}>
                    <div style={{
                      padding: '14px 18px', borderRadius: '4px',
                      fontFamily: "'Crimson Pro', serif", fontSize: '1.05rem', lineHeight: 1.7,
                      color: msg.role === 'user' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.78)',
                      background: msg.role === 'user'
                        ? 'rgba(30,58,138,0.28)'
                        : msg.emergency
                          ? 'rgba(192,57,43,0.1)'
                          : 'rgba(255,255,255,0.04)',
                      border: msg.role === 'user'
                        ? '1px solid rgba(168,192,232,0.2)'
                        : msg.emergency
                          ? '1px solid rgba(192,57,43,0.3)'
                          : '1px solid rgba(90,127,196,0.18)',
                    }}>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>

                      {/* Translations */}
                      {Object.entries(translations[msg.id] || {}).map(([lang, text]) => (
                        <div key={lang} style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(90,127,196,0.15)' }}>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.48rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.35)', marginBottom: '6px' }}>
                            {LANG_OPTIONS.find(l => l.code === lang)?.nativeLabel}
                          </p>
                          <p style={{ fontFamily: 'inherit', fontSize: '1rem', lineHeight: 1.9, color: 'rgba(255,255,255,0.65)', margin: 0, whiteSpace: 'pre-wrap' }}>{text}</p>
                        </div>
                      ))}

                      {/* Predictions */}
                      {msg.predictions && msg.predictions.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.5)', marginBottom: '18px' }}>Possible Conditions</p>
                          {msg.predictions.map((p: Prediction, i: number) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} style={{ marginBottom: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.6rem', fontWeight: 300, color: 'rgba(168,192,232,0.15)', lineHeight: 1, width: '28px' }}>
                                    {String(i + 1).padStart(2, '0')}
                                  </span>
                                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', color: '#fff' }}>{p.disease}</span>
                                </div>
                                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', color: p.confidence >= 65 ? '#a8c0e8' : p.confidence >= 35 ? '#c9a96e' : '#5a7fc4', fontWeight: 500 }}>{p.confidence}%</span>
                              </div>
                              <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${p.confidence}%` }} transition={{ duration: 1, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                                  style={{ height: '100%', background: 'linear-gradient(90deg, #1e3a8a, #a8c0e8)', borderRadius: '2px' }} />
                              </div>
                            </motion.div>
                          ))}
                          <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.82rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.25)', marginTop: '10px' }}>
                            Estimates only. Please consult a doctor for diagnosis.
                          </p>
                        </div>
                      )}

                      {/* Symptom check redirect */}
                      {msg.suggestSymptomCheck && (
                        <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '4px', border: '1px solid rgba(201,169,110,0.3)', background: 'rgba(201,169,110,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,169,110,0.8)', margin: 0 }}>
                            Run detailed ML analysis
                          </p>
                          <a href="/symptoms" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#c9a96e', textDecoration: 'none', border: '1px solid rgba(201,169,110,0.4)', padding: '4px 12px', borderRadius: '2px' }}>
                            Symptom Check
                          </a>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px' }}>
                          {msg.timestamp instanceof Date
                            ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(30,58,138,0.6)', border: '1px solid rgba(168,192,232,0.25)', marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} />
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(90,127,196,0.18)', borderRadius: '4px', padding: '14px 18px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#a8c0e8' }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* Fixed input bar */}
      <motion.div
        initial={{ y: 80 }} animate={{ y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed', bottom: 0, left: '240px', right: 0, zIndex: 30,
          padding: '12px 32px 20px',
          background: 'rgba(13,24,41,0.95)', backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(90,127,196,0.15)',
        }}
        className="chat-input-offset"
      >
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: '10px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(90,127,196,0.22)',
            borderRadius: '4px', padding: '10px 14px',
          }}>

            {/* Mic button with language picker */}
            <div style={{ position: 'relative', flexShrink: 0 }} ref={langPickerRef}>
              <motion.button
                onClick={handleMicClick}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                style={{
                  width: '38px', height: '38px', borderRadius: '4px',
                  border: listening
                    ? '1px solid rgba(232,120,120,0.6)'
                    : '1px solid rgba(90,127,196,0.2)',
                  background: listening
                    ? 'rgba(192,57,43,0.12)'
                    : showLangPicker
                      ? 'rgba(30,58,138,0.25)'
                      : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                title={listening ? 'Stop recording' : 'Voice input. Select language'}
              >
                <MicIcon listening={listening} />
              </motion.button>

              {/* Language picker dropdown */}
              <AnimatePresence>
                {showLangPicker && !listening && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', bottom: '48px', left: 0,
                      background: 'rgba(10,18,36,0.98)', backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(90,127,196,0.35)', borderRadius: '6px',
                      padding: '6px', minWidth: '175px', zIndex: 200,
                    }}
                  >
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.48rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)', padding: '5px 10px 8px', margin: 0 }}>
                      Select voice language
                    </p>
                    {LANG_OPTIONS.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => handleLangSelect(lang.code)}
                        style={{
                          width: '100%', padding: '9px 12px', borderRadius: '4px', border: 'none',
                          background: audioLang === lang.code ? 'rgba(30,58,138,0.4)' : 'transparent',
                          fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem',
                          color: audioLang === lang.code ? '#a8c0e8' : 'rgba(255,255,255,0.55)',
                          cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px',
                          transition: 'all 0.12s',
                        }}
                      >
                        <span style={{ fontSize: '0.56rem', letterSpacing: '2px', opacity: 0.5, minWidth: '18px' }}>{lang.short}</span>
                        <span>{lang.nativeLabel}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* TTS button */}
            <motion.button
              onClick={() => setTtsOn(p => !p)}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              style={{
                width: '38px', height: '38px', borderRadius: '4px',
                border: ttsOn ? '1px solid rgba(168,192,232,0.35)' : '1px solid rgba(90,127,196,0.15)',
                background: ttsOn ? 'rgba(30,58,138,0.25)' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title={ttsOn ? 'Disable voice reply' : 'Enable voice reply'}
            >
              <SpeakerIcon active={ttsOn} />
            </motion.button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              placeholder={
                listening
                  ? `Listening in ${LANG_OPTIONS.find(l => l.code === audioLang)?.nativeLabel}…`
                  : PLACEHOLDER[language] ?? PLACEHOLDER['en']
              }
              style={{
                flex: 1, background: 'transparent', resize: 'none', border: 'none', outline: 'none',
                fontFamily: "'Crimson Pro', serif", fontSize: '1.05rem', fontStyle: 'italic',
                color: 'rgba(255,255,255,0.75)', padding: '6px 4px', maxHeight: '120px',
              }}
            />

            <motion.button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: '8px 22px', borderRadius: '4px',
                border: '1px solid rgba(168,192,232,0.25)',
                background: !input.trim() || loading ? 'rgba(30,58,138,0.1)' : 'rgba(30,58,138,0.3)',
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.62rem', letterSpacing: '2.5px',
                textTransform: 'uppercase',
                color: !input.trim() || loading ? 'rgba(168,192,232,0.3)' : 'rgba(168,192,232,0.85)',
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                flexShrink: 0, transition: 'all 0.2s',
              }}
            >
              Send
            </motion.button>
          </div>

          {/* Active audio lang indicator */}
          {listening && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e87878' }}
              />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.52rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(232,120,120,0.7)' }}>
                Recording in {LANG_OPTIONS.find(l => l.code === audioLang)?.nativeLabel}
              </span>
              <button onClick={stopListening} style={{ background: 'none', border: 'none', color: 'rgba(232,120,120,0.6)', cursor: 'pointer', fontSize: '0.65rem', padding: 0 }}>Stop</button>
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.52rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)' }}>
            Not a substitute for professional care
          </p>
        </div>
      </motion.div>

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .chat-main-offset { margin-left: 0 !important; }
          .chat-input-offset { left: 0 !important; }
        }
      `}</style>
    </main>
  )
}