// MediKiosk Frontend API Helper

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export async function createPatient(patientData) {
  try {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    })

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API Error in createPatient:', error)
    // Return friendly message without exposing raw stack trace or technical errors to patient
    throw new Error('Unable to connect to clinic registration server. Please verify terminal connectivity or ask clinic staff.')
  }
}

export async function getPatient(patientId) {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`)
    if (!response.ok) {
      throw new Error(`Patient not found (${response.status})`)
    }
    return await response.json()
  } catch (error) {
    console.error('API Error in getPatient:', error)
    throw new Error('Unable to retrieve patient profile.')
  }
}

export async function startAssessment({ patientId, language }) {
  try {
    const response = await fetch(`${API_BASE_URL}/assessment/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ patientId, language }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.error || `Server returned status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API Error in startAssessment:', error)
    throw error
  }
}

export async function sendAssessmentMessage({ caseId, patientId, language, message }) {
  try {
    const response = await fetch(`${API_BASE_URL}/assessment/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ caseId, patientId, language, message }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.error || `Server returned status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API Error in sendAssessmentMessage:', error)
    throw error
  }
}

export async function getAssessment(caseId) {
  try {
    const response = await fetch(`${API_BASE_URL}/assessment/${caseId}`)
    if (!response.ok) {
      throw new Error(`Assessment not found (${response.status})`)
    }
    return await response.json()
  } catch (error) {
    console.error('API Error in getAssessment:', error)
    throw error
  }
}

export async function uploadCaseDocument(caseId, file, documentType = 'OTHER') {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)

    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/documents`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.error || `Server returned status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API Error in uploadCaseDocument:', error)
    throw error
  }
}

export async function getCaseSummary(caseId) {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/summary`)
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.error || `Case summary not found (${response.status})`)
    }
    return await response.json()
  } catch (error) {
    console.error('API Error in getCaseSummary:', error)
    throw error
  }
}

export async function getDoctorCases() {
  try {
    const response = await fetch(`${API_BASE_URL}/doctor/cases`)
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.error || `Unable to fetch doctor cases (${response.status})`)
    }
    return await response.json()
  } catch (error) {
    console.error('API Error in getDoctorCases:', error)
    throw error
  }
}

export async function getDoctorCase(caseId) {
  try {
    const response = await fetch(`${API_BASE_URL}/doctor/cases/${caseId}`)
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.error || `Case not found (${response.status})`)
    }
    return await response.json()
  } catch (error) {
    console.error('API Error in getDoctorCase:', error)
    throw error
  }
}

export async function reviewDoctorCase(caseId, reviewData) {
  try {
    const response = await fetch(`${API_BASE_URL}/doctor/cases/${caseId}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.error || `Failed to submit review (${response.status})`)
    }

    return await response.json()
  } catch (error) {
    console.error('API Error in reviewDoctorCase:', error)
    throw error
  }
}


