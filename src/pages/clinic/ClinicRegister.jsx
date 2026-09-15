import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Sparkles,
  Check,
  HelpCircle,
  Zap,
  Clock,
  Layers
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { MediKioskLogo } from '@/components/common/MediKioskLogo'
import { registerClinic } from '@/lib/clinicAuth'

const AYUSH_SPECIALITIES = [
  'Ayurveda (Classical & Kayachikitsa)',
  'Yoga & Naturopathy',
  'Unani Medicine',
  'Siddha Medicine',
  'Homeopathy',
  'Integrative AYUSH / Polyclinic',
]

export const SUBSCRIPTION_PLANS = [
  {
    id: 'STARTER',
    name: 'Starter',
    tagline: 'Essential tools for getting started',
    priceMonthly: 999,
    priceDisplay: '₹999',
    period: '/ month',
    badge: null,
    isRecommended: false,
    colorAccent: 'text-[#2F7663]',
    icon: Zap,
    features: [
      'Clinic profile',
      'Doctor management',
      'Patient & case overview',
      'Appointment management',
    ],
    limits: {
      doctors: 'Up to 2 Affiliated Doctors',
      terminals: '1 Kiosk Terminal License',
      aiCasePrep: 'Standard Case Summary',
      records: '50 Scanned Records / mo',
      support: 'Standard Email Support',
    },
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    tagline: 'Everything you need for a growing clinic',
    priceMonthly: 2499,
    priceDisplay: '₹2,499',
    period: '/ month',
    badge: 'RECOMMENDED',
    isRecommended: true,
    colorAccent: 'text-[#C97D3D]',
    icon: Sparkles,
    features: [
      'Everything in Starter',
      'Advanced case management',
      'AI-assisted case preparation',
      'Document & report workflow',
      'Priority support',
    ],
    limits: {
      doctors: 'Up to 10 Affiliated Doctors',
      terminals: 'Up to 3 Kiosk Terminals',
      aiCasePrep: 'Full AI-Assisted Clinical Intake',
      records: '500 Scanned Records / mo',
      support: 'Priority Support (Within 2 Hours)',
    },
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    tagline: 'Built for larger healthcare operations',
    priceMonthly: 4999,
    priceDisplay: '₹4,999',
    period: '/ month',
    badge: null,
    isRecommended: false,
    colorAccent: 'text-[#6366F1]',
    icon: Building2,
    features: [
      'Everything in Professional',
      'Multi-doctor workflow',
      'Advanced clinic management',
      'Scalable operations',
      'Dedicated support',
    ],
    limits: {
      doctors: 'Unlimited Doctors',
      terminals: 'Unlimited Terminals',
      aiCasePrep: 'AI + Custom Prakriti Templates',
      records: 'Unlimited Scanned Records',
      support: '24/7 Dedicated Account Manager',
    },
  },
]

export function ClinicRegister() {
  const navigate = useNavigate()

  // Step state: 'details' -> 'plan' -> 'activation'
  const [currentStep, setCurrentStep] = useState('details')
  const [selectedPlanId, setSelectedPlanId] = useState('PROFESSIONAL')
  const [showComparison, setShowComparison] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    adminName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    ayushSpecialization: 'Ayurveda (Classical & Kayachikitsa)',
    password: '',
    confirmPassword: '',
  })

  const [errorMessage, setErrorMessage] = useState('')
  const [registeredClinic, setRegisteredClinic] = useState(null)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrorMessage('')
  }

  // Step 1 Validation & Proceed to Plan Selection
  const handleProceedToPlan = (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!formData.name.trim()) {
      setErrorMessage('Clinic name is required.')
      return
    }

    const cleanPhone = formData.phone.replace(/[^\d]/g, '')
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMessage('A valid 10-digit phone number is required as your clinic login ID.')
      return
    }

    if (!formData.password) {
      setErrorMessage('Password is required.')
      return
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    // Details are valid -> transition to Plan step
    setCurrentStep('plan')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Step 2 Submission: Complete Registration with Selected Plan
  const handleCompleteSubscription = async () => {
    setErrorMessage('')
    setIsSubmitting(true)

    const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[1]

    const now = new Date()
    const renewal = new Date(now)
    renewal.setDate(renewal.getDate() + 30)

    const formatDate = (d) =>
      d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

    const startFormatted = formatDate(now)
    const renewalFormatted = formatDate(renewal)

    const payload = {
      ...formData,
      subscriptionPlan: selectedPlan.name,
      plan: selectedPlan.name,
      subscriptionStatus: 'Active (Demo)',
      subscriptionStartDate: startFormatted,
      subscriptionEndDate: renewalFormatted,
    }

    const res = await registerClinic(payload)
    setIsSubmitting(false)

    if (res.success) {
      setRegisteredClinic(res.clinic)
      setCurrentStep('activation')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setErrorMessage(res.error || 'Registration failed. Please try again.')
    }
  }

  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[1]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-[#CCDCD5] selection:text-[#2F7663]">
      {/* Header */}
      <header className="border-b border-border bg-card/85 backdrop-blur-sm sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <MediKioskLogo size="md" showSubtitle={true} subtitle="Clinic Registration" asLink={true} to="/" />

          <Link to="/clinic/login">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Clinic Login</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Registration Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12">
        {/* Step Progress Pills */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-muted/50 border border-border text-xs font-medium">
            <span
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                currentStep === 'details'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground bg-transparent'
              }`}
            >
              <span>1. Clinic Details</span>
              {currentStep !== 'details' && <Check className="h-3 w-3 text-secondary" />}
            </span>

            <span className="text-muted-foreground/50">›</span>

            <span
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                currentStep === 'plan'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground bg-transparent'
              }`}
            >
              <span>2. Subscription Plan</span>
              {currentStep === 'activation' && <Check className="h-3 w-3 text-secondary" />}
            </span>

            <span className="text-muted-foreground/50">›</span>

            <span
              className={`px-3 py-1 rounded-full transition-all ${
                currentStep === 'activation'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground bg-transparent'
              }`}
            >
              3. Demo Activation
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="max-w-2xl mx-auto mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2.5 shadow-2xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: Enter Clinic Details & Password */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 'details' && (
          <Card className="max-w-2xl mx-auto border-border shadow-xs">
            <CardHeader className="space-y-2 pb-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="font-mono text-[11px]">
                  Private Network
                </Badge>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  Demo Authentication only
                </Badge>
              </div>
              <CardTitle className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                Register Your AYUSH Clinic
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Step 1 of 3: Enter your clinic details and credentials. You will choose your clinic subscription plan next.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleProceedToPlan}>
              <CardContent className="space-y-4">
                {/* Clinic Name & Admin Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      <span>Clinic / Hospital Name *</span>
                    </label>
                    <Input
                      placeholder="e.g. Sanjeevani AYUSH Wellness"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span>Administrator / Owner Name</span>
                    </label>
                    <Input
                      placeholder="e.g. Dr. A. K. Verma"
                      value={formData.adminName}
                      onChange={(e) => handleChange('adminName', e.target.value)}
                    />
                  </div>
                </div>

                {/* Phone (Login ID) & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-accent" />
                        <span>Phone Number (Clinic Login ID) *</span>
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">10 Digits</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                        +91
                      </span>
                      <Input
                        type="tel"
                        placeholder="98765 43210"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="pl-11 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      <span>Clinic Email Address</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="contact@sanjeevaniayush.in"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>
                </div>

                {/* Address & City */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>Address / Street</span>
                    </label>
                    <Input
                      placeholder="e.g. 12, Main Market, Civil Lines"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">City</label>
                    <Input
                      placeholder="e.g. Jaipur"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                    />
                  </div>
                </div>

                {/* AYUSH Services / Speciality */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Primary AYUSH Services & Speciality
                  </label>
                  <select
                    value={formData.ayushSpecialization}
                    onChange={(e) => handleChange('ayushSpecialization', e.target.value)}
                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {AYUSH_SPECIALITIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-primary" />
                      <span>Create Password *</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Confirm Password *
                    </label>
                    <Input
                      type="password"
                      placeholder="Repeat password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className="font-mono"
                      required
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                <Link to="/clinic/login">
                  <Button variant="ghost" type="button" size="sm" className="text-muted-foreground">
                    Already registered? Go to Login
                  </Button>
                </Link>

                <Button type="submit" className="w-full sm:w-auto font-semibold gap-2">
                  <span>Continue to Subscription Plan</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: Choose Subscription Plan (Healthcare SaaS Pricing) */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 'plan' && (
          <div className="space-y-8">
            {/* Header & Supporting Copy */}
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF5F1] text-[#2F7663] text-xs font-semibold border border-[#CCDCD5] shadow-2xs">
                <Sparkles className="h-3 w-3 text-[#C97D3D]" />
                <span>Step 2 of 3 • Clinic Subscription</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                Choose the right plan for your clinic
              </h1>
              <p className="text-sm text-muted-foreground">
                Start with the plan that fits your clinic. You can upgrade later.
              </p>
              <div className="pt-1">
                <span className="inline-block text-[11px] font-mono text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded border border-border">
                  Prototype Demo Pricing • No real payment gateway required
                </span>
              </div>
            </div>

            {/* 3 Attractive Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id
                const isRecommended = plan.isRecommended
                const Icon = plan.icon

                return (
                  <motion.div
                    key={plan.id}
                    layout
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#FAF9F6] border-2 border-[#2F7663] shadow-md ring-2 ring-[#2F7663]/20'
                        : isRecommended
                        ? 'bg-card border-2 border-[#CCDCD5] hover:border-[#2F7663]/60 shadow-xs'
                        : 'bg-card border border-border hover:border-[#CCDCD5] hover:shadow-xs'
                    }`}
                  >
                    {/* RECOMMENDED Badge */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <span className="bg-[#C97D3D] text-white text-[10px] font-bold font-mono uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Top Row: Plan Name & Radio Select Indicator */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#2F7663] text-white'
                                : 'bg-muted/70 text-foreground'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-serif text-lg font-bold text-foreground">
                              {plan.name}
                            </h3>
                          </div>
                        </div>

                        {/* Radio Indicator */}
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-[#2F7663] bg-[#2F7663] text-white'
                              : 'border-muted-foreground/40 bg-card'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Tagline */}
                      <p className="text-xs text-muted-foreground min-h-[32px] leading-relaxed">
                        {plan.tagline}
                      </p>

                      {/* Pricing Display */}
                      <div className="pt-2 pb-3 border-y border-border">
                        <div className="flex items-baseline gap-1">
                          <span className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
                            {plan.priceDisplay}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {plan.period}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground/80 block mt-0.5">
                          Demo / prototype subscription
                        </span>
                      </div>

                      {/* Feature Bullet List */}
                      <div className="space-y-2.5 pt-1">
                        <span className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider font-semibold block">
                          Included Features
                        </span>
                        <ul className="space-y-2 text-xs text-foreground">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-tight">
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#2F7663] shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Bottom Select Pill */}
                    <div className="pt-6">
                      <div
                        className={`w-full py-2 rounded-lg text-xs font-semibold text-center transition-all ${
                          isSelected
                            ? 'bg-[#2F7663] text-white shadow-2xs'
                            : 'bg-muted/60 text-muted-foreground group-hover:text-foreground'
                        }`}
                      >
                        {isSelected ? 'Selected Plan' : 'Choose ' + plan.name}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Compare Plans Expandable Drawer */}
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Layers className="h-3.5 w-3.5 text-[#2F7663]" />
                <span>{showComparison ? 'Hide Plan Comparison' : 'Compare All Plan Limits & Features'}</span>
              </Button>

              <AnimatePresence>
                {showComparison && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-4"
                  >
                    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs overflow-x-auto text-left">
                      <table className="w-full text-xs text-foreground">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground font-mono uppercase text-[11px]">
                            <th className="py-2.5 font-semibold">Capability</th>
                            <th className="py-2.5 font-semibold text-center">Starter (₹999)</th>
                            <th className="py-2.5 font-semibold text-center text-[#2F7663]">Professional (₹2,499)</th>
                            <th className="py-2.5 font-semibold text-center">Enterprise (₹4,999)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          <tr>
                            <td className="py-2.5 font-medium">Affiliated Doctors</td>
                            <td className="py-2.5 text-center text-muted-foreground">Up to 2</td>
                            <td className="py-2.5 text-center font-semibold text-[#2F7663]">Up to 10</td>
                            <td className="py-2.5 text-center font-semibold">Unlimited</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-medium">Kiosk Terminals</td>
                            <td className="py-2.5 text-center text-muted-foreground">1 Terminal</td>
                            <td className="py-2.5 text-center font-semibold text-[#2F7663]">Up to 3 Terminals</td>
                            <td className="py-2.5 text-center font-semibold">Unlimited Terminals</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-medium">AYUSH Intake & Case Prep</td>
                            <td className="py-2.5 text-center text-muted-foreground">Standard Intake</td>
                            <td className="py-2.5 text-center font-semibold text-[#2F7663]">AI-Assisted Case Preparation</td>
                            <td className="py-2.5 text-center font-semibold">Custom Prakriti & AI Templates</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-medium">Scanned Records & OCR</td>
                            <td className="py-2.5 text-center text-muted-foreground">50 Records / mo</td>
                            <td className="py-2.5 text-center font-semibold text-[#2F7663]">500 Records / mo</td>
                            <td className="py-2.5 text-center font-semibold">Unlimited Records</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-medium">Customer Support</td>
                            <td className="py-2.5 text-center text-muted-foreground">Standard Email</td>
                            <td className="py-2.5 text-center font-semibold text-[#2F7663]">Priority Support</td>
                            <td className="py-2.5 text-center font-semibold">24/7 Dedicated Manager</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCurrentStep('details')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="gap-2 text-xs font-semibold w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Clinic Details</span>
              </Button>

              <Button
                type="button"
                onClick={handleCompleteSubscription}
                disabled={isSubmitting}
                className="w-full sm:w-auto font-semibold gap-2 px-8 h-11 bg-[#2F7663] hover:bg-[#256050] text-white shadow-xs"
                size="lg"
              >
                <span>{isSubmitting ? 'Activating Demo Subscription...' : `Continue with ${selectedPlan.name}`}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: Demo Activation & Registration Successful */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 'activation' && (
          <Card className="max-w-2xl mx-auto border-border shadow-xs text-center py-8 px-4 sm:px-8 space-y-6">
            <div className="h-16 w-16 rounded-full bg-[#EBF5F1] text-[#2F7663] border border-[#CCDCD5] flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="h-10 w-10 text-[#2F7663]" />
            </div>

            <div className="space-y-2">
              <Badge variant="outline" className="font-mono text-xs text-[#2F7663] border-[#CCDCD5]">
                Account & Subscription Activated
              </Badge>
              <h1 className="font-serif text-3xl font-bold text-foreground">
                You're all set.
              </h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your MediKiosk clinic account is ready with the{' '}
                <strong className="text-[#2F7663]">{registeredClinic?.subscriptionPlan || selectedPlan.name}</strong> plan.
              </p>
            </div>

            {/* Activation Details Summary Box */}
            <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#CCDCD5] text-left max-w-md mx-auto space-y-3 font-sans text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Clinic Name:</span>
                <strong className="text-foreground font-semibold">{registeredClinic?.name}</strong>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Selected Plan:</span>
                <div className="inline-flex items-center gap-1.5 font-semibold text-[#2F7663]">
                  <Sparkles className="h-3.5 w-3.5 text-[#C97D3D]" />
                  <span>{registeredClinic?.subscriptionPlan || selectedPlan.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">({selectedPlan.priceDisplay}/mo)</span>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Subscription Status:</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active (Demo)</span>
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="font-mono text-foreground font-medium">
                  {registeredClinic?.subscriptionStartDate || '15 Sep 2026'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Renewal Date:</span>
                <span className="font-mono text-foreground font-medium">
                  {registeredClinic?.subscriptionEndDate || '15 Oct 2026'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground">Login Phone (Clinic ID):</span>
                <strong className="font-mono text-primary font-bold">
                  {registeredClinic?.formattedPhone || registeredClinic?.phone}
                </strong>
              </div>
            </div>

            {/* Prototype Notice Box */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border text-center max-w-md mx-auto text-[11px] text-muted-foreground">
              <p>
                <strong>Demo Activation Notice:</strong> No credit card or payment gateway was charged. Your private clinic dashboard and doctor management features are unlocked for prototype evaluation.
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => navigate('/clinic/login', { state: { phone: registeredClinic?.phone } })}
                className="gap-2 font-semibold px-8 h-12 bg-[#2F7663] hover:bg-[#256050] text-white shadow-xs rounded-xl"
                size="lg"
              >
                <span>Go to Clinic Login</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <MediKioskLogo size="sm" showSubtitle={false} asLink={true} to="/" />
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
            <span>Private Healthcare Provider Network</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ClinicRegister