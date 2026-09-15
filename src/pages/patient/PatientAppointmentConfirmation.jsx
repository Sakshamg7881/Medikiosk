import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  FileText,
  Download,
  HeartPulse,
  Printer,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { getAppointmentById } from '@/lib/appointments'
import { getCaseSummary } from '@/lib/api'
import { generateClinicalPdf } from '@/lib/pdfReportGenerator'
import { DailyCareCard } from '@/components/patient/DailyCareCard'

export function PatientAppointmentConfirmation() {
  const { appointmentId } = useParams()
  const [appointment, setAppointment] = useState(null)
  const [caseSummary, setCaseSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [careCardOpen, setCareCardOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const appt = await getAppointmentById(appointmentId)
        setAppointment(appt)
        if (appt && appt.caseId) {
          const cData = await getCaseSummary(appt.caseId)
          setCaseSummary(cData)
        }
      } catch (e) {
        console.warn('Error loading confirmation details:', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [appointmentId])

  const handleDownloadPdf = () => {
    if (caseSummary) {
      generateClinicalPdf(caseSummary)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <p className="text-sm text-muted-foreground font-mono">Loading appointment confirmation...</p>
      </div>
    )
  }

  const patientName = appointment?.patientName || caseSummary?.patient?.name || 'Patient'
  const doctorName = appointment?.doctorName || 'Dr. Rajesh Vaidya'
  const clinicName = appointment?.clinicName || 'Ayush Arogya Kendra (Delhi)'
  const dateStr = appointment?.date || 'Tomorrow'
  const timeStr = appointment?.time || '10:30 AM'
  const token = appointment?.consultationToken || `TK-${String(appointment?.caseId || '04').padStart(2, '0')}`
  const consultType = appointment?.consultationType || 'First Consultation'

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 pb-16 text-center">
      {/* Success Badge */}
      <Badge variant="success" className="mx-auto font-mono text-xs gap-1.5 py-1 px-3">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Demo Appointment Confirmed</span>
      </Badge>

      {/* Main Headline */}
      <div className="space-y-1.5">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          MediKiosk Consultation Confirmed
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          Your structured case has been prepared for the doctor.
        </p>
      </div>

      {/* Confirmation Slip Card */}
      <Card className="border-2 border-primary/40 shadow-md text-left overflow-hidden">
        <CardHeader className="bg-primary/10 border-b border-border p-4 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="font-serif text-lg font-bold text-foreground">
                Consultation Pass • {token}
              </CardTitle>
              <CardDescription className="text-xs font-mono text-muted-foreground">
                Appointment ID: #APPT-{appointment?.id || '101'}
              </CardDescription>
            </div>
            <Badge variant="success" className="self-start sm:self-auto font-mono text-xs">
              Status: Confirmed
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-5 text-xs">
          {/* Key Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border/70">
            <div className="space-y-1">
              <span className="text-muted-foreground font-mono text-[11px] block">Patient</span>
              <strong className="text-foreground text-sm font-serif block">{patientName}</strong>
              <span className="text-muted-foreground text-[11px]">Consultation Type: {consultType}</span>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground font-mono text-[11px] block">Attending Physician</span>
              <strong className="text-foreground text-sm font-serif block">{doctorName}</strong>
              <span className="text-primary text-[11px] font-medium">{clinicName}</span>
            </div>

            <div className="space-y-1 pt-1 border-t border-border/60">
              <span className="text-muted-foreground font-mono text-[11px] block">Date & Time</span>
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>{dateStr} • {timeStr}</span>
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t border-border/60">
              <span className="text-muted-foreground font-mono text-[11px] block">Assigned Chamber</span>
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <Building2 className="h-3.5 w-3.5 text-secondary" />
                <span>OPD Chamber #2 • Terminal #04</span>
              </div>
            </div>
          </div>

          {/* Linked Case Context */}
          <div className="p-3.5 bg-primary/5 rounded-lg border border-primary/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-xs text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                <span>Linked Case #{appointment?.caseId || caseSummary?.caseId || '04'}</span>
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                Case Triage Ready
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your reported symptoms, AYUSH indicators (Agni, Nidra, Mala), and preliminary Prakriti profile are securely linked to this appointment. The doctor will review your case summary before calling your token.
            </p>
          </div>

          {/* Demonstration Notice */}
          <div className="p-3 bg-muted/40 rounded-md border border-border/60 text-[11px] text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-secondary shrink-0" />
            <span>
              <strong>Demo Confirmation:</strong> This consultation has been registered in the local prototype queue. No live healthcare integration is invoked.
            </span>
          </div>
        </CardContent>

        {/* 4 Action Buttons required by specification */}
        <CardFooter className="p-4 border-t border-border bg-muted/10 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Link to="/patient/summary">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" />
                <span>View Case</span>
              </Button>
            </Link>

            <Link to="/patient/appointments">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                <span>View Appointments</span>
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadPdf}
              className="gap-1.5 text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Clinical Report</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCareCardOpen(true)}
              className="gap-1.5 text-xs"
            >
              <HeartPulse className="h-3.5 w-3.5 text-secondary" />
              <span>View Daily Care Card</span>
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Daily Care Card Modal */}
      {careCardOpen && (
        <DailyCareCard
          caseData={caseSummary}
          isOpen={careCardOpen}
          onClose={() => setCareCardOpen(false)}
        />
      )}
    </div>
  )
}

export default PatientAppointmentConfirmation
