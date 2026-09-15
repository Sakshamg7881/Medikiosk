import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import {
  Stethoscope,
  Star,
  Clock,
  Calendar,
  Languages,
  Award,
  Building2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { getDoctorById, getClinicById } from '@/data/clinicsData'

export function DemoDoctorProfile() {
  const { doctorId } = useParams()
  const navigate = useNavigate()

  const doctor = getDoctorById(doctorId) || getDoctorById('d1')
  const clinic = doctor ? getClinicById(doctor.clinicId) : null

  const [selectedSlot, setSelectedSlot] = useState(doctor?.availableSlots?.[0] || '09:30 AM')

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-6">
        <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="font-serif text-2xl font-bold mb-2">Doctor Not Found</h2>
        <p className="text-muted-foreground text-sm mb-6">The requested demo doctor could not be found.</p>
        <Link to="/demo">
          <Button variant="default">Back to Product Tour</Button>
        </Link>
      </div>
    )
  }

  const handleBookConsultation = () => {
    navigate(`/demo/consultation/${doctor.id}`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Brand Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/demo" className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-base">
                M
              </div>
              <span className="font-serif text-lg font-bold tracking-tight text-foreground">
                MediKiosk
              </span>
            </Link>
            <Badge variant="outline" className="font-mono text-[10px]">
              Demo Mode
            </Badge>
          </div>

          <div className="flex items-center space-x-3">
            <Link to="/demo">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Product Tour</span>
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Link to={clinic ? `/demo/clinic/${clinic.id}` : '/demo#clinics-preview'}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground text-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>{clinic ? `Back to ${clinic.name}` : 'Back to Clinics'}</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">Demo Stage 02</span>
            <Badge variant="secondary" className="font-mono text-[10px]">
              Doctor Profile
            </Badge>
          </div>
        </div>

        {/* Doctor Hero Card */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="p-6 pb-4 border-b border-border/70 bg-muted/10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-serif text-2xl font-bold border border-primary/20 shrink-0">
                  {doctor.name.split(' ').slice(1).map(n => n[0]).join('')}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-serif text-2xl font-bold text-foreground">
                      {doctor.name}
                    </h1>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {doctor.qualification}
                    </Badge>
                  </div>

                  <p className="text-sm font-medium text-primary">
                    {doctor.specialization} • {doctor.ayushSystem}
                  </p>

                  <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground pt-1">
                    <span className="flex items-center text-foreground font-semibold">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 mr-1 inline" />
                      {doctor.rating} Rating
                    </span>
                    <span>•</span>
                    <span>{doctor.experience}</span>
                    <span>•</span>
                    <span>Reg: {doctor.registrationNumber}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg border border-border/60 text-right self-start sm:self-auto min-w-[140px]">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">Consultation Fee</span>
                <div className="font-serif text-2xl font-bold text-foreground">â‚¹{doctor.consultationFee}</div>
                <span className="text-[10px] text-muted-foreground font-mono">In-Person + AI Pre-Intake</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5 text-xs">
            {/* Associated Clinic Banner */}
            {clinic && (
              <div className="p-3 rounded-md bg-muted/30 border border-border/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-accent shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground text-xs block">{clinic.name}</span>
                    <span className="text-muted-foreground text-[11px]">{clinic.address}</span>
                  </div>
                </div>
                <Link to={`/demo/clinic/${clinic.id}`}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    View Clinic
                  </Button>
                </Link>
              </div>
            )}

            {/* About Doctor */}
            <div className="space-y-1.5">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Physician Background
              </h3>
              <p className="text-foreground/90 leading-relaxed text-sm bg-muted/20 p-4 rounded-md border border-border/60">
                {doctor.about}
              </p>
            </div>

            {/* Clinical Focus */}
            {doctor.clinicalFocus && (
              <div className="space-y-2">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Clinical Focus & Therapeutic Expertise
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {doctor.clinicalFocus.map((focus, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-muted/30 border border-border/50 flex items-start gap-2 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
                      <span className="text-foreground">{focus}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages & Registration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 rounded-md bg-muted/30 border border-border/60 space-y-1">
                <span className="font-mono text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Languages className="h-4 w-4 text-primary" />
                  Languages Spoken
                </span>
                <p className="text-foreground font-medium text-xs">{doctor.languages.join(', ')}</p>
              </div>

              <div className="p-3.5 rounded-md bg-muted/30 border border-border/60 space-y-1">
                <span className="font-mono text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-secondary" />
                  Board Registration
                </span>
                <p className="text-foreground font-mono text-xs">{doctor.registrationNumber}</p>
              </div>
            </div>

            {/* Available Slots */}
            <div className="space-y-2.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground text-xs">
                    Select Consultation Slot ({doctor.availableDays})
                  </span>
                </div>
                <span className="font-mono text-[11px] text-secondary font-medium">OPD Walk-in & Pre-intake</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {doctor.availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-3.5 py-2 rounded-md border text-xs font-mono font-medium transition-all ${
                      selectedSlot === slot
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-card border-border hover:bg-muted text-foreground'
                    }`}
                  >
                    <Clock className="h-3 w-3 inline mr-1.5" />
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/10">
            <div className="text-xs text-muted-foreground text-center sm:text-left">
              <span>Selected slot: </span>
              <strong className="text-foreground font-mono">{selectedSlot}</strong> •{' '}
              <span>Pre-intake history will be organized for this doctor.</span>
            </div>

            <Button
              size="lg"
              onClick={handleBookConsultation}
              className="w-full sm:w-auto gap-2 font-semibold shadow-xs"
            >
              <span>Book Consultation • Prepare Case</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
export default DemoDoctorProfile
