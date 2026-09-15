// Doctor Authentication & Private Session Management
// NOTE: Demo Authentication only (Prototype Simulation)
// For demonstration and kiosk testing only - not production authentication.

const DOCTOR_SESSION_KEY = 'medikiosk_doctor_session';

export const DEFAULT_DEMO_DOCTOR = {
  id: 1,
  doctorId: 1,
  name: 'Dr. Ananya Iyer',
  doctorName: 'Dr. Ananya Iyer',
  phone: '9876500001',
  password: 'doc123',
  qualification: 'BAMS, MD (Ayurveda)',
  speciality: 'Kayachikitsa (Internal Medicine)',
  clinicId: 1,
  clinicName: 'Aarogyam AYUSH Care',
  experience: '8 Years Experience',
  consultationFee: '500',
  isDemoAuth: true,
};

export function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^\d]/g, '').slice(-10);
}

/**
 * Doctor login via backend API with fallback.
 */
export async function loginDoctor(phone, password) {
  const normPhone = normalizePhone(phone);
  if (!normPhone) {
    return { success: false, error: 'Please enter your registered phone number.' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your password.' };
  }

  try {
    const res = await fetch('/api/doctors/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normPhone, password }),
    });

    if (res.ok) {
      const data = await res.json();
      const sessionData = {
        ...data,
        isDemoAuth: true,
        loggedInAt: new Date().toISOString(),
      };
      sessionStorage.setItem(DOCTOR_SESSION_KEY, JSON.stringify(sessionData));
      localStorage.setItem(DOCTOR_SESSION_KEY, JSON.stringify(sessionData));
      return { success: true, doctor: sessionData };
    } else {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Invalid doctor phone number or password.' };
    }
  } catch (netErr) {
    console.warn('Doctor login network fallback:', netErr);
    // Offline / Demo Fallback
    if (normPhone === '9876500001' && password === 'doc123') {
      const sessionData = {
        ...DEFAULT_DEMO_DOCTOR,
        loggedInAt: new Date().toISOString(),
      };
      sessionStorage.setItem(DOCTOR_SESSION_KEY, JSON.stringify(sessionData));
      localStorage.setItem(DOCTOR_SESSION_KEY, JSON.stringify(sessionData));
      return { success: true, doctor: sessionData };
    }
    return { success: false, error: 'Unable to connect to authentication server. Please check backend.' };
  }
}

/**
 * Get active doctor session.
 */
export function getDoctorSession() {
  try {
    const s = sessionStorage.getItem(DOCTOR_SESSION_KEY) || localStorage.getItem(DOCTOR_SESSION_KEY);
    if (s) {
      return JSON.parse(s);
    }
  } catch (e) {
    console.warn('Error reading doctor session:', e);
  }
  return null;
}

/**
 * Logout doctor.
 */
export function logoutDoctor() {
  try {
    sessionStorage.removeItem(DOCTOR_SESSION_KEY);
    localStorage.removeItem(DOCTOR_SESSION_KEY);
  } catch {}
}

/**
 * Fetch doctor scoped cases.
 */
export async function getDoctorScopedCases(doctorId) {
  if (!doctorId) return [];
  try {
    const res = await fetch(`/api/doctors/${doctorId}/cases`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Error fetching doctor cases from API:', e);
  }
  return [];
}

/**
 * Fetch doctor scoped appointments.
 */
export async function getDoctorScopedAppointments(doctorId) {
  if (!doctorId) return [];
  try {
    const res = await fetch(`/api/doctors/${doctorId}/appointments`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Error fetching doctor appointments from API:', e);
  }
  return [];
}
