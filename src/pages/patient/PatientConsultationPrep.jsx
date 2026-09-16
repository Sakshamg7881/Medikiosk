import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
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
} from 'lucide-react'
import { getDoctorById, getClinicById } from '@/data/clinicsData'
import { getPatientSession, setConsultationType, setSelectedDoctor, setSelectedClinic } from '@/lib/session'

export function PatientConsultationPrep() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const session = getPatientSession()
  const lang = session.preferredLanguage || 'en'

  const doctor = getDoctorById(doctorId) || getDoctorById('d1')
  const clinic = doctor ? getClinicById(doctor.clinicId) : null

  const [selectedType, setSelectedType] = useState('first') // 'first', 'detailed', 'followup'

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

  const handleProceed = () => {
    let typeName = 'AI-Assisted First Consultation'
    if (selectedType === 'detailed') typeName = 'Detailed Consultation'
    if (selectedType === 'followup') typeName = 'Follow-up Consultation'

    setConsultationType(typeName)
    setSelectedDoctor(doctor.id)
    if (clinic) setSelectedClinic(clinic.id)

    // Hand off directly to existing consent / assessment flow
    navigate('/patient/consent')
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Link to={`/patient/doctor/${doctor.id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>{doctor.name}</span>
          </Button>
        </Link>
        <Badge variant="outline" className="font-mono text-xs">
          Consultation Preparation
        </Badge>
      </div>

      {/* Screen Title */}
      <div className="text-center space-y-1">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Prepare for Your Consultation</h1>
        <p className="text-muted-foreground text-sm">
          {'Select how you would like to prepare your clinical case before meeting the doctor.'}
        </p>
      </div>

      {/* Doctor Summary Context Card */}
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
            ₹{doctor.consultationFee}
          </Badge>
        </CardContent>
      </Card>

      {/* Consultation Type Choices */}
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
                  Provide a more comprehensive history with attached previous prescriptions, lab reports, or X-rays for automated OCR structuring.
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

      {/* Ethical Medical Guardrail Notice */}
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
          onClick={handleProceed}
          className="w-full justify-between font-semibold shadow-xs"
        >
          <span>
            {'Proceed to Consent & Assessment'}
          </span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
export default PatientConsultationPrep
