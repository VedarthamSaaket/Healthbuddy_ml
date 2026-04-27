'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation } from '@/components/layout/Navigation'
import { EmergencyBanner } from '@/components/crisis/EmergencyBanner'
import { adviceAPI } from '@/lib/api'
import { useThemeStore } from '@/lib/themeStore'
import type { Prediction } from '@/types'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

const LANG_OPTIONS = [
  { code: 'en', short: 'EN', nativeLabel: 'English' },
  { code: 'hi', short: 'HI', nativeLabel: 'हिन्दी' },
  { code: 'te', short: 'TE', nativeLabel: 'తెలుగు' },
  { code: 'kn', short: 'KN', nativeLabel: 'ಕನ್ನಡ' },
]

const LANG_SR: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', te: 'te-IN', kn: 'kn-IN',
}

const UI: Record<string, Record<string, string>> = {
  en: {
    badge: '3-Model ML Ensemble',
    title1: 'Symptom',
    title2: 'Check',
    subtitle: 'Select or describe your symptoms. Our ensemble model returns top 3 predictions with confidence scores.',
    quickSelect: 'Quick Select',
    describeLabel: 'Describe in Your Own Words',
    describePlaceholder: 'e.g. I have had a high fever for 2 days with severe headache and muscle pain…',
    analyseBtn: '✦  Analyse Symptoms',
    analysing: 'Analysing Symptoms…',
    possibleConditions: 'Possible Conditions',
    noMatch: 'No specific condition matched. Please describe your symptoms in more detail or consult a doctor.',
    mlDisclaimer: 'These are probability estimates, not medical diagnoses. Please consult a qualified doctor.',
    guidance: 'Health Guidance',
    disclaimer: '⚕ Health Buddy is not a substitute for professional medical advice, diagnosis, or treatment.',
    voiceSelect: 'Select voice language',
    listening: 'Listening',
    stopRecording: 'Stop',
    recordingIn: 'Recording in',
    tooShort: 'Please describe your symptoms in more detail — at least a sentence or two so we can give you accurate results.',
    tooFewChips: 'Please select at least 3 symptoms, or describe your symptoms in the text box below.',
    wordCount: 'words',
    minWords: 'minimum 10 words',
  },
  hi: {
    badge: '3-मॉडल ML समूह',
    title1: 'लक्षण',
    title2: 'जाँच',
    subtitle: 'अपने लक्षण चुनें या बताएं। हमारा मॉडल शीर्ष 3 संभावनाएं विश्वास स्तर के साथ देता है।',
    quickSelect: 'जल्दी चुनें',
    describeLabel: 'अपने शब्दों में बताएं',
    describePlaceholder: 'जैसे — मुझे 2 दिनों से तेज बुखार है, सिरदर्द और मांसपेशियों में दर्द है…',
    analyseBtn: '✦  लक्षण विश्लेषण करें',
    analysing: 'विश्लेषण हो रहा है…',
    possibleConditions: 'संभावित स्थितियाँ',
    noMatch: 'कोई विशेष स्थिति नहीं मिली। कृपया अपने लक्षण विस्तार से बताएं या डॉक्टर से मिलें।',
    mlDisclaimer: 'ये ML मॉडल के अनुमान हैं, चिकित्सा निदान नहीं। कृपया योग्य डॉक्टर से परामर्श लें।',
    guidance: 'स्वास्थ्य सलाह',
    disclaimer: '⚕ Health Buddy पेशेवर चिकित्सा सलाह का विकल्प नहीं है।',
    voiceSelect: 'आवाज़ भाषा चुनें',
    listening: 'सुन रहा है',
    stopRecording: 'रोकें',
    recordingIn: 'रिकॉर्डिंग हो रही है',
    tooShort: 'कृपया अपने लक्षणों को अधिक विस्तार से बताएं ताकि हम सटीक परिणाम दे सकें।',
    tooFewChips: 'कृपया कम से कम 3 लक्षण चुनें, या नीचे टेक्स्ट बॉक्स में अपने लक्षण बताएं।',
    wordCount: 'शब्द',
    minWords: 'न्यूनतम 10 शब्द',
  },
  te: {
    badge: '3-మోడల్ ML సమూహం',
    title1: 'లక్షణ',
    title2: 'తనిఖీ',
    subtitle: 'మీ లక్షణాలను ఎంచుకోండి లేదా వివరించండి. మా మోడల్ నమ్మకం స్కోర్‌లతో టాప్ 3 అంచనాలు ఇస్తుంది.',
    quickSelect: 'త్వరగా ఎంచుకోండి',
    describeLabel: 'మీ మాటల్లో వివరించండి',
    describePlaceholder: 'ఉదా. నాకు 2 రోజులుగా తీవ్రమైన జ్వరం, తలనొప్పి మరియు కండరాల నొప్పి ఉన్నాయి…',
    analyseBtn: '✦  లక్షణాలు విశ్లేషించు',
    analysing: 'విశ్లేషిస్తున్నారు…',
    possibleConditions: 'సాధ్యమయ్యే పరిస్థితులు',
    noMatch: 'నిర్దిష్ట పరిస్థితి కనుగొనబడలేదు. దయచేసి మీ లక్షణాలను వివరంగా వివరించండి లేదా డాక్టర్‌ను సంప్రదించండి.',
    mlDisclaimer: 'ఇవి ML మోడల్ అంచనాలు మాత్రమే, వైద్య నిర్ధారణలు కాదు. అర్హత కలిగిన డాక్టర్‌ని సంప్రదించండి.',
    guidance: 'ఆరోగ్య మార్గదర్శకత్వం',
    disclaimer: '⚕ Health Buddy వృత్తిపరమైన వైద్య సలహాకు ప్రత్యామ్నాయం కాదు.',
    voiceSelect: 'వాయిస్ భాష ఎంచుకోండి',
    listening: 'వింటున్నారు',
    stopRecording: 'ఆపు',
    recordingIn: 'రికార్డింగ్ అవుతోంది',
    tooShort: 'దయచేసి మీ లక్షణాలను మరింత వివరంగా వివరించండి, తద్వారా మేము ఖచ్చితమైన ఫలితాలు అందించగలము.',
    tooFewChips: 'దయచేసి కనీసం 3 లక్షణాలు ఎంచుకోండి, లేదా క్రింద టెక్స్ట్ బాక్స్‌లో వివరించండి.',
    wordCount: 'పదాలు',
    minWords: 'కనీసం 10 పదాలు',
  },
  kn: {
    badge: '3-ಮಾದರಿ ML ತಂಡ',
    title1: 'ರೋಗಲಕ್ಷಣ',
    title2: 'ತಪಾಸಣೆ',
    subtitle: 'ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ಅಥವಾ ವಿವರಿಸಿ. ನಮ್ಮ ಮಾದರಿ ವಿಶ್ವಾಸ ಸ್ಕೋರ್‌ಗಳೊಂದಿಗೆ ಅಗ್ರ 3 ಊಹೆಗಳನ್ನು ನೀಡುತ್ತದೆ.',
    quickSelect: 'ತ್ವರಿತ ಆಯ್ಕೆ',
    describeLabel: 'ನಿಮ್ಮ ಮಾತುಗಳಲ್ಲಿ ವಿವರಿಸಿ',
    describePlaceholder: 'ಉದಾ. ನನಗೆ 2 ದಿನಗಳಿಂದ ತೀವ್ರ ಜ್ವರ, ತಲೆನೋವು ಮತ್ತು ಮಾಂಸಖಂಡ ನೋವು ಇದೆ…',
    analyseBtn: '✦  ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ',
    analysing: 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ…',
    possibleConditions: 'ಸಂಭವನೀಯ ಸ್ಥಿತಿಗಳು',
    noMatch: 'ನಿರ್ದಿಷ್ಟ ಸ್ಥಿತಿ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿವರವಾಗಿ ವಿವರಿಸಿ ಅಥವಾ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    mlDisclaimer: 'ಇವು ML ಮಾದರಿ ಅಂದಾಜುಗಳು ಮಾತ್ರ, ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯಗಳಲ್ಲ. ಅರ್ಹ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    guidance: 'ಆರೋಗ್ಯ ಮಾರ್ಗದರ್ಶನ',
    disclaimer: '⚕ Health Buddy ವೃತ್ತಿಪರ ವೈದ್ಯಕೀಯ ಸಲಹೆಗೆ ಪರ್ಯಾಯವಲ್ಲ.',
    voiceSelect: 'ಧ್ವನಿ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ',
    listening: 'ಕೇಳುತ್ತಿದ್ದೇನೆ',
    stopRecording: 'ನಿಲ್ಲಿಸಿ',
    recordingIn: 'ರೆಕಾರ್ಡಿಂಗ್ ಆಗುತ್ತಿದೆ',
    tooShort: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಹೆಚ್ಚು ವಿವರವಾಗಿ ವಿವರಿಸಿ ಇದರಿಂದ ನಾವು ನಿಖರ ಫಲಿತಾಂಶಗಳನ್ನು ನೀಡಬಹುದು.',
    tooFewChips: 'ದಯವಿಟ್ಟು ಕನಿಷ್ಠ 3 ರೋಗಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ, ಅಥವಾ ಕೆಳಗಿನ ಪಠ್ಯ ಪೆಟ್ಟಿಗೆಯಲ್ಲಿ ವಿವರಿಸಿ.',
    wordCount: 'ಪದಗಳು',
    minWords: 'ಕನಿಷ್ಠ 10 ಪದಗಳು',
  },
}

const SYMPTOMS: Record<string, string[]> = {
  en: ['Fever', 'Headache', 'Cough', 'Fatigue', 'Nausea', 'Vomiting', 'Diarrhea', 'Sore throat', 'Runny nose', 'Body ache', 'Chest pain', 'Shortness of breath', 'Dizziness', 'Rash', 'Joint pain', 'Loss of appetite', 'Stomach pain', 'Back pain', 'Chills', 'Sweating'],
  hi: ['बुखार', 'सिरदर्द', 'खांसी', 'थकान', 'मतली', 'उल्टी', 'दस्त', 'गले में दर्द', 'नाक बहना', 'शरीर में दर्द', 'सीने में दर्द', 'सांस लेने में तकलीफ', 'चक्कर', 'चकत्ते', 'जोड़ों में दर्द', 'भूख न लगना', 'पेट दर्द', 'पीठ दर्द', 'कंपकंपी', 'पसीना'],
  te: ['జ్వరం', 'తలనొప్పి', 'దగ్గు', 'అలసట', 'వికారం', 'వాంతి', 'విరేచనాలు', 'గొంతు నొప్పి', 'ముక్కు కారడం', 'శరీర నొప్పి', 'ఛాతీ నొప్పి', 'శ్వాస తీసుకోవడం కష్టం', 'తలతిరగడం', 'దద్దుర్లు', 'కీళ్ళ నొప్పి', 'ఆకలి లేకపోవడం', 'కడుపు నొప్పి', 'వీపు నొప్పి', 'చలి', 'చెమట'],
  kn: ['ಜ್ವರ', 'ತಲೆನೋವು', 'ಕೆಮ್ಮು', 'ಆಯಾಸ', 'ಓಕರಿಕೆ', 'ವಾಂತಿ', 'ಭೇದಿ', 'ಗಂಟಲು ನೋವು', 'ಮೂಗು ಸೋರುವಿಕೆ', 'ಮೈ ನೋವು', 'ಎದೆ ನೋವು', 'ಉಸಿರಾಟ ತೊಂದರೆ', 'ತಲೆ ತಿರುಗುವಿಕೆ', 'ಚರ್ಮದ ಕಜ್ಜಿ', 'ಕೀಲು ನೋವು', 'ಹಸಿವಿಲ್ಲದಿರುವಿಕೆ', 'ಹೊಟ್ಟೆ ನೋವು', 'ಬೆನ್ನು ನೋವು', 'ನಡುಕ', 'ಬೆವರು'],
}

const MicIcon = ({ listening }: { listening: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="2" width="6" height="11" rx="3"
      stroke={listening ? '#e87878' : 'rgba(168,192,232,0.55)'}
      strokeWidth="1.5"
      fill={listening ? 'rgba(232,120,120,0.12)' : 'none'}
    />
    <path d="M5 10a7 7 0 0 0 14 0"
      stroke={listening ? '#e87878' : 'rgba(168,192,232,0.4)'}
      strokeWidth="1.5" strokeLinecap="round"
    />
    <line x1="12" y1="19" x2="12" y2="22" stroke={listening ? '#e87878' : 'rgba(168,192,232,0.35)'} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="22" x2="15" y2="22" stroke={listening ? '#e87878' : 'rgba(168,192,232,0.35)'} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const MIN_WORDS = 10
const MIN_CHIPS_ONLY = 3

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } }

export default function SymptomsPage() {
  const { language, setLanguage } = useThemeStore()
  const lang = language || 'en'
  const t = UI[lang] ?? UI['en']
  const symptoms = SYMPTOMS[lang] ?? SYMPTOMS['en']

  const [text, setText] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [advice, setAdvice] = useState('')
  const [loading, setLoading] = useState(false)
  const [emergency, setEmergency] = useState(false)
  const [hasResult, setHasResult] = useState(false)
  const [inputError, setInputError] = useState('')

  const [listening, setListening] = useState(false)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [audioLang, setAudioLang] = useState(lang)
  const recognitionRef = useRef<any>(null)

  const toggleSymptom = (s: string) =>
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const buildQuery = () => {
    const parts = []
    if (selected.length) parts.push(selected.join(', '))
    if (text.trim()) parts.push(text.trim())
    return parts.join('. ')
  }

  const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

  const EMERGENCY_WORDS = ['chest pain', 'cannot breathe', 'shortness of breath', 'unconscious', 'stroke', 'seizure',
    'सीने में दर्द', 'ఛాతీ నొప్పి', 'ಎದೆ ನೋವು']
  const checkEmergency = (q: string) => EMERGENCY_WORDS.some(w => q.toLowerCase().includes(w.toLowerCase()))

  const validateInput = (): string | null => {
    const hasText = text.trim().length > 0
    const hasChips = selected.length > 0

    if (!hasText && !hasChips) {
      return t.tooShort
    }

    if (hasText) {
      const wc = wordCount(text.trim())
      if (wc < MIN_WORDS && !hasChips) {
        return t.tooShort
      }
      if (wc < MIN_WORDS && hasChips) {
        return null
      }
    }

    if (!hasText && hasChips && selected.length < MIN_CHIPS_ONLY) {
      return t.tooFewChips
    }

    return null
  }

  const analyze = async (overrideQuery?: string) => {
    const query = overrideQuery || buildQuery()

    if (!overrideQuery) {
      const err = validateInput()
      if (err) {
        setInputError(err)
        return
      }
    } else {
      if (!query.trim() || wordCount(query) < MIN_WORDS) {
        setInputError(t.tooShort)
        return
      }
    }

    setInputError('')
    setLoading(true)
    setHasResult(false)
    setEmergency(checkEmergency(query))

    try {
      const res = await adviceAPI.generate(query, lang)
      setPredictions(res.data.predictions)
      setAdvice(res.data.advice)
      if (res.data.emergency !== undefined) setEmergency(res.data.emergency)
      setHasResult(true)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (detail) {
        setInputError(detail)
      } else {
        toast.error('Analysis failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const startListeningForLang = (voiceLang: string) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('Voice input not supported in this browser.'); return }

    const rec = new SR()
    rec.lang = LANG_SR[voiceLang] || 'en-IN'
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => { setListening(false); toast.error('Voice input error.') }

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setText(transcript)
      setTimeout(() => analyze(transcript), 200)
    }

    recognitionRef.current = rec
    rec.start()
  }

  const handleMicClick = () => {
    if (listening) { stopListening(); return }
    setShowLangPicker(p => !p)
  }

  const handleLangSelect = (code: string) => {
    setAudioLang(code)
    setShowLangPicker(false)
    setTimeout(() => startListeningForLang(code), 100)
  }

  const confidenceColor = (c: number) => c >= 65 ? '#a8c0e8' : c >= 35 ? '#c9a96e' : '#5a7fc4'

  const currentWordCount = wordCount(text.trim())
  const showWordCounter = text.length > 0 && !hasResult

  return (
    <main style={{ minHeight: '100vh', background: '#0d1829', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: emergency
          ? 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(192,57,43,0.18) 0%, transparent 60%)'
          : `radial-gradient(ellipse 65% 40% at 60% 20%, rgba(30,58,138,0.18) 0%, transparent 60%),
             radial-gradient(ellipse 45% 60% at 20% 80%, rgba(90,127,196,0.10) 0%, transparent 60%)`,
      }} />

      <Navigation />
      {emergency && <EmergencyBanner />}

      <div style={{
        position: 'relative', zIndex: 10,
        paddingTop: emergency ? '144px' : '96px',
        paddingBottom: '80px', paddingLeft: '48px', paddingRight: '48px',
        maxWidth: '900px', margin: '0 auto',
      }}>
        <motion.div variants={container} initial="hidden" animate="show">

          <motion.div variants={item} style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginBottom: '28px' }}>
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
                    setSelected([])
                    setText('')
                    setHasResult(false)
                    setInputError('')
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

          <motion.div variants={item} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(90,127,196,0.2)',
            borderRadius: '4px', padding: '28px 32px', marginBottom: '16px',
          }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.5)', marginBottom: '18px' }}>
              {t.quickSelect}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {symptoms.map(s => {
                const active = selected.includes(s)
                return (
                  <motion.button key={s} onClick={() => { toggleSymptom(s); if (inputError) setInputError('') }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    style={{
                      padding: '6px 16px', borderRadius: '2px',
                      border: active ? '1px solid rgba(168,192,232,0.55)' : '1px solid rgba(90,127,196,0.2)',
                      background: active ? 'rgba(30,58,138,0.35)' : 'rgba(255,255,255,0.03)',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', letterSpacing: '0.5px',
                      color: active ? '#a8c0e8' : 'rgba(255,255,255,0.45)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                    {active && <span style={{ marginRight: '6px', color: '#a8c0e8' }}>✦</span>}
                    {s}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          <motion.div variants={item} style={{
            background: inputError ? 'rgba(192,57,43,0.04)' : 'rgba(255,255,255,0.03)',
            border: inputError ? '1px solid rgba(192,57,43,0.35)' : '1px solid rgba(90,127,196,0.2)',
            borderRadius: '4px', padding: '28px 32px', marginBottom: '8px',
            transition: 'all 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.5)', margin: 0 }}>
                {t.describeLabel}
              </p>

              <div style={{ position: 'relative' }}>
                <motion.button
                  onClick={handleMicClick}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                  style={{
                    width: '36px', height: '36px', borderRadius: '4px', cursor: 'pointer',
                    border: listening ? '1px solid rgba(232,120,120,0.6)' : '1px solid rgba(90,127,196,0.25)',
                    background: listening ? 'rgba(192,57,43,0.12)' : showLangPicker ? 'rgba(30,58,138,0.25)' : 'rgba(255,255,255,0.03)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                  }}
                  title={listening ? 'Stop recording' : 'Voice input — select language'}
                >
                  <MicIcon listening={listening} />
                </motion.button>

                <AnimatePresence>
                  {showLangPicker && !listening && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute', top: '44px', right: 0,
                        background: 'rgba(10,18,36,0.98)', backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(90,127,196,0.35)', borderRadius: '6px',
                        padding: '6px', minWidth: '175px', zIndex: 200,
                      }}
                    >
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.48rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.3)', padding: '5px 10px 8px', margin: 0 }}>
                        {t.voiceSelect}
                      </p>
                      {LANG_OPTIONS.map(l => (
                        <button key={l.code} onClick={() => handleLangSelect(l.code)}
                          style={{
                            width: '100%', padding: '9px 12px', borderRadius: '4px', border: 'none',
                            background: audioLang === l.code ? 'rgba(30,58,138,0.4)' : 'transparent',
                            fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem',
                            color: audioLang === l.code ? '#a8c0e8' : 'rgba(255,255,255,0.55)',
                            cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px',
                            transition: 'all 0.12s',
                          }}>
                          <span style={{ fontSize: '0.56rem', letterSpacing: '2px', opacity: 0.5, minWidth: '18px' }}>{l.short}</span>
                          <span>{l.nativeLabel}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <textarea
              value={text}
              onChange={e => { setText(e.target.value); if (inputError) setInputError('') }}
              rows={3}
              placeholder={listening
                ? `${t.listening} (${LANG_OPTIONS.find(l => l.code === audioLang)?.nativeLabel})…`
                : t.describePlaceholder
              }
              style={{
                width: '100%', background: 'transparent', resize: 'none', border: 'none', outline: 'none',
                fontFamily: "'Crimson Pro', serif", fontSize: '1.05rem', fontStyle: 'italic',
                color: 'rgba(255,255,255,0.75)', lineHeight: 1.7,
              }}
            />

            {listening && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e87878' }}
                />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.52rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(232,120,120,0.7)' }}>
                  {t.recordingIn} {LANG_OPTIONS.find(l => l.code === audioLang)?.nativeLabel}
                </span>
                <button onClick={stopListening} style={{ background: 'none', border: 'none', color: 'rgba(232,120,120,0.6)', cursor: 'pointer', fontSize: '0.65rem', padding: 0 }}>
                  {t.stopRecording}
                </button>
              </div>
            )}
          </motion.div>

          <motion.div variants={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', minHeight: '20px' }}>
            <AnimatePresence mode="wait">
              {inputError ? (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', letterSpacing: '0.5px', color: 'rgba(232,120,120,0.8)', margin: 0 }}
                >
                  {inputError}
                </motion.p>
              ) : (
                <span />
              )}
            </AnimatePresence>

            {showWordCounter && (
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.52rem', letterSpacing: '1px',
                  color: currentWordCount >= MIN_WORDS ? 'rgba(168,192,232,0.35)' : 'rgba(201,169,110,0.5)',
                }}
              >
                {currentWordCount} / {MIN_WORDS} {t.wordCount}
              </motion.span>
            )}
          </motion.div>

          <motion.button
            variants={item} onClick={() => analyze()} disabled={loading}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            style={{
              width: '100%', padding: '16px', borderRadius: '4px',
              border: '1px solid rgba(168,192,232,0.35)',
              background: loading ? 'rgba(30,58,138,0.15)' : 'rgba(30,58,138,0.25)',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', letterSpacing: '3px', textTransform: 'uppercase',
              color: loading ? 'rgba(168,192,232,0.5)' : 'rgba(168,192,232,0.9)',
              cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '40px',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            }}
          >
            {loading ? (
              <>
                <motion.div
                  style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(168,192,232,0.2)', borderTopColor: '#a8c0e8' }}
                  animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                {t.analysing}
              </>
            ) : t.analyseBtn}
          </motion.button>

          <AnimatePresence>
            {hasResult && (
              <motion.div
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {predictions.length > 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(90,127,196,0.25)', borderRadius: '4px', padding: '32px' }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(168,192,232,0.5)', marginBottom: '28px' }}>
                      {t.possibleConditions}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {predictions.map((p, i) => {
                        const color = confidenceColor(p.confidence)
                        return (
                          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 300, color: 'rgba(168,192,232,0.15)', lineHeight: 1, width: '32px' }}>
                                  {String(i + 1).padStart(2, '0')}
                                </span>
                                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.35rem', fontWeight: 400, color: '#fff' }}>
                                  {p.disease}
                                </span>
                              </div>
                              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', letterSpacing: '1px', color, fontWeight: 500 }}>
                                {p.confidence}%
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                              <motion.div
                                initial={{ width: 0 }} animate={{ width: `${p.confidence}%` }}
                                transition={{ duration: 1, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                                style={{ height: '100%', background: `linear-gradient(90deg, ${color}, ${color}66)`, borderRadius: '2px' }}
                              />
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                    <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(90,127,196,0.12)' }}>
                      <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.88rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.3)' }}>
                        {t.mlDisclaimer}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(90,127,196,0.2)', borderRadius: '4px', padding: '32px', textAlign: 'center' }}>
                    <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '1.05rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.45)' }}>
                      {t.noMatch}
                    </p>
                  </div>
                )}

                {advice && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '4px', padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                      <div style={{ width: '28px', height: '1px', background: 'rgba(201,169,110,0.4)' }} />
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.58rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(201,169,110,0.6)' }}>
                        {t.guidance}
                      </p>
                    </div>
                    <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '1.08rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap' }}>
                      {advice}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.p variants={item} style={{
            marginTop: '56px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.58rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)',
          }}>
            {t.disclaimer}
          </motion.p>
        </motion.div>
      </div>
    </main>
  )
}