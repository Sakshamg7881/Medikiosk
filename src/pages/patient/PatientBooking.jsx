import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Stethoscope,
  Building2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  FileText,
  Sparkles,
} from 'lucide-react'
import { getPatientSession, setSelectedDoctor, setSelectedClinic } from '@/lib/session'
import { getAllDoctors, getDoctorById, getClinicById } from '@/data/clinicsData'
import { getCaseSummary } from '@/lib/api'
import { createAppointment } from '@/lib/appointments'

export function PatientBooking() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(getPatientSession())
  const [caseSummary, setCaseSummary] = useState(null)
  const [isLoadingCase, setIsLoadingCase] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const allDoctors = getAllDoctors()

  // Selected clinic (from session or default c1)
  const currentClinic = getClinicById(session.selectedClinicId) || getClinicById('c1')

  // Filter doctors for the selected clinic
  const clinicDoctors = allDoctors.filter((d) => d.clinicId === currentClinic?.id)
  const availableDoctors = clinicDoctors.length > 0 ? clinicDoctors : allDoctors

  // Selected doctor
  const [selectedDocId, setSelectedDocId] = useState(
    doctorId ? Number(doctorId) : (session.selectedDoctorId || availableDoctors[0]?.id || 101)
  )
  const currentDoctor = getDoctorById(selectedDocId) || availableDoctors[0] || allDoctors[0]

  // Booking Form State
  const [consultationType, setConsultationTypeState] = useState('First Consultation') // First Consultation, Follow-up
  const [selectedDate, setSelectedDate] = useState('Tomorrow (14 Sep 2026)')
  const [selectedTime, setSelectedTime] = useState('10:30 AM')

  const lang = session.preferredLanguage || 'en'

  // Available sample dates
  const dateOptions = [
    'Today (13 Sep 2026)',
    'Tomorrow (14 Sep 2026)',
    'Tue, 15 Sep 2026',
    'Wed, 16 Sep 2026',
    'Thu, 17 Sep 2026',
  ]

  // Available sample slots
  const timeSlots = currentDoctor?.availableSlots || [
    '09:30 AM',
    '10:30 AM',
    '11:45 AM',
    '02:30 PM',
    '04:15 PM',
    '05:30 PM',
  ]

  useEffect(() => {
    const s = getPatientSession()
    setSession(s)

    if (s.caseId) {
      setIsLoadingCase(true)
      getCaseSummary(s.caseId)
        .then((data) => setCaseSummary(data))
        .catch((e) => console.warn('Could not load case for booking:', e))
        .finally(() => setIsLoadingCase(false))
    }
  }, [])

  const handleConfirmBooking = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const appt = await createAppointment({
        caseId: session.caseId || caseSummary?.caseId || 1,
        patientId: session.patientId || 1,
        doctorId: currentDoctor.id,
        clinicId: currentClinic?.id || 'c1',
        date: selectedDate,
        time: selectedTime,
        consultationType: consultationType,
        patientName: session.name || 'Patient',
        doctorName: currentDoctor.name,
        clinicName: currentClinic?.name || 'Ayush Arogya Kendra',
      })

      // Update session references
      setSelectedDoctor(currentDoctor.id)
      navigate(`/patient/appointment-confirmation/${appt.id}`)
    } catch (error) {
      console.error('Booking failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 pb-16">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Link to="/patient/export">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Slip</span>
          </Button>
        </Link>
        <Badge variant="outline" className="font-mono text-xs">
          OPD Booking • Demo
        </Badge>
      </div>

      {/* Screen Title */}
      <div className="text-center space-y-1">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Book Clinical Consultation
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Connect your prepared health story with an accredited AYUSH physician.
        </p>
      </div>

      {/* 1. SELECTED CLINIC DISPLAY (WITH CHANGE CLINIC OPTION) */}
      <Card className="border-border shadow-xs bg-muted/20">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Selected Clinic
                </span>
                <Badge variant="secondary" className="text-[9px] py-0 font-medium">
                  {currentClinic?.ayushSystem || 'AYUSH'}
                </Badge>
              </div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-foreground truncate">
                {currentClinic?.name || 'Ayush Arogya Kendra'}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {currentClinic?.area}, {currentClinic?.city}
              </p>
            </div>
          </div>

          <Link to="/patient/clinics" className="shrink-0">
            <Button variant="outline" size="sm" className="text-xs">
              Change Clinic
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* 2. LINKED CASE BANNER */}
      <Card className="border-2 border-primary/30 shadow-xs bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="p-2 rounded-md bg-primary/15 text-primary shrink-0 mt-0.5">
            <FileText className="h-5 w-5" />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-foreground">
                Linked Case Record: #{session.caseId || caseSummary?.caseId || '04'}
              </span>
              <Badge variant="secondary" className="text-[10px] py-0 font-mono">
                Intake Completed
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Primary Concern:</strong>{' '}
              {caseSummary?.chiefComplaint || 'Consultation Intake'}
            </p>
            <p className="text-[11px] text-primary/90 font-medium">
              ✓ Your AI intake history, AYUSH indicators, and Prakriti profile will be pre-filled for this doctor. No repeated questions required.
            </p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleConfirmBooking} className="space-y-6">
        {/* 3. SELECT DOCTOR */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-3 border-b border-border/70 bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span>1. Select Attending Doctor</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              {availableDoctors.map((doc) => {
                const isSelected = selectedDocId === doc.id
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-xs'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-primary/10 text-primary font-serif font-bold flex items-center justify-center text-sm shrink-0">
                        {doc.name.split(' ').slice(1).map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-serif font-bold text-sm text-foreground flex items-center gap-2">
                          <span>{doc.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">({doc.qualification})</span>
                        </div>
                        <span className="text-xs text-primary font-medium block">
                          {doc.specialization} • {doc.ayushSystem}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-foreground text-xs block">₹{doc.consultationFee}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Fee</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 3. CONSULTATION TYPE */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-3 border-b border-border/70 bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-secondary" />
              <span>2. Consultation Type</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConsultationTypeState('First Consultation')}
              className={`p-3.5 rounded-lg border text-left transition-all ${
                consultationType === 'First Consultation'
                  ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-xs'
                  : 'border-border bg-card hover:bg-muted/30'
              }`}
            >
              <span className="font-serif font-bold text-sm text-foreground block">First Consultation</span>
              <span className="text-xs text-muted-foreground leading-relaxed mt-0.5 block">
                Initial in-person clinical review of prepared case history.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setConsultationTypeState('Follow-up')}
              className={`p-3.5 rounded-lg border text-left transition-all ${
                consultationType === 'Follow-up'
                  ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-xs'
                  : 'border-border bg-card hover:bg-muted/30'
              }`}
            >
              <span className="font-serif font-bold text-sm text-foreground block">Follow-up Consultation</span>
              <span className="text-xs text-muted-foreground leading-relaxed mt-0.5 block">
                Continuing treatment response check & regimen refinement.
              </span>
            </button>
          </CardContent>
        </Card>

        {/* 4. DATE & TIME SELECTION */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-3 border-b border-border/70 bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-accent" />
              <span>3. Consultation Date & Slot</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Date choices */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-muted-foreground uppercase block">
                Select Date
              </label>
              <div className="flex flex-wrap gap-2">
                {dateOptions.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`px-3 py-1.5 rounded-md border text-xs font-mono transition-all ${
                      selectedDate === d
                        ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-2xs'
                        : 'bg-card border-border hover:bg-muted text-foreground'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Slot choices */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-muted-foreground uppercase block">
                Available Time Slots
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`p-2.5 rounded-md border text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all ${
                      selectedTime === slot
                        ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-semibold'
                        : 'bg-card border-border hover:bg-muted text-foreground'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>{slot}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. DEMO PAYMENT & SUMMARY CARD */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-3 border-b border-border/70 bg-muted/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>4. Fee & Payment Preview</span>
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                Demo Payment
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="p-3 bg-muted/30 rounded-lg border border-border/70 space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-muted-foreground">Doctor Consultation Fee:</span>
                <strong className="text-foreground text-sm">₹{currentDoctor.consultationFee}</strong>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                <span>MediKiosk Kiosk Intake Preparation:</span>
                <span className="text-secondary font-semibold">Included (₹0)</span>
              </div>
              <div className="border-t border-border pt-2 flex items-center justify-between font-mono">
                <span className="font-bold text-foreground">Total Payable at Clinic Desk:</span>
                <strong className="font-serif text-lg text-primary">₹{currentDoctor.consultationFee}</strong>
              </div>
            </div>

            <div className="p-2.5 rounded bg-muted/40 text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-secondary shrink-0" />
              <span>
                <strong>Demonstration Mode:</strong> No live banking or payment gateway is invoked. This demonstrates the seamless kiosk billing hand-off.
              </span>
            </div>
          </CardContent>

          <CardFooter className="p-4 border-t border-border bg-muted/5">
            <Button
              type="submit"
              size="xl"
              disabled={isSubmitting}
              className="w-full justify-between font-semibold shadow-xs"
            >
              <span>Confirm Appointment • {selectedTime}</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default PatientBooking
