import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  User,
  CheckCircle2,
  Activity,
  Flame,
  Wind,
  Mountain,
  HeartPulse,
  Mic,
  MicOff,
  Volume2,
  AlertTriangle,
  Radio,
} from 'lucide-react'
import { getPatientSession, setPatientLanguage, setPatientCaseId, setPatientData } from '@/lib/session'
import { startAssessment, sendAssessmentMessage, getAssessment, createPatient } from '@/lib/api'
import { MediKioskLogo } from '@/components/common/MediKioskLogo'

// Module-level deduplication to prevent React.StrictMode duplicate invocations in dev mode
let lastStartedKey = null
let lastStartedTime = 0

export function PatientAssessment() {
  const navigate = useNavigate()
  const chatBottomRef = useRef(null)
  const recognitionRef = useRef(null)
  const userExplicitStopRef = useRef(false)
  const composerBaseTextRef = useRef('')
  const isSubmittingRef = useRef(false)
  const currentLangRef = useRef('hi')
  const hasInitializedRef = useRef(false)
  const isInitializingAssessmentRef = useRef(false)
  const activePatientIdRef = useRef(null)

  // Session & Patient State
  const [session, setSession] = useState(getPatientSession())
  const [currentLang, setCurrentLang] = useState('hi')

  // Intake State
  const [caseId, setCaseId] = useState(null)
  const [section, setSection] = useState('GENERAL') // 'GENERAL' | 'COMPLETED'
  const [messages, setMessages] = useState([])
  const [quickOptions, setQuickOptions] = useState([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [prakritiResult, setPrakritiResult] = useState(null)
  const [ayushData, setAyushData] = useState(null)
  const [redFlagDetected, setRedFlagDetected] = useState(false)
  const [redFlagWarning, setRedFlagWarning] = useState(null)

  // Form & UI States
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isLongLoading, setIsLongLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Voice Input Lifecycle: 'IDLE' | 'LISTENING' | 'TRANSCRIBING' | 'READY'
  const [voiceState, setVoiceState] = useState('IDLE')
  const isListening = voiceState === 'LISTENING' || voiceState === 'TRANSCRIBING'
  const [voiceNotice, setVoiceNotice] = useState(null)
  const [speechSupported, setSpeechSupported] = useState(true)

  // Check Web Speech API support on mount and cleanup recognition on unmount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {}
      }
    }
  }, [])

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, quickOptions, isListening])

  // Liveness timer for loading state (>4 seconds fallback message)
  useEffect(() => {
    let timer = null
    if (isInitializing) {
      setIsLongLoading(false)
      timer = setTimeout(() => {
        setIsLongLoading(true)
      }, 4000)
    } else {
      setIsLongLoading(false)
    }
    return () => clearTimeout(timer)
  }, [isInitializing])

  // Initial Mount & Session Validation
  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    const currentSession = getPatientSession()
    setSession(currentSession)

    if (!currentSession.patientId) {
      navigate('/patient/login')
      return
    }

    if (!currentSession.consentAccepted) {
      navigate('/patient/consent')
      return
    }

    const initialLang = currentSession.preferredLanguage || 'hi'
    currentLangRef.current = initialLang
    setCurrentLang(initialLang)

    initAssessment(currentSession.patientId, initialLang)
  }, [navigate])

  const initAssessment = async (patientId, language) => {
    const startKey = `${patientId}_${language}`
    const now = Date.now()
    if (lastStartedKey === startKey && now - lastStartedTime < 2500) {
      console.log('[Assessment] Suppressing duplicate start call within debounce window')
      return
    }
    lastStartedKey = startKey
    lastStartedTime = now

    if (isInitializingAssessmentRef.current) return
    isInitializingAssessmentRef.current = true
    setIsInitializing(true)
    setHasError(false)
    try {
      let activePatientId = patientId

      // If patientId is missing from session, auto-provision guest session
      if (!activePatientId) {
        try {
          const guestPatient = await createPatient({
            name: session.name || 'Kiosk Patient',
            phone: session.phone || '9876543210',
            preferredLanguage: language || 'hi',
          })
          activePatientId = guestPatient.id
          setPatientData(guestPatient)
        } catch (provisionErr) {
          console.warn('[Assessment] Auto-provision fallback failed, continuing to start:', provisionErr)
        }
      }

      let data
      try {
        data = await startAssessment({ patientId: activePatientId, language })
      } catch (startErr) {
        // If patient not found on server (e.g. backend restarted in-memory DB), auto-heal
        if (startErr.message && startErr.message.toLowerCase().includes('patient not found')) {
          console.warn('[Assessment] Patient not found on server. Auto-re-registering kiosk session...')
          const newPatient = await createPatient({
            name: session.name || 'Kiosk Patient',
            phone: session.phone || '9876543210',
            preferredLanguage: language || 'hi',
          })
          setPatientData(newPatient)
          activePatientId = newPatient.id
          data = await startAssessment({ patientId: activePatientId, language })
        } else {
          throw startErr
        }
      }

      const effectivePatientId = data.patientId || activePatientId
      activePatientIdRef.current = effectivePatientId
      setSession((prev) => ({ ...prev, patientId: effectivePatientId }))
      setPatientData({ id: effectivePatientId, preferredLanguage: language })
      setCaseId(data.caseId)
      setPatientCaseId(data.caseId)
      setSection(data.section || 'GENERAL')
      setMessages(data.messages || [])
      setQuickOptions(data.quickOptions || [])
      setIsCompleted(data.completed || false)
      if (data.redFlagDetected) {
        setRedFlagDetected(true)
        setRedFlagWarning(data.redFlagWarning || null)
      }
      if (data.prakritiResult) setPrakritiResult(data.prakritiResult)
      if (data.ayushData) setAyushData(data.ayushData)
    } catch (err) {
      console.error('Failed to initialize assessment:', err)
      setHasError(true)
    } finally {
      setIsInitializing(false)
      isInitializingAssessmentRef.current = false
    }
  }

  // Language Switch Handler (Mid-Assessment)
  const handleLanguageChange = (newLang) => {
    currentLangRef.current = newLang
    setCurrentLang(newLang)
    setPatientLanguage(newLang)
    setSession((prev) => ({ ...prev, preferredLanguage: newLang }))
    console.log(`[Assessment UI] Language switched to: "${newLang}"`)

    // If currently listening, stop so the next voice session uses the new language
    if (recognitionRef.current) {
      userExplicitStopRef.current = true
      try {
        recognitionRef.current.stop()
      } catch (e) {}
    }
    setVoiceState('IDLE')
  }

  // Voice Input Toggle (Web Speech API) with IDLE -> LISTENING -> TRANSCRIBING -> READY Lifecycle
  const toggleVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceNotice(uiText.voiceUnsupported)
      setTimeout(() => setVoiceNotice(null), 6000)
      return
    }

    if (voiceState === 'LISTENING' || voiceState === 'TRANSCRIBING') {
      userExplicitStopRef.current = true
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {}
      }
      setVoiceState('READY')
      if (inputMessage.trim()) {
        setVoiceNotice(uiText.micReadyNotice || uiText.reviewVoiceNotice)
      }
      return
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {}
      }

      userExplicitStopRef.current = false
      // Capture base text once at start of recording to prevent duplicate concatenation
      composerBaseTextRef.current = inputMessage.trim()
      setVoiceState('LISTENING')
      setVoiceNotice(null)

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      // Map language (hi -> hi-IN, hinglish -> en-IN, en -> en-IN)
      if (currentLang === 'hi') {
        recognition.lang = 'hi-IN'
      } else {
        recognition.lang = 'en-IN'
      }

      recognition.onstart = () => {
        setVoiceState('LISTENING')
        setVoiceNotice(null)
      }

      recognition.onresult = (event) => {
        setVoiceState('TRANSCRIBING')
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i]
          const transcript = res[0]?.transcript || ''
          if (res.isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        const recognized = (finalTranscript + interimTranscript).trim()
        if (recognized) {
          const base = composerBaseTextRef.current
          const combined = base ? `${base} ${recognized}` : recognized
          setInputMessage(combined)
        }
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition error event:', event.error)
        const isHindi = currentLang === 'hi'
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceNotice(
            isHindi
              ? 'माइक्रोफ़ोन अनुमति नहीं मिली। कृपया ब्राउज़र में अनुमति दें या लिखकर उत्तर दें।'
              : 'Microphone permission denied. Please grant microphone access in browser settings or type instead.'
          )
          setVoiceState('IDLE')
        } else if (event.error === 'audio-capture') {
          setVoiceNotice(
            isHindi
              ? 'माइक्रोफ़ोन नहीं मिला या किसी अन्य ऐप द्वारा उपयोग में है।'
              : 'No microphone detected or microphone is in use by another application.'
          )
          setVoiceState('IDLE')
        } else if (event.error === 'network') {
          setVoiceNotice(
            isHindi
              ? 'वॉयस नेटवर्क कनेक्शन त्रुटि। कृपया इंटरनेट जांचें या लिखकर उत्तर दें।'
              : 'Speech recognition network error. Please check your connection or type your symptoms.'
          )
          setVoiceState('IDLE')
        } else if (event.error === 'no-speech') {
          setVoiceNotice(
            isHindi
              ? 'कोई आवाज नहीं सुनाई दी। कृपया माइक्रोफ़ोन के पास आकर बोलें।'
              : 'No speech was detected. Please try speaking closer to the microphone.'
          )
          setVoiceState(inputMessage.trim() ? 'READY' : 'IDLE')
        } else {
          setVoiceNotice(
            isHindi
              ? `वॉयस इनपुट सूचना: ${event.error}। कृपया पुनः प्रयास करें या लिखें।`
              : `Voice notice: ${event.error}. You can retry speaking or type your answer.`
          )
          setVoiceState('IDLE')
        }
      }

      recognition.onend = () => {
        if (inputMessage.trim() || composerBaseTextRef.current) {
          setVoiceState('READY')
          setVoiceNotice(uiText.micReadyNotice || uiText.reviewVoiceNotice)
        } else {
          setVoiceState('IDLE')
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err)
      setVoiceState('IDLE')
      setVoiceNotice(uiText.voiceUnsupported)
      setTimeout(() => setVoiceNotice(null), 6000)
    }
  }

  // Text-To-Speech for assistant responses
  const handleSpeakText = (text) => {
    if (!('speechSynthesis' in window)) return
    try {
      window.speechSynthesis.cancel()
      const clean = text.replace(/[⚠️*#]/g, '')
      const utterance = new SpeechSynthesisUtterance(clean)
      if (currentLang === 'hi') {
        utterance.lang = 'hi-IN'
      } else {
        utterance.lang = 'en-IN'
      }
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    } catch (e) {
      console.warn('Speech synthesis error:', e)
    }
  }

  // Submit Patient Response with strict in-flight single request guard
  const handleSubmitMessage = async (textToSend) => {
    if (isSubmittingRef.current || isLoading || !caseId) return
    const messageText = (textToSend || inputMessage).trim()
    if (!messageText) return

    isSubmittingRef.current = true
    setIsLoading(true)
    setHasError(false)
    setVoiceNotice(null)
    setVoiceState('IDLE')

    // Stop recording if active
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
    }

    setInputMessage('')

    // Optimistically append user message to feed
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const optimisticMsg = {
      role: 'user',
      text: messageText,
      timestamp: nowTime,
      section: section,
    }
    setMessages((prev) => [...prev, optimisticMsg])
    setQuickOptions([])

    const activeLang = currentLangRef.current || currentLang || 'hi'
    console.log(`[Assessment UI] Submitting message: "${messageText}" | Language: "${activeLang}" | Case: #${caseId}`)

    try {
      const res = await sendAssessmentMessage({
        caseId,
        patientId: activePatientIdRef.current || session.patientId,
        language: activeLang,
        message: messageText,
      })

      setSection(res.section || 'GENERAL')
      setMessages(res.messages || [])
      setQuickOptions(res.quickOptions || [])
      setIsCompleted(res.completed || false)

      if (res.redFlagDetected) {
        setRedFlagDetected(true)
        if (res.redFlagWarning) setRedFlagWarning(res.redFlagWarning)
      }

      if (res.prakritiResult) {
        setPrakritiResult(res.prakritiResult)
      }
      if (res.ayushData) {
        setAyushData(res.ayushData)
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setHasError(true)
    } finally {
      setIsLoading(false)
      isSubmittingRef.current = false
    }
  }

  const handleRetry = () => {
    isInitializingAssessmentRef.current = false
    lastStartedKey = null
    lastStartedTime = 0
    if (caseId) {
      getAssessment(caseId)
        .then((data) => {
          setMessages(data.messages || [])
          setIsCompleted(data.completed || false)
          if (data.redFlagDetected) setRedFlagDetected(true)
          if (data.prakritiResult) setPrakritiResult(data.prakritiResult)
          setHasError(false)
        })
        .catch(() => {
          initAssessment(session.patientId, currentLang)
        })
    } else {
      initAssessment(session.patientId, currentLang)
    }
  }

  // Language display labels
  // Clean, professional healthcare UI text across languages
  const uiText = {
    hi: {
      adaptiveStatusBadge: 'एडैप्टिव क्लीनिकल संवाद',
      completedStatusShort: 'संवाद पूर्ण',
      back: 'पीछे (Back)',
      intakeStatus: 'एडैप्टिव क्लीनिकल संवाद',
      intakeSub: 'ध्यानपूर्वक सुनकर डॉक्टर के लिए केस तैयार किया जा रहा है',
      completedStatus: 'आपकी स्वास्थ्य जानकारी तैयार है',
      completedSub: 'आपकी जानकारी डॉक्टर के परामर्श हेतु व्यवस्थित कर ली गई है।',
      completionTitle: 'आपकी स्वास्थ्य जानकारी तैयार है',
      completionSub: 'आपकी जानकारी डॉक्टर के परामर्श हेतु व्यवस्थित कर ली गई है।',
      continueToDocsPrimary: 'Continue to Previous Records',
      viewCaseSecondary: 'View My Case',
      thinking: 'मेडीकियोस्क आपके लक्षणों को समझकर अगला सवाल तैयार कर रहा है...',
      placeholder: 'यहाँ अपनी परेशानी बोलें या लिखें...',
      sendBtn: 'भेजें',
      retryBtn: 'पुनः प्रयास करें',
      disclaimerNote: 'मेडीकियोस्क एआई प्री-कंसल्टेशन इतिहास सहायक है। अंतिम निदान व उपचार डॉक्टर करेंगे।',
      prakritiTitle: 'आपकी आयुष जीवनशैली प्रोफ़ाइल',
      prakritiSub: 'क्लीनिकल परामर्श से पहले आपके उत्तरों पर आधारित प्रारंभिक विश्लेषण',
      micListening: 'सुन रहे हैं... कृपया स्पष्ट बोलें',
      micTranscribing: 'आवाज पहचानी जा रही है...',
      micIdle: 'बोलकर उत्तर दें',
      stopListening: 'रोकें',
      reviewVoiceNotice: 'Review your message before sending',
      micReadyNotice: 'आवाज रिकॉर्ड हो गई है। भेजने से पहले संदेश जांच लें या बदलें।',
      voiceUnsupported: "Voice input isn't supported in this browser. You can type instead.",
      readAloud: 'उत्तर सुनें',
      loadingInitial: 'Preparing your health intake...',
      loadingLong: 'Still preparing your intake. Please wait...',
      loadingSub: 'डॉक्टर के लिए संवाद तैयार किया जा रहा है',
      errorTitle: "We couldn't start the intake",
      errorDesc: 'Please try again. Your information has not been lost.',
      errorRetryBtn: 'Try again',
      redFlagNoticeTitle: 'Clinical Advisory Notice',
      redFlagNoticeBody: 'Some of the symptoms you mentioned may need prompt medical attention. Please seek appropriate medical care if these symptoms are severe, sudden, or worsening.',
      quickRepliesHeader: 'त्वरित उत्तर (Suggested Options)',
      vataLabel: 'वात (Air & Space)',
      pittaLabel: 'पित्त (Fire & Water)',
      kaphaLabel: 'कफ (Earth & Water)',
    },
    hinglish: {
      adaptiveStatusBadge: 'Adaptive Clinical Intake',
      completedStatusShort: 'Intake Complete',
      back: 'Peeche (Back)',
      intakeStatus: 'Adaptive Clinical Intake',
      intakeSub: 'Listening carefully and preparing your case for the doctor',
      completedStatus: 'Your health intake is ready',
      completedSub: 'Your information has been organized for the doctor.',
      completionTitle: 'Your health intake is ready',
      completionSub: 'Your information has been organized for the doctor.',
      continueToDocsPrimary: 'Continue to Previous Records',
      viewCaseSecondary: 'View My Case',
      thinking: 'MediKiosk aapka uttar analyze kar raha hai...',
      placeholder: 'Speak or type your symptoms here...',
      sendBtn: 'Send',
      retryBtn: 'Try again',
      disclaimerNote: 'MediKiosk AI pre-consultation intake assistant hai. Final diagnosis doctor consultation me hoga.',
      prakritiTitle: 'Aapki AYUSH Profile',
      prakritiSub: 'Doctor consultation se pehle aapki routine par aadharit preliminary indicator',
      micListening: 'Listening... Please speak clearly',
      micTranscribing: 'Transcribing speech...',
      micIdle: 'Tap to speak',
      stopListening: 'Stop',
      reviewVoiceNotice: 'Review your message before sending',
      micReadyNotice: 'Voice captured! Review or edit your message before sending.',
      voiceUnsupported: "Voice input isn't supported in this browser. You can type instead.",
      readAloud: 'Listen',
      loadingInitial: 'Preparing your health intake...',
      loadingLong: 'Still preparing your intake. Please wait...',
      loadingSub: 'Preparing clinical intake for attending physician',
      errorTitle: "We couldn't start the intake",
      errorDesc: 'Please try again. Your information has not been lost.',
      errorRetryBtn: 'Try again',
      redFlagNoticeTitle: 'Clinical Advisory Notice',
      redFlagNoticeBody: 'Some of the symptoms you mentioned may need prompt medical attention. Please seek appropriate medical care if these symptoms are severe, sudden, or worsening.',
      quickRepliesHeader: 'Suggested Options (1-Tap)',
      vataLabel: 'Vata (Air & Space)',
      pittaLabel: 'Pitta (Fire & Water)',
      kaphaLabel: 'Kapha (Earth & Water)',
    },
    en: {
      adaptiveStatusBadge: 'Adaptive Clinical Intake',
      completedStatusShort: 'Intake Complete',
      back: 'Back to Consent',
      intakeStatus: 'Adaptive Clinical Intake',
      intakeSub: 'Listening carefully and preparing your case for the doctor',
      completedStatus: 'Your health intake is ready',
      completedSub: 'Your information has been organized for the doctor.',
      completionTitle: 'Your health intake is ready',
      completionSub: 'Your information has been organized for the doctor.',
      continueToDocsPrimary: 'Continue to Previous Records',
      viewCaseSecondary: 'View My Case',
      thinking: 'MediKiosk is analyzing your symptoms...',
      placeholder: 'Speak or type your symptoms here...',
      sendBtn: 'Send',
      retryBtn: 'Try again',
      disclaimerNote: 'MediKiosk AI is an intake assistant only. Final clinical diagnosis is performed by your consulting physician.',
      prakritiTitle: 'Your Preliminary AYUSH Profile',
      prakritiSub: 'Structured intake indicator prepared for your consulting physician',
      micListening: 'Listening... Please speak clearly',
      micTranscribing: 'Transcribing speech...',
      micIdle: 'Tap to speak',
      stopListening: 'Stop',
      reviewVoiceNotice: 'Review your message before sending',
      micReadyNotice: 'Voice input captured! Review or edit your message before sending.',
      voiceUnsupported: "Voice input isn't supported in this browser. You can type instead.",
      readAloud: 'Read aloud',
      loadingInitial: 'Preparing your health intake...',
      loadingLong: 'Still preparing your intake. Please wait...',
      loadingSub: 'Preparing clinical intake for attending physician',
      errorTitle: "We couldn't start the intake",
      errorDesc: 'Please try again. Your information has not been lost.',
      errorRetryBtn: 'Try again',
      redFlagNoticeTitle: 'Clinical Advisory Notice',
      redFlagNoticeBody: 'Some of the symptoms you mentioned may need prompt medical attention. Please seek appropriate medical care if these symptoms are severe, sudden, or worsening.',
      quickRepliesHeader: 'Suggested Quick Replies',
      vataLabel: 'Vata (Air & Space)',
      pittaLabel: 'Pitta (Fire & Water)',
      kaphaLabel: 'Kapha (Earth & Water)',
    },
  }[currentLang] || uiText.en

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4 pb-8">
      {/* HEADER: Back to Consent + MediKiosk Branding + 3-Way Language Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-3">
          <Link to="/patient/consent">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xs:inline">{uiText.back}</span>
              <span className="xs:hidden">Back</span>
            </Button>
          </Link>

          {/* MediKiosk Consistent Branding */}
          <div className="pl-1 border-l border-border/60">
            <MediKioskLogo size="sm" showSubtitle={false} />
          </div>
        </div>

        {/* Compact Mid-Assessment Language Switcher & Subtle Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border border-border/80 text-xs">
            <button
              type="button"
              onClick={() => handleLanguageChange('hi')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                currentLang === 'hi'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              हिंदी
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('hinglish')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                currentLang === 'hinglish'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Hinglish
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                currentLang === 'en'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              English
            </button>
          </div>

          <Badge variant="outline" className="hidden sm:inline-flex text-xs font-medium gap-1.5 py-1 px-2.5 bg-muted/40 border-border/80">
            <span className={`h-2 w-2 rounded-full ${isCompleted ? 'bg-secondary' : 'bg-primary animate-pulse'} inline-block`} />
            <span>{isCompleted ? uiText.completedStatusShort : uiText.adaptiveStatusBadge}</span>
          </Badge>
        </div>
      </div>

      {/* STATUS CARD: Subtle & Professional GovTech Healthcare Style */}
      <div className="bg-card border border-border/70 p-3 sm:p-3.5 rounded-lg shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`h-2.5 w-2.5 rounded-full ${isCompleted ? 'bg-secondary' : 'bg-primary animate-pulse'} shrink-0`} />
          <div>
            <span className="font-semibold text-foreground text-xs sm:text-sm block">
              {isCompleted ? uiText.completedStatus : uiText.intakeStatus}
            </span>
            <span className="text-[11px] sm:text-xs text-muted-foreground block">
              {isCompleted ? uiText.completedSub : uiText.intakeSub}
            </span>
          </div>
        </div>

        {redFlagDetected && (
          <Badge variant="destructive" className="font-mono text-[10px] gap-1 shrink-0">
            <AlertTriangle className="h-3 w-3" />
            <span>Priority Attention</span>
          </Badge>
        )}
      </div>

      {/* CONVERSATION AREA & COMPOSER CONTAINER */}
      <Card className="border-border/80 shadow-sm overflow-hidden flex flex-col">
        {/* Chat Feed Area: Min-height around 280px to comfortably fit 1-2 messages without giant empty void */}
        <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto min-h-[280px] max-h-[560px] bg-background/50">
          {/* Red Flag Persistent Advisory Banner if Detected */}
          {redFlagDetected && (
            <div className="p-3.5 sm:p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive space-y-1.5 animate-in fade-in-50">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                <span>{uiText.redFlagNoticeTitle}</span>
              </div>
              <p className="leading-relaxed text-foreground text-xs">
                {uiText.redFlagNoticeBody}
              </p>
            </div>
          )}

          {/* Loading State: Subtle animated spinner with liveness message */}
          {isInitializing ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-3">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                {isLongLoading ? uiText.loadingLong : uiText.loadingInitial}
              </p>
              <p className="text-xs text-muted-foreground">
                {uiText.loadingSub}
              </p>
            </div>
          ) : hasError ? (
            /* Human-Centered Compact Error Card: Zero raw exceptions or tech debug jargon */
            <div className="my-8 p-5 rounded-lg border border-destructive/20 bg-destructive/5 text-center space-y-3 max-w-md mx-auto">
              <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">{uiText.errorTitle}</h4>
                <p className="text-xs text-muted-foreground mt-1">{uiText.errorDesc}</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleRetry} className="gap-1.5 mx-auto">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{uiText.errorRetryBtn}</span>
              </Button>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant'

              return (
                <div
                  key={index}
                  className={`flex items-start gap-2.5 ${
                    isAssistant ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isAssistant && (
                    <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 border bg-primary/10 border-primary/20 text-primary">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xs ${
                      isAssistant
                        ? 'bg-card border border-border/80 text-foreground rounded-tl-xs'
                        : 'bg-primary text-primary-foreground rounded-tr-xs font-medium'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 border-t border-border/30">
                      {isAssistant && (
                        <button
                          type="button"
                          onClick={() => handleSpeakText(msg.text)}
                          className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
                          title={uiText.readAloud}
                        >
                          <Volume2 className="h-3 w-3" />
                          <span>{uiText.readAloud}</span>
                        </button>
                      )}
                      <div
                        className={`text-[10px] ml-auto font-mono ${
                          isAssistant ? 'text-muted-foreground' : 'text-primary-foreground/75'
                        }`}
                      >
                        {msg.timestamp || ''}
                      </div>
                    </div>
                  </div>

                  {!isAssistant && (
                    <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5 text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* Assistant Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <div className="bg-card border border-border/80 rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                  <span className="text-xs text-muted-foreground font-medium pl-1">
                    {uiText.thinking}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* COMPLETED STATE: Health Intake Ready + Preliminary AYUSH Profile + Clean CTAs */}
        {isCompleted && (
          <div className="p-5 sm:p-6 border-t border-border bg-muted/20 space-y-5 animate-in fade-in-50 duration-300">
            {/* Ready Banner */}
            <div className="rounded-lg p-4 bg-primary/10 border border-primary/20 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <h3 className="font-serif text-base sm:text-lg font-bold text-foreground">
                    {uiText.completionTitle}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {uiText.completionSub}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs py-1 px-3 shrink-0">
                {prakritiResult?.dominantTendency || 'Intake Ready'}
              </Badge>
            </div>

            {/* Preliminary AYUSH Prakriti Profile */}
            {prakritiResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-serif text-sm font-bold text-foreground">
                    {uiText.prakritiTitle}
                  </h4>
                  <span className="text-xs text-muted-foreground">{uiText.prakritiSub}</span>
                </div>

                {/* Dosha Scores Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-md bg-card border border-border/80 text-center space-y-1">
                    <div className="flex items-center justify-center text-primary gap-1">
                      <Wind className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">{uiText.vataLabel}</span>
                    </div>
                    <div className="font-mono text-xl font-bold text-foreground">
                      {prakritiResult.scores?.vata || 1}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Air & Mobility</div>
                  </div>

                  <div className="p-3 rounded-md bg-card border border-border/80 text-center space-y-1">
                    <div className="flex items-center justify-center text-accent gap-1">
                      <Flame className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">{uiText.pittaLabel}</span>
                    </div>
                    <div className="font-mono text-xl font-bold text-foreground">
                      {prakritiResult.scores?.pitta || 1}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Fire & Metabolism</div>
                  </div>

                  <div className="p-3 rounded-md bg-card border border-border/80 text-center space-y-1">
                    <div className="flex items-center justify-center text-secondary gap-1">
                      <Mountain className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">{uiText.kaphaLabel}</span>
                    </div>
                    <div className="font-mono text-xl font-bold text-foreground">
                      {prakritiResult.scores?.kapha || 1}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Earth & Stability</div>
                  </div>
                </div>

                {/* Editorial Description */}
                {prakritiResult.description && (
                  <div className="p-3.5 rounded-md bg-card border border-border/80 text-xs text-foreground/90 leading-relaxed">
                    {prakritiResult.description}
                  </div>
                )}

                {/* Mandatory Medical Disclaimer Alert */}
                <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2 leading-relaxed">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <span>
                    {prakritiResult.disclaimer ||
                      'This is a preliminary wellness indicator based on intake history, NOT a clinical diagnosis. Your AYUSH physician will verify your constitutional Prakriti during consultation.'}
                  </span>
                </div>
              </div>
            )}

            {/* Explicit Completion CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Link to="/patient/documents" className="flex-1">
                <Button size="xl" className="w-full justify-between font-semibold">
                  <span>{uiText.continueToDocsPrimary}</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/patient/summary" className="sm:w-auto">
                <Button size="xl" variant="outline" className="w-full justify-center font-medium">
                  <span>{uiText.viewCaseSecondary}</span>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* BOTTOM STICKY COMPOSER & VOICE (Active Intake) */}
        {!isCompleted && (
          <div className="p-3.5 sm:p-4 border-t border-border bg-card space-y-3">
            {/* Context-Aware Quick Options */}
            {quickOptions.length > 0 && !isLoading && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider">
                  {uiText.quickRepliesHeader}
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickOptions.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isLoading || isSubmittingRef.current}
                      onClick={() => {
                        if (!isLoading && !isSubmittingRef.current) {
                          handleSubmitMessage(opt)
                        }
                      }}
                      className="px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-primary/5 hover:border-primary/40 text-xs font-medium text-foreground transition-all cursor-pointer text-left shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Voice Listening Banner */}
            {voiceState === 'LISTENING' && (
              <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/30 flex items-center justify-between text-xs text-destructive animate-pulse">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 animate-spin" />
                  <span className="font-semibold">{uiText.micListening}</span>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={toggleVoiceRecording}
                  className="h-7 text-xs px-2.5"
                >
                  {uiText.stopListening}
                </Button>
              </div>
            )}

            {/* Active Voice Transcribing Banner */}
            {voiceState === 'TRANSCRIBING' && (
              <div className="p-2.5 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-between text-xs text-primary animate-pulse">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-spin" />
                  <span className="font-semibold">{uiText.micTranscribing}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleVoiceRecording}
                  className="h-7 text-xs px-2.5"
                >
                  {uiText.stopListening}
                </Button>
              </div>
            )}

            {/* Post-Voice Review Notice / Ready State Notification */}
            {voiceNotice && !isListening && (
              <div className="p-2.5 rounded-md bg-secondary/15 border border-secondary/30 text-secondary-foreground text-xs flex items-center justify-between animate-in fade-in-50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                  <span>{voiceNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVoiceNotice(null)}
                  className="text-xs underline hover:no-underline ml-2 cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Message Composer Form: Strictly 1 click = 1 request, never auto-sends voice */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!isLoading && !isSubmittingRef.current) {
                  handleSubmitMessage()
                }
              }}
              className="flex items-center gap-2"
            >
              {/* Voice Input Microphone Button */}
              <Button
                type="button"
                variant={isListening ? 'destructive' : 'outline'}
                size="lg"
                onClick={toggleVoiceRecording}
                disabled={isLoading || isSubmittingRef.current}
                title={!speechSupported ? uiText.voiceUnsupported : isListening ? uiText.stopListening : uiText.micIdle}
                className={`h-11 sm:h-12 w-11 sm:w-12 px-0 shrink-0 transition-all cursor-pointer ${
                  isListening
                    ? 'ring-2 ring-destructive animate-pulse bg-destructive text-destructive-foreground'
                    : 'hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className={`h-5 w-5 ${speechSupported ? 'text-primary' : 'text-muted-foreground'}`} />
                )}
              </Button>

              {/* Message Composer Input: Always editable, never auto-sends voice */}
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value)
                  if (voiceNotice && (voiceNotice.includes('Review') || voiceNotice.includes('संदेश'))) setVoiceNotice(null)
                }}
                placeholder={voiceState === 'LISTENING' ? uiText.micListening : voiceState === 'TRANSCRIBING' ? uiText.micTranscribing : uiText.placeholder}
                disabled={isLoading || isSubmittingRef.current}
                className={`flex-1 h-11 sm:h-12 px-3.5 sm:px-4 rounded-md border text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 disabled:opacity-60 placeholder:text-muted-foreground/60 transition-colors ${
                  isListening ? 'border-destructive/60 bg-destructive/5' : 'border-border bg-background'
                }`}
              />

              {/* Send Button: Disabled during in-flight submission */}
              <Button
                type="submit"
                size="lg"
                disabled={!inputMessage.trim() || isLoading || isSubmittingRef.current}
                className="gap-2 px-4 sm:px-5 h-11 sm:h-12 shrink-0 font-medium"
              >
                <span>{uiText.sendBtn}</span>
                <Send className="h-4 w-4" />
              </Button>
            </form>

            {!speechSupported && (
              <p className="text-[11px] text-muted-foreground text-center">
                {uiText.voiceUnsupported}
              </p>
            )}

            <div className="text-[10px] text-center text-muted-foreground/80 flex items-center justify-center gap-1 pt-0.5">
              <ShieldCheck className="h-3 w-3 text-secondary shrink-0" />
              <span>{uiText.disclaimerNote}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
export default PatientAssessment
