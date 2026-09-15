// Clinic Authentication & Private Session Management
// NOTE: Demo Authentication only (Prototype Simulation)
// For demonstration and kiosk testing only - not production authentication.

import { DEMO_CLINICS, DEMO_DOCTORS } from '@/data/clinicsData'

const REGISTERED_CLINICS_KEY = 'medikiosk_registered_clinics'
const CLINIC_SESSION_KEY = 'medikiosk_clinic_session'
const CLINIC_DOCTORS_PREFIX = 'medikiosk_clinic_doctors_'
const CLINIC_CASES_PREFIX = 'medikiosk_clinic_cases_'

// Default seed clinic for quick login testing
export const DEFAULT_DEMO_CLINIC = {
  id: 1,
  clinicId: 1,
  name: 'Aarogyam AYUSH Care',
  clinicName: 'Aarogyam AYUSH Care',
  adminName: 'Dr. Ramesh Sharma',
  phone: '9876543210',
  formattedPhone: '+91 98765 43210',
  email: 'admin@aarogyam.in',
  address: '12 Health Park, Ring Road',
  city: 'New Delhi',
  ayushSpecialization: 'Ayurveda & Panchakarma',
  password: 'clinic123',
  type: 'Private AYUSH Clinic',
  registeredAt: '2026-09-01T10:00:00.000Z',
  activeTerminals: 2,
  subscriptionPlan: 'Professional',
  plan: 'Professional',
  subscriptionStatus: 'Active (Demo)',
  subscriptionStartDate: '01 Sep 2026',
  subscriptionEndDate: '01 Oct 2026',
}

// Clean phone digits for matching
export function normalizePhone(phone) {
  if (!phone) return ''
  return String(phone).replace(/[^\d]/g, '').slice(-10)
}

// Initialize seed clinics in storage
export function getRegisteredClinics() {
  try {
    const data = localStorage.getItem(REGISTERED_CLINICS_KEY)
    if (data) {
      const list = JSON.parse(data)
      if (Array.isArray(list) && list.length > 0) {
        return list
      }
    }
  } catch (e) {
    console.warn('Error reading registered clinics:', e)
  }

  // Seed default demo clinic
  const initial = [DEFAULT_DEMO_CLINIC]
  try {
    localStorage.setItem(REGISTERED_CLINICS_KEY, JSON.stringify(initial))
  } catch {}
  return initial
}

/**
 * Register a new clinic.
 * Phone number is used as the clinic's unique login ID.
 * Calls backend POST /api/clinics with local fallback.
 */
export async function registerClinic(formData) {
  const normPhone = normalizePhone(formData.phone)
  if (!normPhone || normPhone.length !== 10) {
    return { success: false, error: 'Please enter a valid 10-digit phone number.' }
  }

  if (!formData.name?.trim()) {
    return { success: false, error: 'Clinic name is required.' }
  }

  if (!formData.password || formData.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' }
  }

  if (formData.password !== formData.confirmPassword) {
    return { success: false, error: 'Passwords do not match.' }
  }

  // Try backend first
  try {
    const res = await fetch('/api/clinics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name.trim(),
        adminName: formData.adminName?.trim() || 'Clinic Administrator',
        phone: normPhone,
        email: formData.email?.trim() || '',
        address: formData.address?.trim() || '',
        city: formData.city?.trim() || '',
        ayushSpecialization: formData.ayushSpecialization || 'Ayurveda',
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        subscriptionPlan: formData.subscriptionPlan || formData.plan || 'Professional',
        plan: formData.subscriptionPlan || formData.plan || 'Professional',
        subscriptionStatus: formData.subscriptionStatus || 'Active (Demo)',
        subscriptionStartDate: formData.subscriptionStartDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        subscriptionEndDate: formData.subscriptionEndDate || new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      }),
    })

    if (res.ok) {
      const backendClinic = await res.json()
      const enrichedClinic = {
        ...backendClinic,
        subscriptionPlan: backendClinic.subscriptionPlan || formData.subscriptionPlan || 'Professional',
        plan: backendClinic.plan || formData.subscriptionPlan || 'Professional',
        subscriptionStatus: backendClinic.subscriptionStatus || formData.subscriptionStatus || 'Active (Demo)',
        subscriptionStartDate: backendClinic.subscriptionStartDate || formData.subscriptionStartDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        subscriptionEndDate: backendClinic.subscriptionEndDate || formData.subscriptionEndDate || new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        formattedPhone: backendClinic.formattedPhone || `+91 ${normPhone.slice(0, 5)} ${normPhone.slice(5)}`,
      }
      // Cache locally
      const clinics = getRegisteredClinics()
      const idx = clinics.findIndex(c => normalizePhone(c.phone) === normPhone)
      if (idx !== -1) {
        clinics[idx] = enrichedClinic
      } else {
        clinics.push(enrichedClinic)
      }
      localStorage.setItem(REGISTERED_CLINICS_KEY, JSON.stringify(clinics))
      return { success: true, clinic: enrichedClinic }
    } else {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.error || 'Failed to register clinic on server.' }
    }
  } catch (netErr) {
    console.warn('Backend offline, using local registration fallback:', netErr)
  }

  // Local fallback
  const clinics = getRegisteredClinics()
  const existing = clinics.find(c => normalizePhone(c.phone) === normPhone)
  if (existing) {
    return { success: false, error: 'A clinic is already registered with this phone number.' }
  }

  const newClinic = {
    id: 'c_' + Date.now(),
    name: formData.name.trim(),
    adminName: formData.adminName?.trim() || 'Clinic Administrator',
    phone: normPhone,
    formattedPhone: `+91 ${normPhone.slice(0, 5)} ${normPhone.slice(5)}`,
    email: formData.email?.trim() || '',
    address: formData.address?.trim() || '',
    city: formData.city?.trim() || '',
    ayushSpecialization: formData.ayushSpecialization || 'Ayurveda',
    password: formData.password,
    type: 'Private AYUSH Clinic',
    registeredAt: new Date().toISOString(),
    activeTerminals: 1,
    subscriptionPlan: formData.subscriptionPlan || formData.plan || 'Professional',
    plan: formData.subscriptionPlan || formData.plan || 'Professional',
    subscriptionStatus: formData.subscriptionStatus || 'Active (Demo)',
    subscriptionStartDate: formData.subscriptionStartDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    subscriptionEndDate: formData.subscriptionEndDate || new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  }

  clinics.push(newClinic)
  try {
    localStorage.setItem(REGISTERED_CLINICS_KEY, JSON.stringify(clinics))
  } catch (e) {
    return { success: false, error: 'Storage quota exceeded. Unable to register.' }
  }

  return { success: true, clinic: newClinic }
}

/**
 * Clinic Login using Phone Number + Password.
 * Calls backend POST /api/clinics/login with local fallback.
 */
export async function loginClinic(phone, password) {
  const normPhone = normalizePhone(phone)
  if (!normPhone) {
    return { success: false, error: 'Please enter your registered phone number.' }
  }
  if (!password) {
    return { success: false, error: 'Please enter your password.' }
  }

  // Try backend first
  try {
    const res = await fetch('/api/clinics/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normPhone, password }),
    })

    if (res.ok) {
      const data = await res.json()
      const localClinics = getRegisteredClinics()
      const localCached = localClinics.find(c => normalizePhone(c.phone) === normPhone) || {}
      const sessionData = {
        ...localCached,
        ...data,
        subscriptionPlan: data.subscriptionPlan || data.plan || localCached.subscriptionPlan || 'Professional',
        plan: data.plan || data.subscriptionPlan || localCached.plan || 'Professional',
        subscriptionStatus: data.subscriptionStatus || localCached.subscriptionStatus || 'Active (Demo)',
        subscriptionStartDate: data.subscriptionStartDate || localCached.subscriptionStartDate || '01 Sep 2026',
        subscriptionEndDate: data.subscriptionEndDate || localCached.subscriptionEndDate || '01 Oct 2026',
        isDemoAuth: true,
        loggedInAt: new Date().toISOString(),
      }
      sessionStorage.setItem(CLINIC_SESSION_KEY, JSON.stringify(sessionData))
      localStorage.setItem(CLINIC_SESSION_KEY, JSON.stringify(sessionData))
      return { success: true, clinic: sessionData }
    } else {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.error || 'Invalid clinic phone number or password.' }
    }
  } catch (netErr) {
    console.warn('Backend offline, using local login fallback:', netErr)
  }

  // Local fallback
  const clinics = getRegisteredClinics()
  const clinic = clinics.find(c => normalizePhone(c.phone) === normPhone)

  if (!clinic) {
    return { success: false, error: 'No clinic found with this phone number. Please register first.' }
  }

  if (clinic.password !== password) {
    return { success: false, error: 'Incorrect password. Please try again.' }
  }

  const sessionData = {
    ...clinic,
    subscriptionPlan: clinic.subscriptionPlan || clinic.plan || 'Professional',
    plan: clinic.plan || clinic.subscriptionPlan || 'Professional',
    subscriptionStatus: clinic.subscriptionStatus || 'Active (Demo)',
    subscriptionStartDate: clinic.subscriptionStartDate || '01 Sep 2026',
    subscriptionEndDate: clinic.subscriptionEndDate || '01 Oct 2026',
    loggedInAt: new Date().toISOString(),
    isDemoAuth: true,
  }

  try {
    sessionStorage.setItem(CLINIC_SESSION_KEY, JSON.stringify(sessionData))
    localStorage.setItem(CLINIC_SESSION_KEY, JSON.stringify(sessionData))
  } catch {}

  return { success: true, clinic: sessionData }
}

/**
 * Retrieve current authenticated clinic session.
 */
export function getClinicSession() {
  try {
    const s = sessionStorage.getItem(CLINIC_SESSION_KEY) || localStorage.getItem(CLINIC_SESSION_KEY)
    if (s) {
      return JSON.parse(s)
    }
  } catch {}
  return null
}

/**
 * Log out current clinic session.
 */
export function logoutClinic() {
  try {
    sessionStorage.removeItem(CLINIC_SESSION_KEY)
    localStorage.removeItem(CLINIC_SESSION_KEY)
  } catch {}
}

/**
 * Update clinic profile information.
 */
export async function updateClinicProfile(updatedClinic) {
  if (!updatedClinic || !updatedClinic.id) return false

  try {
    await fetch(`/api/clinics/${updatedClinic.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedClinic),
    })
  } catch (e) {
    console.warn('Backend update failed, using local update:', e)
  }

  const clinics = getRegisteredClinics()
  const idx = clinics.findIndex(c => String(c.id) === String(updatedClinic.id))
  if (idx !== -1) {
    clinics[idx] = { ...clinics[idx], ...updatedClinic }
    try {
      localStorage.setItem(REGISTERED_CLINICS_KEY, JSON.stringify(clinics))
      const session = getClinicSession()
      if (session && String(session.id) === String(updatedClinic.id)) {
        const newSession = { ...session, ...updatedClinic }
        sessionStorage.setItem(CLINIC_SESSION_KEY, JSON.stringify(newSession))
        localStorage.setItem(CLINIC_SESSION_KEY, JSON.stringify(newSession))
      }
    } catch {}
    return true
  }
  return false
}

/**
 * Get doctors strictly scoped to a specific clinicId.
 */
export async function getClinicDoctors(clinicId) {
  if (!clinicId) return []

  try {
    const res = await fetch(`/api/clinics/${clinicId}/doctors`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        return data
      }
    }
  } catch (e) {
    console.warn('Error fetching clinic doctors from API:', e)
  }

  // Local fallback
  const baseDoctors = DEMO_DOCTORS.filter(d => String(d.clinicId) === String(clinicId))
  try {
    const custom = localStorage.getItem(`${CLINIC_DOCTORS_PREFIX}${clinicId}`)
    if (custom) {
      const customList = JSON.parse(custom)
      if (Array.isArray(customList)) {
        return [...baseDoctors, ...customList]
      }
    }
  } catch {}
  return baseDoctors
}

/**
 * Add a doctor strictly scoped to a specific clinicId.
 */
export async function addClinicDoctor(clinicId, doctorData) {
  if (!clinicId || !doctorData.name?.trim()) return null

  try {
    const res = await fetch(`/api/clinics/${clinicId}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: doctorData.name.trim(),
        phone: normalizePhone(doctorData.phone) || ('98765' + Math.floor(10000 + Math.random() * 90000)),
        password: doctorData.password || 'doc123',
        qualification: doctorData.qualification || 'BAMS, MD',
        speciality: doctorData.speciality || doctorData.specialization || 'General AYUSH Consultation',
        consultationFee: String(doctorData.consultationFee || 500),
        experience: doctorData.experience || '5+ Years Experience',
        availability: doctorData.availableDays || 'Mon - Sat (10:00 AM - 04:00 PM)',
      }),
    })

    if (res.ok) {
      const savedDoc = await res.json()
      return savedDoc
    }
  } catch (e) {
    console.warn('Backend add doctor failed, using local storage:', e)
  }

  // Local fallback
  const newDoc = {
    id: 'doc_' + Date.now(),
    clinicId: clinicId,
    clinicName: doctorData.clinicName || 'Clinic Doctor',
    name: doctorData.name.trim(),
    phone: normalizePhone(doctorData.phone) || '9876500099',
    qualification: doctorData.qualification || 'BAMS, MD',
    speciality: doctorData.speciality || doctorData.specialization || 'General Consultation',
    experience: doctorData.experience || '5+ Years Experience',
    consultationFee: Number(doctorData.consultationFee) || 500,
    availability: doctorData.availableDays || 'Mon - Sat',
    active: true,
  }

  try {
    const key = `${CLINIC_DOCTORS_PREFIX}${clinicId}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    existing.push(newDoc)
    localStorage.setItem(key, JSON.stringify(existing))
  } catch (e) {
    console.warn('Error saving clinic doctor locally:', e)
  }

  return newDoc
}

/**
 * Get patient cases strictly filtered to this clinic.
 */
export async function getClinicScopedCases(clinicId) {
  if (!clinicId) return []

  try {
    const res = await fetch(`/api/clinics/${clinicId}/cases`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        return data
      }
    }
  } catch (e) {
    console.warn('Error fetching clinic cases from API:', e)
  }

  let customCases = []
  try {
    const raw = localStorage.getItem(`${CLINIC_CASES_PREFIX}${clinicId}`)
    if (raw) customCases = JSON.parse(raw)
  } catch {}

  return customCases
}

/**
 * Get clinic appointments strictly filtered to this clinic.
 */
export async function getClinicAppointments(clinicId) {
  if (!clinicId) return []

  try {
    const res = await fetch(`/api/clinics/${clinicId}/appointments`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        return data
      }
    }
  } catch (e) {
    console.warn('Error fetching clinic appointments from API:', e)
  }

  return []
}
