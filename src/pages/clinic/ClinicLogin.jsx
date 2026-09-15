import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Building2, Lock, Phone, ArrowLeft, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import { MediKioskLogo } from '@/components/common/MediKioskLogo'
import { loginClinic, DEFAULT_DEMO_CLINIC } from '@/lib/clinicAuth'

export function ClinicLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const registeredPhone = location.state?.phone || ''

  const [phone, setPhone] = useState(registeredPhone || '')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!phone.trim()) {
      setErrorMessage('Please enter your clinic registered phone number.')
      return
    }

    if (!password) {
      setErrorMessage('Please enter your password.')
      return
    }

    setIsLoading(true)
    const result = await loginClinic(phone, password)
    setIsLoading(false)

    if (result.success) {
      navigate('/clinic/dashboard')
    } else {
      setErrorMessage(result.error)
    }
  }

  const fillDemoCredentials = () => {
    setPhone(DEFAULT_DEMO_CLINIC.phone)
    setPassword(DEFAULT_DEMO_CLINIC.password)
    setErrorMessage('')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <MediKioskLogo size="md" showSubtitle={true} subtitle="Clinic Administration" asLink={true} to="/" />

          <Link to="/provider/login">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Provider Gateway</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        <Card className="border-border shadow-xs">
          <CardHeader className="space-y-2 pb-4 text-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Badge variant="outline" className="text-[11px] font-mono">
                Private Portal
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Demo Auth
              </Badge>
            </div>
            <CardTitle className="font-serif text-2xl font-bold">
              Clinic Reception Login
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your registered clinic phone number and password to access the private clinic dashboard.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Phone Number Field (Login ID) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Registered Phone Number (Login ID)</span>
                  <span className="font-mono text-[10px] text-muted-foreground">10 Digits</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground select-none">
                    +91
                  </span>
                  <Input
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-11 font-mono tracking-wide"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="•••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Quick Demo Pre-fill */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="w-full text-left p-2.5 rounded-md border border-dashed border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/50 transition-colors text-xs text-muted-foreground flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <span>Fill Demo Credentials (c1 • Delhi)</span>
                  </span>
                  <span className="font-mono text-[10px] text-primary font-medium">9876543210</span>
                </button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button type="submit" className="w-full font-semibold gap-2" disabled={isLoading}>
                <span>{isLoading ? 'Signing In...' : 'Login to Clinic Dashboard'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="text-center text-xs text-muted-foreground pt-1">
                New AYUSH Clinic or Healthcare Center?{' '}
                <Link to="/clinic/register" className="text-primary font-semibold hover:underline">
                  Register your Clinic
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Notice */}
        <div className="mt-6 text-center text-[11px] text-muted-foreground max-w-sm mx-auto">
          <p>
            <strong className="font-semibold text-foreground">Demo Authentication only:</strong> In prototype mode, registered clinics are maintained in browser session storage for seamless testing.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <MediKioskLogo size="sm" showSubtitle={false} asLink={true} to="/" />
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
            <span>Authorized Clinic Staff Gateway • Private Portal</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ClinicLogin