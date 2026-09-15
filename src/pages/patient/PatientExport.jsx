import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  CheckCircle2,
  Printer,
  Home as HomeIcon,
  Clock,
  User,
  Stethoscope,
  FileText,
  HeartPulse,
  Download,
  Building2,
  ShieldCheck,
  ExternalLink,
  Calendar,
} from 'lucide-react'
import { getPatientSession, clearPatientSession } from '@/lib/session'
import { getCaseSummary } from '@/lib/api'
import { ClinicalQrCode } from '@/components/common/ClinicalQrCode'
import { DailyCareCard } from '@/components/patient/DailyCareCard'
import { generateClinicalPdf } from '@/lib/pdfReportGenerator'

export function PatientExport() {
  const [session, setSession] = useState(getPatientSession())
  const [caseSummary, setCaseSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [careCardOpen, setCareCardOpen] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const lang = session.preferredLanguage || 'en'

  useEffect(() => {
    const s = getPatientSession()
    setSession(s)

    if (s.caseId) {
      setIsLoading(true)
      getCaseSummary(s.caseId)
        .then((data) => setCaseSummary(data))
        .catch((err) => console.warn('Could not fetch case status for export:', err))
        .finally(() => setIsLoading(false))
    }
  }, [])

  const patient = caseSummary?.patient || {}
  const patientName = patient.name || session.name || 'Patient'
  const caseId = session.caseId || caseSummary?.caseId || '04'
  const isReviewed = caseSummary?.status === 'REVIEWED'
  const statusLabel = isReviewed
    ? 'Reviewed by Doctor' : 'Awaiting Doctor Review'

  const handleDownloadPdf = () => {
    if (caseSummary) {
      generateClinicalPdf(caseSummary)
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 4000)
    }
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="max-w-xl mx-auto w-full space-y-6 text-center pb-16">
      {/* Top Breadcrumb Badge */}
      <Badge variant="success" className="mx-auto font-mono text-xs">
        Step 7 of 7 • Consultation Hand-off Ready
      </Badge>

      {/* Screen Title */}
      <div className="space-y-1">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Your Consultation Slip is Ready</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          {'Your structured case has been forwarded to the attending doctor. Please take a seat in the waiting area.'}
        </p>
      </div>

      {/* Download Alert Banner */}
      {downloadSuccess && (
        <div className="p-3 bg-secondary/15 border border-secondary/40 rounded-lg text-xs text-secondary-foreground font-semibold flex items-center justify-center gap-2 animate-in fade-in-50">
          <CheckCircle2 className="h-4 w-4 text-secondary" />
          <span>Clinical PDF Report downloaded to your device.</span>
        </div>
      )}

      {/* AUTHENTIC CLINICAL TOKEN SLIP CARD */}
      <div className="bg-card border-2 border-border rounded-xl shadow-md overflow-hidden text-left">
        {/* Slip Header (Kiosk Facility) */}
        <div className="bg-primary/10 border-b border-border p-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <div className="h-6 w-6 rounded bg-primary text-primary-foreground font-serif font-bold text-xs flex items-center justify-center">
              M
            </div>
            <span className="font-serif font-bold text-base text-foreground tracking-tight">
              MediKiosk Clinic Intake Slip
            </span>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">
            Kiosk Terminal #04 • Ayush Arogya Kendra • {currentDate} {currentTime}
          </p>
        </div>

        {/* Slip Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Patient Details Row */}
          <div className="grid grid-cols-2 gap-3 text-xs p-3.5 bg-muted/30 rounded-lg border border-border/70">
            <div>
              <span className="font-mono text-[10px] text-muted-foreground uppercase block">Patient Name</span>
              <span className="font-semibold text-foreground text-sm">{patientName}</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                {patient.age ? `${patient.age} yrs` : 'Age: N/A'} • {patient.gender || 'Gender: N/A'}
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono text-[10px] text-muted-foreground uppercase block">Case Reference</span>
              <span className="font-mono font-bold text-primary text-sm">MK-{String(caseId).padStart(4, '0')}</span>
              <span className="font-mono text-[11px] text-muted-foreground block mt-0.5">
                Ph: {patient.phone || session.phone || 'Recorded'}
              </span>
            </div>
          </div>

          {/* OPD Token Box */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border text-center space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground block">
              OPD Chamber Queue Token
            </span>
            <div className="font-serif text-5xl sm:text-6xl font-extrabold text-primary py-1">
              #{String(caseId).padStart(2, '0')}
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              {isReviewed ? (
                <Badge variant="success" className="gap-1 py-0.5 text-xs font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{statusLabel}</span>
                </Badge>
              ) : (
                <Badge variant="warning" className="gap-1 py-0.5 text-xs font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{statusLabel}</span>
                </Badge>
              )}
            </div>
            <p className="font-mono text-[11px] text-foreground font-semibold pt-1">
              Chamber #2 • Dr. R. Sharma (AYUSH)
            </p>
          </div>

          {/* Clean Square QR Code Section */}
          <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-lg border border-border/80 space-y-2.5">
            <ClinicalQrCode
              value={`MEDIKIOSK-CASE-${caseId}-${patientName.replace(/\s+/g, '_')}`}
              size={140}
            />
            <div className="text-center space-y-0.5">
              <span className="font-mono text-xs font-semibold text-foreground block">
                Scan to view your case (Demo)
              </span>
              <span className="text-[10px] font-mono text-muted-foreground block">
                Clinical intake verification • Prototype demonstration
              </span>
            </div>
          </div>

          {/* Tear-off divider effect */}
          <div className="relative border-t-2 border-dashed border-border/80 my-2">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-card px-2 font-mono text-[10px] text-muted-foreground uppercase">
              Next Steps for Patient
            </span>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed pt-1">
            <div className="flex items-start gap-2">
              <span className="font-mono font-bold text-primary">1.</span>
              <span>Your case history, reported symptoms, and prior records have been organized for the physician.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono font-bold text-primary">2.</span>
              <span>Token #{String(caseId).padStart(2, '0')} will appear on the OPD chamber screen when it is your turn.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono font-bold text-primary">3.</span>
              <span>You can download your structured clinical report or view your Daily Care Card below.</span>
            </div>
          </div>
        </div>

        {/* Book Consultation Slot Card */}
        <div className="p-4 bg-primary/10 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left space-y-0.5">
            <span className="font-serif font-bold text-sm text-foreground block">
              Ready for your Doctor Consultation?
            </span>
            <span className="text-xs text-muted-foreground">
              Book your consultation slot now. Your prepared case (#MK-{String(caseId).padStart(4, '0')}) will be pre-loaded for the doctor.
            </span>
          </div>
          <Link to="/patient/book" className="w-full sm:w-auto shrink-0">
            <Button size="md" className="w-full sm:w-auto gap-2 font-semibold text-xs shadow-xs">
              <Calendar className="h-4 w-4" />
              <span>Book Consultation Slot</span>
            </Button>
          </Link>
        </div>

        {/* Slip Actions */}
        <div className="p-4 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <Button
            variant="default"
            size="md"
            onClick={handleDownloadPdf}
            className="w-full sm:w-auto gap-2 font-semibold text-xs shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>Download Clinical PDF</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setCareCardOpen(true)}
            className="w-full sm:w-auto gap-2 text-xs font-medium"
          >
            <HeartPulse className="h-4 w-4 text-secondary" />
            <span>View Daily Care Card</span>
          </Button>

          <Button
            variant="ghost"
            size="md"
            onClick={() => window.print()}
            className="w-full sm:w-auto gap-1.5 text-xs text-muted-foreground"
          >
            <Printer className="h-4 w-4" />
            <span>Print Slip</span>
          </Button>
        </div>
      </div>

      {/* Return Home Action */}
      <div className="pt-2">
        <Link
          to="/"
          onClick={() => clearPatientSession()}
          className="inline-block"
        >
          <Button variant="ghost" size="lg" className="gap-2 text-muted-foreground hover:text-foreground">
            <HomeIcon className="h-4 w-4" />
            <span>Finish • Return to Kiosk Home</span>
          </Button>
        </Link>
      </div>

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
export default PatientExport
