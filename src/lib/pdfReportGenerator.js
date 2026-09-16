import { jsPDF } from 'jspdf'

/**
 * MediKiosk Professional Clinical PDF Report Generator
 * Generates an official, structured clinical document for a completed intake.
 * 
 * Features:
 * - Intelligent dynamic 2-4 page budgeting with clean page breaks
 * - MediKiosk Brand Header with Tagline & Selected Clinic Name
 * - Prominent CONSULTATION TOKEN box (e.g. TK-01) without QR codes
 * - Zero currency mojibake using custom vector glyph / sanitization
 * - Clear Red-Flag highlight (or clean non-diagnostic negative notice)
 * - Complete AYUSH & Prakriti profile with mandatory safety disclaimer
 * - Lined Doctor Review area for handwritten or verified notes
 * - Dynamic "Page X of Y" footers on all pages
 */

/**
 * Dedicated vector glyph helper to render crisp Indian Rupee symbol
 * without standard font encoding issues or â‚¹ mojibake.
 */
export function drawRupee(doc, x, y, size = 3, color = [31, 58, 52]) {
  doc.saveGraphicsState?.()
  doc.setDrawColor(...color)
  doc.setLineWidth(size * 0.12)
  const w = size * 0.7
  const h = size

  // Top horizontal bar
  doc.line(x, y - h * 0.85, x + w, y - h * 0.85)
  // Second horizontal bar
  doc.line(x, y - h * 0.55, x + w * 0.85, y - h * 0.55)
  // Vertical stem on left
  doc.line(x + w * 0.15, y - h * 0.85, x + w * 0.15, y - h * 0.35)
  // Upper curve
  doc.line(x + w * 0.15, y - h * 0.85, x + w * 0.7, y - h * 0.85)
  doc.line(x + w * 0.7, y - h * 0.85, x + w * 0.85, y - h * 0.6)
  doc.line(x + w * 0.85, y - h * 0.6, x + w * 0.35, y - h * 0.35)
  // Diagonal leg
  doc.line(x + w * 0.35, y - h * 0.35, x + w * 0.85, y)
  doc.restoreGraphicsState?.()
}

/**
 * Sanitize strings to avoid ASCII/WinAnsi mojibake in jsPDF
 */
function sanitizeText(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/₹/g, 'Rs. ')
    .replace(/â‚¹/g, 'Rs. ')
    .replace(/[\u20B9]/g, 'Rs. ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
}

export function generateClinicalPdf(caseData) {
  if (!caseData) return null

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 210
  const pageHeight = 297
  const leftMargin = 16
  const rightMargin = 16
  const usableWidth = pageWidth - leftMargin - rightMargin // 178 mm
  let y = 16

  // Color tokens
  const COLOR_PINE = [31, 58, 52]        // #1F3A34 Primary
  const COLOR_SAGE = [107, 143, 113]     // #6B8F71 Secondary
  const COLOR_TURMERIC = [201, 125, 61]  // #C97D3D Accent
  const COLOR_INK = [28, 27, 25]         // #1C1B19 Deep text
  const COLOR_MUTED = [100, 100, 100]    // Subtle gray
  const COLOR_BG_LIGHT = [250, 249, 245] // Soft warm parchment
  const COLOR_BORDER = [218, 215, 207]   // Crisp card border
  const COLOR_RED = [185, 28, 28]        // Alert red
  const COLOR_GREEN = [46, 125, 50]      // Safe green

  const patient = caseData.patient || {}
  const rawCaseId = caseData.caseId || caseData.id || 1
  const caseIdStr = String(rawCaseId).padStart(4, '0')
  const tokenStr = `TK-${String(rawCaseId).padStart(2, '0')}`
  const selectedClinic = caseData.selectedClinic || {}
  const clinicName = sanitizeText(caseData.clinicName || selectedClinic.name || 'Ayush Arogya Kendra')
  const clinicCity = sanitizeText(selectedClinic.city || 'Delhi')

  // Helper to handle intelligent page breaks
  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage()
      y = 20
      drawMiniHeader()
    }
  }

  const drawMiniHeader = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_PINE)
    doc.text('MEDIKIOSK • PRE-CONSULTATION CLINICAL REPORT', leftMargin, 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_MUTED)
    const headerInfo = `Case #MK-${caseIdStr}  |  Token: ${tokenStr}  |  ${sanitizeText(patient.name || 'Patient')}`
    doc.text(headerInfo, pageWidth - rightMargin, 12, { align: 'right' })

    doc.setDrawColor(...COLOR_BORDER)
    doc.setLineWidth(0.25)
    doc.line(leftMargin, 15, pageWidth - rightMargin, 15)
  }

  const drawSectionHeader = (title, iconText = '') => {
    checkPageBreak(12)
    y += 2
    doc.setFillColor(...COLOR_BG_LIGHT)
    doc.roundedRect(leftMargin, y, usableWidth, 6.5, 1, 1, 'F')
    doc.setDrawColor(...COLOR_BORDER)
    doc.roundedRect(leftMargin, y, usableWidth, 6.5, 1, 1, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...COLOR_PINE)
    doc.text(iconText ? `${iconText}  ${title}` : title, leftMargin + 3.5, y + 4.5)
    y += 9.5
  }

  const drawFieldRow = (label, value) => {
    const safeVal = sanitizeText(value || 'Not reported')
    const labelWidth = 52
    const valueWidth = usableWidth - labelWidth

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_MUTED)
    doc.text(label, leftMargin + 3, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_INK)
    const lines = doc.splitTextToSize(safeVal, valueWidth - 4)
    checkPageBreak(lines.length * 4 + 2)
    doc.text(lines, leftMargin + labelWidth, y)
    y += Math.max(lines.length * 4, 4.5) + 1
  }

  // =========================================================================
  // 1. MASTER HEADER (Page 1)
  // =========================================================================
  doc.setFillColor(...COLOR_PINE)
  doc.rect(0, 0, pageWidth, 26, 'F')

  doc.setFont('times', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(255, 255, 255)
  doc.text('MEDIKIOSK', leftMargin, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(220, 235, 228)
  doc.text('Your story, structured for better care. • Pre-Consultation Clinical Intake', leftMargin, 17)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(200, 220, 212)
  doc.text('ACCREDITED AYUSH CLINICAL NETWORK RECORD', leftMargin, 22)

  const printDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(230, 240, 235)
  doc.text(`Date: ${printDate}`, pageWidth - rightMargin, 12, { align: 'right' })
  doc.text(`Terminal: Kiosk #04`, pageWidth - rightMargin, 17, { align: 'right' })
  doc.text(`Facility: ${clinicName}`, pageWidth - rightMargin, 22, { align: 'right' })

  y = 31

  // =========================================================================
  // 2. COMPACT PATIENT INFO & PROMINENT TOKEN BOX (Page 1)
  // =========================================================================
  const tokenBoxWidth = 42
  const infoBoxWidth = usableWidth - tokenBoxWidth - 3

  // Info Box (Left)
  doc.setFillColor(...COLOR_BG_LIGHT)
  doc.roundedRect(leftMargin, y, infoBoxWidth, 26, 1.5, 1.5, 'F')
  doc.setDrawColor(...COLOR_BORDER)
  doc.roundedRect(leftMargin, y, infoBoxWidth, 26, 1.5, 1.5, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR_MUTED)
  doc.text('PATIENT NAME', leftMargin + 3.5, y + 5)
  doc.text('AGE / GENDER', leftMargin + 50, y + 5)
  doc.text('CASE RECORD', leftMargin + 90, y + 5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(...COLOR_INK)
  doc.text(sanitizeText(patient.name || 'Patient'), leftMargin + 3.5, y + 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  const ageGenderStr = `${patient.age ? `${patient.age} yrs` : 'Not reported'} • ${sanitizeText(patient.gender || 'Not reported')}`
  doc.text(ageGenderStr, leftMargin + 50, y + 11)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_PINE)
  doc.text(`MK-${caseIdStr}`, leftMargin + 90, y + 11)

  // Sub-row: Phone, Preferred Language, Selected Clinic
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(`Phone: ${sanitizeText(patient.phone || 'Recorded')}`, leftMargin + 3.5, y + 18)
  doc.text(`Language: ${(patient.preferredLanguage || 'English').toUpperCase()}`, leftMargin + 50, y + 18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLOR_PINE)
  doc.text(`Clinic: ${clinicName} (${clinicCity})`, leftMargin + 3.5, y + 23)

  // Prominent Token Box (Right) — NO QR CODE
  const tokenX = leftMargin + infoBoxWidth + 3
  doc.setFillColor(...COLOR_BG_LIGHT)
  doc.roundedRect(tokenX, y, tokenBoxWidth, 26, 1.5, 1.5, 'F')
  doc.setDrawColor(...COLOR_TURMERIC)
  doc.setLineWidth(0.6)
  doc.roundedRect(tokenX, y, tokenBoxWidth, 26, 1.5, 1.5, 'S')
  doc.setLineWidth(0.2)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...COLOR_TURMERIC)
  doc.text('CONSULTATION TOKEN', tokenX + tokenBoxWidth / 2, y + 5.5, { align: 'center' })

  doc.setFont('times', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...COLOR_PINE)
  doc.text(tokenStr, tokenX + tokenBoxWidth / 2, y + 16, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...COLOR_MUTED)
  doc.text('OPD CHAMBER QUEUE', tokenX + tokenBoxWidth / 2, y + 22, { align: 'center' })

  y += 31

  // =========================================================================
  // 3. RED FLAGS SAFETY TRIAGE (Clear Warning or Clean Negative Notice)
  // =========================================================================
  const redFlagDetected = Boolean(caseData.redFlagDetected) || (caseData.redFlagTerms && caseData.redFlagTerms.length > 0)
  if (redFlagDetected) {
    checkPageBreak(18)
    doc.setFillColor(254, 242, 242)
    doc.roundedRect(leftMargin, y, usableWidth, 16, 1.5, 1.5, 'F')
    doc.setDrawColor(...COLOR_RED)
    doc.setLineWidth(0.4)
    doc.roundedRect(leftMargin, y, usableWidth, 16, 1.5, 1.5, 'S')
    doc.setLineWidth(0.2)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...COLOR_RED)
    doc.text('RED FLAG SAFETY ALERT (URGENT EVALUATION RECOMMENDED)', leftMargin + 3.5, y + 5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(130, 20, 20)
    const alertMsg = sanitizeText(caseData.redFlagWarning || 'Symptoms noted during kiosk intake require immediate clinical evaluation.')
    doc.text(alertMsg, leftMargin + 3.5, y + 9.5)

    if (caseData.redFlagTerms && caseData.redFlagTerms.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text(`Triggered indicators: ${sanitizeText(caseData.redFlagTerms.join(', '))}`, leftMargin + 3.5, y + 13.5)
    }
    y += 19
  } else {
    checkPageBreak(10)
    doc.setFillColor(243, 248, 244)
    doc.roundedRect(leftMargin, y, usableWidth, 8, 1, 1, 'F')
    doc.setDrawColor(...COLOR_SAGE)
    doc.roundedRect(leftMargin, y, usableWidth, 8, 1, 1, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLOR_GREEN)
    doc.text('SAFETY TRIAGE: No red-flag symptoms identified from the information provided.', leftMargin + 3.5, y + 5.2)
    y += 11
  }

  // =========================================================================
  // 4. CHIEF COMPLAINT
  // =========================================================================
  drawSectionHeader('1. CHIEF COMPLAINT', '•')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...COLOR_INK)
  const ccText = sanitizeText(caseData.chiefComplaint || 'Consultation Intake')
  const ccLines = doc.splitTextToSize(ccText, usableWidth - 6)
  checkPageBreak(ccLines.length * 4.5 + 2)
  doc.text(ccLines, leftMargin + 3.5, y)
  y += ccLines.length * 4.5 + 2

  // =========================================================================
  // 5. HISTORY OF PRESENT ILLNESS (HPI)
  // =========================================================================
  drawSectionHeader('2. HISTORY OF PRESENT ILLNESS (HPI)', '•')
  const hpiText = sanitizeText(
    caseData.hpi ||
    'Detailed clinical timeline captured during interactive intake. Onset and severity documented below.'
  )
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_INK)
  const hpiLines = doc.splitTextToSize(hpiText, usableWidth - 6)
  checkPageBreak(hpiLines.length * 3.8 + 2)
  doc.text(hpiLines, leftMargin + 3.5, y)
  y += hpiLines.length * 3.8 + 3

  // Detailed HPI Dimensions
  if (caseData.duration || caseData.location || caseData.severity || caseData.aggravatingFactors) {
    drawFieldRow('Onset / Duration:', caseData.duration || 'Not reported')
    drawFieldRow('Anatomical Location:', caseData.location || 'Not reported')
    drawFieldRow('Discomfort Severity:', caseData.severity || 'Not reported')
    drawFieldRow('Aggravating Triggers:', caseData.aggravatingFactors || 'Not reported')
    drawFieldRow('Relieving Factors:', caseData.relievingFactors || 'Not reported')
  }

  // =========================================================================
  // 6. ASSOCIATED SYMPTOMS & PERTINENT NEGATIVES
  // =========================================================================
  drawSectionHeader('3. ASSOCIATED SYMPTOMS & PERTINENT NEGATIVES', '•')
  drawFieldRow('Associated Factors:', caseData.associatedSymptoms || 'None reported')
  const pertNeg = caseData.pertinentNegatives || []
  const pertNegStr = Array.isArray(pertNeg) && pertNeg.length > 0 ? pertNeg.join(', ') : 'None reported'
  drawFieldRow('Pertinent Negatives:', pertNegStr)

  // =========================================================================
  // 7. MEDICAL / SURGICAL HISTORY & MEDICATIONS
  // =========================================================================
  drawSectionHeader('4. MEDICAL, SURGICAL & MEDICATION HISTORY', '•')
  drawFieldRow('Past Medical History:', caseData.pastMedicalHistory || 'Not reported')
  drawFieldRow('Past Surgical History:', caseData.pastSurgicalHistory || 'Not reported')
  drawFieldRow('Current Medications:', caseData.currentMedicines || 'Not reported')
  drawFieldRow('Known Allergies:', caseData.allergies || 'Not reported')
  drawFieldRow('Family History:', caseData.familyHistory || 'Not reported')

  // =========================================================================
  // 8. AYUSH LIFESTYLE & PRAKRITI PROFILE
  // =========================================================================
  drawSectionHeader('5. AYUSH LIFESTYLE & PRAKRITI PROFILE', '•')
  const ayush = caseData.ayushData || {}
  const prakriti = caseData.prakritiResult || {}
  const prakritiScores = prakriti.scores || {}
  const dominant = sanitizeText(prakriti.dominantTendency || 'Balanced Constitution')

  drawFieldRow('Agni (Metabolism/Digestion):', ayush.agni || 'Recorded in intake')
  drawFieldRow('Nidra (Sleep Pattern):', ayush.nidra || 'Recorded in intake')
  drawFieldRow('Mala (Elimination Regularity):', ayush.mala || 'Recorded in intake')
  drawFieldRow('Prakriti Constitutional Tendency:', dominant)

  // Scores row
  checkPageBreak(12)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_MUTED)
  doc.text('Dosha Score Indicators:', leftMargin + 3, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLOR_INK)
  const scoreSummary = `Vata: ${prakritiScores.vata || 1}   |   Pitta: ${prakritiScores.pitta || 1}   |   Kapha: ${prakritiScores.kapha || 1}`
  doc.text(scoreSummary, leftMargin + 52, y)
  y += 5

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(
    'MANDATORY DISCLAIMER: Preliminary wellness indicator calculated from intake questions — NOT a disease diagnosis.',
    leftMargin + 3,
    y
  )
  y += 6

  // =========================================================================
  // 9. PREVIOUS REPORTS / INVESTIGATIONS (OCR)
  // =========================================================================
  drawSectionHeader('6. PREVIOUS REPORTS & OCR EXTRACTIONS', '•')
  const documents = caseData.documents || []
  if (documents.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_MUTED)
    doc.text('No previous records attached.', leftMargin + 3.5, y)
    y += 5.5
  } else {
    documents.forEach((docItem, idx) => {
      checkPageBreak(18)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...COLOR_PINE)
      const docLabel = `Record #${idx + 1}: ${sanitizeText(docItem.fileName || 'Attached Document')} (${sanitizeText(docItem.documentType || 'DOCUMENT')})`
      doc.text(docLabel, leftMargin + 3.5, y)
      y += 4.5

      const struct = docItem.structuredData || {}
      if (struct.medicines && struct.medicines.length > 0) {
        drawFieldRow('  Extracted Medicines:', struct.medicines.join(', '))
      }
      if (struct.labResults && struct.labResults.length > 0) {
        drawFieldRow('  Extracted Lab Values:', struct.labResults.join(', '))
      }
      if (struct.importantFindings && struct.importantFindings.length > 0) {
        drawFieldRow('  Clinical Findings:', struct.importantFindings.join(', '))
      }
    })
  }

  // =========================================================================
  // 10. MISSING / NOT REPORTED INFORMATION
  // =========================================================================
  drawSectionHeader('7. MISSING / NOT REPORTED INFORMATION', '•')
  const missingItems = []
  if (!caseData.pastMedicalHistory) missingItems.push('- Past Medical History: Not reported')
  if (!caseData.pastSurgicalHistory) missingItems.push('- Past Surgical History: Not reported')
  if (!caseData.currentMedicines) missingItems.push('- Current Medications: Not reported')
  if (!caseData.allergies) missingItems.push('- Drug/Food Allergies: Not reported')
  if (!caseData.familyHistory) missingItems.push('- Family History: Not reported')
  if (!caseData.personalLifestyle) missingItems.push('- Personal Lifestyle: Not reported')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR_MUTED)
  if (missingItems.length === 0) {
    doc.text('Comprehensive intake parameters provided during clinical questionnaire.', leftMargin + 3.5, y)
    y += 5
  } else {
    missingItems.slice(0, 4).forEach((item) => {
      checkPageBreak(5)
      doc.text(item, leftMargin + 3.5, y)
      y += 4
    })
  }
  y += 2

  // =========================================================================
  // 11. PRE-CONSULTATION SUMMARY (3-5 Concise Lines)
  // =========================================================================
  drawSectionHeader('8. PRE-CONSULTATION SUMMARY (PHYSICIAN BRIEF)', '•')
  const summaryLines = [
    `1. Patient ${sanitizeText(patient.name || 'Patient')} (${patient.age ? `${patient.age}y` : 'Age unrecorded'}, ${sanitizeText(patient.gender || 'Gender unrecorded')}) presents with ${sanitizeText(caseData.chiefComplaint || 'reported concerns')}, duration ${sanitizeText(caseData.duration || 'unspecified')}, severity rated ${sanitizeText(caseData.severity || 'unspecified')}.`,
    `2. Aggravating factors: ${sanitizeText(caseData.aggravatingFactors || 'none reported')}. Associated symptoms: ${sanitizeText(caseData.associatedSymptoms || 'none reported')}. Pertinent negatives: ${pertNegStr}.`,
    `3. Baseline history: medical (${sanitizeText(caseData.pastMedicalHistory || 'none reported')}), medications (${sanitizeText(caseData.currentMedicines || 'none reported')}), allergies (${sanitizeText(caseData.allergies || 'none reported')}).`,
    `4. Preliminary AYUSH constitutional tendency indicates ${dominant} profile with ${sanitizeText(ayush.agni || 'normal')} Agni and ${sanitizeText(ayush.nidra || 'regular')} Nidra.`,
    `5. Case prepared for physician clinical examination, pulse reading (Nadi Pariksha), and therapeutic prescription.`
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_INK)
  summaryLines.forEach((sLine) => {
    const split = doc.splitTextToSize(sLine, usableWidth - 6)
    checkPageBreak(split.length * 3.8 + 2)
    doc.text(split, leftMargin + 3.5, y)
    y += split.length * 3.8 + 1.5
  })
  y += 2

  // Mandatory notice
  checkPageBreak(8)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(
    'AI-generated pre-consultation summary. Review and verification by a qualified healthcare professional is required.',
    leftMargin + 3.5,
    y
  )
  y += 8

  // =========================================================================
  // 12. DOCTOR REVIEW & CLINICAL NOTES (Lined Area)
  // =========================================================================
  checkPageBreak(50)
  doc.setFillColor(...COLOR_PINE)
  doc.roundedRect(leftMargin, y, usableWidth, 6.5, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text('9. ATTENDING DOCTOR REVIEW & CLINICAL NOTES (FINAL AUTHORITY)', leftMargin + 3.5, y + 4.5)
  y += 10

  const isReviewed = caseData.status === 'REVIEWED'

  if (isReviewed && (caseData.doctorNotes || caseData.doctorReviewedSummary)) {
    if (caseData.doctorReviewedSummary) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...COLOR_PINE)
      doc.text('Doctor Verified Clinical Impression:', leftMargin + 3.5, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...COLOR_INK)
      const drLines = doc.splitTextToSize(sanitizeText(caseData.doctorReviewedSummary), usableWidth - 6)
      checkPageBreak(drLines.length * 3.8 + 2)
      doc.text(drLines, leftMargin + 3.5, y)
      y += drLines.length * 3.8 + 3
    }

    if (caseData.doctorNotes) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...COLOR_PINE)
      doc.text('Clinical Observations & Prescription Advice:', leftMargin + 3.5, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...COLOR_INK)
      const noteLines = doc.splitTextToSize(sanitizeText(caseData.doctorNotes), usableWidth - 6)
      checkPageBreak(noteLines.length * 3.8 + 2)
      doc.text(noteLines, leftMargin + 3.5, y)
      y += noteLines.length * 3.8 + 4
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLOR_MUTED)
    const revTime = caseData.doctorReviewedAt
      ? new Date(caseData.doctorReviewedAt).toLocaleString('en-IN')
      : 'Recorded on system'
    doc.text(`Reviewed by Attending Physician • Timestamp: ${revTime}`, leftMargin + 3.5, y)
    y += 8
  } else {
    // Generous lined writing area for attending doctor
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_INK)
    doc.text('Attending Physician: ____________________________________________________', leftMargin + 3.5, y)
    doc.text('Review Date/Time: _________________________', leftMargin + 105, y)
    y += 7

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLOR_MUTED)
    doc.text('Clinical Observations & Examination Notes:', leftMargin + 3.5, y)
    y += 4

    // Draw 4 neat writing lines
    doc.setDrawColor(...COLOR_BORDER)
    doc.setLineWidth(0.2)
    for (let i = 0; i < 4; i++) {
      doc.line(leftMargin + 3.5, y + 4, pageWidth - rightMargin - 3.5, y + 4)
      y += 7
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLOR_MUTED)
    doc.text('Prescription & Dietary Advice (Pathya / Apathya):', leftMargin + 3.5, y)
    y += 4

    // Draw 3 neat writing lines
    for (let i = 0; i < 3; i++) {
      doc.line(leftMargin + 3.5, y + 4, pageWidth - rightMargin - 3.5, y + 4)
      y += 7
    }

    y += 3
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_INK)
    doc.text('Doctor Signature / Stamp: ____________________________________________________', leftMargin + 3.5, y)
    y += 8
  }

  // =========================================================================
  // 13. DYNAMIC FOOTERS ("Page X of Y") ACROSS ALL PAGES
  // =========================================================================
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLOR_MUTED)

    // Footer divider line
    doc.setDrawColor(...COLOR_BORDER)
    doc.setLineWidth(0.2)
    doc.line(leftMargin, pageHeight - 12, pageWidth - rightMargin, pageHeight - 12)

    // Left brand disclaimer
    doc.text(
      'MediKiosk • AI-generated pre-consultation record — verify before clinical use.',
      leftMargin,
      pageHeight - 8
    )

    // Right page number
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - rightMargin,
      pageHeight - 8,
      { align: 'right' }
    )
  }

  // Save / Trigger Download
  const filename = `MediKiosk_Case_${caseIdStr}_Clinical_Report.pdf`
  doc.save(filename)
  return filename
}

/**
 * MediKiosk Patient Daily Care Card PDF Generator
 * Patient-friendly, very conservative wellness reminder card.
 * Does NOT generate medical advice, diagnosis, or prescription.
 */
export function generateDailyCareCardPdf(caseData) {
  if (!caseData) return null

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 210
  const pageHeight = 297
  const leftMargin = 20
  const rightMargin = 20
  const usableWidth = pageWidth - leftMargin - rightMargin // 170 mm
  let y = 20

  const COLOR_PINE = [31, 58, 52]
  const COLOR_SAGE = [107, 143, 113]
  const COLOR_INK = [28, 27, 25]
  const COLOR_MUTED = [102, 102, 102]
  const COLOR_BG = [250, 249, 246]
  const COLOR_CARD_BG = [244, 247, 244]
  const COLOR_BORDER = [205, 216, 206]

  // Outer border & background
  doc.setFillColor(...COLOR_BG)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  doc.setDrawColor(...COLOR_PINE)
  doc.setLineWidth(1)
  doc.roundedRect(12, 12, pageWidth - 24, pageHeight - 24, 3, 3, 'S')

  // Inner card header
  doc.setFillColor(...COLOR_PINE)
  doc.roundedRect(leftMargin, y, usableWidth, 24, 2, 2, 'F')

  doc.setFont('times', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('MEDIKIOSK DAILY CARE CARD', leftMargin + 6, y + 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(230, 240, 235)
  doc.text('Personal Wellness & Routine Reminders for Your Consultation Visit', leftMargin + 6, y + 17)

  y += 32

  const patient = caseData.patient || {}
  const rawId = caseData.caseId || caseData.id || 1
  const tokenStr = `TK-${String(rawId).padStart(2, '0')}`
  const patientName = sanitizeText(patient.name || 'Patient')
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  // Demographics Pill
  doc.setFillColor(...COLOR_CARD_BG)
  doc.roundedRect(leftMargin, y, usableWidth, 14, 1.5, 1.5, 'F')
  doc.setDrawColor(...COLOR_BORDER)
  doc.roundedRect(leftMargin, y, usableWidth, 14, 1.5, 1.5, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_INK)
  doc.text(`Patient: ${patientName}`, leftMargin + 5, y + 6)
  doc.text(`Token: ${tokenStr}`, leftMargin + 85, y + 6)
  doc.text(`Date: ${dateStr}`, leftMargin + 130, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(`Main Reported Concern: ${sanitizeText(caseData.chiefComplaint || 'Consultation Intake')}`, leftMargin + 5, y + 11)

  y += 20

  // SECTION: GENERAL CARE REMINDERS
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLOR_PINE)
  doc.text('General Daily Self-Care Reminders', leftMargin, y)
  y += 6

  const carePoints = [
    '• Hydration: Drink clean, warm or room-temperature water throughout the day.',
    '• Timely Meals: Eat freshly cooked meals at regular intervals; avoid eating in a rush.',
    '• Rest & Recovery: Ensure 7 to 8 hours of quiet sleep in a well-ventilated room.',
    '• Gentle Movement: Light walking or stretching as comfortable without straining your body.',
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_INK)
  carePoints.forEach((pt) => {
    doc.text(pt, leftMargin + 3, y)
    y += 6
  })

  y += 4

  // SECTION: LIFESTYLE OBSERVATIONS
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLOR_PINE)
  doc.text('Routine Observations to Note for Your Doctor', leftMargin, y)
  y += 6

  const ayush = caseData.ayushData || {}
  const lifestylePoints = [
    `• Digestion: Keep note of how comfortably you digest different meals (${sanitizeText(ayush.agni || 'Recorded in intake')}).`,
    `• Sleep Routine: Observe if sleeping at a fixed hour improves morning alertness (${sanitizeText(ayush.nidra || 'Recorded in intake')}).`,
    `• Bowel Regularity: Notice whether warm fluids in the morning support regular digestion (${sanitizeText(ayush.mala || 'Recorded in intake')}).`,
    '• Stress Management: Practice 5 minutes of calm, slow breathing (Pranayama) daily.',
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_INK)
  lifestylePoints.forEach((pt) => {
    const lines = doc.splitTextToSize(pt, usableWidth - 6)
    doc.text(lines, leftMargin + 3, y)
    y += lines.length * 5 + 1
  })

  y += 4

  // SECTION: QUESTIONS TO DISCUSS
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLOR_PINE)
  doc.text('Points to Discuss with Your AYUSH Doctor', leftMargin, y)
  y += 6

  const doctorQuestions = [
    '1. What dietary adjustments (Pathya / Apathya) are best suited for my current symptoms?',
    '2. Are there specific daily herbal teas or decoctions recommended for my constitution?',
    '3. How can I align my sleep and meal schedules for better energy and digestion?',
    '4. What follow-up timeline should I observe to monitor improvement?',
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_INK)
  doctorQuestions.forEach((q) => {
    const lines = doc.splitTextToSize(q, usableWidth - 6)
    doc.text(lines, leftMargin + 3, y)
    y += lines.length * 5 + 1
  })

  y += 6

  // DISCLAIMER
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(leftMargin, y, usableWidth, 22, 1.5, 1.5, 'F')
  doc.setDrawColor(...COLOR_BORDER)
  doc.roundedRect(leftMargin, y, usableWidth, 22, 1.5, 1.5, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_PINE)
  doc.text('HEALTHCARE SAFETY & MEDICAL DISCLAIMER', leftMargin + 4, y + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR_MUTED)
  const disclaimerText =
    'This Daily Care Card provides general traditional wellness and routine reminders based on your intake conversation. It does NOT constitute medical advice, a prescription, or a medical diagnosis. Do NOT start, stop, or change any medications without the explicit guidance of your consulting AYUSH physician.'
  const disLines = doc.splitTextToSize(disclaimerText, usableWidth - 8)
  doc.text(disLines, leftMargin + 4, y + 10)

  // Footer text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(
    'MediKiosk • SIH26047 Foundation • "Your story, structured for better care."',
    pageWidth / 2,
    pageHeight - 16,
    { align: 'center' }
  )

  const filename = `MediKiosk_Daily_Care_Card_${rawId}.pdf`
  doc.save(filename)
  return filename
}

export default generateClinicalPdf
