import React from 'react'
import { Link } from 'react-router-dom'
import { Stethoscope, Building2, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MediKioskLogo } from '@/components/common/MediKioskLogo'

export function ProviderLogin() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <MediKioskLogo size="md" showSubtitle={true} subtitle="Healthcare Provider Gateway" asLink={true} to="/" />

          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Patient Portal</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 space-y-8 flex flex-col justify-center">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <Badge variant="outline" className="text-xs font-mono">
            Clinical Staff Gateway
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Healthcare Provider Access
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select your clinical workspace to review pre-consultation cases or manage OPD kiosk terminals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Doctor Workspace Login */}
          <Card className="flex flex-col justify-between border-border hover:border-primary/50 transition-colors shadow-2xs">
            <CardHeader className="p-6 pb-3 space-y-3">
              <div className="h-11 w-11 rounded-md bg-accent/15 text-accent flex items-center justify-center">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-serif font-bold">
                  Doctor Consultation Desk
                </CardTitle>
                <CardDescription className="text-xs mt-1 leading-relaxed">
                  Log in with clinic-created credentials to review synthesized patient cases, verify Prakriti indicators, and record clinical notes.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Link to="/provider/login/doctor" className="block w-full">
                <Button className="w-full justify-between font-semibold" variant="default">
                  <span>Enter Doctor Login</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Clinic Reception Desk */}
          <Card className="flex flex-col justify-between border-border hover:border-primary/50 transition-colors shadow-2xs">
            <CardHeader className="p-6 pb-3 space-y-3">
              <div className="h-11 w-11 rounded-md bg-secondary/15 text-secondary flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-serif font-bold">
                  Clinic Administration Desk
                </CardTitle>
                <CardDescription className="text-xs mt-1 leading-relaxed">
                  Log in to manage clinic medical staff, create doctor accounts, monitor OPD kiosk queues, and update clinic profiles.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Link to="/clinic/login" className="block w-full">
                <Button className="w-full justify-between font-semibold" variant="outline">
                  <span>Enter Clinic Login</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Register New Clinic Banner */}
        <div className="p-4 rounded-md bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-foreground">New Healthcare Facility?</span>{' '}
            <span className="text-muted-foreground">Register your AYUSH hospital or private clinic to deploy MediKiosk terminals.</span>
          </div>
          <Link to="/clinic/register">
            <Button variant="secondary" size="sm" className="font-semibold text-xs shrink-0">
              <span>Register New Clinic</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Security & Access Notice */}
        <div className="p-4 rounded-md bg-muted/40 border border-border/80 text-xs text-muted-foreground flex items-center gap-3">
          <ShieldCheck className="h-4 w-4 text-secondary shrink-0" />
          <span>
            Authorized clinical personnel only. All access to digital health records is logged in accordance with clinical governance standards.
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <MediKioskLogo size="sm" showSubtitle={false} asLink={true} to="/" />
          <p>MediKiosk Clinical Intake System • Healthcare Professional Gateway</p>
        </div>
      </footer>
    </div>
  )
}

export default ProviderLogin
