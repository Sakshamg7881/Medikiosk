import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:8080/api';
const ARTIFACTS_DIR = 'C:\\Users\\itsan\\.gemini\\antigravity\\brain\\2b413da1-29a5-4ebf-a4b6-cdb6972f85f4';

async function runZeroRepeatBrowserTest() {
  console.log('================================================================');
  console.log('STARTING ZERO-REPEAT QUESTION ENGINE & VOICE E2E BROWSER TEST');
  console.log('================================================================\n');

  // 1. Create a fresh test patient via backend API
  console.log('Step 1: Creating fresh test patient via backend API...');
  const patientRes = await fetch(`${BACKEND_URL}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Sharma',
      age: 34,
      gender: 'Male',
      phone: '9876543999',
      preferredLanguage: 'hinglish'
    })
  });
  const patientData = await patientRes.json();
  const testPatientId = patientData.id;
  console.log(`  ✓ Created patient ID: ${testPatientId}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    protocolTimeout: 60000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--use-fake-ui-for-media-stream'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    let assessmentMessageRequests = 0;
    page.on('request', req => {
      if (req.url().includes('/api/assessment/message') && req.method() === 'POST') {
        assessmentMessageRequests++;
        console.log(`[Network] POST /api/assessment/message #${assessmentMessageRequests}`);
      }
    });

    // 2. Set up patient session in localStorage
    console.log('\nStep 2: Injecting active patient session into browser...');
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.evaluate((pId) => {
      const session = {
        patientId: pId,
        consentAccepted: true,
        preferredLanguage: 'hinglish',
        name: 'Rohan Sharma',
        age: 34,
        gender: 'Male',
        phone: '9876543999',
        selectedClinicId: 1,
        selectedDoctorId: 1,
        consultationType: 'AI-Assisted First Consultation'
      };
      localStorage.setItem('medikiosk_patient_session', JSON.stringify(session));
    }, testPatientId);

    // 3. Navigate to Patient Assessment
    console.log('\nStep 3: Navigating to /patient/assessment...');
    await page.goto(`${FRONTEND_URL}/patient/assessment`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    const currentUrl = page.url();
    const pageText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    console.log(`  Current URL: ${currentUrl}`);
    console.log(`  Page Text Preview: ${pageText.replace(/\n+/g, ' ')}`);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'browser_debug_assessment.png') });
    console.log('  Captured browser_debug_assessment.png');

    // Wait for the composer input
    const inputSelector = 'form input[type="text"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    console.log('  ✓ Assessment composer loaded successfully');

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'browser_test_assessment_start.png') });
    console.log('  ✓ Captured browser_test_assessment_start.png');

    // 4. Test Zero-Repeat Engine: Patient sends "2 hafte se knee pain hai"
    console.log('\nStep 4: Testing Zero-Repeat Gate - Patient sends "2 hafte se knee pain hai"...');
    await page.type(inputSelector, '2 hafte se knee pain hai');

    // Click Send
    await page.click('form button[type="submit"]');

    // Wait for AI response to arrive
    console.log('  Waiting for clinical brain response...');
    await page.waitForFunction(
      () => !document.body.innerText.includes('analyze kar raha hai'),
      { timeout: 30000 }
    );
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'browser_test_turn1_no_duration_repeat.png') });
    console.log('  ✓ Captured browser_test_turn1_no_duration_repeat.png');

    // Extract all assistant messages
    const aiMessageTexts = await page.evaluate(() => {
      // Find all message containers rendered for assistant (left aligned)
      const els = Array.from(document.querySelectorAll('.prose, p.text-sm, div.rounded-2xl'));
      return els.map(e => e.innerText.trim()).filter(Boolean);
    });

    const candidateReplies = aiMessageTexts.filter(txt => 
      !txt.includes('2 hafte se knee pain hai') && 
      !txt.includes('Namaste. Aaj aapko') &&
      !txt.includes('MediKiosk AI pre-consultation') &&
      txt.length > 10
    );
    const latestAiMessage = candidateReplies[candidateReplies.length - 1] || '';
    console.log(`\n[AI Clinical Question Turn 1]:\n"${latestAiMessage}"\n`);

    const lower = latestAiMessage.toLowerCase();
    // Zero-repeat assertion: Must NOT ask for duration
    const reAskedDuration = lower.includes('kab se') || 
                            lower.includes('how long') || 
                            lower.includes('kitne din') ||
                            lower.includes('kitne hafte');

    if (reAskedDuration) {
      throw new Error(`FAIL: AI repeated the duration question! Response: "${latestAiMessage}"`);
    }
    console.log('  ✓ PASS: Zero-repeat gate active! Duration question was NOT asked because "2 hafte" is known.');

    // 5. Test Quick Reply Buttons & In-Flight Lock
    console.log('\nStep 5: Verifying Quick Reply buttons and In-Flight Locks...');
    const quickButtons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const options = btns.filter(b => 
        b.className.includes('rounded') && 
        !b.innerText.includes('Send') && 
        !b.innerText.includes('Back') && 
        !b.innerText.includes('Help') &&
        !['हिंदी', 'Hinglish', 'English'].includes(b.innerText.trim()) &&
        b.innerText.length > 1
      );
      return options.map(b => b.innerText);
    });
    console.log(`  Quick Reply options rendered: ${JSON.stringify(quickButtons.slice(0, 4))}`);

    if (quickButtons.length > 0) {
      // Click the first quick option and test rapid double-click guard
      const reqCountBefore = assessmentMessageRequests;
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const opt = btns.find(b => 
          b.className.includes('rounded') && 
          !b.innerText.includes('Send') && 
          !b.innerText.includes('Back') && 
          !b.innerText.includes('Help') &&
          !['हिंदी', 'Hinglish', 'English'].includes(b.innerText.trim()) &&
          b.innerText.length > 1
        );
        if (opt) {
          opt.click();
          opt.click(); // Immediate double click attempt
        }
      });

      // Wait for turn 2 response
      await page.waitForFunction(
        () => !document.body.innerText.includes('analyze kar raha hai'),
        { timeout: 30000 }
      );
      await new Promise(r => setTimeout(r, 1200));

      const reqCountAfter = assessmentMessageRequests;
      console.log(`  Requests dispatched during quick reply click: ${reqCountAfter - reqCountBefore} (Expected: 1)`);
      if ((reqCountAfter - reqCountBefore) > 1) {
        throw new Error(`FAIL: In-flight lock failed! Dispatched ${reqCountAfter - reqCountBefore} requests.`);
      }
      console.log('  ✓ PASS: In-flight single submission lock strictly enforced on Quick Replies!');

      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'browser_test_turn2_quick_reply.png') });
      console.log('  ✓ Captured browser_test_turn2_quick_reply.png');
    }

    // 6. Test Voice UI Lifecycle (Microphone state)
    console.log('\nStep 6: Verifying Voice UI Microphone controls & banner...');
    const voiceControls = await page.evaluate(() => {
      const micBtn = document.querySelector('button[aria-label*="mic" i], button[title*="voice" i], button[aria-label*="voice" i]') ||
                     Array.from(document.querySelectorAll('button')).find(b => b.innerHTML.includes('lucide-mic') || b.innerHTML.includes('Mic'));
      return {
        hasMicButton: !!micBtn,
        micDisabled: micBtn?.disabled || false
      };
    });
    console.log(`  Mic Button Present: ${voiceControls.hasMicButton}`);
    if (!voiceControls.hasMicButton) {
      throw new Error('FAIL: Microphone button not found in the composer!');
    }
    console.log('  ✓ PASS: Voice UI controls verified in composer.');

    console.log('\n================================================================');
    console.log('ALL BROWSER E2E TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');

  } finally {
    await browser.close();
  }
}

runZeroRepeatBrowserTest().catch(err => {
  console.error('Browser test failed:', err);
  process.exit(1);
});
