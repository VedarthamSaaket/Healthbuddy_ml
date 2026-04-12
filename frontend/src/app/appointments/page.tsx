'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation } from '@/components/layout/Navigation'
import { useThemeStore } from '@/lib/themeStore'
import toast from 'react-hot-toast'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Language config ──────────────────────────────────────────────────────────
const LANG_OPTIONS = [
  { code: 'en', short: 'EN', nativeLabel: 'English' },
  { code: 'hi', short: 'HI', nativeLabel: 'हिन्दी' },
  { code: 'te', short: 'TE', nativeLabel: 'తెలుగు' },
  { code: 'kn', short: 'KN', nativeLabel: 'ಕನ್ನಡ' },
]

// All UI strings per language
const UI: Record<string, Record<string, string>> = {
  en: {
    badge: 'Symptom-Based Guidance',
    title1: 'Medication',
    title2: 'Guidance',
    subtitle: 'Carefully curated OTC recommendations based on your ML symptom analysis. Always consult a doctor before taking any medication.',
    tabGenerate: 'Generate',
    tabHistory: 'History',
    basedOn: 'Based on Symptom Check',
    specificQ: 'Specific Question (optional)',
    specificPlaceholder: 'e.g. Are there any OTC options safe during pregnancy? What should I avoid?',
    disclaimerNotice: 'Medication guidance is based on your ML symptom analysis and is for informational purposes only. It is not a prescription. Always consult a licensed pharmacist or doctor before taking any medication.',
    generateBtn: '✦  Generate Medication Guidance',
    generating: 'Analysing your health data…',
    addressing: 'Addressing',
    noSymptoms: 'No symptom data found. Complete a Symptom Check first so we can provide tailored guidance.',
    goToCheck: 'Go to Symptom Check',
    noHistory: 'No medication history yet. Generate your first guidance above.',
    loadingData: 'Loading your health data…',
    topLabel: 'Top',
    confidenceMatch: 'match',
    guidanceReport: 'Guidance Report',
    footerDisclaimer: 'These are informational suggestions only. A licensed pharmacist or doctor must be consulted before taking any medication.',
    pageDisclaimer: '⚕ Health Buddy is not a substitute for professional medical advice, diagnosis, or treatment.',
    translateBtn: 'Translate',
    translating: 'Translating…',
    translatedIn: 'Translated',
  },
  hi: {
    badge: 'लक्षण-आधारित मार्गदर्शन',
    title1: 'दवा',
    title2: 'मार्गदर्शन',
    subtitle: 'आपके ML लक्षण विश्लेषण के आधार पर सावधानी से चुनी गई OTC सिफारिशें। कोई भी दवा लेने से पहले डॉक्टर से सलाह लें।',
    tabGenerate: 'उत्पन्न करें',
    tabHistory: 'इतिहास',
    basedOn: 'लक्षण जाँच के आधार पर',
    specificQ: 'विशिष्ट प्रश्न (वैकल्पिक)',
    specificPlaceholder: 'जैसे — गर्भावस्था में कौन सी दवाएं सुरक्षित हैं? क्या न लें?',
    disclaimerNotice: 'दवा मार्गदर्शन केवल जानकारी के लिए है। यह नुस्खा नहीं है। कोई भी दवा लेने से पहले लाइसेंस प्राप्त फार्मासिस्ट या डॉक्टर से परामर्श करें।',
    generateBtn: '✦  दवा मार्गदर्शन प्राप्त करें',
    generating: 'आपके स्वास्थ्य डेटा का विश्लेषण हो रहा है…',
    addressing: 'संबोधित कर रहे हैं',
    noSymptoms: 'कोई लक्षण डेटा नहीं मिला। पहले लक्षण जाँच पूरी करें।',
    goToCheck: 'लक्षण जाँच पर जाएं',
    noHistory: 'अभी तक कोई दवा इतिहास नहीं है। ऊपर से पहला मार्गदर्शन प्राप्त करें।',
    loadingData: 'आपका स्वास्थ्य डेटा लोड हो रहा है…',
    topLabel: 'शीर्ष',
    confidenceMatch: 'मिलान',
    guidanceReport: 'मार्गदर्शन रिपोर्ट',
    footerDisclaimer: 'ये केवल जानकारी सुझाव हैं। कोई भी दवा लेने से पहले लाइसेंस प्राप्त फार्मासिस्ट या डॉक्टर से परामर्श करें।',
    pageDisclaimer: '⚕ Health Buddy पेशेवर चिकित्सा सलाह का विकल्प नहीं है।',
    translateBtn: 'अनुवाद करें',
    translating: 'अनुवाद हो रहा है…',
    translatedIn: 'अनुवादित',
  },
  te: {
    badge: 'లక్షణ-ఆధారిత మార్గదర్శకత్వం',
    title1: 'మందుల',
    title2: 'మార్గదర్శకత్వం',
    subtitle: 'మీ ML లక్షణ విశ్లేషణ ఆధారంగా జాగ్రత్తగా సంకలనం చేయబడిన OTC సిఫార్సులు. ఏ మందు తీసుకోవడానికి ముందు ఎల్లప్పుడూ డాక్టర్‌ని సంప్రదించండి.',
    tabGenerate: 'రూపొందించు',
    tabHistory: 'చరిత్ర',
    basedOn: 'లక్షణ తనిఖీ ఆధారంగా',
    specificQ: 'నిర్దిష్ట ప్రశ్న (ఐచ్ఛికం)',
    specificPlaceholder: 'ఉదా. గర్భిణీ సమయంలో సురక్షితమైన OTC ఎంపికలు ఏమైనా ఉన్నాయా?',
    disclaimerNotice: 'మందుల మార్గదర్శకత్వం సమాచార ప్రయోజనాల కోసం మాత్రమే. ఇది ప్రిస్క్రిప్షన్ కాదు. ఏ మందు తీసుకోవడానికి ముందు లైసెన్స్ పొందిన ఫార్మసిస్ట్ లేదా డాక్టర్‌ని సంప్రదించండి.',
    generateBtn: '✦  మందుల మార్గదర్శకత్వం రూపొందించు',
    generating: 'మీ ఆరోగ్య డేటాను విశ్లేషిస్తున్నారు…',
    addressing: 'పరిష్కరిస్తోంది',
    noSymptoms: 'లక్షణ డేటా కనుగొనబడలేదు. ముందు లక్షణ తనిఖీని పూర్తి చేయండి.',
    goToCheck: 'లక్షణ తనిఖీకి వెళ్ళు',
    noHistory: 'ఇంకా మందుల చరిత్ర లేదు. పైన మొదటి మార్గదర్శకత్వం రూపొందించండి.',
    loadingData: 'మీ ఆరోగ్య డేటా లోడ్ అవుతోంది…',
    topLabel: 'టాప్',
    confidenceMatch: 'సరిపోలిక',
    guidanceReport: 'మార్గదర్శకత్వం నివేదిక',
    footerDisclaimer: 'ఇవి సమాచార సూచనలు మాత్రమే. ఏ మందు తీసుకోవడానికి ముందు లైసెన్స్ పొందిన ఫార్మసిస్ట్ లేదా డాక్టర్‌ని సంప్రదించాలి.',
    pageDisclaimer: '⚕ Health Buddy వృత్తిపరమైన వైద్య సలహాకు ప్రత్యామ్నాయం కాదు.',
    translateBtn: 'అనువదించు',
    translating: 'అనువదిస్తున్నారు…',
    translatedIn: 'అనువాదం',
  },
  kn: {
    badge: 'ರೋಗಲಕ್ಷಣ-ಆಧಾರಿತ ಮಾರ್ಗದರ್ಶನ',
    title1: 'ಔಷಧ',
    title2: 'ಮಾರ್ಗದರ್ಶನ',
    subtitle: 'ನಿಮ್ಮ ML ರೋಗಲಕ್ಷಣ ವಿಶ್ಲೇಷಣೆ ಆಧರಿಸಿ ಎಚ್ಚರಿಕೆಯಿಂದ ಸಂಗ್ರಹಿಸಿದ OTC ಶಿಫಾರಸುಗಳು. ಯಾವುದೇ ಔಷಧ ತೆಗೆದುಕೊಳ್ಳುವ ಮೊದಲು ಯಾವಾಗಲೂ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    tabGenerate: 'ರಚಿಸಿ',
    tabHistory: 'ಇತಿಹಾಸ',
    basedOn: 'ರೋಗಲಕ್ಷಣ ತಪಾಸಣೆ ಆಧರಿಸಿ',
    specificQ: 'ನಿರ್ದಿಷ್ಟ ಪ್ರಶ್ನೆ (ಐಚ್ಛಿಕ)',
    specificPlaceholder: 'ಉದಾ. ಗರ್ಭಾವಸ್ಥೆಯಲ್ಲಿ ಸುರಕ್ಷಿತ OTC ಆಯ್ಕೆಗಳು ಯಾವುವು?',
    disclaimerNotice: 'ಔಷಧ ಮಾರ್ಗದರ್ಶನ ಕೇವಲ ಮಾಹಿತಿ ಉದ್ದೇಶಗಳಿಗಾಗಿ ಮಾತ್ರ. ಇದು ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಲ್ಲ. ಯಾವುದೇ ಔಷಧ ತೆಗೆದುಕೊಳ್ಳುವ ಮೊದಲು ಪರವಾನಿಗೆ ಪಡೆದ ಫಾರ್ಮಸಿಸ್ಟ್ ಅಥವಾ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    generateBtn: '✦  ಔಷಧ ಮಾರ್ಗದರ್ಶನ ರಚಿಸಿ',
    generating: 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಡೇಟಾ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ…',
    addressing: 'ಪರಿಹರಿಸುತ್ತಿದೆ',
    noSymptoms: 'ರೋಗಲಕ್ಷಣ ಡೇಟಾ ಕಂಡುಬಂದಿಲ್ಲ. ಮೊದಲು ರೋಗಲಕ್ಷಣ ತಪಾಸಣೆ ಪೂರ್ಣಗೊಳಿಸಿ.',
    goToCheck: 'ರೋಗಲಕ್ಷಣ ತಪಾಸಣೆಗೆ ಹೋಗಿ',
    noHistory: 'ಇನ್ನೂ ಔಷಧ ಇತಿಹಾಸ ಇಲ್ಲ. ಮೇಲೆ ಮೊದಲ ಮಾರ್ಗದರ್ಶನ ರಚಿಸಿ.',
    loadingData: 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಡೇಟಾ ಲೋಡ್ ಆಗುತ್ತಿದೆ…',
    topLabel: 'ಟಾಪ್',
    confidenceMatch: 'ಹೊಂದಾಣಿಕೆ',
    guidanceReport: 'ಮಾರ್ಗದರ್ಶನ ವರದಿ',
    footerDisclaimer: 'ಇವು ಕೇವಲ ಮಾಹಿತಿ ಸಲಹೆಗಳಾಗಿವೆ. ಯಾವುದೇ ಔಷಧ ತೆಗೆದುಕೊಳ್ಳುವ ಮೊದಲು ಪರವಾನಿಗೆ ಪಡೆದ ಫಾರ್ಮಸಿಸ್ಟ್ ಅಥವಾ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಬೇಕು.',
    pageDisclaimer: '⚕ Health Buddy ವೃತ್ತಿಪರ ವೈದ್ಯಕೀಯ ಸಲಹೆಗೆ ಪರ್ಯಾಯವಲ್ಲ.',
    translateBtn: 'ಅನುವಾದಿಸಿ',
    translating: 'ಅನುವಾದಿಸಲಾಗುತ್ತಿದೆ…',
    translatedIn: 'ಅನುವಾದ',
  },
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } }

interface SymptomLog {
  id: string
  symptoms: string[] | string
  predictions: { disease: string; confidence: number }[]
  raw_text: string
  source: string
  created_at: string
}

interface MedHistoryEntry {
  id: string
  condition: string
  recommendations: string
  predictions: { disease: string; confidence: number }[]
  language: string
  created_at: string
}

const fetchJSON = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, { credentials: 'include', ...options })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

function SectionBlock({ title, content }: { title: string; content: string }) {
  const lines = content.split('\n').filter(Boolean)
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{ width: '20px', height: '1px', background: 'rgba(168,192,232,0.4)' }} />
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.56rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.55)', margin: 0 }}>
          {title}
        </p>
      </div>
      {lines.map((line, i) => (
        <p key={i} style={{ fontFamily: "'Crimson Pro', serif", fontSize: '1.05rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.72)', margin: '0 0 4px 0', paddingLeft: '30px' }}>
          {line.replace(/^\*\*[^*]+\*\*\s*/, '').replace(/^[-•]\s*/, '')}
        </p>
      ))}
    </div>
  )
}

function parseRecommendations(text: string) {
  const sections = [
    { key: 'condition', label: 'Likely Condition' },
    { key: 'otc', label: 'Common OTC Remedies' },
    { key: 'home', label: 'Home Care Measures' },
    { key: 'diet', label: 'Dietary Guidance' },
    { key: 'doctor', label: 'When to See a Doctor' },
    { key: 'warnings', label: 'Important Warnings' },
  ]
  const result: { label: string; content: string }[] = []
  for (let i = 0; i < sections.length; i++) {
    const current = sections[i]
    const next = sections[i + 1]
    const pattern = new RegExp(`\\*\\*${current.label}\\*\\*([\\s\\S]*?)(?=\\*\\*${next?.label}\\*\\*|$)`, 'i')
    const match = text.match(pattern)
    if (match) result.push({ label: current.label, content: match[1].trim() })
  }
  if (result.length === 0) return [{ label: 'Recommendations', content: text }]
  return result
}

export default function MedicationPage() {
  const { language, setLanguage } = useThemeStore()
  const lang = language || 'en'
  const t = UI[lang] ?? UI['en']

  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([])
  const [medHistory, setMedHistory] = useState<MedHistoryEntry[]>([])
  const [selectedLogId, setSelectedLogId] = useState<string>('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    recommendations: string
    condition: string
    predictions: { disease: string; confidence: number }[]
  } | null>(null)
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate')
  const [loadingData, setLoadingData] = useState(true)

  // Translation state: resultTranslated stores translated text for current result
  const [resultTranslated, setResultTranslated] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)
  const [showTranslated, setShowTranslated] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [logs, history] = await Promise.all([
          fetchJSON(`${API_BASE}/api/medication/symptom-logs`),
          fetchJSON(`${API_BASE}/api/medication/history`),
        ])
        setSymptomLogs(logs)
        setMedHistory(history)
        if (logs.length > 0) setSelectedLogId(logs[0].id)
      } catch {
        toast.error('Failed to load your health data.')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [])

  // Reset translation when result changes
  useEffect(() => {
    setResultTranslated(null)
    setShowTranslated(false)
  }, [result])

  const generate = async () => {
    if (symptomLogs.length === 0) {
      toast.error('No symptom data found. Please complete a Symptom Check first.')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const data = await fetchJSON(`${API_BASE}/api/medication/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), language: lang, symptom_log_id: selectedLogId }),
      })
      setResult(data)
      const history = await fetchJSON(`${API_BASE}/api/medication/history`)
      setMedHistory(history)
    } catch (e: any) {
      const msg = e?.message?.includes('400')
        ? 'No symptom data found. Complete a Symptom Check first.'
        : 'Failed to generate recommendations. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleTranslate = async () => {
    if (!result) return
    // If already translated and just toggling display
    if (resultTranslated) { setShowTranslated(p => !p); return }
    // Need to translate — pick a target lang (translate to Hindi if current is en, else to English)
    const targetLang = lang !== 'en' ? lang : 'hi'
    setTranslating(true)
    try {
      const res = await fetch(`${API_BASE}/api/chat/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: result.recommendations, target_language: targetLang }),
        credentials: 'include',
      })
      const data = await res.json()
      setResultTranslated(data.translated)
      setShowTranslated(true)
    } catch {
      toast.error('Translation failed.')
    } finally {
      setTranslating(false)
    }
  }

  const translateTargetLabel = () => {
    if (lang !== 'en') return 'English'
    return 'हिन्दी / తెలుగు / ಕನ್ನಡ'
  }

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) }
    catch { return d }
  }

  const formatSymptoms = (s: string[] | string) => {
    if (Array.isArray(s)) return s.slice(0, 4).join(', ')
    return String(s).slice(0, 80)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0d1829', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 65% 40% at 60% 20%, rgba(30,58,138,0.18) 0%, transparent 60%),
                     radial-gradient(ellipse 45% 60% at 20% 80%, rgba(90,127,196,0.10) 0%, transparent 60%)`,
      }} />

      <Navigation />

      <div style={{
        position: 'relative', zIndex: 10,
        paddingTop: '96px', paddingBottom: '80px',
        paddingLeft: '48px', paddingRight: '48px',
        maxWidth: '900px', margin: '0 auto',
      }}>
        <motion.div variants={container} initial="hidden" animate="show">

          {/* ── Language Bar ─────────────────────────────────────────────────── */}
          <motion.div variants={item} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
            <div style={{
              display: 'flex', gap: '3px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(90,127,196,0.2)',
              borderRadius: '4px', padding: '4px',
            }}>
              {LANG_OPTIONS.map(l => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code as any)
                    setResult(null)
                    setResultTranslated(null)
                    setShowTranslated(false)
                  }}
                  style={{
                    padding: '6px 14px', borderRadius: '3px', border: 'none', cursor: 'pointer',
                    background: lang === l.code ? 'rgba(30,58,138,0.5)' : 'transparent',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: lang === l.code ? '0.72rem' : '0.65rem',
                    letterSpacing: '1.5px', fontWeight: lang === l.code ? 600 : 400,
                    color: lang === l.code ? '#a8c0e8' : 'rgba(255,255,255,0.35)',
                    transition: 'all 0.18s', minWidth: '44px',
                  }}
                  title={l.nativeLabel}
                >
                  {l.short}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── Header ───────────────────────────────────────────────────────── */}
          <motion.div variants={item} style={{ marginBottom: '44px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '28px', height: '1px', background: 'rgba(168,192,232,0.5)' }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.62rem', letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.6)' }}>
                {t.badge}
              </span>
            </div>
            <h1 style={{ fontFamily: "'IM Fell English', serif", fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 400, lineHeight: 0.95, color: '#fff', marginBottom: '12px' }}>
              {t.title1} <em style={{ fontStyle: 'italic', color: '#a8c0e8' }}>{t.title2}</em>
            </h1>
            <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '1rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.45)' }}>
              {t.subtitle}
            </p>
          </motion.div>

          {/* ── Tabs ─────────────────────────────────────────────────────────── */}
          <motion.div variants={item} style={{ display: 'flex', gap: '0', marginBottom: '32px', borderBottom: '1px solid rgba(90,127,196,0.2)' }}>
            {(['generate', 'history'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 24px', border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #a8c0e8' : '2px solid transparent',
                  background: 'transparent', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', letterSpacing: '2.5px', textTransform: 'uppercase',
                  color: activeTab === tab ? '#a8c0e8' : 'rgba(168,192,232,0.35)',
                  transition: 'all 0.2s', marginBottom: '-1px',
                }}>
                {tab === 'generate' ? t.tabGenerate : `${t.tabHistory} (${medHistory.length})`}
              </button>
            ))}
          </motion.div>

          {/* ── Generate Tab ─────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {activeTab === 'generate' && (
              <motion.div key="generate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>

                {loadingData ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <motion.div
                      style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(168,192,232,0.15)', borderTopColor: '#a8c0e8', margin: '0 auto 16px' }}
                      animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.95rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.3)' }}>
                      {t.loadingData}
                    </p>
                  </div>
                ) : symptomLogs.length === 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,169,110,0.25)', borderRadius: '4px', padding: '40px 32px', textAlign: 'center' }}>
                    <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '1.1rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>
                      {t.noSymptoms}
                    </p>
                    <a href="/symptoms" style={{ display: 'inline-block', padding: '10px 28px', borderRadius: '4px', border: '1px solid rgba(201,169,110,0.4)', color: '#c9a96e', fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', letterSpacing: '2.5px', textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.2s' }}>
                      {t.goToCheck}
                    </a>
                  </div>
                ) : (
                  <>
                    {/* Symptom log selector */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(90,127,196,0.2)', borderRadius: '4px', padding: '28px 32px', marginBottom: '16px' }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.5)', marginBottom: '16px' }}>
                        {t.basedOn}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {symptomLogs.slice(0, 5).map(log => {
                          const sel = selectedLogId === log.id
                          const topPred = log.predictions?.[0]
                          return (
                            <motion.button key={log.id} onClick={() => setSelectedLogId(log.id)} whileHover={{ scale: 1.005 }}
                              style={{
                                padding: '12px 16px', borderRadius: '4px', textAlign: 'left',
                                border: sel ? '1px solid rgba(168,192,232,0.45)' : '1px solid rgba(90,127,196,0.18)',
                                background: sel ? 'rgba(30,58,138,0.28)' : 'rgba(255,255,255,0.02)',
                                cursor: 'pointer', transition: 'all 0.2s',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px',
                              }}>
                              <div>
                                <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.95rem', color: sel ? '#fff' : 'rgba(255,255,255,0.6)', margin: 0, marginBottom: '4px' }}>
                                  {formatSymptoms(log.symptoms)}
                                </p>
                                {topPred && (
                                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '0.5px', color: sel ? 'rgba(168,192,232,0.7)' : 'rgba(168,192,232,0.35)', margin: 0 }}>
                                    {t.topLabel}: {topPred.disease} ({topPred.confidence}%)
                                  </p>
                                )}
                              </div>
                              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.52rem', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                                {formatDate(log.created_at)}
                              </span>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Optional query */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(90,127,196,0.2)', borderRadius: '4px', padding: '24px 32px', marginBottom: '20px' }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.5)', marginBottom: '12px' }}>
                        {t.specificQ}
                      </p>
                      <textarea value={query} onChange={e => setQuery(e.target.value)} rows={2}
                        placeholder={t.specificPlaceholder}
                        style={{ width: '100%', background: 'transparent', resize: 'none', border: 'none', outline: 'none', fontFamily: "'Crimson Pro', serif", fontSize: '1.02rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}
                      />
                    </div>

                    {/* Disclaimer */}
                    <div style={{ marginBottom: '20px', padding: '12px 18px', borderRadius: '4px', border: '1px solid rgba(192,57,43,0.2)', background: 'rgba(192,57,43,0.06)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'rgba(192,57,43,0.7)', fontSize: '0.9rem', flexShrink: 0 }}>⚕</span>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', letterSpacing: '0.5px', lineHeight: 1.7, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                        {t.disclaimerNotice}
                      </p>
                    </div>

                    {/* Generate button */}
                    <motion.button onClick={generate} disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      style={{
                        width: '100%', padding: '16px', borderRadius: '4px',
                        border: '1px solid rgba(168,192,232,0.35)',
                        background: loading ? 'rgba(30,58,138,0.15)' : 'rgba(30,58,138,0.25)',
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', letterSpacing: '3px', textTransform: 'uppercase',
                        color: loading ? 'rgba(168,192,232,0.5)' : 'rgba(168,192,232,0.9)',
                        cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '40px',
                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                      }}>
                      {loading ? (
                        <>
                          <motion.div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(168,192,232,0.2)', borderTopColor: '#a8c0e8' }}
                            animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                          {t.generating}
                        </>
                      ) : t.generateBtn}
                    </motion.button>

                    {/* ── Result ─────────────────────────────────────────────── */}
                    <AnimatePresence>
                      {result && (
                        <motion.div
                          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                          {result.condition && (
                            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.56rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.4)' }}>
                                {t.addressing}
                              </span>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', color: '#a8c0e8' }}>
                                {result.condition}
                              </span>
                              {result.predictions?.[0] && (
                                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', color: 'rgba(168,192,232,0.5)' }}>
                                  ({result.predictions[0].confidence}% {t.confidenceMatch})
                                </span>
                              )}
                            </div>
                          )}

                          {/* Translate button */}
                          {lang !== 'en' && (
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                              <motion.button
                                onClick={handleTranslate}
                                disabled={translating}
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                style={{
                                  padding: '7px 20px', borderRadius: '3px', cursor: translating ? 'not-allowed' : 'pointer',
                                  border: '1px solid rgba(201,169,110,0.35)',
                                  background: showTranslated ? 'rgba(201,169,110,0.15)' : 'transparent',
                                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', letterSpacing: '2px', textTransform: 'uppercase',
                                  color: translating ? 'rgba(201,169,110,0.4)' : '#c9a96e',
                                  display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                                }}>
                                {translating ? (
                                  <>
                                    <motion.div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid rgba(201,169,110,0.2)', borderTopColor: '#c9a96e' }}
                                      animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                                    {t.translating}
                                  </>
                                ) : (
                                  <>
                                    <span style={{ fontSize: '0.8rem' }}>⇄</span>
                                    {showTranslated ? 'Show original' : `${t.translateBtn} → English`}
                                  </>
                                )}
                              </motion.button>
                            </div>
                          )}

                          {/* Also allow EN users to translate to Hindi for rural users */}
                          {lang === 'en' && (
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              {LANG_OPTIONS.filter(l => l.code !== 'en').map(l => (
                                <motion.button key={l.code}
                                  onClick={async () => {
                                    if (translating || !result) return
                                    setTranslating(true)
                                    try {
                                      const res = await fetch(`${API_BASE}/api/chat/translate`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ text: result.recommendations, target_language: l.code }),
                                        credentials: 'include',
                                      })
                                      const data = await res.json()
                                      setResultTranslated(data.translated)
                                      setShowTranslated(true)
                                    } catch { toast.error('Translation failed.') }
                                    finally { setTranslating(false) }
                                  }}
                                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                  style={{
                                    padding: '6px 14px', borderRadius: '3px', cursor: 'pointer',
                                    border: '1px solid rgba(201,169,110,0.25)',
                                    background: 'transparent',
                                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '1.5px',
                                    color: 'rgba(201,169,110,0.7)', transition: 'all 0.18s',
                                  }}>
                                  {l.short}
                                </motion.button>
                              ))}
                              {showTranslated && resultTranslated && (
                                <motion.button onClick={() => setShowTranslated(false)}
                                  whileHover={{ scale: 1.04 }}
                                  style={{ padding: '6px 14px', borderRadius: '3px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)' }}>
                                  × EN
                                </motion.button>
                              )}
                            </div>
                          )}

                          {/* Recommendations display */}
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(90,127,196,0.25)', borderRadius: '4px', padding: '32px' }}>
                            <AnimatePresence mode="wait">
                              {showTranslated && resultTranslated ? (
                                <motion.div key="translated" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                  <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
                                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.5rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(201,169,110,0.5)' }}>
                                      {t.translatedIn}
                                    </span>
                                  </div>
                                  <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '1.05rem', lineHeight: 1.9, color: 'rgba(255,255,255,0.72)', whiteSpace: 'pre-wrap' }}>
                                    {resultTranslated}
                                  </p>
                                </motion.div>
                              ) : (
                                <motion.div key="original" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                  {parseRecommendations(result.recommendations).map((section, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                                      <SectionBlock title={section.label} content={section.content} />
                                      {i < parseRecommendations(result.recommendations).length - 1 && (
                                        <div style={{ height: '1px', background: 'rgba(90,127,196,0.1)', margin: '16px 0 24px' }} />
                                      )}
                                    </motion.div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div style={{ marginTop: '16px', padding: '12px 18px', borderRadius: '4px', border: '1px solid rgba(201,169,110,0.2)', background: 'rgba(201,169,110,0.05)' }}>
                            <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.88rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                              {t.footerDisclaimer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </motion.div>
            )}

            {/* ── History Tab ──────────────────────────────────────────────── */}
            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                {medHistory.length === 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(90,127,196,0.15)', borderRadius: '4px', padding: '60px 32px', textAlign: 'center' }}>
                    <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '1.05rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.3)' }}>
                      {t.noHistory}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {medHistory.map((entry, i) => {
                      const sections = parseRecommendations(entry.recommendations)
                      return (
                        <motion.details key={entry.id}
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(90,127,196,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                          <summary style={{ padding: '18px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', listStyle: 'none', userSelect: 'none' }}>
                            <div>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem', color: '#fff' }}>
                                {entry.condition || t.guidanceReport}
                              </span>
                              {entry.predictions?.[0] && (
                                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', color: 'rgba(168,192,232,0.45)', marginLeft: '12px' }}>
                                  {entry.predictions[0].confidence}% {t.confidenceMatch}
                                </span>
                              )}
                            </div>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.52rem', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.2)' }}>
                              {formatDate(entry.created_at)}
                            </span>
                          </summary>
                          <div style={{ padding: '0 24px 24px', borderTop: '1px solid rgba(90,127,196,0.12)' }}>
                            <div style={{ paddingTop: '20px' }}>
                              {sections.map((section, j) => (
                                <div key={j}>
                                  <SectionBlock title={section.label} content={section.content} />
                                  {j < sections.length - 1 && (
                                    <div style={{ height: '1px', background: 'rgba(90,127,196,0.08)', margin: '12px 0 20px' }} />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.details>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Disclaimer */}
          <motion.p variants={item} style={{ marginTop: '56px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)' }}>
            {t.pageDisclaimer}
          </motion.p>
        </motion.div>
      </div>
    </main>
  )
}