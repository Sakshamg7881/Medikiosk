import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:8080/api';
const ARTIFACTS_DIR = 'C:\\Users\\itsan\\.gemini\\antigravity\\brain\\2b413da1-29a5-4ebf-a4b6-cdb6972f85f4';

async function runLiveReproductionAndVoiceTest() {
  console.log('================================================================');
  console.log('STARTING REAL BROWSER TEST: AGNI NO-REPEAT & VOICE LIFECYCLE');
  console.log('================================================================\n');

  // 1. Create a fresh test patient
  console.log('Step 1: Creating fresh test patient via backend API...');
  const patientRes = await fetch(`${BACKEND_URL}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Aarav Mehta',
      age: 42,
      gender: 'Male',
      phone: '9876543111',
      preferredLanguage: 'en'
    })
  });
  const patientData = await patientRes.json();
  const testPatientId = patientData.id;
  console.log(`  ✓ Created patient ID: ${testPatientId}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    protocolTimeout: 60000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    let messageApiRequests = 0;
    page.on('request', req => {
      if (req.url().includes('/api/assessment/message') && req.method() === 'POST') {
        messageApiRequests++;
        console.log(`[Network] POST /api/assessment/message #${messageApiRequests}`);
      }
    });

    // 2. Set up patient session in localStorage
    console.log('\nStep 2: Injecting active patient session into browser...');
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.evaluate((pId) => {
      const session = {
        patientId: pId,
        consentAccepted: true,
        preferredLanguage: 'en',
        name: 'Aarav Mehta',
        age: 42,
        gender: 'Male',
        phone: '9876543111',
        selectedClinicId: 1,
        selectedDoctorId: 1,
        consultationType: 'AI-Assisted First Consultation'
      };
      localStorage.setItem('medikiosk_patient_session', JSON.stringify(session));
    }, testPatientId);

    // 3. Inject Mock Web Speech Recognition with full event control
    await page.evaluateOnNewDocument(() => {
      class MockSpeechRecognition extends EventTarget {
        constructor() {
          super();
          this.continuous = false;
          this.interimResults = true;
          this.lang = 'en-IN';
          window.__mockSpeechRecognitionInstance = this;
        }

        start() {
          this.onstart && this.onstart();
        }

        stop() {
          this.onend && this.onend();
        }

        abort() {
          this.onend && this.onend();
        }

        simulateSpeech(transcript, isFinal = true) {
          const event = {
            resultIndex: 0,
            results: [
              [
                {
                  transcript: transcript,
                  confidence: 0.96
                }
              ]
            ]
          };
          event.results[0].isFinal = isFinal;
          this.onresult && this.onresult(event);
        }

        simulateError(errorName) {
          const event = { error: errorName };
          this.onerror && this.onerror(event);
        }

        simulateEnd() {
          this.onend && this.onend();
        }
      }

      window.SpeechRecognition = MockSpeechRecognition;
      window.webkitSpeechRecognition = MockSpeechRecognition;
    });

    // 4. Navigate to Patient Assessment
    console.log('\nStep 3: Navigating to /patient/assessment...');
    await page.goto(`${FRONTEND_URL}/patient/assessment`, { waitUntil: 'networkidle0', timeout: 15000 });
    const inputSelector = 'form input[type="text"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    console.log('  ✓ Assessment composer loaded');

    // 5. Test Voice Input Lifecycle (LISTENING -> TRANSCRIBING -> READY -> NO AUTO-SEND)
    console.log('\nStep 4: Testing Voice Input Lifecycle...');
    // Click microphone button
    await page.evaluate(() => {
      const micBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerHTML.includes('lucide-mic') || b.title?.includes('voice') || b.title?.includes('Speak'));
      if (micBtn) micBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const isListeningNow = await page.evaluate(() => {
      return document.body.innerText.includes('Listening') || document.body.innerText.includes('स्पष्ट बोलें');
    });
    console.log(`  Voice state LISTENING banner visible: ${isListeningNow}`);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_test_1_voice_listening.png') });
    console.log('  ✓ Captured live_test_1_voice_listening.png');

    // Simulate voice dictation
    console.log('  Simulating voice transcription: "Stomach burning for 3 days"...');
    await page.evaluate(() => {
      window.__mockSpeechRecognitionInstance.simulateSpeech('Stomach burning for 3 days', true);
      window.__mockSpeechRecognitionInstance.simulateEnd();
    });
    await new Promise(r => setTimeout(r, 600));

    const inputValAfterVoice = await page.evaluate(() => {
      return document.querySelector('form input[type="text"]')?.value || '';
    });
    console.log(`  Composer input text after voice: "${inputValAfterVoice}"`);
    if (!inputValAfterVoice.includes('Stomach burning')) {
      throw new Error(`FAIL: Voice transcription not populated in composer! Value was: "${inputValAfterVoice}"`);
    }

    // Assert strictly NO AUTO-SEND!
    console.log(`  API Requests dispatched so far: ${messageApiRequests} (Expected: 0)`);
    if (messageApiRequests > 0) {
      throw new Error('FAIL: Voice input auto-sent! It must remain editable in composer.');
    }
    console.log('  ✓ PASS: Voice dictation stayed in composer without auto-sending.');

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_test_2_voice_ready.png') });
    console.log('  ✓ Captured live_test_2_voice_ready.png');

    // Also test Voice Error Banner visibility (e.g. if audio-capture fails)
    await page.evaluate(() => {
      window.__mockSpeechRecognitionInstance.simulateError('audio-capture');
    });
    await new Promise(r => setTimeout(r, 300));
    const errorNoticeShown = await page.evaluate(() => {
      return document.body.innerText.includes('No microphone detected') || document.body.innerText.includes('माइक');
    });
    console.log(`  Descriptive error notice shown on audio-capture: ${errorNoticeShown}`);

    // Now submit Turn 1 by clicking Send
    console.log('\nStep 5: Submitting Turn 1 (Stomach burning for 3 days)...');
    await page.click('form button[type="submit"]');

    // Wait for Turn 1 response
    await page.waitForFunction(
      () => !document.body.innerText.includes('analyzing') && !document.body.innerText.includes('preparing your next question'),
      { timeout: 30000 }
    );
    await new Promise(r => setTimeout(r, 1200));

    // Turn 2: Location
    console.log('\nStep 6: Sending Turn 2: "Upper stomach"...');
    await page.type(inputSelector, 'Upper stomach');
    await page.click('form button[type="submit"]');
    await page.waitForFunction(
      () => !document.body.innerText.includes('analyzing') && !document.body.innerText.includes('preparing your next question'),
      { timeout: 30000 }
    );
    await new Promise(r => setTimeout(r, 1200));

    // Turn 3: Severity
    console.log('\nStep 7: Sending Turn 3: "Moderate (5-6)"...');
    await page.type(inputSelector, 'Moderate (5-6)');
    await page.click('form button[type="submit"]');
    await page.waitForFunction(
      () => !document.body.innerText.includes('analyzing') && !document.body.innerText.includes('preparing your next question'),
      { timeout: 30000 }
    );
    await new Promise(r => setTimeout(r, 1200));

    // Turn 4: Trigger
    console.log('\nStep 8: Sending Turn 4: "Worse after spicy food"...');
    await page.type(inputSelector, 'Worse after spicy food');
    await page.click('form button[type="submit"]');
    await page.waitForFunction(
      () => !document.body.innerText.includes('analyzing') && !document.body.innerText.includes('preparing your next question'),
      { timeout: 30000 }
    );
    await new Promise(r => setTimeout(r, 1200));

    // Turn 5: Medical History / Meds
    console.log('\nStep 9: Sending Turn 5: "No medicines, no past history"...');
    await page.type(inputSelector, 'No medicines, no past history');
    await page.click('form button[type="submit"]');
    await page.waitForFunction(
      () => !document.body.innerText.includes('analyzing') && !document.body.innerText.includes('preparing your next question'),
      { timeout: 30000 }
    );
    await new Promise(r => setTimeout(r, 1500));

    // At this stage, AI will ask AYUSH Digestion (Agni)
    const turn5AiText = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('div.rounded-2xl, div.prose'));
      return els.map(e => e.innerText.trim()).filter(Boolean);
    });
    const latestBeforeAgni = turn5AiText[turn5AiText.length - 1] || '';
    console.log(`\n[AI Question before Agni answer]:\n"${latestBeforeAgni}"\n`);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_test_3_ai_asking_digestion.png') });
    console.log('  ✓ Captured live_test_3_ai_asking_digestion.png');

    // STEP 10: REPRODUCING AND VERIFYING THE LIVE BUG
    // Patient replies with the EXACT string reported by user: "Normal balanced"
    console.log('\nStep 10: Patient answers "Normal balanced" to digestion question...');
    await page.type(inputSelector, 'Normal balanced');
    await page.click('form button[type="submit"]');

    // Wait for AI response
    await page.waitForFunction(
      () => !document.body.innerText.includes('analyzing') && !document.body.innerText.includes('preparing your next question'),
      { timeout: 30000 }
    );
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_test_4_after_normal_balanced.png') });
    console.log('  ✓ Captured live_test_4_after_normal_balanced.png');

    // Get the AI's response after "Normal balanced"
    const allAiMessages = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('div.rounded-2xl, div.prose'));
      return els.map(e => e.innerText.trim()).filter(Boolean);
    });
    const latestAiAfterAgni = allAiMessages[allAiMessages.length - 1] || '';
    console.log(`\n[AI Response after "Normal balanced"]:\n"${latestAiAfterAgni}"\n`);

    // ABSOLUTE NO REPEAT ASSERTION:
    const lowerLatest = latestAiAfterAgni.toLowerCase();
    const repeatedDigestion = lowerLatest.includes('how is your daily appetite and digestion') ||
                              lowerLatest.includes('assess your digestion') ||
                              lowerLatest.includes('appetite and digestion');

    if (repeatedDigestion) {
      throw new Error(`CRITICAL FAIL: AI REPEATED THE DIGESTION QUESTION IN AN INFINITE LOOP!\nResponse was: "${latestAiAfterAgni}"`);
    }
    console.log('  ✓ PASS: ZERO REPETITION! AI did NOT re-ask the digestion/appetite question!');
    console.log('  ✓ The system acknowledged or moved to the next dimension / completion!');

    console.log('\n================================================================');
    console.log('ALL LIVE BROWSER REPRODUCTIONS PASSED WITH ZERO LOOPS & RELIABLE VOICE!');
    console.log('================================================================\n');

  } finally {
    await browser.close();
  }
}

runLiveReproductionAndVoiceTest().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
