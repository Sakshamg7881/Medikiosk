// MediKiosk Lightweight Patient Session Helper (MVP LocalStorage)

const SESSION_KEY = 'medikiosk_patient_session'

export function getPatientSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) {
      return {
        patientId: null,
        caseId: null,
        preferredLanguage: 'hi',
        consentAccepted: false,
        name: '',
        age: null,
        gender: '',
        phone: '',
        selectedClinicId: null,
        selectedDoctorId: null,
        consultationType: 'AI-Assisted First Consultation',
      }
    }
    const parsed = JSON.parse(raw)
    return {
      selectedClinicId: null,
      selectedDoctorId: null,
      consultationType: 'AI-Assisted First Consultation',
      ...parsed,
    }
  } catch (e) {
    console.error('Failed to read patient session from storage', e)
    return {
      patientId: null,
      caseId: null,
      preferredLanguage: 'hi',
      consentAccepted: false,
      name: '',
      age: null,
      gender: '',
      phone: '',
      selectedClinicId: null,
      selectedDoctorId: null,
      consultationType: 'AI-Assisted First Consultation',
    }
  }
}

export function setPatientLanguage(preferredLanguage) {
  const session = getPatientSession()
  const updated = { ...session, preferredLanguage }
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  return updated
}

export function setPatientCaseId(caseId) {
  const session = getPatientSession()
  const updated = { ...session, caseId }
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  return updated
}

export function setSelectedClinic(selectedClinicId) {
  const session = getPatientSession()
  const updated = { ...session, selectedClinicId }
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  return updated
}

export function setSelectedDoctor(selectedDoctorId) {
  const session = getPatientSession()
  const updated = { ...session, selectedDoctorId }
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  return updated
}

export function setConsultationType(consultationType) {
  const session = getPatientSession()
  const updated = { ...session, consultationType }
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  return updated
}

export function setPatientData(patient) {
  const session = getPatientSession()
  const updated = {
    ...session,
    patientId: patient.id,
    name: patient.name || session.name,
    age: patient.age !== undefined ? patient.age : session.age,
    gender: patient.gender || session.gender,
    phone: patient.phone || session.phone,
    preferredLanguage: patient.preferredLanguage || session.preferredLanguage,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  return updated
}

export function setConsentAccepted(consentAccepted = true) {
  const session = getPatientSession()
  const updated = { ...session, consentAccepted }
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  return updated
}

export function clearPatientSession() {
  localStorage.removeItem(SESSION_KEY)
}
