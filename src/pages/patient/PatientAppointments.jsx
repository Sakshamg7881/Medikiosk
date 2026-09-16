import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  ArrowLeft,
  PlusCircle,
  CheckCircle2,
  Navigation,
  FileText,
  HeartPulse,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { getPatientSession } from '@/lib/session'
import { getPatientUpcomingAppointments, getPatientPastAppointments } from '@/lib/appointments'
import { getCaseSummary } from '@/lib/api'
import { generateClinicalPdf } from '@/lib/pdfReportGenerator'
import { DailyCareCard } from '@/components/patient/DailyCareCard'

export function PatientAppointments() {
  const session = getPatientSession()
  const lang = session.preferredLanguage || 'en'

  const [activeTab, setActiveTab] = useState('UPCOMING') // UPCOMING, PAST
  const [upcomingList, setUpcomingList] = useState([])
  const [pastList, setPastList] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Directions Modal
  const [directionsModal, setDirectionsModal] = useState(false)
  const [activeClinic, setActiveClinic] = useState(null)

  // Daily Care Card Modal
  const [careCardOpen, setCareCardOpen] = useState(false)
  const [selectedCaseForCareCard, setSelectedCaseForCareCard] = useState(null)
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    setIsLoading(true)
    try {
      const patientId = session.patientId || 1
      const [upcoming, past] = await Promise.all([
        getPatientUpcomingAppointments(patientId),
        getPatientPastAppointments(patientId),
      ])
      setUpcomingList(upcoming || [])
      setPastList(past || [])
    } catch (e) {
      console.warn('Error loading patient appointments:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReport = async (caseId) => {
    if (!caseId) return
    setIsPdfGenerating(true)
    try {
      const cData = await getCaseSummary(caseId)
      if (cData) {
        generateClinicalPdf(cData)
      }
    } catch (e) {
      console.error('Failed to generate PDF for case:', e)
    } finally {
      setIsPdfGenerating(false)
    }
  }

  const handleOpenCareCard = async (caseId) => {
    try {
      const targetCaseId = caseId || session.caseId || 1
      const cData = await getCaseSummary(targetCaseId)
      setSelectedCaseForCareCard(cData)
      setCareCardOpen(true)
    } catch (e) {
      console.error('Failed to fetch case for Daily Care Card:', e)
    }
  }

  const handleOpenDirections = (clinicName) => {
    setActiveClinic(clinicName || 'MediCare AYUSH Clinic')
    setDirectionsModal(true)
  }

  const currentList = activeTab === 'UPCOMING' ? upcomingList : pastList

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Link to="/patient/home">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </Link>
        <Badge variant="outline" className="font-mono text-xs">
          OPD Schedule • Demo Mode
        </Badge>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">My Consultations</h1>
          <p className="text-muted-foreground text-sm">Upcoming visits, completed consultations, clinical PDF reports, and Daily Care Cards.</p>
        </div>

        <Link to="/patient/book">
          <Button size="sm" className="gap-1.5 font-medium">
            <PlusCircle className="h-4 w-4" />
            <span>Book Consultation</span>
          </Button>
        </Link>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`pb-3 px-4 font-mono text-xs font-semibold uppercase tracking-wider transition-colors relative ${
            activeTab === 'UPCOMING'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Upcoming Visits ({upcomingList.length})
        </button>

        <button
          onClick={() => setActiveTab('PAST')}
          className={`pb-3 px-4 font-mono text-xs font-semibold uppercase tracking-wider transition-colors relative ${
            activeTab === 'PAST'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Past Consultations ({pastList.length})
        </button>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="p-16 text-center text-muted-foreground font-mono text-xs">
          Loading appointments...
        </div>
      ) : currentList.length === 0 ? (
        <Card className="border-dashed border-2 border-border p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-foreground">
              {activeTab === 'UPCOMING' ? 'No Upcoming Consultations' : 'No Past Consultations Recorded'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {activeTab === 'UPCOMING'
                ? 'You do not have any confirmed consultations right now. Book a visit or complete health intake at any MediKiosk facility.'
                : 'Completed consultations and finalized clinical summaries will appear here for your reference.'}
            </p>
          </div>
          {activeTab === 'UPCOMING' && (
            <Link to="/patient/book">
              <Button size="sm" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Book Consultation Slot</span>
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {currentList.map((appt) => {
            const isCompleted = appt.status === 'COMPLETED'
            const isConfirmed = appt.status === 'CONFIRMED'
            const token = appt.consultationToken || `TK-${String(appt.caseId || '04').padStart(2, '0')}`

            return (
              <Card
                key={appt.id}
                className={`border shadow-xs transition-colors ${
                  isCompleted
                    ? 'border-border/80 bg-card/60'
                    : 'border-2 border-primary/40 bg-card'
                }`}
              >
                <CardHeader className="py-3.5 px-5 border-b border-border bg-muted/15 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    <div>
                      <span className="font-serif font-bold text-sm text-foreground">
                        {appt.doctorName}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 font-mono">
                        Token: <strong className="text-primary">{token}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                      {appt.consultationType || 'First Consultation'}
                    </Badge>

                    {isCompleted ? (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Completed</span>
                      </Badge>
                    ) : isConfirmed ? (
                      <Badge variant="success" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Confirmed</span>
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="gap-1 text-[10px]">
                        <Clock className="h-3 w-3" />
                        <span>{appt.status}</span>
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-muted-foreground font-mono block text-[11px]">
                        Scheduled Slot
                      </span>
                      <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        <span>{appt.date} • {appt.time}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-muted-foreground font-mono block text-[11px]">
                        Clinical Facility
                      </span>
                      <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                        <MapPin className="h-4 w-4 text-accent shrink-0" />
                        <span className="truncate">{appt.clinicName || 'MediCare AYUSH Clinic'}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-muted-foreground font-mono block text-[11px]">
                        Linked Intake Case
                      </span>
                      <div className="flex items-center gap-2 text-foreground font-mono text-xs">
                        <FileText className="h-4 w-4 text-secondary shrink-0" />
                        <span>Case #MK-{String(appt.caseId || 1).padStart(4, '0')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Context notice */}
                  <div className="p-3 rounded-md bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-center justify-between flex-wrap gap-2">
                    <span>
                      {isCompleted
                        ? 'Consultation completed. The attending physician has reviewed and finalized your clinical findings.'
                        : 'Your case history and Prakriti assessment are already attached to this appointment for the physician.'}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      Ref: #{appt.id}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-wrap gap-2 justify-end border-t border-border p-4 bg-muted/10">
                  {/* Get Directions (for upcoming) */}
                  {!isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => handleOpenDirections(appt.clinicName)}
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>Get Directions</span>
                    </Button>
                  )}

                  {/* Download PDF button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    disabled={isPdfGenerating}
                    onClick={() => handleDownloadReport(appt.caseId)}
                  >
                    <Download className="h-3.5 w-3.5 text-primary" />
                    <span>{isCompleted ? 'Final Clinical Report (PDF)' : 'Pre-Consultation PDF'}</span>
                  </Button>

                  {/* Daily Care Card */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => handleOpenCareCard(appt.caseId)}
                  >
                    <HeartPulse className="h-3.5 w-3.5 text-secondary" />
                    <span>Daily Care Card</span>
                  </Button>

                  {/* View Case */}
                  <Link to="/patient/cases">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                      <span>View Case History</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Directions Modal */}
      {directionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                <h3 className="font-serif font-bold text-base">Facility Directions</h3>
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
                <strong className="text-foreground text-sm">{activeClinic}</strong>
                <br />
                E-42, South Extension Part II, New Delhi, Delhi 110049
              </p>
              <p className="p-2.5 rounded bg-muted/40 font-mono text-[11px] text-foreground">
                Nearest Metro: South Extension Metro Station (Pink Line, Gate 2) • 350m walk
              </p>
              <p className="text-[11px]">
                Upon arrival, present token at MediKiosk Terminal #04 or proceed directly to AYUSH OPD Chamber #2.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <a
                href="https://maps.google.com/?q=South+Extension+Part+II+New+Delhi"
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="outline" className="text-xs">
                  Open External Maps
                </Button>
              </a>
              <Button size="sm" variant="default" onClick={() => setDirectionsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Care Card Modal */}
      {careCardOpen && (
        <DailyCareCard
          caseData={selectedCaseForCareCard}
          isOpen={careCardOpen}
          onClose={() => setCareCardOpen(false)}
        />
      )}
    </div>
  )
}
export default PatientAppointments
