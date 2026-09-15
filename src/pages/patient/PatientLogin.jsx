import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { ArrowLeft, ArrowRight, Check, KeyRound, AlertCircle, Loader2 } from 'lucide-react'
import { getPatientSession, setPatientData } from '@/lib/session'
import { createPatient } from '@/lib/api'

export function PatientLogin() {
  const navigate = useNavigate()
  const [session, setSession] = useState(getPatientSession())

  // Form State
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('Male')
  const [phone, setPhone] = useState('')

  // Flow State: 'profile' or 'otp'
  const [step, setStep] = useState('profile')
  const [createdPatient, setCreatedPatient] = useState(null)

  // OTP State
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')

  // Request State
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const currentSession = getPatientSession()
    setSession(currentSession)
    if (currentSession.name) setName(currentSession.name)
    if (currentSession.phone) setPhone(currentSession.phone)
  }, [])

  const lang = session.preferredLanguage || 'en'

  // Handle Profile Form Submit
  const handleProfileSubmit = async (e) => {
    e?.preventDefault()
    setErrorMessage('')

    if (!name.trim()) {
      setErrorMessage('Please enter your full name')
      return
    }

    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    try {
      const patientPayload = {
        name: name.trim(),
        age: age ? parseInt(age, 10) : null,
        gender,
        phone: phone.trim(),
        preferredLanguage: lang,
      }

      const saved = await createPatient(patientPayload)
      setCreatedPatient(saved)
      setStep('otp')
    } catch (err) {
      setErrorMessage(err.message || 'Unable to register patient profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Mock OTP Verification
  const handleOtpVerify = (e) => {
    e?.preventDefault()
    setOtpError('')

    const cleanOtp = otp.trim()
    // Accept any valid 6-digit numeric OTP
    if (!/^\d{6}$/.test(cleanOtp)) {
      setOtpError('Please enter a valid 6-digit code')
      return
    }

    if (createdPatient) {
      // Store patient in local session
      setPatientData(createdPatient)
    }

    // Continue to consent
    navigate('/patient/consent')
  }

  return (
    <div className="max-w-xl mx-auto w-full space-y-6">
      {/* Top Header / Back Navigation */}
      <div className="flex items-center justify-between">
        {step === 'profile' ? (
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('profile')}
            className="gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Edit Profile</span>
          </Button>
        )}

        <Badge variant="outline">
          Step 2 of 7 • {step === 'profile' ? 'Patient Profile' : 'Verification'}
        </Badge>
      </div>

      {/* Screen Title */}
      <div className="text-center space-y-1">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          {step === 'profile'
            ? (lang === 'hi' ? 'रोगी विवरण दर्ज करें' : 'Patient Registration')
            : (lang === 'hi' ? 'सुरक्षा सत्यापन (OTP)' : 'Security Verification')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {step === 'profile'
            ? (lang === 'hi' ? 'क्लिनिक परामर्श के लिए अपनी जानकारी भरें' : 'Enter your details to generate your clinic record')
            : (lang === 'hi' ? `मोबाइल नंबर ${phone} पर भेजा गया कोड दर्ज करें` : `Enter the verification code for ${phone}`)}
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Profile Form Step */}
      {step === 'profile' && (
        <Card>
          <form onSubmit={handleProfileSubmit}>
            <CardContent className="space-y-4 pt-6">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {lang === 'hi' ? 'पूरा नाम (Full Name) *' : 'Full Name *'}
                </label>
                <Input
                  sizeVariant="lg"
                  placeholder={lang === 'hi' ? 'उदा. रमेश गुप्ता' : 'e.g. Ramesh Gupta'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {lang === 'hi' ? 'आयु (Age)' : 'Age'}
                  </label>
                  <Input
                    sizeVariant="lg"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 45"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    disabled={loading}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {lang === 'hi' ? 'लिंग (Gender)' : 'Gender'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`h-12 rounded-md border text-sm font-medium transition-colors ${
                          gender === g
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card border-border hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        {g === 'Male' ? (lang === 'hi' ? 'पुरुष' : 'Male') :
                         g === 'Female' ? (lang === 'hi' ? 'महिला' : 'Female') :
                         (lang === 'hi' ? 'अन्य' : 'Other')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {lang === 'hi' ? 'मोबाइल नंबर (Phone Number) *' : 'Mobile Number *'}
                </label>
                <Input
                  sizeVariant="lg"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  className="font-mono text-base"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {lang === 'hi' ? 'परामर्श और पर्ची इस नंबर से जुड़ी रहेगी' : 'Consultation token and records are linked to this number'}
                </p>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                size="xl"
                disabled={loading}
                className="w-full justify-between"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{lang === 'hi' ? 'पंजीकरण हो रहा है...' : 'Registering...'}</span>
                  </span>
                ) : (
                  <>
                    <span>{lang === 'hi' ? 'आगे बढ़ें (सत्यापन)' : 'Continue to Verification'}</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Mock OTP Verification Step */}
      {step === 'otp' && (
        <Card className="border-primary/40 shadow-sm">
          <form onSubmit={handleOtpVerify}>
            <CardHeader className="pb-3 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-2">
                <KeyRound className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">
                {lang === 'hi' ? '6-अंकीय सत्यापन कोड' : '6-Digit Verification Code'}
              </CardTitle>
              <CardDescription>
                {lang === 'hi' ? 'डेमो मोड में कोई भी 6 अंक मान्य हैं' : 'Demonstration mode: enter any 6 digits to proceed'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
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
                  className="font-mono text-center text-2xl tracking-[0.4em] font-bold h-16"
                />

                {otpError && (
                  <p className="text-xs text-destructive text-center font-medium">
                    {otpError}
                  </p>
                )}
              </div>

              {/* Demo Helper Banner */}
              <div className="p-3 bg-muted/60 rounded-md border border-border text-center">
                <span className="font-mono text-xs text-muted-foreground block">
                  Demo mode: enter any 6-digit code (e.g. 123456)
                </span>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                size="xl"
                className="w-full justify-between"
              >
                <span>{lang === 'hi' ? 'सत्यापित करें और आगे बढ़ें' : 'Verify & Continue'}</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  )
}
