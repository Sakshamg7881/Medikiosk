import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, ArrowRight, ShieldCheck, Check, AlertCircle } from 'lucide-react'
import { getPatientSession, setConsentAccepted } from '@/lib/session'

export function PatientConsent() {
  const navigate = useNavigate()
  const [session, setSession] = useState(getPatientSession())
  const [accepted, setAccepted] = useState(false)
  const [errorNotice, setErrorNotice] = useState('')

  useEffect(() => {
    const s = getPatientSession()
    setSession(s)
    if (s.consentAccepted) {
      setAccepted(true)
    }
  }, [])

  const lang = session.preferredLanguage || 'en'

  const handleContinue = () => {
    if (!accepted) {
      setErrorNotice(
        'Please accept the consent terms to proceed to assessment.'
      )
      return
    }

    setConsentAccepted(true)
    navigate('/patient/assessment')
  }

  return (
    <div className="max-w-xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/patient/login">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </Link>
        <Badge variant="outline">Step 3 of 7 • Consent</Badge>
      </div>

      <div className="text-center space-y-1">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Consent & Data Privacy</h1>
        <p className="text-muted-foreground text-sm">
          {'Your information is recorded strictly for physician triage and diagnosis'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-md bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Digital Health Consent (ABDM Guidelines)</CardTitle>
              <CardDescription>Secure, encrypted, and strictly confidential</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <div className="p-3 bg-muted/40 rounded-md space-y-2 border border-border/60">
            <p>
              1. <strong>Purpose:</strong>{' '}
              {'The health complaints you share will be structured and delivered directly to your consulting physician.'}
            </p>
            <p>
              2. <strong>Control:</strong>{' '}
              {'You may choose not to answer any questions or request clinic volunteer help at any time.'}
            </p>
            <p>
              3. <strong>Security:</strong>{' '}
              {'Your documents and intake records are encrypted in accordance with National Health data norms.'}
            </p>
          </div>

          {/* Consent Checkbox Control */}
          <div
            onClick={() => {
              setAccepted(!accepted)
              if (errorNotice) setErrorNotice('')
            }}
            className={`flex items-start space-x-3.5 p-4 rounded-md border transition-colors cursor-pointer select-none ${
              accepted
                ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                : 'border-border bg-card hover:bg-muted/40'
            }`}
          >
            <div
              className={`h-6 w-6 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                accepted
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border bg-card'
              }`}
            >
              {accepted && <Check className="h-4 w-4" />}
            </div>
            <span className="text-sm font-medium text-foreground leading-snug">
              {'I understand and give informed consent to record my intake details for medical triage.'}
            </span>
          </div>

          {errorNotice && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{errorNotice}</span>
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-2">
          <Button
            size="xl"
            disabled={!accepted}
            onClick={handleContinue}
            className="w-full justify-between disabled:opacity-50"
          >
            <span>Accept & Begin Assessment</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
