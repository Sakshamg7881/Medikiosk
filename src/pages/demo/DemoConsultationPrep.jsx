import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import {
  Stethoscope,
  Sparkles,
  FileSpreadsheet,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { getDoctorById, getClinicById } from '@/data/clinicsData'
import { setConsultationType, setSelectedDoctor, setSelectedClinic } from '@/lib/session'

export function DemoConsultationPrep() {
  const { doctorId } = useParams()
  const navigate = useNavigate()

  const doctor = getDoctorById(doctorId) || getDoctorById('d1')
  const clinic = doctor ? getClinicById(doctor.clinicId) : null

  const [selectedType, setSelectedType] = useState('first') // 'first', 'detailed', 'followup'
  const [handoffModal, setHandoffModal] = useState(false)

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-6">
        <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="font-serif text-2xl font-bold mb-2">Doctor Not Found</h2>
        <p className="text-muted-foreground text-sm mb-6">The requested doctor does not exist.</p>
        <Link to="/demo">
          <Button variant="default">Back to Product Tour</Button>
        </Link>
      </div>
    )
  }

  const handleStartExistingAssessment = () => {
    let typeName = 'AI-Assisted First Consultation'
    if (selectedType === 'detailed') typeName = 'Detailed Consultation'
    if (selectedType === 'followup') typeName = 'Follow-up Consultation'

    setConsultationType(typeName)
    setSelectedDoctor(doctor.id)
    if (clinic) setSelectedClinic(clinic.id)

    // Hand off to the existing, live working flow
    navigate('/patient/consent')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Brand Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Link to={`/demo/doctor/${doctor.id}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground text-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dr. {doctor.name.split(' ').pop()}</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">Demo Stage 02</span>
            <Badge variant="secondary" className="font-mono text-[10px]">
              Consultation Prep
            </Badge>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Prepare Your Consultation
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Select how you would like to prepare your clinical story before meeting the physician.
          </p>
        </div>

        {/* Attending Doctor Context Banner */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-serif text-lg font-bold shrink-0">
                {doctor.name.split(' ').slice(1).map(n => n[0]).join('')}
              </div>
              <div>
                <span className="font-serif font-bold text-base text-foreground block">
                  {doctor.name}
                </span>
                <span className="text-xs text-primary font-medium block">
                  {doctor.specialization} • {doctor.qualification}
                </span>
                {clinic && (
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3 text-accent" />
                    {clinic.name}, {clinic.city}
                  </span>
                )}
              </div>
            </div>

            <Badge variant="secondary" className="text-xs font-mono shrink-0">
              â‚¹{doctor.consultationFee}
            </Badge>
          </CardContent>
        </Card>

        {/* 3 Consultation Type Options */}
        <div className="space-y-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Choose Intake Option
          </span>

          {/* Option 1: AI-Assisted First Consultation */}
          <div
            onClick={() => setSelectedType('first')}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedType === 'first'
                ? 'border-primary bg-primary/10 ring-2 ring-primary shadow-xs'
                : 'border-border bg-card hover:bg-muted/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-primary/15 text-primary shrink-0 mt-0.5">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-base text-foreground">
                      1. AI-Assisted First Consultation
                    </h3>
                    <Badge variant="success" className="text-[10px] py-0">Recommended</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Prepare your health history through an interactive intake chat before meeting the doctor. Covers chief complaint, duration, and Mini AYUSH parameters.
                  </p>
                </div>
              </div>
              <div className="h-5 w-5 rounded-full border border-primary flex items-center justify-center shrink-0 mt-1">
                {selectedType === 'first' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </div>
            </div>
          </div>

          {/* Option 2: Detailed Consultation */}
          <div
            onClick={() => setSelectedType('detailed')}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedType === 'detailed'
                ? 'border-primary bg-primary/10 ring-2 ring-primary shadow-xs'
                : 'border-border bg-card hover:bg-muted/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-secondary/20 text-secondary-foreground shrink-0 mt-0.5">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-base text-foreground">
                    2. Detailed Consultation & Prior Records
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Provide a comprehensive history with attached previous prescriptions, lab reports, or scans for automated document intelligence structuring.
                  </p>
                </div>
              </div>
              <div className="h-5 w-5 rounded-full border border-primary flex items-center justify-center shrink-0 mt-1">
                {selectedType === 'detailed' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </div>
            </div>
          </div>

          {/* Option 3: Follow-up */}
          <div
            onClick={() => setSelectedType('followup')}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedType === 'followup'
                ? 'border-primary bg-primary/10 ring-2 ring-primary shadow-xs'
                : 'border-border bg-card hover:bg-muted/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-accent/20 text-accent-foreground shrink-0 mt-0.5">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-base text-foreground">
                    3. Follow-up Consultation
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Continue an existing clinical case. Record treatment response, current relief percentage, and medicine tolerance for the physician.
                  </p>
                </div>
              </div>
              <div className="h-5 w-5 rounded-full border border-primary flex items-center justify-center shrink-0 mt-1">
                {selectedType === 'followup' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </div>
            </div>
          </div>
        </div>

        {/* Safety & Clinical Guardrail Banner */}
        <div className="p-4 rounded-md bg-muted/40 border border-border/80 text-xs text-muted-foreground flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
          <span>
            <strong>Healthcare Guarantee:</strong> MediKiosk is not an automated doctor. The artificial intelligence only organizes your story into a clinical summary. Your attending doctor retains complete authority over diagnosis, physical examination, and treatment.
          </span>
        </div>

        {/* Continue Button */}
        <div className="pt-2">
          <Button
            size="xl"
            onClick={() => setHandoffModal(true)}
            className="w-full justify-between font-semibold shadow-xs"
          >
            <span>Continue • Proceed to Case Intake</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </main>

      {/* Confirmation & Hand-off Modal */}
      {handoffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-serif font-bold text-lg text-foreground">
                  Ready to begin?
                </h3>
              </div>
              <button
                onClick={() => setHandoffModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono"
              >
                âœ•
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p className="text-foreground font-medium text-sm">
                Connect Clinic Discovery to Live AI Case-Taking
              </p>
              <p>
                You are about to enter MediKiosk's operational intake pipeline. This prepares a verified clinical summary for <strong>{doctor.name}</strong> at <strong>{clinic?.name || 'the clinic'}</strong>.
              </p>

              <div className="p-3 bg-muted/40 rounded-md space-y-1.5 font-mono text-[11px] text-foreground/90">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                  <span>1. Patient Consent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                  <span>2. Adaptive Gemini AI Case-Taking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                  <span>3. Mini AYUSH & Prakriti Assessment</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                  <span>4. Document Intelligence & Red-Flag Safety</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                  <span>5. Doctor Triage Review</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
              <Button
                variant="default"
                size="sm"
                onClick={handleStartExistingAssessment}
                className="flex-1 gap-1.5 font-semibold text-xs"
              >
                <span>Start Existing AI Assessment</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Link to="/demo" className="sm:w-auto">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Back to Tour
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default DemoConsultationPrep
