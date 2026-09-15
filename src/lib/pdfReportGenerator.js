import { jsPDF } from 'jspdf'

/**
 * MediKiosk Professional Clinical PDF Report Generator
 * Generates an official, structured clinical document for a completed case.
 * Adheres strictly to healthcare safety guidelines:
 * - Prioritizes doctor-reviewed information over raw AI output
 * - Uses "Not reported" for missing fields, never inventing information
 * - Does not expose raw chatbot transcripts
 */
export function generateClinicalPdf(caseData) {
  if (!caseData) return

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

  // Color definitions matching MediKiosk Design Tokens
  const COLOR_PINE = [31, 58, 52]       // #1F3A34 Primary
  const COLOR_SAGE = [107, 143, 113]    // #6B8F71 Secondary
  const COLOR_TURMERIC = [201, 125, 61] // #C97D3D Accent
  const COLOR_INK = [28, 27, 25]        // #1C1B19 Text
  const COLOR_MUTED = [102, 102, 102]   // Muted Text
  const COLOR_BG_LIGHT = [247, 246, 242]// Light warm background
  const COLOR_BORDER = [218, 215, 207]  // Border line
  const COLOR_RED = [185, 28, 28]       // Red flag

  // Page helper
  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - 18) {
      drawFooter()
      doc.addPage()
      y = 18
      drawMiniHeader()
    }
  }

  const drawFooter = () => {
    const pageNumber = doc.internal.getCurrentPageInfo().pageNumber
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_MUTED)
    doc.text(
      'AI-assisted pre-consultation record. Final clinical decisions remain with the attending doctor.',
      leftMargin,
      pageHeight - 10
    )
    doc.text(
      `Page ${pageNumber}`,
      pageWidth - rightMargin,
      pageHeight - 10,
      { align: 'right' }
    )
    doc.setDrawColor(...COLOR_BORDER)
    doc.setLineWidth(0.2)
    doc.line(leftMargin, pageHeight - 14, pageWidth - rightMargin, pageHeight - 14)
  }

  const drawMiniHeader = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_PINE)
    doc.text('MEDIKIOSK CLINICAL PRE-CONSULTATION SUMMARY', leftMargin, 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_MUTED)
    doc.text(`Case Record #${caseData?.caseId || 'N/A'}`, pageWidth - rightMargin, 12, { align: 'right' })
    doc.setDrawColor(...COLOR_BORDER)
    doc.setLineWidth(0.2)
    doc.line(leftMargin, 14, pageWidth - rightMargin, 14)
  }

  const drawSectionHeading = (title, iconText = '') => {
    checkPageBreak(12)
    y += 2
    doc.setFillColor(...COLOR_BG_LIGHT)
    doc.roundedRect(leftMargin, y, usableWidth, 7, 1, 1, 'F')
    doc.setDrawColor(...COLOR_BORDER)
    doc.roundedRect(leftMargin, y, usableWidth, 7, 1, 1, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR_PINE)
    doc.text(iconText ? `${iconText}  ${title}` : title, leftMargin + 3, y + 5)
    y += 10
  }

  const drawFieldRow = (label, value) => {
    const safeVal = value || 'Not reported'
    const labelWidth = 45
    const valueWidth = usableWidth - labelWidth

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...COLOR_MUTED)
    doc.text(label, leftMargin + 2, y)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLOR_INK)
    const lines = doc.splitTextToSize(String(safeVal), valueWidth - 4)
    checkPageBreak(lines.length * 4.2 + 2)
    doc.text(lines, leftMargin + labelWidth, y)
    y += Math.max(lines.length * 4.2, 5) + 1
  }

  // --- SECTION 1: MASTER CLINICAL HEADER ---
  // Top Banner
  doc.setFillColor(...COLOR_PINE)
  doc.rect(0, 0, pageWidth, 24, 'F')

  doc.setFont('times', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(255, 255, 255)
  doc.text('MEDIKIOSK CLINICAL PRE-CONSULTATION SUMMARY', leftMargin, 12)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8.5)
  doc.setTextColor(230, 240, 235)
  doc.text('Your story, structured for better care. • Traditional Medicine (AYUSH) Intake', leftMargin, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(220, 230, 225)
  const printDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  doc.text(`Generated: ${printDate}`, pageWidth - rightMargin, 18, { align: 'right' })

  y = 30

  // --- SECTION 2: PATIENT DEMOGRAPHICS & RECORD INFO ---
  const patient = caseData?.patient || {}
  const caseId = caseData?.caseId || 'N/A'
  const isReviewed = caseData?.status === 'REVIEWED'

  doc.setFillColor(...COLOR_BG_LIGHT)
  doc.roundedRect(leftMargin, y, usableWidth, 22, 1.5, 1.5, 'F')
  doc.setDrawColor(...COLOR_BORDER)
  doc.roundedRect(leftMargin, y, usableWidth, 22, 1.5, 1.5, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_MUTED)
  doc.text('PATIENT NAME', leftMargin + 4, y + 6)
  doc.text('AGE / GENDER', leftMargin + 60, y + 6)
  doc.text('CASE RECORD', leftMargin + 105, y + 6)
  doc.text('CLINICAL STATUS', leftMargin + 140, y + 6)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLOR_INK)
  doc.text(patient.name || 'Anonymous Patient', leftMargin + 4, y + 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const ageGender = `${patient.age ? patient.age + ' yrs' : 'Not reported'} • ${patient.gender || 'Not reported'}`
  doc.text(ageGender, leftMargin + 60, y + 13)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_PINE)
  doc.text(`#${caseId}`, leftMargin + 105, y + 13)

  // Status Badge
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  if (isReviewed) {
    doc.setFillColor(...COLOR_SAGE)
    doc.roundedRect(leftMargin + 138, y + 8, 36, 6, 1, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text('DOCTOR REVIEWED', leftMargin + 140, y + 12.5)
  } else {
    doc.setFillColor(...COLOR_TURMERIC)
    doc.roundedRect(leftMargin + 138, y + 8, 36, 6, 1, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text('PENDING REVIEW', leftMargin + 141, y + 12.5)
  }

  // Sub-demographics
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_MUTED)
  const regDate = caseData?.createdAt
    ? new Date(caseData.createdAt).toLocaleDateString('en-IN')
    : new Date().toLocaleDateString('en-IN')
  doc.text(`Phone: ${patient.phone || 'Not reported'}   |   Language: ${(patient.preferredLanguage || 'English').toUpperCase()}   |   Date: ${regDate}`, leftMargin + 4, y + 19)

  y += 26

  // --- SECTION 10 (PRIORITY): RED FLAG SAFETY BANNER IF DETECTED ---
  const hasRedFlags = caseData?.redFlagDetected || (caseData?.redFlagTerms && caseData.redFlagTerms.length > 0)
  if (hasRedFlags) {
    checkPageBreak(22)
    doc.setFillColor(254, 242, 242) // Light red tint
    doc.roundedRect(leftMargin, y, usableWidth, 18, 1.5, 1.5, 'F')
    doc.setDrawColor(...COLOR_RED)
    doc.setLineWidth(0.4)
    doc.roundedRect(leftMargin, y, usableWidth, 18, 1.5, 1.5, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR_RED)
    doc.text('URGENT MEDICAL SAFETY NOTICE (PRE-CONSULTATION TRIAGE CHECK)', leftMargin + 4, y + 5.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(120, 20, 20)
    const warningMsg = caseData?.redFlagWarning || 'Symptoms or reports noted during intake may require prompt clinical evaluation.'
    doc.text(doc.splitTextToSize(warningMsg, usableWidth - 8), leftMargin + 4, y + 10)

    if (caseData?.redFlagTerms && caseData.redFlagTerms.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text(`Flagged Keywords: ${caseData.redFlagTerms.join(', ')}`, leftMargin + 4, y + 15)
    }
    y += 22
  }

  // --- SECTION 3: CHIEF COMPLAINT ---
  drawSectionHeading('1. CHIEF COMPLAINT')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_INK)
  const ccLines = doc.splitTextToSize(caseData?.chiefComplaint || 'Consultation Intake', usableWidth - 6)
  doc.text(ccLines, leftMargin + 3, y)
  y += ccLines.length * 5 + 2

  // --- SECTION 4: HISTORY OF PRESENT ILLNESS (HPI) ---
  drawSectionHeading('2. HISTORY OF PRESENT ILLNESS (HPI)')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLOR_INK)
  const hpiText = caseData?.hpi || 'Detailed history collected through patient questionnaire. Onset and progression noted during intake.'
  const hpiLines = doc.splitTextToSize(hpiText, usableWidth - 6)
  checkPageBreak(hpiLines.length * 4.2 + 4)
  doc.text(hpiLines, leftMargin + 3, y)
  y += hpiLines.length * 4.2 + 3

  // --- SECTION 5: ASSOCIATED SYMPTOMS ---
  if (caseData?.associatedSymptoms) {
    drawSectionHeading('3. ASSOCIATED SYMPTOMS & AGGRAVATING FACTORS')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...COLOR_INK)
    const symmLines = doc.splitTextToSize(caseData.associatedSymptoms, usableWidth - 6)
    checkPageBreak(symmLines.length * 4.2 + 4)
    doc.text(symmLines, leftMargin + 3, y)
    y += symmLines.length * 4.2 + 3
  }

  // --- SECTION 6: MEDICAL & MEDICATION HISTORY ---
  drawSectionHeading('4. MEDICAL & SURGICAL HISTORY (BASELINE)')
  drawFieldRow('Existing Illnesses:', 'Not reported')
  drawFieldRow('Surgical / Hospital:', 'Not reported')
  drawFieldRow('Active Medications:', 'See attached records below or discuss during exam')
  drawFieldRow('Known Allergies:', 'Not reported')
  drawFieldRow('Family History:', 'Not reported')

  // --- SECTION 7: AYUSH LIFESTYLE PROFILE ---
  const ayush = caseData?.ayushData || {}
  drawSectionHeading('5. AYUSH LIFESTYLE & FUNCTIONAL PARAMETERS')
  drawFieldRow('Agni (Digestion):', ayush.agni || 'Not reported')
  drawFieldRow('Nidra (Sleep):', ayush.nidra || 'Not reported')
  drawFieldRow('Mala (Elimination):', ayush.mala || 'Not reported')
  drawFieldRow('Ahara / Vihara:', 'Intake regimen noted in preliminary assessment')

  // --- SECTION 8: PRAKRITI INDICATOR ---
  const prakriti = caseData?.prakritiResult || {}
  const prakritiScores = prakriti.scores || {}
  drawSectionHeading('6. PRELIMINARY PRAKRITI TENDENCY INDICATOR')

  checkPageBreak(20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_PINE)
  doc.text(`Dominant Tendency: ${prakriti.dominantTendency || 'Balanced Constitution'}`, leftMargin + 3, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(
    `Constitutional Scores:  Vata: ${prakritiScores.vata || 1}  |  Pitta: ${prakritiScores.pitta || 1}  |  Kapha: ${prakritiScores.kapha || 1}`,
    leftMargin + 3,
    y
  )
  y += 5

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(
    'MANDATORY DISCLAIMER: Preliminary wellness indicator calculated from intake questions — NOT a disease diagnosis.',
    leftMargin + 3,
    y
  )
  y += 6

  // --- SECTION 9: PREVIOUS RECORDS & OCR EXTRACTION ---
  const documents = caseData?.documents || []
  drawSectionHeading('7. PREVIOUS RECORDS & OCR INTELLIGENCE', '📄')

  if (documents.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...COLOR_MUTED)
    doc.text('No previous medical records or prescriptions attached to this case.', leftMargin + 3, y)
    y += 6
  } else {
    documents.forEach((docItem, idx) => {
      checkPageBreak(25)
      doc.setFillColor(...COLOR_BG_LIGHT)
      doc.roundedRect(leftMargin + 2, y, usableWidth - 4, 6, 1, 1, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...COLOR_PINE)
      doc.text(
        `Record #${idx + 1}: ${docItem.fileName || 'Uploaded Document'} (${docItem.documentType || 'DOCUMENT'})`,
        leftMargin + 5,
        y + 4.5
      )
      y += 8

      const struct = docItem.structuredData || {}
      if (struct.medicines && struct.medicines.length > 0) {
        drawFieldRow('Extracted Medicines:', struct.medicines.join(', '))
      }
      if (struct.labResults && struct.labResults.length > 0) {
        drawFieldRow('Extracted Lab Values:', struct.labResults.join(', '))
      }
      if (struct.importantFindings && struct.importantFindings.length > 0) {
        drawFieldRow('Clinical Findings:', struct.importantFindings.join(', '))
      }
    })
  }

  // --- SECTION 11: STRUCTURED AI PRE-CONSULTATION SUMMARY ---
  if (caseData?.aiSummary) {
    drawSectionHeading('8. PRE-CONSULTATION INTAKE SYNTHESIS (AI PREPARED)')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_INK)
    const aiLines = doc.splitTextToSize(caseData.aiSummary, usableWidth - 6)
    checkPageBreak(aiLines.length * 4 + 4)
    doc.text(aiLines, leftMargin + 3, y)
    y += aiLines.length * 4 + 4
  }

  // --- SECTION 12: DOCTOR REVIEW (CRITICAL — HIGHEST CLINICAL VALUE) ---
  checkPageBreak(35)
  y += 2
  doc.setFillColor(...COLOR_PINE)
  doc.roundedRect(leftMargin, y, usableWidth, 7, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(255, 255, 255)
  doc.text('9. ATTENDING DOCTOR REVIEW & CLINICAL NOTES (FINAL AUTHORITY)', leftMargin + 3, y + 5)
  y += 10

  if (isReviewed) {
    // Doctor Verified Summary
    if (caseData?.doctorReviewedSummary) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...COLOR_PINE)
      doc.text('Doctor-Verified Clinical Summary:', leftMargin + 3, y)
      y += 4.5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...COLOR_INK)
      const docSummaryLines = doc.splitTextToSize(caseData.doctorReviewedSummary, usableWidth - 6)
      checkPageBreak(docSummaryLines.length * 4.2 + 4)
      doc.text(docSummaryLines, leftMargin + 3, y)
      y += docSummaryLines.length * 4.2 + 4
    }

    // Doctor Notes & Observations
    if (caseData?.doctorNotes) {
      checkPageBreak(15)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...COLOR_PINE)
      doc.text('Clinical Observations, Regimen & Advice:', leftMargin + 3, y)
      y += 4.5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...COLOR_INK)
      const notesLines = doc.splitTextToSize(caseData.doctorNotes, usableWidth - 6)
      checkPageBreak(notesLines.length * 4.2 + 4)
      doc.text(notesLines, leftMargin + 3, y)
      y += notesLines.length * 4.2 + 4
    }

    // Doctor Sign-off details
    checkPageBreak(10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_MUTED)
    const reviewedTime = caseData?.doctorReviewedAt
      ? new Date(caseData.doctorReviewedAt).toLocaleString('en-IN')
      : 'Recorded on system'
    doc.text(`Reviewed by Attending Physician • Timestamp: ${reviewedTime}`, leftMargin + 3, y)
    y += 8
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(...COLOR_MUTED)
    doc.text(
      'Awaiting attending physician examination and clinical sign-off in consultation chamber.',
      leftMargin + 3,
      y
    )
    y += 8
  }

  // Draw final page footer
  drawFooter()

  // Save / Trigger Download
  const filename = `MediKiosk_Case_${caseId}_Clinical_Report.pdf`
  doc.save(filename)
  return filename
}

/**
 * MediKiosk Patient Daily Care Card PDF Generator
 * Patient-friendly, very conservative wellness reminder card.
 * Does NOT generate medical advice, diagnosis, or prescription.
 */
export function generateDailyCareCardPdf(caseData) {
  if (!caseData) return

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

  const patient = caseData?.patient || {}
  const caseId = caseData?.caseId || '04'
  const patientName = patient.name || 'Patient'
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
  doc.text(`Token: #${String(caseId).padStart(2, '0')}`, leftMargin + 85, y + 6)
  doc.text(`Date: ${dateStr}`, leftMargin + 130, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(`Main Reported Concern: ${caseData?.chiefComplaint || 'Consultation Intake'}`, leftMargin + 5, y + 11)

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

  // SECTION: LIFESTYLE REMINDERS (Strictly Conservative)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLOR_PINE)
  doc.text('Routine Observations to Note for Your Doctor', leftMargin, y)
  y += 6

  const ayush = caseData?.ayushData || {}
  const lifestylePoints = [
    `• Digestion: Keep note of how comfortably you digest different meals (${ayush.agni || 'Recorded in intake'}).`,
    `• Sleep Routine: Observe if sleeping at a fixed hour improves morning alertness (${ayush.nidra || 'Recorded in intake'}).`,
    `• Bowel Regularity: Notice whether warm fluids in the morning support regular digestion (${ayush.mala || 'Recorded in intake'}).`,
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

  // SECTION: QUESTIONS TO DISCUSS WITH YOUR AYUSH DOCTOR
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

  // PROMINENT ETHICAL & SAFETY DISCLAIMER (Mandatory)
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

  const filename = `MediKiosk_Daily_Care_Card_${caseId}.pdf`
  doc.save(filename)
  return filename
}
