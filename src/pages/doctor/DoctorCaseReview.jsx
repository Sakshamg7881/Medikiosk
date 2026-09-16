import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  User,
  Activity,
  HeartPulse,
  Wind,
  Flame,
  Mountain,
  FileText,
  Pill,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Clock,
  Save,
  Download,
  Calendar,
} from 'lucide-react'
import { getDoctorCase, reviewDoctorCase } from '@/lib/api'
import { generateClinicalPdf } from '@/lib/pdfReportGenerator'
import { getAllAppointments, updateAppointmentStatus } from '@/lib/appointments'
import { getDoctorSession } from '@/lib/doctorAuth'

export function DoctorCaseReview() {
  const { caseId } = useParams()
  const navigate = useNavigate()

  const [caseData, setCaseData] = useState(null)
  const [linkedAppointment, setLinkedAppointment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Doctor editable inputs
  const [doctorNotes, setDoctorNotes] = useState('')
  const [doctorReviewedSummary, setDoctorReviewedSummary] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [isCompletingAppt, setIsCompletingAppt] = useState(false)

  useEffect(() => {
    if (caseId) {
      fetchCase(caseId)
    }
  }, [caseId])

  const fetchCase = async (id) => {
    setIsLoading(true)
    setError(null)
    try {
      const [data, appts] = await Promise.all([
        getDoctorCase(id),
        getAllAppointments(),
      ])
      setCaseData(data)
      setDoctorNotes(data.doctorNotes || '')
      // Pre-fill reviewed summary with existing reviewed summary or fallback to AI summary
      setDoctorReviewedSummary(data.doctorReviewedSummary || data.aiSummary || '')

      const appt = appts.find((a) => String(a.caseId) === String(id))
      setLinkedAppointment(appt || null)
    } catch (err) {
      console.error('Failed to fetch doctor case:', err)
      setError(err.message || 'Unable to load clinical case. Please retry.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteAppointment = async () => {
    if (!linkedAppointment) return
    setIsCompletingAppt(true)
    try {
      const updated = await updateAppointmentStatus(linkedAppointment.id, 'COMPLETED')
      setLinkedAppointment(updated)
    } catch (e) {
      console.error('Failed to complete appointment:', e)
    } finally {
      setIsCompletingAppt(false)
    }
  }

  const handleMarkAsReviewed = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)
    setSaveError(null)

    try {
      const docSession = getDoctorSession()
      const attendingDocId = docSession ? (docSession.doctorId || docSession.id) : 101

      const updated = await reviewDoctorCase(caseId, {
        doctorNotes,
        doctorReviewedSummary,
        doctorId: attendingDocId, // Attending doctor
      })

      setCaseData(updated)
      setSaveSuccess(true)

      // Also if linked appointment exists and not completed, update it
      if (linkedAppointment && linkedAppointment.status !== 'COMPLETED') {
        try {
          const apptUpdated = await updateAppointmentStatus(linkedAppointment.id, 'COMPLETED')
          setLinkedAppointment(apptUpdated)
        } catch (ignored) {}
      }

      // Scroll to top or show alert
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to submit doctor review:', err)
      setSaveError(err.message || 'Failed to save review notes.')
    } finally {
      setIsSaving(false)
    }
  }

  const patient = caseData?.patient || {}
  const ayush = caseData?.ayushData || {}
  const prakriti = caseData?.prakritiResult || {}
  const prakritiScores = prakriti.scores || {}
  const documents = caseData?.documents || []
  const hasRedFlags = caseData?.redFlagDetected || (caseData?.redFlagTerms && caseData.redFlagTerms.length > 0)
  const isReviewed = caseData?.status === 'REVIEWED'

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center space-x-2">
          <Link to="/doctor/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-mono text-xs text-muted-foreground">Case #{caseId}</span>
        </div>

        <div className="flex items-center space-x-2">
          {caseData && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateClinicalPdf(caseData)}
              className="gap-1.5 text-xs font-medium"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span>{isReviewed ? 'Download Verified PDF' : 'Download Clinical PDF'}</span>
            </Button>
          )}
          {isReviewed ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Reviewed by Doctor</span>
            </Badge>
          ) : (
            <Badge variant="warning" className="gap-1">
              <Clock className="h-3 w-3" />
              <span>Ready for Review</span>
            </Badge>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-card rounded-lg border border-border">
          <RefreshCw className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading clinical case records...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center space-y-4 bg-card rounded-lg border border-destructive/30">
          <p className="text-sm text-destructive">{error}</p>
          <div className="flex justify-center gap-3">
            <Button size="sm" variant="outline" onClick={() => fetchCase(caseId)}>
              Retry
            </Button>
            <Link to="/doctor/dashboard">
              <Button size="sm" variant="ghost">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Success Banner if Saved */}
          {saveSuccess && (
            <div className="p-4 rounded-lg border border-secondary/50 bg-secondary/15 text-secondary-foreground flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in-50">
              <div className="flex items-center gap-2.5 text-sm font-semibold">
                <CheckCircle2 className="h-5 w-5 text-secondary shrink-0" />
                <span>Case #{caseId} successfully marked as REVIEWED. Clinical notes saved.</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => generateClinicalPdf(caseData)}
                  className="text-xs gap-1.5 font-semibold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Final PDF</span>
                </Button>
                <Link to="/doctor/dashboard">
                  <Button size="sm" variant="outline" className="text-xs bg-background">
                    Back to Queue
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Linked Consultation Appointment Card */}
          {linkedAppointment && (
            <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-mono font-bold text-sm shrink-0">
                  {linkedAppointment.consultationToken || `TK-${String(caseId).padStart(2, '0')}`}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-foreground">
                      Linked OPD Consultation: {linkedAppointment.consultationType || 'First Consultation'}
                    </span>
                    {linkedAppointment.status === 'COMPLETED' ? (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Completed</span>
                      </Badge>
                    ) : (
                      <Badge variant="success" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Confirmed</span>
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {linkedAppointment.date} • {linkedAppointment.time}
                    </span>
                    <span>•</span>
                    <span>{linkedAppointment.clinicName || 'Ayush Arogya Kendra'}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">Appt #{linkedAppointment.id}</span>
                  </div>
                </div>
              </div>

              {linkedAppointment.status !== 'COMPLETED' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isCompletingAppt}
                  onClick={handleCompleteAppointment}
                  className="gap-1.5 text-xs font-semibold self-end sm:self-center shrink-0"
                >
                  {isCompletingAppt ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                  )}
                  <span>Mark Consultation Completed</span>
                </Button>
              )}
            </div>
          )}

          {/* 1. RED FLAG BANNER (TOP PRIORITY IF DETECTED) */}
          {hasRedFlags && (
            <div className="p-5 rounded-lg border-2 border-destructive/70 bg-destructive/10 text-destructive dark:text-red-300 space-y-2.5 shadow-sm animate-in fade-in-50">
              <div className="flex items-center gap-2 font-bold text-base text-destructive dark:text-red-300">
                <AlertTriangle className="h-6 w-6 text-destructive shrink-0 animate-pulse" />
                <span>âš ï¸ RED FLAG DETECTED â€” Needs Immediate Attention</span>
              </div>
              <p className="text-xs leading-relaxed text-foreground/90">
                {caseData?.redFlagWarning ||
                  'Patient reported symptoms or clinical findings indicating urgent medical triage requirements.'}
              </p>
              {caseData?.redFlagTerms && caseData.redFlagTerms.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {caseData.redFlagTerms.map((term, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded bg-destructive/20 text-destructive dark:text-red-200 text-xs font-mono font-bold border border-destructive/30"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-[11px] text-muted-foreground italic pt-1">
                Automated safety triage alert based on intake keywords. Clinical diagnosis and definitive care must be determined by attending physician.
              </div>
            </div>
          )}

          {/* 2. Patient Details Header */}
          <Card className="border-border">
            <CardHeader className="py-3.5 px-5 border-b border-border/70 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-semibold">Patient Information</CardTitle>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  Patient ID #{patient.id || caseData?.patientId}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground font-mono block mb-1">Full Name</span>
                <span className="font-semibold text-foreground text-sm">
                  {patient.name || 'Anonymous Patient'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-mono block mb-1">Age</span>
                <span className="font-medium text-foreground text-sm">
                  {patient.age ? `${patient.age} yrs` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-mono block mb-1">Gender</span>
                <span className="font-medium text-foreground text-sm">
                  {patient.gender || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-mono block mb-1">Phone</span>
                <span className="font-mono text-foreground text-sm">
                  {patient.phone || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-mono block mb-1">Intake Language</span>
                <span className="font-mono text-foreground text-sm uppercase">
                  {patient.preferredLanguage || 'EN'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3. Chief Complaint & Clinical History */}
          <Card className="border-border">
            <CardHeader className="py-3.5 px-5 border-b border-border/70 bg-muted/20">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">Chief Complaint & History</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-muted-foreground font-mono block mb-1">Chief Complaint</span>
                <div className="font-serif text-lg font-bold text-foreground">
                  {caseData?.chiefComplaint || 'Consultation Intake'}
                </div>
              </div>
              {caseData?.hpi && (
                <div>
                  <span className="text-muted-foreground font-mono block mb-1">History of Present Illness (HPI)</span>
                  <div className="text-foreground/90 leading-relaxed bg-muted/30 p-3.5 rounded-md border border-border/60 text-sm">
                    {caseData.hpi}
                  </div>
                </div>
              )}
              {caseData?.associatedSymptoms && (
                <div>
                  <span className="text-muted-foreground font-mono block mb-1">Associated Symptoms & Aggravating Factors</span>
                  <p className="text-foreground/90 text-sm">{caseData.associatedSymptoms}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. AYUSH Specifics & 5. Preliminary Prakriti Indicator */}
          <Card className="border-border">
            <CardHeader className="py-3.5 px-5 border-b border-border/70 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-secondary" />
                  <CardTitle className="text-base font-semibold">
                    AYUSH Specifics & Preliminary Prakriti
                  </CardTitle>
                </div>
                {prakriti.dominantTendency && (
                  <Badge variant="secondary" className="text-xs">
                    Dominant: {prakriti.dominantTendency}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              {/* AYUSH Key Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-md bg-muted/30 border border-border/60 space-y-1">
                  <span className="font-mono text-xs text-muted-foreground block font-semibold">
                    Agni (Digestion & Metabolism)
                  </span>
                  <p className="text-foreground font-medium text-sm">
                    {ayush.agni || 'Recorded during intake'}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-muted/30 border border-border/60 space-y-1">
                  <span className="font-mono text-xs text-muted-foreground block font-semibold">
                    Nidra (Sleep Pattern)
                  </span>
                  <p className="text-foreground font-medium text-sm">
                    {ayush.nidra || 'Recorded during intake'}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-muted/30 border border-border/60 space-y-1">
                  <span className="font-mono text-xs text-muted-foreground block font-semibold">
                    Mala / Koshtha (Elimination)
                  </span>
                  <p className="text-foreground font-medium text-sm">
                    {ayush.mala || 'Recorded during intake'}
                  </p>
                </div>
              </div>

              {/* Preliminary Prakriti Dosha Breakdown */}
              <div className="p-4 bg-card border border-border rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-semibold text-foreground text-sm">
                    Prakriti Constitutional Tendency
                  </span>
                  <span className="text-xs font-mono text-muted-foreground italic">
                    Preliminary wellness indicator â€” not a diagnosis
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center pt-1">
                  <div className="p-2.5 rounded bg-muted/40 border border-border/60">
                    <div className="flex items-center justify-center text-primary gap-1 text-xs font-semibold">
                      <Wind className="h-4 w-4" />
                      <span>Vata</span>
                    </div>
                    <div className="font-mono text-lg font-bold text-foreground mt-0.5">
                      {prakritiScores.vata || 1}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-muted/40 border border-border/60">
                    <div className="flex items-center justify-center text-accent gap-1 text-xs font-semibold">
                      <Flame className="h-4 w-4" />
                      <span>Pitta</span>
                    </div>
                    <div className="font-mono text-lg font-bold text-foreground mt-0.5">
                      {prakritiScores.pitta || 1}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-muted/40 border border-border/60">
                    <div className="flex items-center justify-center text-secondary gap-1 text-xs font-semibold">
                      <Mountain className="h-4 w-4" />
                      <span>Kapha</span>
                    </div>
                    <div className="font-mono text-lg font-bold text-foreground mt-0.5">
                      {prakritiScores.kapha || 1}
                    </div>
                  </div>
                </div>

                {prakriti.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {prakriti.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 6. Uploaded Documents & OCR Extractions */}
          <Card className="border-border">
            <CardHeader className="py-3.5 px-5 border-b border-border/70 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-semibold">
                    Uploaded Documents & OCR Extractions ({documents.length})
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  OCR • Gemini Extracted
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              {documents.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-3">
                  No medical documents attached by patient.
                </p>
              ) : (
                documents.map((doc, idx) => {
                  const struct = doc.structuredData || {}
                  const meds = struct.medicines || []
                  const findings = struct.importantFindings || []
                  const labs = struct.labResults || []

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-muted/30 border border-border/70 rounded-md space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-sm flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-secondary" />
                          <a
                           href={`http://localhost:8080/api/cases/${caseId}/documents/${encodeURIComponent(doc.fileName)}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-primary hover:underline cursor-pointer"
                        >
                          {doc.fileName}
                          </a>
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-[11px]">
                            {doc.documentType || 'DOCUMENT'}
                          </Badge>
                          {doc.ocrStatus && (
                            <Badge variant="outline" className="font-mono text-[10px]">
                              OCR: {doc.ocrStatus}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Extracted Medications */}
                      {meds.length > 0 && (
                        <div className="text-xs">
                          <strong className="text-foreground flex items-center gap-1.5 font-semibold mb-1">
                            <Pill className="h-3.5 w-3.5 text-accent" />
                            Extracted Medications:
                          </strong>
                          <ul className="list-disc pl-5 space-y-0.5 text-foreground/90 font-mono text-[11px]">
                            {meds.map((m, mIdx) => (
                              <li key={mIdx}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Extracted Lab Results */}
                      {labs.length > 0 && (
                        <div className="text-xs">
                          <strong className="text-foreground font-semibold mb-1 block">
                            Extracted Lab Values:
                          </strong>
                          <ul className="list-disc pl-5 space-y-0.5 text-foreground/90 font-mono text-[11px]">
                            {labs.map((l, lIdx) => (
                              <li key={lIdx}>{l}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Clinical Findings */}
                      {findings.length > 0 && (
                        <div className="text-xs">
                          <strong className="text-foreground font-semibold mb-1 block">
                            Document Clinical Findings:
                          </strong>
                          <ul className="list-disc pl-5 space-y-0.5 text-foreground/90 text-[11px]">
                            {findings.map((f, fIdx) => (
                              <li key={fIdx}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Preview Snippet */}
                      {doc.extractedTextPreview && (
                        <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                          <span className="font-mono font-semibold">OCR Preview: </span>
                          <span className="italic">{doc.extractedTextPreview}</span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* 7. AI Pre-Consultation Summary */}
          {caseData?.aiSummary && (
            <Card className="border-border">
              <CardHeader className="py-3.5 px-5 border-b border-border/70 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-semibold">
                    AI Pre-Consultation Summary
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 text-xs space-y-2">
                <div className="whitespace-pre-wrap leading-relaxed font-mono bg-muted/30 p-4 rounded-md border border-border/60 text-foreground text-xs">
                  {caseData.aiSummary}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-secondary shrink-0" />
                  <span>
                    Generated automatically by MediKiosk clinical intake pipeline. Pre-filled below for doctor editing and review.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 8. DOCTOR REVIEW & NOTES SECTION (CRITICAL) */}
          <Card className="border-2 border-primary/40 shadow-sm">
            <CardHeader className="py-4 px-5 border-b border-border bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      Doctor Review & Clinical Notes
                    </CardTitle>
                    <CardDescription className="text-xs">
                      The doctor maintains final clinical control. Add observations, treatment regimen, and finalize the intake summary.
                    </CardDescription>
                  </div>
                </div>
                {caseData?.doctorReviewedAt && (
                  <Badge variant="outline" className="font-mono text-[11px]">
                    Last Reviewed: {new Date(caseData.doctorReviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <form onSubmit={handleMarkAsReviewed}>
              <CardContent className="p-5 space-y-5">
                {saveError && (
                  <div className="p-3 rounded bg-destructive/10 text-destructive text-xs border border-destructive/30">
                    {saveError}
                  </div>
                )}

                {/* Editable Doctor Notes */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
                    Doctor Notes / Clinical Observations & Advice *
                  </label>
                  <textarea
                    rows={4}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="Enter clinical examination findings, prescribed Ayurvedic medicines, dosha management advice, dietary recommendations..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    These notes will be attached directly to the patient's case record and final consultation export.
                  </p>
                </div>

                {/* Editable Doctor Reviewed Summary */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
                    Doctor Reviewed Summary (Pre-filled from AI Intake) *
                  </label>
                  <textarea
                    rows={5}
                    value={doctorReviewedSummary}
                    onChange={(e) => setDoctorReviewedSummary(e.target.value)}
                    placeholder="Review and modify the pre-consultation summary before finalizing..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 leading-relaxed text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    You may refine or correct any AI-extracted points to reflect your clinical assessment.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border p-5 bg-muted/20">
                <Link to="/doctor/dashboard">
                  <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span>Back to Dashboard</span>
                  </Button>
                </Link>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSaving}
                  className="w-full sm:w-auto gap-2 font-semibold shadow-xs"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Saving Clinical Review...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Mark as Reviewed</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
export default DoctorCaseReview
