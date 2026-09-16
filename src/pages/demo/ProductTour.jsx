import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Stethoscope,
  Building2,
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  HeartPulse,
  Clock,
  MapPin,
  Star,
  Layers,
  ChevronRight,
  ExternalLink,
  Navigation,
  CreditCard,
  Check,
  HelpCircle,
  Activity,
  Flame,
  User,
} from 'lucide-react'
import { DEMO_CLINICS } from '@/data/clinicsData'

export function ProductTour() {
  const [directionsClinic, setDirectionsClinic] = useState(null)
  const [subscriptionModal, setSubscriptionModal] = useState(null)

  // 9-Step Complete Product Journey Timeline
  const journeySteps = [
    {
      step: '01',
      title: 'Patient Access & Language',
      desc: 'Multilingual kiosk login via mobile number & mock OTP with English, Hindi, and Hinglish options.',
      status: 'Operational',
      route: '/patient/language',
      actionLabel: 'Launch Kiosk',
    },
    {
      step: '02',
      title: 'Clinic & Doctor Discovery',
      desc: 'Patient finds an accredited AYUSH clinic, reviews specialist qualifications, and selects a consultation slot.',
      status: 'Prototype',
      route: '#clinics-preview',
      actionLabel: 'Explore Directory',
      isAnchor: true,
    },
    {
      step: '03',
      title: 'Adaptive AI Case-Taking',
      desc: 'Gemini conversational intake that asks focused clinical follow-ups without hallucinating medical diagnosis.',
      status: 'Operational',
      route: '/patient/assessment',
      actionLabel: 'View AI Intake',
    },
    {
      step: '04',
      title: 'Mini AYUSH Assessment',
      desc: 'Structured questions capturing Agni (digestion), Nidra (sleep), Mala (bowel), and rule-based Prakriti tendency.',
      status: 'Operational',
      route: '/patient/assessment',
      actionLabel: 'View AYUSH Logic',
    },
    {
      step: '05',
      title: 'Document Intelligence & OCR',
      desc: 'Pure-Java Apache PDFBox extraction and Gemini structuring of previous prescriptions, medicines, and labs.',
      status: 'Operational',
      route: '/patient/documents',
      actionLabel: 'View Document OCR',
    },
    {
      step: '06',
      title: 'Structured Pre-Consultation Summary',
      desc: 'Automated 1-paragraph clinical summary with prominent red-flag safety detection for urgent symptoms.',
      status: 'Operational',
      route: '/patient/summary',
      actionLabel: 'View Case Summary',
    },
    {
      step: '07',
      title: 'Doctor Triage & Case Review',
      desc: 'Attending physician clinical workspace: review patient story, edit clinical notes, and sign off as REVIEWED.',
      status: 'Operational',
      route: '/doctor/dashboard',
      actionLabel: 'Open Doctor Desk',
    },
    {
      step: '08',
      title: 'In-Person Consultation',
      desc: 'OPD queue token hand-off so doctor spends high-value examination time rather than typing routine questions.',
      status: 'Operational',
      route: '/patient/export',
      actionLabel: 'View Hand-off Token',
    },
    {
      step: '09',
      title: 'Records & Follow-up',
      desc: 'Unified patient portal displaying past cases, doctor-verified notes, connected clinics, and appointments.',
      status: 'Prototype',
      route: '/patient/home',
      actionLabel: 'Open Patient Portal',
    },
  ]

  // Core Intelligence Modules
  const coreModules = [
    {
      title: 'AI Case-Taking',
      subtitle: 'Adaptive conversational history collection',
      desc: 'Engages patient in their preferred language (Hindi, English, Hinglish). Extracts chief complaint, onset, duration, and associated symptoms without giving unsolicited diagnoses.',
      icon: Sparkles,
      tag: 'Gemini 2.5 Flash',
    },
    {
      title: 'Mini AYUSH Assessment',
      subtitle: 'Agni, Ahara, Vihara, Nidra and Mala',
      desc: 'Systematically assesses digestive fire (Mandagni/Tikshnagni/Samagni), sleep quality, bowel regularity, and aggravating lifestyle factors central to traditional medicine triage.',
      icon: HeartPulse,
      tag: 'Clinical Protocol',
    },
    {
      title: 'Prakriti Indicator',
      subtitle: 'Rule-based preliminary wellness indicator',
      desc: 'Deterministic scoring algorithm calculating Vata, Pitta, and Kapha constitutional tendencies. Clearly labeled as a wellness indicator, never a definitive disease diagnosis.',
      icon: Flame,
      tag: 'Deterministic Logic',
    },
    {
      title: 'Document Intelligence',
      subtitle: 'OCR and structured medical information extraction',
      desc: 'Lightweight PDF and image parsing extracting active medications, prior diagnoses, and lab values, automatically synthesizing previous history into the physician summary.',
      icon: FileSpreadsheet,
      tag: 'PDFBox & Gemini',
    },
    {
      title: 'Red-Flag Detection',
      subtitle: 'Safety-focused symptom flagging',
      desc: 'Rule-based safety triage scanning for high-acuity keywords (chest pain, acute breathlessness, sudden numbness, heavy bleeding) to trigger immediate visual clinician warnings.',
      icon: AlertTriangle,
      tag: 'Patient Safety',
    },
    {
      title: 'Doctor Review & Control',
      subtitle: 'AI-generated case remains editable and doctor-verified',
      desc: 'The consulting doctor maintains full clinical authority. AI pre-fills the summary; the physician can edit notes, add observations, and explicitly mark the case as REVIEWED.',
      icon: Stethoscope,
      tag: 'Clinician Authority',
    },
  ]

  // Business Model Subscription Tiers
  const pricingTiers = [
    {
      name: 'STARTER',
      target: 'For solo AYUSH vaidyas and small neighborhood clinics',
      price: '₹999',
      period: '/ month',
      features: [
        'Single MediKiosk terminal pairing',
        'Up to 300 patient intakes / month',
        'AI conversational history preparation',
        'Basic AYUSH & Prakriti profiling',
        'Doctor web triage dashboard',
      ],
      popular: false,
    },
    {
      name: 'CLINIC',
      target: 'For growing AYUSH polyclinics & Panchakarma centres',
      price: '₹2,499',
      period: '/ month',
      features: [
        'Up to 3 MediKiosk terminal pairings',
        'Unlimited patient intakes',
        'Document OCR & prescription structuring',
        'Deterministic red-flag safety alerts',
        'Multi-doctor consultation queue',
        'Patient consultation hand-off & QR tokens',
      ],
      popular: true,
    },
    {
      name: 'PROFESSIONAL',
      target: 'For AYUSH hospitals, research institutes & health networks',
      price: 'Custom',
      period: '',
      features: [
        'Multi-facility deployment oversight',
        'Custom AYUSH clinical form customization',
        'Planned ABHA / ABDM sandbox integration',
        'Dedicated server instance & SLA support',
        'Clinical triage analytics & audit trail',
      ],
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Brand Navigation Bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-base">
                M
              </div>
              <span className="font-serif text-lg font-bold tracking-tight text-foreground">
                MediKiosk
              </span>
            </Link>
            <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-mono">
              Product Overview • Prototype
            </Badge>
          </div>

          <div className="flex items-center space-x-3">
            <Link to="/patient/language">
              <Button size="sm" className="gap-1 text-xs">
                <span>Try Live Kiosk Flow</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Tour Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-16">
        {/* Hero Section */}
        <section className="space-y-4 max-w-3xl">
          <Badge variant="accent" className="font-mono text-xs">
            Healthcare Technology Prototype • SIH26047
          </Badge>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
            From patient story to doctor-ready case.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            MediKiosk is an AI-assisted healthcare case-preparation platform. We structure patient narratives, lifestyle factors, and existing records before the doctor begins the consultation â€” preserving physician time for meaningful clinical care.
          </p>
          <div className="p-3.5 rounded-lg border border-primary/30 bg-primary/5 text-xs text-foreground/90 flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-secondary shrink-0" />
            <span>
              <strong>Core Healthcare Principle:</strong> AI does not diagnose or prescribe. The consulting AYUSH physician remains solely responsible for clinical decisions.
            </span>
          </div>
        </section>

        {/* SECTION 1: COMPLETE PRODUCT JOURNEY TIMELINE */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-border pb-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                End-to-End Architecture
              </span>
              <h2 className="font-serif text-2xl font-bold text-foreground mt-0.5">
                Complete Healthcare Product Journey
              </h2>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              9 Connected Stages • Click "Explore" to test active routes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {journeySteps.map((item) => {
              const isOperational = item.status === 'Operational'

              return (
                <Card
                  key={item.step}
                  className="border-border flex flex-col justify-between hover:border-primary/50 transition-all shadow-2xs"
                >
                  <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                        STAGE {item.step}
                      </span>
                      <Badge
                        variant={isOperational ? 'success' : 'outline'}
                        className="text-[10px] py-0"
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-serif font-bold text-foreground">
                      {item.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 text-xs text-muted-foreground leading-relaxed flex-1">
                    {item.desc}
                  </CardContent>

                  <CardFooter className="p-4 pt-2 border-t border-border flex items-center justify-between bg-muted/5">
                    <code className="font-mono text-[10px] text-muted-foreground">
                      {item.route}
                    </code>

                    {item.isAnchor ? (
                      <a href={item.route}>
                        <Button size="sm" variant="outline" className="text-xs gap-1">
                          <span>{item.actionLabel}</span>
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </a>
                    ) : (
                      <Link to={item.route}>
                        <Button size="sm" variant={isOperational ? 'default' : 'outline'} className="text-xs gap-1">
                          <span>{item.actionLabel}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </section>

        {/* SECTION 2: CORE INTELLIGENCE CAPABILITIES */}
        <section className="space-y-6">
          <div className="border-b border-border pb-4">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Proprietary Clinical Engineering
            </span>
            <h2 className="font-serif text-2xl font-bold text-foreground mt-0.5">
              Core Intelligence Modules
            </h2>
            <p className="text-xs text-muted-foreground">
              What has been built and tested in MediKiosk. No simulated claims or speculative metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coreModules.map((mod, idx) => {
              const Icon = mod.icon

              return (
                <div
                  key={idx}
                  className="p-5 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {mod.tag}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-serif text-base font-bold text-foreground">
                      {mod.title}
                    </h3>
                    <div className="font-mono text-xs text-accent font-medium mt-0.5">
                      {mod.subtitle}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* SECTION 3: FRONTEND-ONLY CLINIC DISCOVERY PREVIEW */}
        <section id="clinics-preview" className="space-y-6 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  Frontend Demonstration Only
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">Mock Directory</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground mt-1">
                Find an AYUSH Clinic • Discovery Preview
              </h2>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              6 Illustrative Demo Clinics across Indian Cities
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_CLINICS.map((clinic) => (
              <Card
                key={clinic.id}
                className="border-border hover:border-primary/50 transition-all flex flex-col justify-between shadow-2xs"
              >
                <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/10">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-serif font-bold text-foreground">
                        {clinic.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] py-0 font-medium">
                          {clinic.ayushSystem}
                        </Badge>
                        <span className="flex items-center text-[11px] font-mono text-foreground font-semibold">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-1 inline" />
                          {clinic.rating} ({clinic.reviewCount})
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] py-0 shrink-0">
                      {clinic.availability}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 text-xs space-y-2 flex-1">
                  <div className="flex items-start gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                    <span>{clinic.address}</span>
                  </div>

                  <div className="p-2 rounded bg-muted/30 border border-border/50 flex items-center justify-between font-mono text-[11px] mt-2">
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Fee</span>
                      <strong className="text-foreground">₹{clinic.consultationFee}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground text-[10px] block">Specialists</span>
                      <span className="font-semibold text-foreground">{clinic.doctorsCount} Doctors</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-2 border-t border-border flex items-center justify-between gap-2 bg-muted/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setDirectionsClinic(clinic)}
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Get Directions</span>
                  </Button>

                  <Link to={`/demo/clinic/${clinic.id}`}>
                    <Button size="sm" className="gap-1 text-xs font-medium">
                      <span>View Clinic</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* SECTION 4: BUSINESS MODEL PREVIEW */}
        <section className="space-y-6">
          <div className="border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">
                Prototype Commercialization
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">SaaS + Service Layer</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground mt-1">
              Built for Healthcare Providers
            </h2>
            <p className="text-xs text-muted-foreground">
              Illustrative pricing model for small AYUSH clinics, polyclinics, and larger hospital networks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`border flex flex-col justify-between transition-all ${
                  tier.popular
                    ? 'border-primary shadow-sm ring-1 ring-primary/40 bg-card'
                    : 'border-border bg-card/60'
                }`}
              >
                <CardHeader className="p-5 pb-3">
                  {tier.popular && (
                    <Badge variant="accent" className="w-fit text-[10px] mb-2">
                      Most Popular for Polyclinics
                    </Badge>
                  )}
                  <CardTitle className="font-serif text-lg font-bold text-foreground">
                    {tier.name}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {tier.target}
                  </CardDescription>
                  <div className="pt-2">
                    <span className="font-serif text-3xl font-extrabold text-foreground">
                      {tier.price}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono"> {tier.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 text-xs space-y-2.5 flex-1">
                  <Separator className="my-2" />
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                    Included Features
                  </span>
                  <ul className="space-y-1.5">
                    {tier.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-foreground/90">
                        <Check className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="p-5 pt-2 border-t border-border bg-muted/5">
                  <Button
                    variant={tier.popular ? 'default' : 'outline'}
                    className="w-full text-xs font-semibold gap-1.5"
                    onClick={() => setSubscriptionModal(tier)}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Demo Subscription</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Business Model Visual Flow */}
          <div className="p-5 rounded-lg border border-border bg-muted/20 space-y-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Proposed Business Model • Prototype Overview
            </span>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-card border border-border text-center flex-1 min-w-[120px]">
                <span className="text-muted-foreground block text-[10px]">Step 1</span>
                <strong className="text-foreground">Patient Intake</strong>
              </div>
              <span className="text-muted-foreground">&rarr;</span>
              <div className="p-2.5 rounded bg-card border border-border text-center flex-1 min-w-[120px]">
                <span className="text-muted-foreground block text-[10px]">Step 2</span>
                <strong className="text-foreground">Doctor Consultation</strong>
              </div>
              <span className="text-muted-foreground">&rarr;</span>
              <div className="p-2.5 rounded bg-card border border-border text-center flex-1 min-w-[120px]">
                <span className="text-muted-foreground block text-[10px]">Step 3</span>
                <strong className="text-foreground">Clinic / Provider</strong>
              </div>
              <span className="text-muted-foreground">&rarr;</span>
              <div className="p-2.5 rounded bg-primary/10 border border-primary/30 text-primary text-center flex-1 min-w-[120px]">
                <span className="text-muted-foreground block text-[10px]">Revenue</span>
                <strong>Subscription + Fee</strong>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
              Revenue generated through monthly hardware-software clinic subscriptions plus a nominal micro-service fee on booked consultations. Clearly designated as a proposed commercialization model for hackathon evaluation.
            </p>
          </div>
        </section>

        {/* SECTION 5: PRODUCT DIFFERENTIATOR */}
        <section className="space-y-4 max-w-4xl">
          <div className="border-b border-border pb-4">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Strategic Value Proposition
            </span>
            <h2 className="font-serif text-2xl font-bold text-foreground mt-0.5">
              Why MediKiosk?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card space-y-1.5">
              <span className="font-mono text-xs text-primary font-bold">01</span>
              <h3 className="font-serif text-base font-bold text-foreground">
                Patient Story &rarr; Structured Case
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Replaces messy handwriting and scattered recollections with a clean, structured clinical narrative organized before the patient sits before the doctor.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card space-y-1.5">
              <span className="font-mono text-xs text-secondary font-bold">02</span>
              <h3 className="font-serif text-base font-bold text-foreground">
                Multilingual + AYUSH-Aware
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Built specifically for Indian healthcare realities. Supports Hindi, English, and Hinglish while capturing classical parameters like Agni, Nidra, and Prakriti.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card space-y-1.5">
              <span className="font-mono text-xs text-accent font-bold">03</span>
              <h3 className="font-serif text-base font-bold text-foreground">
                Doctor Remains in Control
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Zero black-box prescriptions. The AI is strictly an assistant; all clinical diagnoses, observations, and sign-offs are explicitly reviewed and owned by the attending physician.
              </p>
            </div>
          </div>

          <blockquote className="p-4 rounded-md border-l-4 border-primary bg-muted/30 italic text-sm text-foreground/90 leading-relaxed mt-4">
            "MediKiosk does not replace clinical judgement. It prepares the information that helps the doctor spend more time on the patient."
          </blockquote>
        </section>

        {/* SECTION 6: DIRECT LAUNCHPAD */}
        <section className="p-8 rounded-xl border-2 border-primary/30 bg-card text-center space-y-4 shadow-sm">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              Ready to experience MediKiosk?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Test the end-to-end flow from patient intake to doctor case review using actual live backend endpoints.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/patient/language">
              <Button size="lg" className="gap-2 font-semibold">
                <span>Start Patient Kiosk Flow</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/doctor/dashboard">
              <Button size="lg" variant="outline" className="gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <span>Open Doctor Queue</span>
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-border bg-card/60 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-foreground">MediKiosk</span>
            <span>•</span>
            <span>SIH26047 Prototype</span>
            <span>•</span>
            <span className="font-mono text-[11px]">AYUSH Clinical Intakes</span>
          </div>
          <p className="font-serif italic">
            "Your story, structured for better care."
          </p>
        </div>
      </footer>

      {/* Directions Modal (Frontend Mock) */}
      {directionsClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                <h3 className="font-serif font-bold text-base">{directionsClinic.name}</h3>
              </div>
              <button
                onClick={() => setDirectionsClinic(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono"
              >
                âœ•
              </button>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground text-sm">{directionsClinic.name}</strong>
                <br />
                {directionsClinic.address}
              </p>
              <p>
                <strong className="text-foreground">Phone:</strong> {directionsClinic.phone}
              </p>
              <p className="p-2.5 rounded bg-muted/40 font-mono text-[11px] text-foreground">
                Operating Hours: {directionsClinic.openingHours}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(directionsClinic.name + ' ' + directionsClinic.city)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="outline" className="text-xs">
                  Open External Destination
                </Button>
              </a>
              <Button size="sm" variant="default" onClick={() => setDirectionsClinic(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Demo Modal */}
      {subscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="font-serif font-bold text-base">
                  {subscriptionModal.name} Plan • Demo
                </h3>
              </div>
              <button
                onClick={() => setSubscriptionModal(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono"
              >
                âœ•
              </button>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p className="text-foreground font-semibold">
                Simulated Subscription: {subscriptionModal.price} {subscriptionModal.period}
              </p>
              <p>
                This is a prototype demonstration of the MediKiosk SaaS billing tier. No actual payment processing is invoked in this build.
              </p>
              <div className="p-3 bg-muted/40 rounded-md text-[11px] font-mono space-y-1">
                <div>Terminal Provisioning: Simulated Kiosk Token #04</div>
                <div>Plan: {subscriptionModal.name}</div>
                <div>Status: Active Demo Account</div>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-border">
              <Button size="sm" variant="default" onClick={() => setSubscriptionModal(null)}>
                Close Demo Modal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default ProductTour
