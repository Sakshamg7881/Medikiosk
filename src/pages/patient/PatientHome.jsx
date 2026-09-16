import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Sparkles,
  Search,
  Building2,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Shield,
  Bell,
  User,
  ArrowRight,
  CheckCircle2,
  Navigation,
  PlusCircle,
  FileSpreadsheet,
  Stethoscope,
  ChevronRight,
} from 'lucide-react'
import { getPatientSession, setSelectedClinic } from '@/lib/session'
import { getClinicById } from '@/data/clinicsData'
import { getCaseSummary } from '@/lib/api'

export function PatientHome() {
  const navigate = useNavigate()
  const [session, setSession] = useState(getPatientSession())
  const [recentCase, setRecentCase] = useState(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [directionsModal, setDirectionsModal] = useState(false)

  const lang = session.preferredLanguage || 'en'

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const patientName = session.name || 'Patient'

  useEffect(() => {
    const s = getPatientSession()
    setSession(s)

    // Load recent case if exists
    if (s.caseId) {
      getCaseSummary(s.caseId)
        .then((data) => setRecentCase(data))
        .catch((err) => console.warn('Could not load recent case on home:', err))
    }
  }, [])

  const connectedClinic = getClinicById(session.selectedClinicId || 'c1') || getClinicById('c1')

  return (
    <div className="max-w-4xl mx-auto w-full space-y-7 pb-16">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-serif font-bold text-sm text-primary tracking-wide">
              MediKiosk
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="font-serif italic text-xs text-muted-foreground">
              Your story, structured for better care.
            </span>
          </div>

          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            {getGreeting()}, {patientName}
          </h1>
          <p className="text-muted-foreground text-sm">Your health information, organized before your consultation.</p>
        </div>

        {/* Right Header Icons */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Notifications Toggle */}
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full relative"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              title="Notifications"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />
            </Button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-md border border-border bg-card p-3 shadow-lg z-40 space-y-2 animate-in fade-in-50">
                <div className="flex items-center justify-between border-b border-border pb-1.5 text-xs font-semibold">
                  <span>Notifications</span>
                  <Badge variant="outline" className="text-[10px]">1 New</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Consultation Scheduled</p>
                  <p className="text-[11px]">
                    Upcoming appointment on 14 Sep at MediCare AYUSH Clinic. Arrive 15 mins early for kiosk check-in.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Patient Profile Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/30 text-xs font-medium">
            <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[11px]">
              {patientName[0]?.toUpperCase() || 'P'}
            </div>
            <span className="hidden sm:inline text-foreground">{patientName}</span>
          </div>

          
        </div>
      </div>

      {/* 2. PRIMARY ACTION CARD */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-card to-muted/20 shadow-sm">
        <CardContent className="p-6 sm:p-7 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="accent" className="gap-1 text-[11px]">
                <Sparkles className="h-3 w-3" />
                <span>Pre-Consultation Intake</span>
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">Kiosk #04</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Ready for your consultation?</h2>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">Complete your health history before meeting your AYUSH doctor. AI prepares your symptoms and lifestyle factors beforehand.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link to="/patient/consent" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 font-semibold shadow-xs">
                <span>Start New Assessment</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link to="/patient/clinics" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span>Find a Clinic</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Grid: Connected Clinic & Upcoming Consultation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 3. CONNECTED CLINIC */}
        <Card className="border-border flex flex-col justify-between shadow-2xs">
          <CardHeader className="py-4 px-5 border-b border-border/70 bg-muted/15 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Your Clinic</CardTitle>
            </div>
            <Badge variant="success" className="text-[10px] py-0">
              Connected
            </Badge>
          </CardHeader>

          <CardContent className="p-5 space-y-3 text-xs flex-1">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                {connectedClinic.name}
              </h3>
              <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                <Badge variant="secondary" className="text-[10px] py-0">
                  {connectedClinic.ayushSystem}
                </Badge>
                <span className="font-mono text-[11px]">{connectedClinic.city}</span>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed text-xs">
              {connectedClinic.address}
            </p>

            <div className="p-2.5 rounded bg-muted/30 border border-border/50 grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div>
                <span className="text-muted-foreground block text-[10px]">Doctors</span>
                <strong className="text-foreground">{connectedClinic.doctorsCount} Available</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Availability</span>
                <strong className="text-foreground">{connectedClinic.availability}</strong>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-4 border-t border-border flex items-center justify-between gap-2 bg-muted/5">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setDirectionsModal(true)}
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Get Directions</span>
            </Button>
            <Link to={`/patient/clinic/${connectedClinic.id}`}>
              <Button size="sm" variant="outline" className="text-xs font-medium">
                View Clinic
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* 4. UPCOMING CONSULTATION */}
        <Card className="border-border flex flex-col justify-between shadow-2xs">
          <CardHeader className="py-4 px-5 border-b border-border/70 bg-muted/15 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-secondary" />
              <CardTitle className="text-sm font-semibold">Upcoming Consultation</CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] py-0">
              Confirmed
            </Badge>
          </CardHeader>

          <CardContent className="p-5 space-y-3 text-xs flex-1">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Dr. Ananya Sharma
              </h3>
              <p className="text-xs text-primary font-medium">
                Ayurveda Physician • Kayachikitsa Specialist
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>14 September 2026 • 05:30 PM</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-accent" />
                <span>MediCare AYUSH Clinic • Chamber #2</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground italic pt-1">
              Your intake history will be automatically made available in the doctor's review queue.
            </p>
          </CardContent>

          <CardFooter className="p-4 border-t border-border flex items-center justify-between gap-2 bg-muted/5">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setDirectionsModal(true)}
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Get Directions</span>
            </Button>
            <Link to="/patient/appointments">
              <Button size="sm" variant="outline" className="text-xs font-medium">
                View Appointment
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* 5. RECENT CASE */}
      <Card className="border-border shadow-2xs">
        <CardHeader className="py-3.5 px-5 border-b border-border/70 bg-muted/15 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Most Recent Case</CardTitle>
          </div>
          {recentCase?.status === 'REVIEWED' ? (
            <Badge variant="success" className="text-[10px] gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Reviewed by Doctor</span>
            </Badge>
          ) : session.caseId ? (
            <Badge variant="warning" className="text-[10px] gap-1">
              <Clock className="h-3 w-3" />
              <span>Intake Prepared</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">
              Ready
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold text-foreground">
                {recentCase?.chiefComplaint || 'Knee Pain & Morning Stiffness'}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                Case #{session.caseId || 'MK-1024'}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {recentCase?.hpi ||
                'Patient reported persistent morning stiffness for past 4 weeks. Preliminary Prakriti: Vata-Pitta tendency evaluated.'}
            </p>

            <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground pt-1">
              <span>Date: Today</span>
              <span>•</span>
              <span>{recentCase?.documents?.length || 1} Document Attached</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/patient/cases">
              <Button variant="outline" size="sm" className="text-xs">
                View Case
              </Button>
            </Link>
            <Link to="/patient/summary">
              <Button size="sm" className="text-xs font-semibold gap-1">
                <span>View Summary</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 6. QUICK ACCESS COMPACT SECTION */}
      <div className="space-y-3">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Access
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            to="/patient/cases"
            className="p-3.5 rounded-lg border border-border bg-card hover:bg-muted/40 hover:border-primary/40 transition-all text-center space-y-1.5 shadow-2xs group"
          >
            <div className="h-8 w-8 rounded-md bg-primary/10 text-primary mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="h-4 w-4" />
            </div>
            <div className="font-semibold text-xs text-foreground">My Cases</div>
            <div className="text-[10px] text-muted-foreground font-mono">Records</div>
          </Link>

          <Link
            to="/patient/documents"
            className="p-3.5 rounded-lg border border-border bg-card hover:bg-muted/40 hover:border-primary/40 transition-all text-center space-y-1.5 shadow-2xs group"
          >
            <div className="h-8 w-8 rounded-md bg-secondary/15 text-secondary mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div className="font-semibold text-xs text-foreground">My Documents</div>
            <div className="text-[10px] text-muted-foreground font-mono">OCR Scans</div>
          </Link>

          <Link
            to="/patient/appointments"
            className="p-3.5 rounded-lg border border-border bg-card hover:bg-muted/40 hover:border-primary/40 transition-all text-center space-y-1.5 shadow-2xs group"
          >
            <div className="h-8 w-8 rounded-md bg-accent/15 text-accent mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="font-semibold text-xs text-foreground">Appointments</div>
            <div className="text-[10px] text-muted-foreground font-mono">OPD Schedule</div>
          </Link>

          <Link
            to="/patient/clinics"
            className="p-3.5 rounded-lg border border-border bg-card hover:bg-muted/40 hover:border-primary/40 transition-all text-center space-y-1.5 shadow-2xs group"
          >
            <div className="h-8 w-8 rounded-md bg-primary/10 text-primary mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="font-semibold text-xs text-foreground">Find a Clinic</div>
            <div className="text-[10px] text-muted-foreground font-mono">AYUSH Network</div>
          </Link>

          <Link
            to="/patient/privacy"
            className="p-3.5 rounded-lg border border-border bg-card hover:bg-muted/40 hover:border-primary/40 transition-all text-center space-y-1.5 shadow-2xs group col-span-2 sm:col-span-1"
          >
            <div className="h-8 w-8 rounded-md bg-muted text-muted-foreground mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
              <Shield className="h-4 w-4" />
            </div>
            <div className="font-semibold text-xs text-foreground">Privacy & Consent</div>
            <div className="text-[10px] text-muted-foreground font-mono">Charter</div>
          </Link>
        </div>
      </div>

      {/* Directions Modal */}
      {directionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                <h3 className="font-serif font-bold text-base">{connectedClinic.name}</h3>
              </div>
              <button
                onClick={() => setDirectionsModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground text-sm">{connectedClinic.name}</strong>
                <br />
                {connectedClinic.address}
              </p>
              <p className="p-2.5 rounded bg-muted/40 font-mono text-[11px] text-foreground">
                Nearest Metro: South Extension Metro Station (Pink Line) • 350m walk
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(connectedClinic.name + ' ' + connectedClinic.city)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="outline" className="text-xs">
                  Open External Maps
                </Button>
              </a>
              <Button size="sm" variant="default" onClick={() => setDirectionsModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default PatientHome
