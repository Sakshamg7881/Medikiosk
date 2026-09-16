const BASE_URL = 'http://localhost:8080/api';

async function runScenarioTests() {
  console.log('====================================================');
  console.log('STARTING 10-SCENARIO CLINICAL BRAIN VERIFICATION');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  // Helper to create patient
  async function createPatient(name, age, gender, phone, lang = 'hinglish') {
    const res = await fetch(`${BASE_URL}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, age, gender, phone, preferredLanguage: lang })
    });
    const data = await res.json();
    if (!data.id) {
      throw new Error(`Failed to create patient: ${JSON.stringify(data)}`);
    }
    return data.id;
  }

  // Helper to start assessment
  async function startAssessment(patientId, lang) {
    const res = await fetch(`${BASE_URL}/assessment/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, language: lang })
    });
    return await res.json();
  }

  // Helper to send message
  async function sendMessage(caseId, patientId, lang, msg) {
    const res = await fetch(`${BASE_URL}/assessment/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, patientId, language: lang, message: msg })
    });
    return await res.json();
  }

  // Helper to get case details
  async function getCase(caseId) {
    const res = await fetch(`${BASE_URL}/assessment/${caseId}`);
    return await res.json();
  }

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. SCENARIO 1: Simple pain (knee pain 2 weeks, duration not re-asked)
  try {
    console.log('\n--- Scenario 1: Simple pain with duration ---');
    const p1 = await createPatient('Rahul Sharma', 35, 'Male', '9810011111', 'hinglish');
    const s1 = await startAssessment(p1, 'hinglish');
    const m1 = await sendMessage(s1.caseId, p1, 'hinglish', 'Mujhe 2 hafte se ghutne mein dard ho raha hai');
    assert(!m1.message.toLowerCase().includes('kab se'), 'AI must NOT ask duration again');
    assert(m1.clinicalState.duration.includes('2 weeks') || m1.clinicalState.duration.includes('hafte'), 'Duration 2 weeks captured');
    passed++;
  } catch (err) {
    console.error('Scenario 1 failed:', err.message);
    failed++;
  }

  // 2. SCENARIO 2: Multiple symptoms with separate durations
  try {
    console.log('\n--- Scenario 2: Multiple symptoms & dual durations ---');
    const p2 = await createPatient('Ananya Roy', 29, 'Female', '9810022222', 'hinglish');
    const s2 = await startAssessment(p2, 'hinglish');
    const m2 = await sendMessage(s2.caseId, p2, 'hinglish', '2 din se fever ho rha or 5 din se jukham');
    assert(m2.clinicalState.symptoms && m2.clinicalState.symptoms.length >= 2, 'Captured at least 2 distinct symptoms');
    assert(!m2.message.toLowerCase().includes('kab se'), 'AI must not re-ask duration for known symptoms');
    passed++;
  } catch (err) {
    console.error('Scenario 2 failed:', err.message);
    failed++;
  }

  // 3. SCENARIO 3: Hinglish stomach burning with postprandial trigger
  try {
    console.log('\n--- Scenario 3: Hinglish stomach burning + postprandial trigger ---');
    const p3 = await createPatient('Sunil Verma', 44, 'Male', '9810033333', 'hinglish');
    const s3 = await startAssessment(p3, 'hinglish');
    const m3 = await sendMessage(s3.caseId, p3, 'hinglish', 'pet me jalan ho rahi hai khana khane ke baad se');
    assert(m3.clinicalState.aggravatingFactors.toLowerCase().includes('khana') || m3.clinicalState.aggravatingFactors.toLowerCase().includes('meal'), 'Captured postprandial meal trigger');
    passed++;
  } catch (err) {
    console.error('Scenario 3 failed:', err.message);
    failed++;
  }

  // 4. SCENARIO 4: Hindi Devanagari script authority
  try {
    console.log('\n--- Scenario 4: Hindi Devanagari script authority ---');
    const p4 = await createPatient('सुनीता देवी', 50, 'Female', '9810044444', 'hi');
    const s4 = await startAssessment(p4, 'hi');
    const m4 = await sendMessage(s4.caseId, p4, 'hi', 'मुझे तीन दिन से सिर दर्द है');
    assert(/[\u0900-\u097F]/.test(m4.message), 'Response contains Devanagari Hindi characters');
    assert(!m4.message.toLowerCase().includes('where exactly'), 'Response is not English');
    passed++;
  } catch (err) {
    console.error('Scenario 4 failed:', err.message);
    failed++;
  }

  // 5. SCENARIO 5: Patient correction overrides previous value
  try {
    console.log('\n--- Scenario 5: Patient correction overrides previous value ---');
    const p5 = await createPatient('Aakash Mehra', 25, 'Male', '9810055555', 'hinglish');
    const s5 = await startAssessment(p5, 'hinglish');
    await sendMessage(s5.caseId, p5, 'hinglish', 'Ye bukhar 2 din se hai');
    const m5_2 = await sendMessage(s5.caseId, p5, 'hinglish', 'Actually 5 din se hai');
    assert(m5_2.clinicalState.duration.includes('5 days') || m5_2.clinicalState.duration.includes('5 din'), 'Overwrote duration to 5 days');
    assert(m5_2.clinicalState.provenance && m5_2.clinicalState.provenance.duration === 'PATIENT_CORRECTED', 'Flagged with PATIENT_CORRECTED provenance');
    passed++;
  } catch (err) {
    console.error('Scenario 5 failed:', err.message);
    failed++;
  }

  // 6. SCENARIO 6: Anti-repetition guard
  try {
    console.log('\n--- Scenario 6: Anti-repetition on pre-answered fields ---');
    const p6 = await createPatient('Pooja Nair', 38, 'Female', '9810066666', 'hinglish');
    const s6 = await startAssessment(p6, 'hinglish');
    const m6 = await sendMessage(s6.caseId, p6, 'hinglish', 'Sar dard ho raha teen din se');
    const q1 = m6.message;
    const m6_2 = await sendMessage(s6.caseId, p6, 'hinglish', 'Moderate (5-6)');
    const q2 = m6_2.message;
    assert(q1.trim() !== q2.trim(), 'AI must never repeat the exact same question');
    assert(!q2.includes('0 se 10'), 'AI must not re-ask severity');
    passed++;
  } catch (err) {
    console.error('Scenario 6 failed:', err.message);
    failed++;
  }

  // 7. SCENARIO 7: Red flag safety advisory immediate detection
  try {
    console.log('\n--- Scenario 7: Immediate red flag detection & safety advisory ---');
    const p7 = await createPatient('Manoj Kumar', 55, 'Male', '9810077777', 'hinglish');
    const s7 = await startAssessment(p7, 'hinglish');
    const m7 = await sendMessage(s7.caseId, p7, 'hinglish', 'chest pain ke saath saans lene mein bahut dikkat ho rahi hai');
    assert(m7.redFlagDetected === true, 'Red flag detected boolean is true');
    assert(m7.message.includes('⚠️'), 'Safety advisory alert present in message');
    passed++;
  } catch (err) {
    console.error('Scenario 7 failed:', err.message);
    failed++;
  }

  // 8. SCENARIO 8: Volunteered AYUSH information captured and not re-asked
  try {
    console.log('\n--- Scenario 8: Naturally volunteered AYUSH info captured ---');
    const p8 = await createPatient('Kavita Joshi', 31, 'Female', '9810088888', 'hinglish');
    const s8 = await startAssessment(p8, 'hinglish');
    const m8 = await sendMessage(s8.caseId, p8, 'hinglish', 'pet kharab rehta hai, bhookh bilkul nahi lagti aur neend bhi theek se nahi aati');
    assert(m8.clinicalState.ayushAgni !== null, 'Agni dimension captured');
    assert(m8.clinicalState.ayushNidra !== null, 'Nidra dimension captured');
    const nextMsg = m8.message.toLowerCase();
    assert(!nextMsg.includes('bhookh') && !nextMsg.includes('appetite'), 'Did not re-ask Agni/bhookh');
    assert(!nextMsg.includes('neend') && !nextMsg.includes('sleep'), 'Did not re-ask Nidra/neend');
    passed++;
  } catch (err) {
    console.error('Scenario 8 failed:', err.message);
    failed++;
  }

  // 9. SCENARIO 9: Long natural paragraph parsing
  try {
    console.log('\n--- Scenario 9: Long natural paragraph parsing ---');
    const p9 = await createPatient('Deepak Chawla', 40, 'Male', '9810099999', 'hinglish');
    const s9 = await startAssessment(p9, 'hinglish');
    const m9 = await sendMessage(s9.caseId, p9, 'hinglish', 'Mujhe 3 din se tez bukhar hai aur sath me sukhi khansi bhi hai. Maine subah paracetamol li thi par aaram nahi hua. Koi allergy nahi hai aur main desk job karta hoon.');
    assert(m9.clinicalState.currentMedicines && m9.clinicalState.currentMedicines.includes('Paracetamol'), 'Extracted Paracetamol');
    assert(m9.clinicalState.allergies && m9.clinicalState.allergies.toLowerCase().includes('no known'), 'Extracted no allergies');
    assert(m9.clinicalState.personalLifestyle && m9.clinicalState.personalLifestyle.toLowerCase().includes('desk job'), 'Extracted desk job lifestyle');
    passed++;
  } catch (err) {
    console.error('Scenario 9 failed:', err.message);
    failed++;
  }

  // 10. SCENARIO 10: Strict language lock against English loanwords & Devanagari adapt
  try {
    console.log('\n--- Scenario 10: Strict language lock against loanwords & Devanagari adapt ---');
    const p10 = await createPatient('Sneha Saxena', 27, 'Female', '9810010101', 'hinglish');
    const s10 = await startAssessment(p10, 'hinglish');
    const m10_1 = await sendMessage(s10.caseId, p10, 'hinglish', 'Mujhe fever hai and maine paracetamol li thi, pain moderate hai');
    assert(m10_1.language === 'hinglish', 'Language stayed hinglish despite loanwords fever/paracetamol/moderate');
    const m10_2 = await sendMessage(s10.caseId, p10, 'hinglish', 'कृपया मुझे बताएं कि आगे क्या करना चाहिए');
    assert(m10_2.language === 'hi', 'Dynamic adaptation to hi on genuine Devanagari script');
    passed++;
  } catch (err) {
    console.error('Scenario 10 failed:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runScenarioTests().catch(err => {
  console.error('Fatal error running scenario tests:', err);
  process.exit(1);
});
