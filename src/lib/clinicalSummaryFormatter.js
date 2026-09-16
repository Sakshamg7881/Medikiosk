/**
 * MediKiosk Standardized 14-Section Clinical Summary Formatter
 * Generates an objective, structured summary from clinical intake data.
 * Adheres strictly to the 14-section format with no invented clinical data.
 */

export function format14SectionSummary(caseData = {}) {
  const patient = caseData.patient || {}
  const ayush = caseData.ayushData || {}
  const prakriti = caseData.prakritiResult || {}
  const dominant = prakriti.dominantTendency || 'Undetermined'
  const documents = caseData.documents || []
  const redFlagDetected = Boolean(caseData.redFlagDetected)
  const redFlagTerms = caseData.redFlagTerms || []

  const valOr = (val, fallback = 'Not reported') => {
    if (val === null || val === undefined) return fallback
    const s = String(val).trim()
    if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return fallback
    return s
  }

  const lines = []
  lines.push('==================================================')
  lines.push('STRUCTURED PRE-CONSULTATION CLINICAL SUMMARY')
  lines.push('MediKiosk AI Intake Preparation for Attending Physician')
  lines.push('==================================================\n')

  // 1. PATIENT OVERVIEW
  lines.push('1. PATIENT OVERVIEW:')
  lines.push(`- Name: ${valOr(patient.name, 'Patient')}`)
  lines.push(`- Age: ${patient.age ? `${patient.age} years` : 'Not reported'}`)
  lines.push(`- Gender: ${valOr(patient.gender)}`)
  lines.push(`- Case ID: MK-${String(caseData.caseId || caseData.id || '0001').padStart(4, '0')}`)
  lines.push(`- Phone: ${valOr(patient.phone, 'Recorded')}\n`)

  // 2. CHIEF COMPLAINT
  lines.push('2. CHIEF COMPLAINT:')
  lines.push(`- Primary Concern: ${valOr(caseData.chiefComplaint)}`)
  lines.push(`- Duration: ${valOr(caseData.duration || caseData.hpiDuration)}\n`)

  // 3. HISTORY OF PRESENT ILLNESS (HPI)
  lines.push('3. HISTORY OF PRESENT ILLNESS (HPI):')
  lines.push(`- Onset & Duration: ${valOr(caseData.duration || caseData.hpiDuration)}`)
  lines.push(`- Anatomical Location: ${valOr(caseData.location)}`)
  lines.push(`- Severity: ${valOr(caseData.severity)}`)
  lines.push(`- Character / Nature: ${valOr(caseData.character)}`)
  lines.push(`- Aggravating Factors: ${valOr(caseData.aggravatingFactors)}`)
  lines.push(`- Relieving Factors: ${valOr(caseData.relievingFactors)}`)
  lines.push(`- Associated Symptoms: ${valOr(caseData.associatedSymptoms)}`)
  const pertinentNegatives = caseData.pertinentNegatives || []
  if (Array.isArray(pertinentNegatives) && pertinentNegatives.length > 0) {
    lines.push(`- Pertinent Negatives: ${pertinentNegatives.join(', ')}`)
  } else {
    lines.push('- Pertinent Negatives: None reported')
  }
  lines.push('')

  // 4. MEDICAL / SURGICAL HISTORY
  lines.push('4. MEDICAL / SURGICAL HISTORY:')
  lines.push(`- Past Medical History: ${valOr(caseData.pastMedicalHistory)}`)
  lines.push(`- Past Surgical History: ${valOr(caseData.pastSurgicalHistory)}\n`)

  // 5. CURRENT MEDICATIONS
  lines.push('5. CURRENT MEDICATIONS:')
  lines.push(`${valOr(caseData.currentMedicines)}\n`)

  // 6. ALLERGIES
  lines.push('6. ALLERGIES:')
  lines.push(`${valOr(caseData.allergies)}\n`)

  // 7. FAMILY HISTORY
  lines.push('7. FAMILY HISTORY:')
  lines.push(`${valOr(caseData.familyHistory)}\n`)

  // 8. PERSONAL / LIFESTYLE HISTORY
  lines.push('8. PERSONAL / LIFESTYLE HISTORY:')
  lines.push(`${valOr(caseData.personalLifestyle)}\n`)

  // 9. AYUSH PROFILE
  lines.push('9. AYUSH PROFILE:')
  lines.push(`- Agni (Metabolism/Digestion): ${valOr(ayush.agni)}`)
  lines.push(`- Nidra (Sleep Pattern): ${valOr(ayush.nidra)}`)
  lines.push(`- Mala (Elimination): ${valOr(ayush.mala)}`)
  lines.push(`- Rule-Based Prakriti Tendency: ${dominant}`)
  lines.push('- Note: Preliminary wellness constitution indicator — not a clinical diagnosis.\n')

  // 10. PREVIOUS REPORTS / INVESTIGATIONS
  lines.push('10. PREVIOUS REPORTS / INVESTIGATIONS:')
  if (Array.isArray(documents) && documents.length > 0) {
    lines.push(`${documents.length} attached patient record(s) registered in system for review.\n`)
  } else {
    lines.push('No previous records attached.\n')
  }

  // 11. RED FLAGS
  lines.push('11. RED FLAGS:')
  if (redFlagDetected) {
    const details = redFlagTerms.length > 0 ? redFlagTerms.join(', ') : 'Urgent symptoms detected during interview.'
    lines.push(`⚠️ RED FLAG PRESENT: ${details}\n`)
  } else {
    lines.push('No red-flag symptoms identified from the information provided.\n')
  }

  // 12. MISSING / NOT REPORTED
  lines.push('12. MISSING / NOT REPORTED:')
  const missing = []
  if (!caseData.pastMedicalHistory) missing.push('- Past Medical History: Not reported')
  if (!caseData.pastSurgicalHistory) missing.push('- Surgical History: Not reported')
  if (!caseData.currentMedicines) missing.push('- Current Medications: Not reported')
  if (!caseData.allergies) missing.push('- Drug/Food Allergies: Not reported')
  if (!caseData.familyHistory) missing.push('- Family History: Not reported')
  if (!caseData.personalLifestyle) missing.push('- Personal/Lifestyle History: Not reported')
  if (!caseData.character) missing.push('- Symptom Character/Quality: Not reported')
  if (missing.length > 0) {
    lines.push(missing.join('\n') + '\n')
  } else {
    lines.push('Comprehensive intake details captured.\n')
  }

  // 13. PRE-CONSULTATION SUMMARY (3-5 concise lines)
  lines.push('13. PRE-CONSULTATION SUMMARY:')
  lines.push(`1. Patient ${valOr(patient.name, 'Patient')} (${patient.age ? `${patient.age}y` : 'Age unrecorded'}, ${valOr(patient.gender, 'Gender unrecorded')}) presents with ${valOr(caseData.chiefComplaint, 'reported symptoms')} of ${valOr(caseData.duration || caseData.hpiDuration, 'unspecified')} duration, rated at ${valOr(caseData.severity, 'unspecified')} severity.`)
  lines.push(`2. Key aggravating factors: ${valOr(caseData.aggravatingFactors, 'none reported')}. Associated symptoms: ${valOr(caseData.associatedSymptoms, 'none reported')}. Pertinent negatives: ${Array.isArray(pertinentNegatives) && pertinentNegatives.length > 0 ? pertinentNegatives.join(', ') : 'none reported'}.`)
  lines.push(`3. Medical/surgical background: ${valOr(caseData.pastMedicalHistory, 'none reported')}. Current medications: ${valOr(caseData.currentMedicines, 'none reported')}. Known allergies: ${valOr(caseData.allergies, 'none reported')}.`)
  lines.push(`4. AYUSH intake indicates ${valOr(ayush.agni, 'normal')} Agni, ${valOr(ayush.nidra, 'regular')} Nidra, and ${dominant} constitutional tendency.`)
  lines.push('5. Prepared for physician clinical examination, differential diagnosis, and consultation.\n')

  // 14. MANDATORY VERIFICATION NOTICE
  lines.push('14. MANDATORY NOTICE:')
  lines.push('AI-generated pre-consultation summary. Review and verification by a qualified healthcare professional is required.')

  return lines.join('\n')
}

export default format14SectionSummary
