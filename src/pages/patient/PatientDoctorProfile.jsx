import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
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
  Phone,
  User,
} from 'lucide-react'
import { getDoctorById, getClinicById } from '@/data/clinicsData'
import { getPatientSession, setSelectedDoctor, setSelectedClinic } from '@/lib/session'

export function PatientDoctorProfile() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const session = getPatientSession()
  const lang = session.preferredLanguage || 'en'

  const doctor = getDoctorById(doctorId) || getDoctorById('d1')
  const clinic = doctor ? getClinicById(doctor.clinicId) : null

  const [selectedSlot, setSelectedSlot] = useState(doctor?.availableSlots?.[0] || '09:30 AM')

  if (!doctor) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <Stethoscope className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="font-serif text-xl font-bold">Doctor Not Found</h2>
        <Link to="/patient/clinics">
          <Button variant="outline">Browse All Clinics</Button>
        </Link>
      </div>
    )
  }

  const handleBookConsultation = () => {
    setSelectedDoctor(doctor.id)
    if (clinic) setSelectedClinic(clinic.id)
    navigate(`/patient/book/${doctor.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Link to={clinic ? `/patient/clinic/${clinic.id}` : '/patient/clinics'}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>{clinic ? `Back to ${clinic.name}` : 'Back to Clinics'}</span>
          </Button>
        </Link>
        <Badge variant="outline" className="font-mono text-xs">
          Doctor Profile
        </Badge>
      </div>

      {/* Doctor Hero Card */}
      <Card className="border-border shadow-xs">
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
                  {doctor.specialization}
                </p>

                <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground pt-1">
                  <span className="flex items-center text-foreground font-semibold">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 mr-1 inline" />
                    {doctor.rating} Rating
                  </span>
                  <span>•</span>
                  <span>{doctor.experience}</span>
                  <span>•</span>
                  <span>{doctor.ayushSystem}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg border border-border/60 text-right self-start sm:self-auto min-w-[140px]">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block">Consultation Fee</span>
              <div className="font-serif text-2xl font-bold text-foreground">â‚¹{doctor.consultationFee}</div>
              <span className="text-[10px] text-muted-foreground font-mono">In-Person & Kiosk Assisted</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5 text-xs">
          {/* Associated Clinic Strip */}
          {clinic && (
            <div className="p-3 rounded-md bg-muted/30 border border-border/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-accent shrink-0" />
                <div>
                  <span className="font-semibold text-foreground text-xs block">{clinic.name}</span>
                  <span className="text-muted-foreground text-[11px]">{clinic.address}</span>
                </div>
              </div>
              <Link to={`/patient/clinic/${clinic.id}`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  View Clinic
                </Button>
              </Link>
            </div>
          )}

          {/* About Section */}
          <div className="space-y-1.5">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              About the Doctor
            </h3>
            <p className="text-foreground/90 leading-relaxed text-sm bg-muted/20 p-3.5 rounded-md border border-border/60">
              {doctor.about}
            </p>
          </div>

          {/* Clinical Focus / Specialization */}
          {doctor.clinicalFocus && (
            <div className="space-y-2">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Clinical Focus & Conditions Treated
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

          {/* Languages & Credentials */}
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
                Medical Registration
              </span>
              <p className="text-foreground font-mono text-xs">{doctor.registrationNumber}</p>
            </div>
          </div>

          {/* Available Slots Section */}
          <div className="space-y-2.5 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground text-xs">
                  Available Consultation Slots ({doctor.availableDays})
                </span>
              </div>
              <span className="font-mono text-[11px] text-secondary font-medium">Walk-in & Pre-intake</span>
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
            <span>Case history will be structured before meeting.</span>
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
    </div>
  )
}
export default PatientDoctorProfile
