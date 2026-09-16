import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  KeyRound,
  AlertCircle,
  Loader2,
  UserPlus,
  UserCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  UserX
} from 'lucide-react'
import { getPatientSession, setPatientData, setConsentAccepted, setSelectedClinic } from '@/lib/session'
import { createPatient, getPatientByPhone } from '@/lib/api'

export function PatientLogin() {
  const navigate = useNavigate()
  const [session, setSession] = useState(getPatientSession())

  // Step Mode: 'choice' | 'first_visit_form' | 'first_visit_otp' | 'returning_patient_phone' | 'returning_patient_otp' | 'profile_not_found'
  const [mode, setMode] = useState('choice')

  // Form State
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('Male')
  const [phone, setPhone] = useState('')

  // OTP State
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')

  // Request State
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const currentSession = getPatientSession()
    setSession(currentSession)
    // Clear any previously preselected clinic so fresh intake has no default clinic
    setSelectedClinic(null)
  }, [])

  const lang = session.preferredLanguage || 'en'

  // 1. Submit First Visit Registration Form -> Advance to OTP
  const handleFirstVisitFormSubmit = (e) => {
    e?.preventDefault()
    setErrorMessage('')

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.')
      return
    }

    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.')
      return
    }

    setOtp('')
    setOtpError('')
    setMode('first_visit_otp')
  }

  // 2. Submit First Visit OTP -> Register Profile & Go to Clinic Selection
  const handleFirstVisitOtpVerify = async (e) => {
    e?.preventDefault()
    setOtpError('')
    setErrorMessage('')

    const cleanOtp = otp.trim()
    if (!/^\d{6}$/.test(cleanOtp)) {
      setOtpError('Please enter a valid 6-digit verification code.')
      return
    }

    setLoading(true)
    const cleanPhone = phone.replace(/\D/g, '')

    try {
      const patientPayload = {
        name: name.trim(),
        age: age ? parseInt(age, 10) : null,
        gender: gender || 'Male',
        phone: cleanPhone,
        preferredLanguage: lang,
      }

      let savedPatient
      try {
        savedPatient = await createPatient(patientPayload)
      } catch (apiErr) {
        console.warn('Backend createPatient error, falling back to local creation:', apiErr)
        savedPatient = {
          id: Date.now(),
          ...patientPayload,
          createdAt: new Date().toISOString(),
        }
      }

      // Cache patient in registered patients list in localStorage
      try {
        const existingList = JSON.parse(localStorage.getItem('medikiosk_registered_patients') || '[]')
        const filtered = existingList.filter(p => String(p.phone).replace(/\D/g, '') !== cleanPhone)
        filtered.push(savedPatient)
        localStorage.setItem('medikiosk_registered_patients', JSON.stringify(filtered))
      } catch (storageErr) {
        console.warn('Could not cache patient profile in localStorage:', storageErr)
      }

      // Store patient in session
      setPatientData(savedPatient)
      setConsentAccepted(true)

      // Converge directly to CLINIC SELECTION
      navigate('/patient/clinics')
    } catch (err) {
      setErrorMessage('Unable to save patient profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // 3. Submit Returning Patient Mobile Number -> Advance to OTP
  const handleReturningPatientPhoneSubmit = (e) => {
    e?.preventDefault()
    setErrorMessage('')

    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter your 10-digit registered mobile number.')
      return
    }

    setOtp('')
    setOtpError('')
    setMode('returning_patient_otp')
  }

  // 4. Submit Returning Patient OTP -> Find Profile & Go to Clinic Selection
  const handleReturningPatientOtpVerify = async (e) => {
    e?.preventDefault()
    setOtpError('')
    setErrorMessage('')

    const cleanOtp = otp.trim()
    if (!/^\d{6}$/.test(cleanOtp)) {
      setOtpError('Please enter a valid 6-digit verification code.')
      return
    }

    setLoading(true)
    const cleanPhone = phone.replace(/\D/g, '')

    try {
      const existing = await getPatientByPhone(cleanPhone)

      if (existing && existing.name) {
        // Found existing profile! Do NOT create a duplicate.
        setPatientData(existing)
        setConsentAccepted(true)

        // Continue directly to CLINIC SELECTION
        navigate('/patient/clinics')
      } else {
        // No existing profile found with this number
        setMode('profile_not_found')
      }
    } catch (err) {
      console.warn('Error during returning patient lookup:', err)
      setMode('profile_not_found')
    } finally {
      setLoading(false)
    }
  }

  // Helper to switch to First Visit with phone prefilled
  const handleSwitchToFirstVisit = () => {
    setErrorMessage('')
    setOtp('')
    setOtpError('')
    setMode('first_visit_form')
  }

  return (
    <div className="max-w-xl mx-auto w-full space-y-6 pb-12">
      {/* Top Header / Back Navigation */}
      <div className="flex items-center justify-between">
        {mode === 'choice' ? (
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setErrorMessage('')
              setOtpError('')
              if (mode === 'first_visit_otp') setMode('first_visit_form')
              else if (mode === 'returning_patient_otp') setMode('returning_patient_phone')
              else if (mode === 'profile_not_found') setMode('returning_patient_phone')
              else setMode('choice')
            }}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        )}

        <Badge variant="outline" className="font-mono text-xs">
          Patient Intake • MediKiosk
        </Badge>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* ========================================================================= */}
      {/* 1. CHOICE SCREEN: FIRST VISIT vs RETURNING PATIENT */}
      {/* ========================================================================= */}
      {mode === 'choice' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="text-center space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Welcome to MediKiosk
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              How would you like to continue?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Option Card 1: FIRST VISIT */}
            <Card
              className="border-2 border-border hover:border-primary/60 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group bg-card"
              onClick={() => {
                setErrorMessage('')
                setMode('first_visit_form')
              }}
            >
              <CardHeader className="p-6 pb-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold block">
                    New Registration
                  </span>
                  <CardTitle className="font-serif text-2xl font-bold text-foreground">
                    First Visit
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  Create your MediKiosk patient profile
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 pt-0">
                <ul className="text-xs text-muted-foreground space-y-2 pt-2 border-t border-border/70">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Quick 1-minute profile setup</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Digital health intake & AYUSH triage</span>
                  </li>
                </ul>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <Button
                  type="button"
                  id="first-visit-btn"
                  className="w-full justify-between font-semibold group-hover:bg-primary/90"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    setErrorMessage('')
                    setMode('first_visit_form')
                  }}
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Option Card 2: RETURNING PATIENT */}
            <Card
              className="border-2 border-border hover:border-primary/60 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group bg-card"
              onClick={() => {
                setErrorMessage('')
                setMode('returning_patient_phone')
              }}
            >
              <CardHeader className="p-6 pb-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-semibold block">
                    Existing Record
                  </span>
                  <CardTitle className="font-serif text-2xl font-bold text-foreground">
                    Returning Patient
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  Continue with your existing profile
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 pt-0">
                <ul className="text-xs text-muted-foreground space-y-2 pt-2 border-t border-border/70">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-secondary shrink-0" />
                    <span>Instant record lookup by phone</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-secondary shrink-0" />
                    <span>No repeated profile forms</span>
                  </li>
                </ul>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <Button
                  type="button"
                  id="returning-patient-btn"
                  variant="outline"
                  className="w-full justify-between font-semibold border-border hover:bg-muted/50"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    setErrorMessage('')
                    setMode('returning_patient_phone')
                  }}
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FIRST VISIT: REGISTRATION FORM */}
      {/* ========================================================================= */}
      {mode === 'first_visit_form' && (
        <Card className="border-border shadow-xs animate-in fade-in-50 duration-200">
          <CardHeader className="space-y-1 text-center pb-3">
            <Badge variant="outline" className="mx-auto text-[10px] font-mono text-primary border-primary/30">
              First Visit
            </Badge>
            <CardTitle className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              Create your MediKiosk patient profile
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Enter your personal details to create your secure clinical intake record.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleFirstVisitFormSubmit}>
            <CardContent className="space-y-4 pt-2">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Full Name *
                </label>
                <Input
                  id="patient-name-input"
                  sizeVariant="lg"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Age
                  </label>
                  <Input
                    id="patient-age-input"
                    sizeVariant="lg"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 45"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Gender
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`h-11 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                          gender === g
                            ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                            : 'bg-card border-border hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Mobile Number *</span>
                  <span className="font-mono text-[10px] text-muted-foreground">10 Digits</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                    +91
                  </span>
                  <Input
                    id="patient-phone-input"
                    sizeVariant="lg"
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-11 font-mono text-base"
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Your verification OTP and future appointment slips will be sent to this number.
                </p>
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex flex-col gap-2">
              <Button
                type="submit"
                size="xl"
                className="w-full justify-between font-semibold"
              >
                <span>Continue</span>
                <ArrowRight className="h-5 w-5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setErrorMessage('')
                  setMode('choice')
                }}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Back to Options
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 3. FIRST VISIT: OTP VERIFICATION */}
      {/* ========================================================================= */}
      {mode === 'first_visit_otp' && (
        <Card className="border-border shadow-xs text-center animate-in fade-in-50 duration-200">
          <form onSubmit={handleFirstVisitOtpVerify}>
            <CardHeader className="space-y-2 pb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-1">
                <KeyRound className="h-6 w-6" />
              </div>
              <CardTitle className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                Verify your mobile number
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Enter the 6-digit verification code sent to{' '}
                <strong className="font-mono text-foreground">+91 {phone}</strong>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <div className="space-y-2 max-w-xs mx-auto">
                <Input
                  id="otp-input"
                  sizeVariant="lg"
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setOtp(val)
                    if (otpError) setOtpError('')
                  }}
                  className="font-mono text-center text-3xl tracking-[0.4em] font-bold h-16"
                />

                {otpError && (
                  <p className="text-xs text-destructive text-center font-medium">
                    {otpError}
                  </p>
                )}
              </div>

              {/* Demo Helper Pill */}
              <div className="p-3 bg-muted/50 rounded-lg border border-border text-center max-w-xs mx-auto">
                <span className="font-mono text-[11px] text-muted-foreground block">
                  Demo mode: Enter any 6 digits (e.g. 123456)
                </span>
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex flex-col gap-2">
              <Button
                type="submit"
                size="xl"
                disabled={loading}
                className="w-full justify-between font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2 mx-auto">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating profile & continuing...</span>
                  </span>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMode('first_visit_form')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Change mobile number or details
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 4. RETURNING PATIENT: MOBILE NUMBER ONLY */}
      {/* ========================================================================= */}
      {mode === 'returning_patient_phone' && (
        <Card className="border-border shadow-xs animate-in fade-in-50 duration-200">
          <CardHeader className="space-y-1 text-center pb-3">
            <Badge variant="outline" className="mx-auto text-[10px] font-mono text-secondary border-secondary/30">
              Returning Patient
            </Badge>
            <CardTitle className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              Enter your registered mobile number
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              We'll look up your existing records and clinical history.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleReturningPatientPhoneSubmit}>
            <CardContent className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Mobile Number</span>
                  <span className="font-mono text-[10px] text-muted-foreground">10 Digits</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                    +91
                  </span>
                  <Input
                    id="returning-phone-input"
                    sizeVariant="lg"
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-11 font-mono text-base"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Demo Quick Hint Pill */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>Demo Returning Numbers:</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setPhone('9876543210')}
                    className="px-2 py-1 rounded bg-card border border-border hover:border-primary text-foreground"
                  >
                    9876543210 (Ramesh Kumar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhone('9810012345')}
                    className="px-2 py-1 rounded bg-card border border-border hover:border-primary text-foreground"
                  >
                    9810012345 (Sunita Sharma)
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex flex-col gap-2">
              <Button
                type="submit"
                size="xl"
                className="w-full justify-between font-semibold"
              >
                <span>Continue</span>
                <ArrowRight className="h-5 w-5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setErrorMessage('')
                  setMode('choice')
                }}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Back to Options
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 5. RETURNING PATIENT: OTP VERIFICATION */}
      {/* ========================================================================= */}
      {mode === 'returning_patient_otp' && (
        <Card className="border-border shadow-xs text-center animate-in fade-in-50 duration-200">
          <form onSubmit={handleReturningPatientOtpVerify}>
            <CardHeader className="space-y-2 pb-2">
              <div className="w-12 h-12 rounded-full bg-secondary/15 text-secondary mx-auto flex items-center justify-center mb-1">
                <KeyRound className="h-6 w-6" />
              </div>
              <CardTitle className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                Verify your mobile number
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Enter the 6-digit verification code sent to{' '}
                <strong className="font-mono text-foreground">+91 {phone}</strong>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <div className="space-y-2 max-w-xs mx-auto">
                <Input
                  id="otp-input"
                  sizeVariant="lg"
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setOtp(val)
                    if (otpError) setOtpError('')
                  }}
                  className="font-mono text-center text-3xl tracking-[0.4em] font-bold h-16"
                />

                {otpError && (
                  <p className="text-xs text-destructive text-center font-medium">
                    {otpError}
                  </p>
                )}
              </div>

              {/* Demo Helper Pill */}
              <div className="p-3 bg-muted/50 rounded-lg border border-border text-center max-w-xs mx-auto">
                <span className="font-mono text-[11px] text-muted-foreground block">
                  Demo mode: Enter any 6 digits (e.g. 123456)
                </span>
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex flex-col gap-2">
              <Button
                type="submit"
                size="xl"
                disabled={loading}
                className="w-full justify-between font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2 mx-auto">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Looking up existing profile...</span>
                  </span>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMode('returning_patient_phone')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Change mobile number
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 6. PROFILE NOT FOUND SCREEN */}
      {/* ========================================================================= */}
      {mode === 'profile_not_found' && (
        <Card className="border-border shadow-xs text-center py-8 px-4 sm:px-6 space-y-6 animate-in fade-in-50 duration-200">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <UserX className="h-8 w-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              We couldn't find a profile with this number.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              No existing MediKiosk records were found for <strong className="font-mono text-foreground">+91 {phone}</strong>. You can easily create your profile right now to continue.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
            <Button
              type="button"
              id="create-first-visit-btn"
              size="lg"
              onClick={handleSwitchToFirstVisit}
              className="w-full sm:w-auto font-semibold gap-2"
            >
              <span>Create First Visit Profile</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                setPhone('')
                setMode('returning_patient_phone')
              }}
              className="w-full sm:w-auto border-border text-muted-foreground hover:text-foreground"
            >
              Try Another Number
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default PatientLogin
