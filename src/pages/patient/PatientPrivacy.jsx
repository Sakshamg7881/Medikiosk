import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  FileCheck,
  UserCheck,
  AlertCircle,
  ArrowLeft,
  Server,
  KeyRound,
  Layers,
} from 'lucide-react'
import { getPatientSession } from '@/lib/session'

export function PatientPrivacy() {
  const session = getPatientSession()
  const lang = session.preferredLanguage || 'en'

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 pb-16">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Link to="/patient/home">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </Link>
        <Badge variant="outline" className="font-mono text-xs">
          Privacy • Consent Governance
        </Badge>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="accent">Patient Protection</Badge>
          <span className="font-mono text-xs text-muted-foreground">MediKiosk Privacy Charter</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Privacy & Consent Governance</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {'Understand what health information is gathered, how your attending doctor accesses it, and how your consent is safeguarded.'}
        </p>
      </div>

      {/* Future Integration Banner â€” Planned Notice */}
      <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-foreground space-y-1.5">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary shrink-0" />
          <span className="font-semibold text-sm text-foreground">
            ABHA / ABDM Integration â€” Planned (Future Milestone)
          </span>
          <Badge variant="outline" className="text-[10px] uppercase font-mono ml-auto">
            Roadmap
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          MediKiosk is designed in architectural alignment with the Ayushman Bharat Digital Mission (ABDM) guidelines. Full live integration with national ABHA Health IDs and M1/M2/M3 milestones is planned for subsequent phases. The current terminal operates on local clinic triage sessions.
        </p>
      </div>

      {/* 1. What Information Is Collected */}
      <Card className="border-border">
        <CardHeader className="py-3.5 px-5 border-b border-border/70 bg-muted/20">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">1. What Information Is Collected</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3 text-xs text-foreground/90 leading-relaxed">
          <p>
            During your kiosk intake, MediKiosk collects only the information necessary to prepare a structured clinical summary for your consulting doctor:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Basic Demographics:</strong> Your name, age, gender, and contact phone number to identify your appointment queue.
            </li>
            <li>
              <strong className="text-foreground">Symptom Descriptions & HPI:</strong> Chief complaint, duration, aggravating triggers, and conversational responses provided during intake.
            </li>
            <li>
              <strong className="text-foreground">AYUSH Lifestyle Profile:</strong> Digestion status (<em>Agni</em>), sleep regularity (<em>Nidra</em>), and bowel elimination (<em>Mala</em>).
            </li>
            <li>
              <strong className="text-foreground">Attached Records (Optional):</strong> Any prescriptions, previous lab reports, or discharge summaries you choose to scan or upload.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* 2. Why It Is Collected */}
      <Card className="border-border">
        <CardHeader className="py-3.5 px-5 border-b border-border/70 bg-muted/20">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">2. Why It Is Collected (Clinical Purpose)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>
            The sole purpose of collection is <strong className="text-foreground">pre-consultation case preparation</strong>. Collecting this information before you meet your doctor allows your attending AYUSH physician to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Spend more consultation time examining you rather than typing routine baseline questions.</li>
            <li>Review a synthesized 1-paragraph summary alongside your Prakriti constitutional profile.</li>
            <li>Identify safety red flags immediately before commencing the clinical consultation.</li>
          </ul>
        </CardContent>
      </Card>

      {/* 3. Patient Consent & 4. Who Can Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="py-3.5 px-5 border-b border-border/70 bg-muted/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              <CardTitle className="text-sm font-semibold">3. Patient Consent</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p>
              Your explicit consent is recorded prior to starting any assessment. You are asked to confirm your participation on the consent screen. No health conversation or document scanning begins without your affirmative action.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="py-3.5 px-5 border-b border-border/70 bg-muted/20">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm font-semibold">4. Access Boundaries</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p>
              Your intake case and attached records are accessible <strong className="text-foreground">strictly by the consulting doctor and clinic staff</strong> associated with your case ID in the OPD chamber. Case data is not publicly searchable.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 5. Patient Control Over Consent */}
      <Card className="border-border">
        <CardHeader className="py-3.5 px-5 border-b border-border/70 bg-muted/20">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">5. Patient Control & Withdrawal</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 text-xs text-muted-foreground space-y-2.5 leading-relaxed">
          <p>
            You have full ownership of your health consultation. You may at any point:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Skip any question in the intake chat that you prefer to answer directly to the doctor in person.</li>
            <li>Proceed without uploading previous documents if you do not wish to share them digitally.</li>
            <li>Request clinic staff to reset your active kiosk session or delete your pending intake record before your turn.</li>
          </ul>
        </CardContent>
      </Card>

      {/* 6. Privacy-First Design Philosophy */}
      <Card className="border-2 border-secondary/40 shadow-xs">
        <CardHeader className="py-3.5 px-5 border-b border-border/70 bg-secondary/10">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-secondary" />
            <CardTitle className="text-sm font-bold text-foreground">6. Privacy-First Engineering</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 text-xs text-foreground/90 space-y-2 leading-relaxed">
          <p>
            <strong>Zero Advertising / Commercial Monetization:</strong> MediKiosk is built strictly for clinical utility. Your personal or health details are never sold, rented, or utilized for targeted marketing.
          </p>
          <p className="text-muted-foreground">
            <strong>Clinical Primacy:</strong> The artificial intelligence model only structures your words into medical history format. The consulting AYUSH physician remains solely responsible for the diagnosis, examination, and treatment regimen.
          </p>
        </CardContent>
      </Card>

      {/* Return to Home Action */}
      <div className="pt-2 flex justify-center">
        <Link to="/patient/home">
          <Button variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Patient Home</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
export default PatientPrivacy
