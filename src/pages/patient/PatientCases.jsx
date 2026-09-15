import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  PlusCircle,
  Inbox,
  Calendar,
  Stethoscope,
} from 'lucide-react'
import { getPatientSession } from '@/lib/session'
import { getCaseSummary } from '@/lib/api'

export function PatientCases() {
  const [session, setSession] = useState(getPatientSession())
  const [activeSummary, setActiveSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const lang = session.preferredLanguage || 'en'

  useEffect(() => {
    const s = getPatientSession()
    setSession(s)

    if (s.caseId) {
      setIsLoading(true)
      getCaseSummary(s.caseId)
        .then((data) => setActiveSummary(data))
        .catch((err) => console.warn('Could not fetch active case for cases list:', err))
        .finally(() => setIsLoading(false))
    }
  }, [])

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Link to="/patient/home">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>{lang === 'hi' ? 'मुख्य पृष्ठ' : 'Back to Home'}</span>
          </Button>
        </Link>
        <Badge variant="outline" className="font-mono text-xs">
          Clinical History
        </Badge>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            {lang === 'hi' ? 'मेरे स्वास्थ्य केस (My Cases)' : 'My Clinical Cases'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lang === 'hi'
              ? 'आपके पिछले एवं वर्तमान परामर्श केस रिकॉर्ड्स'
              : 'Records of your pre-consultation intake histories and physician summaries.'}
          </p>
        </div>

        <Link to="/patient/consent">
          <Button size="sm" className="gap-1.5 font-medium">
            <PlusCircle className="h-4 w-4" />
            <span>{lang === 'hi' ? 'नया केस शुरू करें' : 'Start New Case'}</span>
          </Button>
        </Link>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {/* Active Session Case (if exists) */}
        {session.caseId && (
          <Card className="border-primary/40 shadow-xs ring-1 ring-primary/20">
            <CardHeader className="py-3.5 px-5 border-b border-border/70 bg-primary/5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-mono text-xs font-bold text-primary">Active Kiosk Case #{session.caseId}</span>
              </div>
              {activeSummary?.status === 'REVIEWED' ? (
                <Badge variant="success" className="gap-1 text-[10px]">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>REVIEWED BY DOCTOR</span>
                </Badge>
              ) : (
                <Badge variant="warning" className="gap-1 text-[10px]">
                  <Clock className="h-3 w-3" />
                  <span>READY FOR REVIEW</span>
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground font-mono block mb-1">Chief Complaint</span>
                <div className="font-serif text-base font-bold text-foreground">
                  {activeSummary?.chiefComplaint || 'Consultation Intake'}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-muted-foreground font-mono">
                <div>
                  <span>Date: </span>
                  <strong className="text-foreground">Today</strong>
                </div>
                <div>
                  <span>Prakriti: </span>
                  <strong className="text-foreground">{activeSummary?.prakritiResult?.dominantTendency || 'Evaluated'}</strong>
                </div>
                <div>
                  <span>Documents: </span>
                  <strong className="text-foreground">{activeSummary?.documents?.length || 0} Attached</strong>
                </div>
              </div>

              {activeSummary?.doctorNotes && (
                <div className="p-3 bg-muted/40 rounded-md border border-border/60 mt-2">
                  <span className="font-semibold text-foreground flex items-center gap-1 mb-1">
                    <Stethoscope className="h-3.5 w-3.5 text-secondary" />
                    Doctor Observations:
                  </span>
                  <p className="text-foreground/90 italic">{activeSummary.doctorNotes}</p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <Link to="/patient/summary">
                  <Button size="sm" variant="default" className="gap-1.5">
                    <span>View Case Summary</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demo Previous Case for realism */}
        <Card className="border-border">
          <CardHeader className="py-3.5 px-5 border-b border-border/70 bg-muted/20 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">Previous Case #MK-1024</span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              COMPLETED
            </Badge>
          </CardHeader>
          <CardContent className="p-5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-serif text-base font-bold text-foreground">
                Mild Dyspepsia & Acid Reflux (Amlapitta)
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">12 Sep 2026</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Patient presented with recurring post-meal heaviness. Mandagni identified. Advised dietary modifications and digestive herbal tea.
            </p>
            <div className="pt-2 flex justify-end">
              <Link to="/patient/summary">
                <Button size="sm" variant="outline" className="text-xs">
                  Review Intake Record
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
export default PatientCases
