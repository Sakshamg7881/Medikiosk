import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  Stethoscope,
  ArrowRight,
  Sparkles,
  HeartPulse,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Languages,
  Mic,
  Clock,
  Lock,
  ChevronRight,
  Leaf,
  Heart,
  Users,
  MessageSquare,
  Linkedin,
  Youtube,
  Instagram,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MediKioskLogo } from '@/components/common/MediKioskLogo'

export function Home() {
  const [activeStep, setActiveStep] = useState(0)

  // 4-Stage Consultation Flow: 01 ACCESS → 02 INTAKE → 03 STRUCTURE → 04 CARE
  const visualFlow = [
    {
      step: '01',
      stage: 'ACCESS',
      title: 'Share Your Story',
      icon: Mic,
      pastelBg: 'bg-[#EAF3FF]',
      iconColor: 'text-[#2F7663]',
      summary: 'Speak or type in your preferred language. Answer natural follow-up questions.',
      detail: 'Describe how you feel without rigid checkboxes. MediKiosk adapts its follow-up questions to your pace and chief complaints.',
    },
    {
      step: '02',
      stage: 'INTAKE',
      title: 'Smart Intake',
      icon: FileText,
      pastelBg: 'bg-[#E8F5E9]',
      iconColor: 'text-[#2F7663]',
      summary: 'We extract key details, analyze patterns, and include your previous records.',
      detail: 'Captures vital AYUSH dimensions including Agni (digestion), Nidra (sleep), and Prakriti tendencies alongside scanned previous records.',
    },
    {
      step: '03',
      stage: 'STRUCTURE',
      title: 'Structured Case',
      icon: Sparkles,
      pastelBg: 'bg-[#FFF0E7]',
      iconColor: 'text-[#D98A52]',
      summary: 'A clear, organized summary with safety checks and AYUSH context.',
      detail: 'Produces a confidential clinical summary categorized by chief complaint, HPI, and past medical history before your turn.',
    },
    {
      step: '04',
      stage: 'CARE',
      title: 'Better Care',
      icon: Stethoscope,
      pastelBg: 'bg-[#F0ECFF]',
      iconColor: 'text-[#6366F1]',
      summary: 'Your doctor reviews everything before your consultation, saving time for what matters.',
      detail: 'Eliminates repetitive data entry so your attending physician can spend maximum time on personal examination and care.',
    },
  ]

  // Feature items for "Healthcare that listens" section
  const features = [
    {
      icon: MessageSquare,
      title: 'Multi-language Support',
      description: 'Use Hindi, Hinglish or English — whatever feels natural to you.',
      containerBg: 'bg-[#EAF3FF]',
      iconColor: 'text-[#2F7663]',
    },
    {
      icon: Leaf,
      title: 'Prakriti & Holistic Context',
      description: 'Includes traditional insights like digestion (Agni), sleep (Nidra) and lifestyle factors.',
      containerBg: 'bg-[#E8F5E9]',
      iconColor: 'text-[#2F7663]',
    },
    {
      icon: FileText,
      title: 'Upload Records Easily',
      description: 'Share previous prescriptions and lab reports with OCR.',
      containerBg: 'bg-[#F0ECFF]',
      iconColor: 'text-[#6366F1]',
    },
    {
      icon: Clock,
      title: 'More Time with Your Doctor',
      description: 'Arrive with a clear summary, so your doctor can focus on guidance and care.',
      containerBg: 'bg-[#FFF0E7]',
      iconColor: 'text-[#D98A52]',
    },
  ]

  // Patient experience pillars
  const patientPillars = [
    {
      icon: Languages,
      title: 'Tell Your Story in Your Own Words',
      description:
        'Speak or type freely in Hindi, Hinglish, or English. Our adaptive clinical intake listens to your story and asks natural follow-up questions tailored to your specific symptoms.',
      highlight: 'Voice & text enabled',
    },
    {
      icon: HeartPulse,
      title: 'Holistic AYUSH Context & Records',
      description:
        'Upload previous prescriptions and lab reports for instant OCR extraction, and share essential daily health habits like digestion (Agni), sleep (Nidra), and routine wellness indicators.',
      highlight: 'Prakriti & record scan',
    },
    {
      icon: Clock,
      title: 'More Quality Time with Your Doctor',
      description:
        'Arrive at your consultation with your clinical summary already organized. Your doctor receives a clear briefing beforehand, allowing more time for examination, discussion, and advice.',
      highlight: 'Streamlined consultation',
    },
  ]

  return (
    <div className="min-h-screen bg-white text-[#172033] flex flex-col font-sans selection:bg-[#CCDCD5] selection:text-[#2F7663]">
      {/* ========================================================================= */}
      {/* HEADER: Clean White Navigation Bar */}
      {/* ========================================================================= */}
      <header className="border-b border-[#E5E9E6] bg-white/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* MediKiosk Brand Identity */}
          <div className="flex items-center space-x-3">
            <MediKioskLogo
              size="md"
              showSubtitle={true}
              subtitle="Your story, better care."
              asLink={true}
              to="/"
            />
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-[#5F6670]">
            <Link to="/" className="text-[#2F7663] font-semibold transition-colors">
              Home
            </Link>
            <Link to="/patient/login" className="hover:text-[#2F7663] transition-colors">
              For Patients
            </Link>
            <Link to="/provider/login" className="hover:text-[#2F7663] transition-colors">
              For Providers
            </Link>
            <Link to="/patient/privacy" className="hover:text-[#2F7663] transition-colors">
              About
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            <Link to="/provider/login">
              <Button
                variant="outline"
                size="sm"
                className="border-[#E5E9E6] hover:bg-[#F7F9F8] text-[#172033] gap-1.5 text-xs font-medium px-3.5 h-9 rounded-lg shadow-2xs transition-all"
              >
                <Stethoscope className="h-3.5 w-3.5 text-[#2F7663]" />
                <span className="hidden sm:inline">Healthcare Provider Login</span>
                <span className="sm:hidden">Provider</span>
              </Button>
            </Link>

            <Link to="/patient/login">
              <Button
                size="sm"
                className="bg-[#2F7663] hover:bg-[#256050] text-white gap-1.5 text-xs font-semibold px-4 h-9 shadow-xs rounded-lg transition-all"
              >
                <User className="h-3.5 w-3.5" />
                <span>Patient Portal</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION: 2-Column Balanced Health-Tech Layout (Background: #FFFFFF) */}
        {/* ========================================================================= */}
        <section className="bg-white py-10 lg:py-16 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Headline, Badge, Description, CTA, Trust Indicators */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Soft Green Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EBF5F1] border border-[#CCDCD5] text-xs text-[#2F7663] font-medium shadow-2xs">
                <Leaf className="h-3.5 w-3.5 text-[#2F7663]" />
                <span>Digital Clinical Intake & AYUSH Case Preparation</span>
              </div>

              {/* Large Elegant Headline */}
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-[#172033] leading-[1.12]">
                Your story,<br />
                structured for<br />
                <span className="text-[#2F7663]">better care.</span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-[#5F6670] leading-relaxed max-w-xl font-sans">
                MediKiosk listens in your language, organizes your symptoms and past records, and prepares a confidential clinical summary for your consulting AYUSH physician.
              </p>

              {/* Primary CTA Button */}
              <div className="pt-2">
                <Link to="/patient/login">
                  <Button className="bg-[#2F7663] hover:bg-[#256050] text-white px-8 h-12 rounded-full font-semibold text-sm shadow-xs hover:shadow-md transition-all duration-200 gap-2.5">
                    <span>Continue as Patient</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators Strip */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#5F6670] pt-4">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#2F7663]" />
                  <span>Doctor-Supervised Care</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-[#2F7663]" />
                  <span>100% Confidential</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Languages className="h-4 w-4 text-[#D98A52]" />
                  <span>Hindi, Hinglish & English</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Arch + Editorial Statement + Floating Stack */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              {/* Editorial Brand Statement 1: "Same You, A Healthier Tomorrow" */}
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -top-7 left-2 sm:-left-3 z-20 max-w-[calc(100vw-48px)]"
              >
                <div className="relative bg-[#FAF9F6]/95 backdrop-blur-md border border-[#CCDCD5] rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-[0_8px_24px_rgba(31,58,52,0.08)] flex items-center gap-2.5 sm:gap-3 select-text">
                  {/* Delicate Turmeric Accent Bar */}
                  <span className="w-1.5 h-7 rounded-full bg-gradient-to-b from-[#C97D3D] to-[#DC9F6A] shrink-0" aria-hidden="true" />
                  <div className="leading-tight">
                    <span className="font-serif italic text-base sm:text-lg font-normal text-[#1F3A34] tracking-tight block">
                      “Same You,
                    </span>
                    <span className="font-serif italic text-xs sm:text-sm font-semibold text-[#6B8F71] tracking-normal inline-block translate-x-1.5">
                      A Healthier Tomorrow”
                    </span>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-[#EBF5F1] text-[#1F3A34] flex items-center justify-center shrink-0 ml-0.5 border border-[#CCDCD5]/60">
                    <Sparkles className="h-3 w-3 text-[#C97D3D]" />
                  </div>
                </div>
              </motion.div>

              {/* Arch Container with Approved MediKiosk Hero Image */}
              <div className="relative w-full max-w-[340px] sm:max-w-[380px] h-[440px] sm:h-[490px] rounded-t-[190px] rounded-b-[40px] overflow-hidden bg-gradient-to-b from-[#EBF5F1] via-[#F4F9F6] to-[#FAF9F6] border border-[#CCDCD5] shadow-[0_12px_36px_rgba(23,32,51,0.06)]">
                {/* Approved MediKiosk Hero Wellness Portrait */}
                <img
                  src="/images/medikiosk-hero.webp"
                  alt=""
                  aria-hidden="true"
                  onError={(e) => {
                    e.currentTarget.src = '/images/medikiosk-hero.jpg'
                  }}
                  className="w-full h-full object-cover object-[78%_25%] select-none"
                  draggable="false"
                />

                {/* Subtle Decorative Botanical Sprig SVG at bottom-left */}
                <div className="absolute bottom-2 left-2 z-10 pointer-events-none opacity-85">
                  <svg width="72" height="72" viewBox="0 0 100 100" fill="none">
                    <path d="M10 90 C 30 70, 50 60, 80 40" stroke="#2F7663" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M40 75 C 45 60, 65 58, 70 70 C 58 78, 45 80, 40 75 Z" fill="#8FB8A5" opacity="0.75" />
                    <path d="M60 55 C 70 40, 90 42, 88 56 C 76 60, 64 60, 60 55 Z" fill="#2F7663" opacity="0.65" />
                  </svg>
                </div>
              </div>

              {/* Floating Information Cards Stack (Overlapping on Right) */}
              <div className="hidden sm:flex flex-col space-y-3 absolute -right-2 sm:-right-6 top-1/2 -translate-y-1/2 z-20">
                {/* Floating Card 1 */}
                <div className="bg-white/95 backdrop-blur-sm border border-[#E5E9E6] rounded-2xl py-2.5 px-4 shadow-[0_4px_16px_rgba(23,32,51,0.06)] flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#E8F5E9] flex items-center justify-center shrink-0">
                    <Leaf className="h-4 w-4 text-[#2F7663]" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#172033] whitespace-nowrap">
                    Tradition. Technology.<br />Together.
                  </span>
                </div>

                {/* Floating Card 2 */}
                <div className="bg-white/95 backdrop-blur-sm border border-[#E5E9E6] rounded-2xl py-2.5 px-4 shadow-[0_4px_16px_rgba(23,32,51,0.06)] flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#FFF0E7] flex items-center justify-center shrink-0">
                    <Heart className="h-4 w-4 text-[#D98A52]" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#172033] whitespace-nowrap">
                    Your Health<br />Story Matters
                  </span>
                </div>

                {/* Floating Card 3 */}
                <div className="bg-white/95 backdrop-blur-sm border border-[#E5E9E6] rounded-2xl py-2.5 px-4 shadow-[0_4px_16px_rgba(23,32,51,0.06)] flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#F0ECFF] flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-[#6366F1]" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#172033] whitespace-nowrap">
                    Better Conversations<br />Better Care
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. THE MEDIKIOSK FLOW: 4 Modern Cards (Background: #F7F9F8) */}
        {/* ========================================================================= */}
        <section className="bg-[#F7F9F8] border-y border-[#E5E9E6] py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            {/* Section Heading */}
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="font-mono text-xs uppercase tracking-widest text-[#2F7663] font-bold">
                The MediKiosk Flow
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#172033]">
                From Your Story to <span className="text-[#2F7663]">Informed Care</span>
              </h2>
              <p className="text-sm text-[#5F6670]">
                A simple, guided journey designed around you.
              </p>
            </div>

            {/* 4 Connected Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative items-stretch">
              {visualFlow.map((stage, idx) => {
                const Icon = stage.icon
                const isActive = activeStep === idx
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`cursor-pointer rounded-2xl p-6 bg-white border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                      isActive
                        ? 'border-[#2F7663] ring-1 ring-[#2F7663]/30 shadow-md'
                        : 'border-[#E5E9E6] hover:border-[#CCDCD5] hover:shadow-xs'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        {/* Pastel Icon Container */}
                        <div
                          className={`h-11 w-11 rounded-full ${stage.pastelBg} flex items-center justify-center shrink-0`}
                        >
                          <Icon className={`h-5 w-5 ${stage.iconColor}`} />
                        </div>
                        <span className="font-mono text-xs font-bold text-[#5F6670]">
                          {stage.step}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="font-serif text-lg font-bold text-[#172033]">
                          {stage.title}
                        </h3>
                        <p className="text-xs text-[#5F6670] leading-relaxed">
                          {stage.summary}
                        </p>
                      </div>
                    </div>

                    {/* Subtle Accent Progress Bar */}
                    <div
                      className={`h-1 w-full rounded-full transition-colors ${
                        isActive ? 'bg-[#2F7663]' : 'bg-[#E5E9E6]/60'
                      }`}
                    />
                  </div>
                )
              })}
            </div>

            {/* Active Stage Detail Insight Card */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E9E6] shadow-[0_4px_20px_rgba(23,32,51,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-[#EBF5F1] border border-[#CCDCD5] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-[#2F7663]" />
                </div>
                <div>
                  <strong className="text-[#172033] font-semibold text-sm">
                    Stage {visualFlow[activeStep].step} ({visualFlow[activeStep].stage}): {visualFlow[activeStep].title}
                  </strong>
                  <p className="text-[#5F6670] leading-relaxed mt-0.5">
                    {visualFlow[activeStep].detail}
                  </p>
                </div>
              </div>
              <Link to="/patient/login" className="shrink-0 self-end sm:self-center">
                <Button size="sm" variant="outline" className="border-[#E5E9E6] hover:bg-[#F7F9F8] text-[#2F7663] font-semibold text-xs gap-1.5 rounded-lg">
                  <span>Try Intake</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. HEALTHCARE THAT LISTENS (Feature Section: 2 Columns) (Background: #FFFFFF) */}
        {/* ========================================================================= */}
        <section className="bg-white py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Heading + Description + Learn More */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <span className="font-mono text-xs uppercase tracking-widest text-[#2F7663] font-bold">
                Why MediKiosk
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#172033] leading-tight">
                Healthcare<br />
                that <span className="text-[#2F7663]">listens.</span>
              </h2>
              <p className="text-sm sm:text-base text-[#5F6670] leading-relaxed font-sans">
                Combining modern AI with the depth of AYUSH, MediKiosk helps you take a more active role in your health journey.
              </p>
              <div>
                <Link to="/patient/login">
                  <Button
                    variant="outline"
                    className="border-[#E5E9E6] hover:bg-[#F7F9F8] text-[#172033] px-5 h-10 rounded-lg text-xs font-semibold gap-2 shadow-2xs"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: 2x2 Feature Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {features.map((feat, idx) => {
                const Icon = feat.icon
                return (
                  <div
                    key={idx}
                    className="bg-white border border-[#E5E9E6] rounded-2xl p-5 shadow-[0_4px_20px_rgba(23,32,51,0.03)] hover:border-[#CCDCD5] transition-all duration-200 flex items-start gap-4"
                  >
                    {/* Pastel Circle Container */}
                    <div className={`h-11 w-11 rounded-2xl ${feat.containerBg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`h-5 w-5 ${feat.iconColor}`} />
                    </div>

                    <div className="space-y-1 text-left">
                      <h3 className="font-serif text-sm font-bold text-[#172033]">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-[#5F6670] leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. STATS / TRUST STRIP + "Care Without Barriers" (Background: #FFFFFF) */}
        {/* ========================================================================= */}
        <section className="bg-white pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-[#F7F9F8] border border-[#E5E9E6] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_4px_20px_rgba(23,32,51,0.03)]">
              {/* Stats Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 w-full md:w-auto text-left">
                {/* Metric 1 */}
                <div className="space-y-1">
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-[#172033]">
                    1
                  </div>
                  <div className="text-xs text-[#5F6670] leading-snug">
                    Patient Story<br />at a Time
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="space-y-1">
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-[#172033]">
                    3
                  </div>
                  <div className="text-xs text-[#5F6670] leading-snug">
                    Languages<br />Supported
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="space-y-1">
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-[#172033]">
                    100%
                  </div>
                  <div className="text-xs text-[#5F6670] leading-snug">
                    Confidential<br />& Secure
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="space-y-1">
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-[#172033]">
                    ∞
                  </div>
                  <div className="text-xs text-[#5F6670] leading-snug">
                    A Healthier<br />Tomorrow
                  </div>
                </div>
              </div>

              {/* Integrated Brand Statement Card */}
              <div className="w-full md:w-auto shrink-0 md:pl-8 md:border-l md:border-[#E5E9E6] flex items-center justify-start md:justify-end">
                <div className="bg-white border border-[#E5E9E6] rounded-xl px-5 py-3.5 shadow-2xs flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#EBF5F1] text-[#2F7663] flex items-center justify-center shrink-0">
                    <HeartPulse className="h-4 w-4 text-[#2F7663]" />
                  </div>
                  <div>
                    <p className="font-serif text-sm sm:text-base font-semibold text-[#172033] leading-snug">
                      Your health story,
                    </p>
                    <p className="text-xs sm:text-sm text-[#2F7663] font-medium leading-tight">
                      heard clearly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. AYUSH / VISION SECTION: Traditional Wisdom + Modern Tech */}
        {/* ========================================================================= */}
        <section className="bg-white py-14 lg:py-18">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Approved Ayurvedic Nature Landscape + Editorial Callout Card */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-start">
              <div className="relative w-full max-w-[340px] sm:max-w-[380px]">
                {/* Approved MediKiosk Nature Sunrise Landscape Arch */}
                <div className="w-full h-64 sm:h-76 rounded-t-[160px] rounded-b-[32px] overflow-hidden border border-[#CCDCD5] shadow-[0_8px_24px_rgba(23,32,51,0.05)] bg-[#EBF5F1]">
                  <img
                    src="/images/medikiosk-nature.webp"
                    alt=""
                    aria-hidden="true"
                    onError={(e) => {
                      e.currentTarget.src = '/images/medikiosk-nature.jpg'
                    }}
                    className="w-full h-full object-cover object-center select-none"
                    draggable="false"
                  />
                </div>

                {/* Editorial Brand Statement 2: "Rooted in Wisdom. Built for What's Next." */}
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 'some' }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute -right-2 sm:-right-4 -bottom-4 sm:-bottom-5 z-20 max-w-[calc(100vw-48px)]"
                >
                  <div className="bg-[#FAF9F6]/95 backdrop-blur-md border border-[#CCDCD5] rounded-2xl p-3.5 sm:p-4 shadow-[0_8px_24px_rgba(31,58,52,0.09)] flex items-center gap-3 select-text max-w-[250px] sm:max-w-[270px]">
                    <div className="w-8 h-8 rounded-xl bg-[#EBF5F1] text-[#1F3A34] border border-[#CCDCD5]/70 flex items-center justify-center shrink-0 shadow-2xs">
                      <Leaf className="h-4 w-4 text-[#1F3A34]" />
                    </div>
                    <div className="space-y-0.5 leading-snug">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C97D3D] shrink-0" aria-hidden="true" />
                        <span className="font-serif italic text-xs sm:text-sm font-semibold text-[#1F3A34] tracking-tight">
                          Rooted in Wisdom.
                        </span>
                      </div>
                      <span className="font-sans text-[11px] sm:text-xs font-medium text-[#6B8F71] tracking-wide block pl-3">
                        Built for What’s Next.
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right Column: Title + Description + CTA + Quote Card */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <span className="font-mono text-xs uppercase tracking-widest text-[#2F7663] font-bold">
                Our Vision
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#172033] leading-tight">
                Bridging Traditional Wisdom and Modern Technology
              </h2>
              <p className="text-sm sm:text-base text-[#5F6670] leading-relaxed font-sans">
                MediKiosk makes holistic healthcare more accessible, personalized, and proactive — for everyone.
              </p>

              <div>
                <Link to="/patient/login">
                  <Button className="bg-[#2F7663] hover:bg-[#256050] text-white px-7 h-11 rounded-full font-semibold text-xs shadow-xs transition-all duration-200 gap-2">
                    <span>Be Part of the Change</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Elegant Quote Card */}
              <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E9E6] shadow-2xs relative mt-4 max-w-lg">
                <span className="font-serif text-3xl text-[#2F7663]/30 leading-none block select-none">
                  “
                </span>
                <p className="font-serif italic text-sm text-[#172033] mt-1 leading-relaxed">
                  Better information leads to better conversations, and better care.
                </p>
                <div className="flex justify-end mt-2">
                  <Leaf className="h-4 w-4 text-[#8FB8A5]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. PATIENT EXPERIENCE PILLARS (Background: #F7F9F8) */}
        {/* ========================================================================= */}
        <section className="bg-[#F7F9F8] border-t border-[#E5E9E6] py-14 lg:py-18">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-1.5 max-w-xl mx-auto">
              <span className="font-mono text-xs uppercase tracking-widest text-[#2F7663] font-bold">
                Patient Experience
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#172033]">
                Designed for Dignified, Clear Care
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {patientPillars.map((pillar, idx) => {
                const Icon = pillar.icon
                return (
                  <div
                    key={idx}
                    className="flex flex-col justify-between bg-white border border-[#E5E9E6] rounded-2xl p-6 shadow-[0_4px_20px_rgba(23,32,51,0.03)] hover:border-[#CCDCD5] hover:shadow-xs transition-all space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-10 w-10 rounded-xl bg-[#EBF5F1] text-[#2F7663] flex items-center justify-center">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-mono text-[#2F7663] bg-[#EBF5F1] border border-[#CCDCD5] px-2 py-0.5 rounded-full font-medium">
                          {pillar.highlight}
                        </span>
                      </div>
                      <h3 className="text-base font-bold font-serif text-[#172033] leading-snug">
                        {pillar.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[#5F6670] leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* FOOTER: Modern Clean White Health-Tech Footer */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#E5E9E6] bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Logo + Slogan */}
            <div className="flex items-center space-x-3">
              <MediKioskLogo size="sm" showSubtitle={false} asLink={true} to="/" />
              <span className="text-xs text-[#5F6670] font-sans pl-3 border-l border-[#E5E9E6]">
                Your story, better care.
              </span>
            </div>

            {/* Nav Links */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-[#5F6670]">
              <Link to="/patient/login" className="hover:text-[#2F7663] transition-colors">
                For Patients
              </Link>
              <Link to="/patient/privacy" className="hover:text-[#2F7663] transition-colors">
                Privacy
              </Link>
              <Link to="/provider/login" className="hover:text-[#2F7663] transition-colors">
                For Providers
              </Link>
              <Link to="/patient/privacy" className="hover:text-[#2F7663] transition-colors">
                About
              </Link>
            </div>

            {/* Social Icons */}
            <div className="flex items-center space-x-4 text-[#5F6670]">
              <a href="#" className="hover:text-[#2F7663] transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="hover:text-[#2F7663] transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="#" className="hover:text-[#2F7663] transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="border-t border-[#E5E9E6]" />

          {/* Bottom Copyright and Clinical Guardrail Notice */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#5F6670] gap-3">
            <p className="text-left">
              MediKiosk digital clinical intake assists AYUSH healthcare facilities. Diagnosis, physical examination, and treatment remain under the sole authority of the consulting physician.
            </p>
            <span className="font-mono text-[11px] shrink-0">
              © 2026 MediKiosk. Built for better care, together.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
