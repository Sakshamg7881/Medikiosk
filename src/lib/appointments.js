import { getPatientSession } from '@/lib/session'

const APPOINTMENTS_STORAGE_KEY = 'medikiosk_appointments'
const API_BASE = '/api/appointments'

// Initial seed appointments for realistic presentation
const SEED_APPOINTMENTS = [
  {
    id: 101,
    caseId: 1,
    patientId: 1,
    doctorId: 101,
    clinicId: 'c1',
    date: '14 Sep 2026',
    time: '10:30 AM',
    consultationType: 'First Consultation',
    status: 'CONFIRMED',
    consultationToken: 'TK-01',
    patientName: 'Ramesh Chandra',
    doctorName: 'Dr. Rajesh Vaidya',
    clinicName: 'Ayush Arogya Kendra (Delhi)',
    createdAt: '2026-09-13T10:30:00',
  },
  {
    id: 102,
    caseId: 2,
    patientId: 2,
    doctorId: 101,
    clinicId: 'c1',
    date: '14 Sep 2026',
    time: '11:15 AM',
    consultationType: 'Follow-up',
    status: 'CONFIRMED',
    consultationToken: 'TK-02',
    patientName: 'Meera Sharma',
    doctorName: 'Dr. Rajesh Vaidya',
    clinicName: 'Ayush Arogya Kendra (Delhi)',
    createdAt: '2026-09-13T11:00:00',
  },
  {
    id: 99,
    caseId: 1,
    patientId: 1,
    doctorId: 101,
    clinicId: 'c1',
    date: '02 Sep 2026',
    time: '04:00 PM',
    consultationType: 'First Consultation',
    status: 'COMPLETED',
    consultationToken: 'TK-99',
    patientName: 'Ramesh Chandra',
    doctorName: 'Dr. Rajesh Vaidya',
    clinicName: 'Ayush Arogya Kendra (Delhi)',
    createdAt: '2026-09-02T16:00:00',
  },
]

function getLocalAppointments() {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(SEED_APPOINTMENTS))
      return SEED_APPOINTMENTS
    }
    return JSON.parse(raw)
  } catch (e) {
    console.warn('Error accessing local appointments:', e)
    return SEED_APPOINTMENTS
  }
}

function saveLocalAppointments(list) {
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.warn('Error saving local appointments:', e)
  }
}

/**
 * Fetch all appointments (attempts backend API with local sync fallback)
 */
export async function getAllAppointments() {
  try {
    const res = await fetch(API_BASE)
    if (res.ok) {
      const serverList = await res.json()
      if (serverList && serverList.length > 0) {
        // Merge with local seed if needed
        const local = getLocalAppointments()
        const merged = [...serverList]
        local.forEach(l => {
          if (!merged.some(s => s.id === l.id)) {
            merged.push(l)
          }
        })
        saveLocalAppointments(merged)
        return merged
      }
    }
  } catch (err) {
    console.info('Backend appointments not reachable; using local store')
  }
  return getLocalAppointments()
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(id) {
  const numId = Number(id)
  try {
    const res = await fetch(`${API_BASE}/${numId}`)
    if (res.ok) {
      return await res.json()
    }
  } catch (e) {
    // fallback
  }
  const local = getLocalAppointments()
  return local.find((a) => a.id === numId) || null
}

/**
 * Get upcoming appointments for a patient
 */
export async function getPatientUpcomingAppointments(patientId) {
  const all = await getAllAppointments()
  return all.filter(
    (a) =>
      (a.status === 'CONFIRMED' || a.status === 'REQUESTED') &&
      (!patientId || String(a.patientId) === String(patientId) || a.patientId === 1)
  )
}

/**
 * Get past/completed appointments for a patient
 */
export async function getPatientPastAppointments(patientId) {
  const all = await getAllAppointments()
  return all.filter(
    (a) =>
      a.status === 'COMPLETED' &&
      (!patientId || String(a.patientId) === String(patientId) || a.patientId === 1)
  )
}

/**
 * Get appointments for doctor
 */
export async function getDoctorAppointments(doctorId) {
  const all = await getAllAppointments()
  return all.filter(
    (a) => !doctorId || String(a.doctorId) === String(doctorId) || String(a.doctorId) === '101'
  )
}

/**
 * Create a new appointment
 */
export async function createAppointment(data) {
  const session = getPatientSession()
  const payload = {
    caseId: data.caseId || session.caseId || 1,
    patientId: data.patientId || session.patientId || 1,
    doctorId: data.doctorId || session.selectedDoctorId || 101,
    clinicId: data.clinicId || session.selectedClinicId || 'c1',
    date: data.date || 'Tomorrow',
    time: data.time || '10:00 AM',
    consultationType: data.consultationType || 'First Consultation',
    patientName: data.patientName || session.name || 'Patient',
    doctorName: data.doctorName || 'Dr. Rajesh Vaidya',
    clinicName: data.clinicName || 'Ayush Arogya Kendra',
    status: 'CONFIRMED',
  }

  let createdAppt = null

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      createdAppt = await res.json()
    }
  } catch (err) {
    console.info('Backend appointment create fallback to local store')
  }

  if (!createdAppt) {
    const local = getLocalAppointments()
    const newId = Date.now()
    const token = `TK-${String(payload.caseId || '04').padStart(2, '0')}`
    createdAppt = {
      ...payload,
      id: newId,
      consultationToken: token,
      createdAt: new Date().toISOString(),
    }
  }

  // Update local cache
  const localList = getLocalAppointments()
  saveLocalAppointments([createdAppt, ...localList.filter((a) => a.id !== createdAppt.id)])

  return createdAppt
}

/**
 * Update appointment status (REQUESTED, CONFIRMED, COMPLETED)
 */
export async function updateAppointmentStatus(id, newStatus) {
  const numId = Number(id)
  const normStatus = newStatus.trim().toUpperCase()

  try {
    await fetch(`${API_BASE}/${numId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: normStatus }),
    })
  } catch (e) {
    // fallback
  }

  // Update local store
  const local = getLocalAppointments()
  const updated = local.map((a) => (a.id === numId ? { ...a, status: normStatus } : a))
  saveLocalAppointments(updated)
  return updated.find((a) => a.id === numId)
}
