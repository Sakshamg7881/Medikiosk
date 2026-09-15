import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  ArrowRight,
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
  Download,
} from 'lucide-react'
import { getPatientSession } from '@/lib/session'
import { getCaseSummary } from '@/lib/api'
import { DailyCareCard } from '@/components/patient/DailyCareCard'
import { generateClinicalPdf } from '@/lib/pdfReportGenerator'

export function PatientSummary() {
  const navigate = useNavigate()
  const [session, setSession] = useState(getPatientSession())
  const [summaryData, setSummaryData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [careCardOpen, setCareCardOpen] = useState(false)
  const [error, setError] = useState(null)

  const lang = session.preferredLanguage || 'en'

  useEffect(() => {
    const s = getPatientSession()
    setSession(s)

    if (!s.patientId) {
      navigate('/patient/login')
      return
    }

    if (!s.consentAccepted) {
      navigate('/patient/consent')
      return
    }

    if (s.caseId) {
      fetchSummary(s.caseId)
    } else {
      setIsLoading(false)
    }
  }, [navigate])

  const fetchSummary = async (cId) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getCaseSummary(cId)
      setSummaryData(data)
    } catch (err) {
      console.error('Failed to load case summary:', err)
      setError('Unable to load clinical case summary. Please retry.')
    } finally {
      setIsLoading(false)
    }
  }

  const patient = summaryData?.patient || {}
  const ayush = summaryData?.ayushData || {}
  const prakriti = summaryData?.prakritiResult || {}
  const prakritiScores = prakriti.scores || {}
  const documents = summaryData?.documents || []
  const hasRedFlags = summaryData?.redFlagDetected || false

  return (
    <div className="max-w-2xl mx-auto w-full space-y-5 pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link to="/patient/documents">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Documents</span>
          </Button>
        </Link>
        <Badge variant="outline">Step 6 of 7 • Case Summary</Badge>
      </div>

      <div className="text-center space-y-1">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Clinical Case Summary</h1>
        <p className="text-muted-foreground text-sm">Pre-consultation intake structured for your attending physician</p>
      </div>

      {/* 1. Red-Flag Warning Banner (Prominent at Top if Detected) */}
      {hasRedFlags && (
        <div className="p-4 rounded-lg border-2 border-amber-500/60 bg-amber-500/10 text-amber-950 dark:text-amber-200 space-y-2 shadow-xs animate-in fade-in-50">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-900 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Urgent Medical Attention Notice</span>
          </div>
          <p className="text-xs leading-relaxed">
            {summaryData?.redFlagWarning ||
              'Some symptoms mentioned may need urgent medical attention. Please seek appropriate medical care promptly.'}
          </p>
          {summaryData?.redFlagTerms && summaryData.redFlagTerms.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {summaryData.redFlagTerms.map((term, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] font-mono font-medium"
                >
                  {term}
                </span>
              ))}
            </div>
          )}
          <div className="text-[10px] text-muted-foreground/80 italic pt-0.5">
            This is a preliminary safety triage check, NOT a disease diagnosis.
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-card rounded-lg border border-border">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading structured case summary...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center space-y-3 bg-card rounded-lg border border-destructive/30">
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" onClick={() => fetchSummary(session.caseId)}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 2. Patient Basic Information Card */}
          <Card className="border-border">
            <CardHeader className="py-3 px-4 border-b border-border/70 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Patient Information</CardTitle>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                  ID #{summaryData?.caseId || session.patientId}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground font-mono block">Name</span>
                <span className="font-semibold text-foreground text-sm">
                  {patient.name || session.name || 'Patient'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-mono block">Age / Gender</span>
                <span className="font-medium text-foreground">
                  {patient.age ? `${patient.age} yrs` : 'N/A'} • {patient.gender || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-mono block">Phone</span>
                <span className="font-mono text-foreground">{patient.phone || session.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-mono block">Language</span>
                <span className="font-medium text-foreground uppercase font-mono">
                  {patient.preferredLanguage || session.preferredLanguage || 'EN'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3. Main Concern & Clinical History */}
          <Card className="border-border">
            <CardHeader className="py-3 px-4 border-b border-border/70 bg-muted/20">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Main Concern & Symptoms</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground font-mono block mb-0.5">Primary Concern</span>
                <div className="font-serif text-base font-bold text-foreground">
                  {summaryData?.chiefComplaint || 'Consultation Intake'}
                </div>
              </div>
              {summaryData?.hpi && (
                <div>
                  <span className="text-muted-foreground font-mono block mb-0.5">History / Symptoms</span>
                  <p className="text-foreground/90 leading-relaxed bg-muted/30 p-2.5 rounded-md border border-border/60">
                    {summaryData.hpi}
                  </p>
                </div>
              )}
              {summaryData?.associatedSymptoms && (
                <div>
                  <span className="text-muted-foreground font-mono block mb-0.5">Associated Factors</span>
                  <p className="text-foreground/90">{summaryData.associatedSymptoms}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. AYUSH Lifestyle Profile & Prakriti */}
          <Card className="border-border">
            <CardHeader className="py-3 px-4 border-b border-border/70 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-secondary" />
                  <CardTitle className="text-sm font-semibold">
                    AYUSH Lifestyle & Prakriti Profile
                  </CardTitle>
                </div>
                {prakriti.dominantTendency && (
                  <Badge variant="secondary" className="text-xs">
                    {prakriti.dominantTendency}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5 text-xs">
              {/* Routine Intake Factors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-md bg-muted/30 border border-border/60 space-y-1">
                  <span className="font-mono text-[11px] text-muted-foreground block font-semibold">
                    Agni (Digestion)
                  </span>
                  <p className="text-foreground/90 text-[11px]">{ayush.agni || 'Recorded in assessment'}</p>
                </div>
                <div className="p-2.5 rounded-md bg-muted/30 border border-border/60 space-y-1">
                  <span className="font-mono text-[11px] text-muted-foreground block font-semibold">
                    Nidra (Sleep)
                  </span>
                  <p className="text-foreground/90 text-[11px]">{ayush.nidra || 'Recorded in assessment'}</p>
                </div>
                <div className="p-2.5 rounded-md bg-muted/30 border border-border/60 space-y-1">
                  <span className="font-mono text-[11px] text-muted-foreground block font-semibold">
                    Mala (Regularity)
                  </span>
                  <p className="text-foreground/90 text-[11px]">{ayush.mala || 'Recorded in assessment'}</p>
                </div>
              </div>

              {/* Prakriti Dosha Breakdown */}
              <div className="p-3 bg-card border border-border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-xs">
                    Constitutional Tendency Indicator
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Preliminary wellness indicator â€” not a diagnosis
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded bg-muted/40 border border-border/60">
                    <div className="flex items-center justify-center text-primary gap-1 text-[11px] font-semibold">
                      <Wind className="h-3 w-3" />
                      <span>Vata</span>
                    </div>
                    <div className="font-mono text-base font-bold text-foreground">
                      {prakritiScores.vata || 1}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-muted/40 border border-border/60">
                    <div className="flex items-center justify-center text-accent gap-1 text-[11px] font-semibold">
                      <Flame className="h-3 w-3" />
                      <span>Pitta</span>
                    </div>
                    <div className="font-mono text-base font-bold text-foreground">
                      {prakritiScores.pitta || 1}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-muted/40 border border-border/60">
                    <div className="flex items-center justify-center text-secondary gap-1 text-[11px] font-semibold">
                      <Mountain className="h-3 w-3" />
                      <span>Kapha</span>
                    </div>
                    <div className="font-mono text-base font-bold text-foreground">
                      {prakritiScores.kapha || 1}
                    </div>
                  </div>
                </div>

                {prakriti.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                    {prakriti.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 5. Reviewed Documents & Extracted Findings */}
          <Card className="border-border">
            <CardHeader className="py-3 px-4 border-b border-border/70 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">
                    Attached Records & Extracted Information ({documents.length})
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  OCR & AI Structured
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {documents.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-2">
                  No previous records attached. Pre-consultation summary based on patient conversation.
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
                      className="p-3 bg-muted/30 border border-border/70 rounded-md space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                          <span>{doc.fileName}</span>
                        </span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {doc.documentType}
                        </Badge>
                      </div>

                      {meds.length > 0 && (
                        <div className="text-[11px]">
                          <strong className="text-foreground flex items-center gap-1">
                            <Pill className="h-3 w-3 text-accent" />
                            Extracted Medications:
                          </strong>
                          <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-muted-foreground">
                            {meds.map((m, mIdx) => (
                              <li key={mIdx}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {findings.length > 0 && (
                        <div className="text-[11px]">
                          <strong className="text-foreground">Clinical Findings:</strong>
                          <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-muted-foreground">
                            {findings.map((f, fIdx) => (
                              <li key={fIdx}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {labs.length > 0 && (
                        <div className="text-[11px]">
                          <strong className="text-foreground">Lab Values:</strong>
                          <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-muted-foreground">
                            {labs.map((l, lIdx) => (
                              <li key={lIdx}>{l}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* 6. AI-Generated Pre-Consultation Summary */}
          {summaryData?.aiSummary && (
            <Card className="border-border">
              <CardHeader className="py-3 px-4 border-b border-border/70 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">
                    AI-Generated Pre-Consultation Summary
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 text-xs">
                <div className="whitespace-pre-wrap leading-relaxed font-mono bg-muted/30 p-3.5 rounded-md border border-border/60 text-foreground">
                  {summaryData.aiSummary}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-secondary shrink-0" />
                  <span>
                    MediKiosk clinical intake assistant • Prepared for physician review. Final diagnosis and prescription by consulting doctor.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick PDF & Care Card Export Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                if (summaryData) generateClinicalPdf(summaryData)
              }}
              className="w-full sm:w-auto gap-2 text-xs"
            >
              <Download className="h-4 w-4 text-primary" />
              <span>Download Pre-Consultation PDF</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setCareCardOpen(true)}
              className="w-full sm:w-auto gap-2 text-xs"
            >
              <HeartPulse className="h-4 w-4 text-secondary" />
              <span>View Daily Care Card</span>
            </Button>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <Link to="/patient/export" className="block w-full">
              <Button size="xl" className="w-full justify-between font-semibold">
                <span>Proceed to Consultation Hand-off</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Daily Care Card Modal */}
          {careCardOpen && (
            <DailyCareCard
              caseData={summaryData}
              isOpen={careCardOpen}
              onClose={() => setCareCardOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}
