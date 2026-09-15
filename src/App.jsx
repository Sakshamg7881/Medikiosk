import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'

// Layouts
import { PatientLayout } from '@/layouts/PatientLayout'
import { ClinicLayout } from '@/layouts/ClinicLayout'
import { DoctorLayout } from '@/layouts/DoctorLayout'

// Main Pages
import { Home } from '@/pages/Home'

// Demo Showcase Pages
import { ProductTour } from '@/pages/demo/ProductTour'
import { DemoClinicDetail } from '@/pages/demo/DemoClinicDetail'
import { DemoDoctorProfile } from '@/pages/demo/DemoDoctorProfile'
import { DemoConsultationPrep } from '@/pages/demo/DemoConsultationPrep'

// Clinic Pages
import { ClinicLogin } from '@/pages/clinic/ClinicLogin'
import { ClinicRegister } from '@/pages/clinic/ClinicRegister'
import { ClinicDashboard } from '@/pages/clinic/ClinicDashboard'

// Doctor Pages
import { DoctorLogin } from '@/pages/doctor/DoctorLogin'
import { DoctorDashboard } from '@/pages/doctor/DoctorDashboard'
import { DoctorCaseReview } from '@/pages/doctor/DoctorCaseReview'

// Patient Pages
import { PatientLanguage } from '@/pages/patient/PatientLanguage'
import { PatientLogin } from '@/pages/patient/PatientLogin'
import { PatientConsent } from '@/pages/patient/PatientConsent'
import { PatientAssessment } from '@/pages/patient/PatientAssessment'
import { PatientDocuments } from '@/pages/patient/PatientDocuments'
import { PatientSummary } from '@/pages/patient/PatientSummary'
import { PatientExport } from '@/pages/patient/PatientExport'
import { PatientHome } from '@/pages/patient/PatientHome'
import { PatientClinics } from '@/pages/patient/PatientClinics'
import { PatientClinicDetail } from '@/pages/patient/PatientClinicDetail'
import { PatientDoctorProfile } from '@/pages/patient/PatientDoctorProfile'
import { PatientConsultationPrep } from '@/pages/patient/PatientConsultationPrep'
import { PatientCases } from '@/pages/patient/PatientCases'
import { PatientAppointments } from '@/pages/patient/PatientAppointments'
import { PatientPrivacy } from '@/pages/patient/PatientPrivacy'
import { PatientBooking } from '@/pages/patient/PatientBooking'
import { PatientAppointmentConfirmation } from '@/pages/patient/PatientAppointmentConfirmation'

import { IntroSplash } from '@/components/common/IntroSplash'

// Provider Access Page
import { ProviderLogin } from '@/pages/provider/ProviderLogin'

export default function App() {
  return (
    <ThemeProvider>
      {/* Root Welcome Splash — Runs only on full document load / refresh of root URL */}
      <IntroSplash />
      <Routes>
        {/* 1. Home Portal */}
        <Route path="/" element={<Home />} />

        {/* Dedicated Healthcare Provider Gateway */}
        <Route path="/provider" element={<ProviderLogin />} />
        <Route path="/provider/login" element={<ProviderLogin />} />
        <Route path="/provider/login/clinic" element={<ClinicLogin />} />
        <Route path="/provider/login/doctor" element={<DoctorLogin />} />

        {/* 2. Demo Showcase Routes */}
        <Route path="/demo" element={<ProductTour />} />
        <Route path="/demo/clinic/:clinicId" element={<DemoClinicDetail />} />
        <Route path="/demo/doctor/:doctorId" element={<DemoDoctorProfile />} />
        <Route path="/demo/consultation/:doctorId" element={<DemoConsultationPrep />} />

        {/* 3. Clinic Routes */}
        <Route path="/clinic" element={<ClinicLayout />}>
          <Route index element={<Navigate to="/clinic/login" replace />} />
          <Route path="login" element={<ClinicLogin />} />
          <Route path="register" element={<ClinicRegister />} />
          <Route path="dashboard" element={<ClinicDashboard />} />
        </Route>

        {/* 4. Doctor Routes */}
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="case/:caseId" element={<DoctorCaseReview />} />
        </Route>

        {/* 5. Patient Routes */}
        <Route path="/patient" element={<PatientLayout />}>
          <Route path="language" element={<Navigate to="/patient/login" replace />} />
          <Route path="login" element={<PatientLogin />} />
          <Route path="consent" element={<PatientConsent />} />
          <Route path="assessment" element={<PatientAssessment />} />
          <Route path="documents" element={<PatientDocuments />} />
          <Route path="summary" element={<PatientSummary />} />
          <Route path="export" element={<PatientExport />} />
          <Route path="home" element={<PatientHome />} />
          <Route path="clinics" element={<PatientClinics />} />
          <Route path="clinic/:clinicId" element={<PatientClinicDetail />} />
          <Route path="doctor/:doctorId" element={<PatientDoctorProfile />} />
          <Route path="consultation/:doctorId" element={<PatientConsultationPrep />} />
          <Route path="cases" element={<PatientCases />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="book" element={<PatientBooking />} />
          <Route path="book/:doctorId" element={<PatientBooking />} />
          <Route path="appointment-confirmation/:appointmentId" element={<PatientAppointmentConfirmation />} />
          <Route path="privacy" element={<PatientPrivacy />} />
        </Route>

        {/* Fallback to Home */}
        <Route path="*" element={<Home />} />
      </Routes>
    </ThemeProvider>
  )
}
