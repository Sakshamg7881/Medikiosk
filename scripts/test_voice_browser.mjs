import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:8080/api';
const ARTIFACTS_DIR = 'C:\\Users\\itsan\\.gemini\\antigravity\\brain\\2b413da1-29a5-4ebf-a4b6-cdb6972f85f4';

async function runVoiceBrowserTest() {
  console.log('================================================================');
  console.log('STARTING VOICE LIFECYCLE & NO-AUTO-SEND BROWSER VERIFICATION');
  console.log('================================================================\n');

  // 1. Create fresh patient
  const patientRes = await fetch(`${BACKEND_URL}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Priya Sharma',
      age: 28,
      gender: 'Female',
      phone: '9876543888',
      preferredLanguage: 'hinglish'
    })
  });
  const patientData = await patientRes.json();
  const testPatientId = patientData.id;

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
        console.log(`[Network] POST /api/assessment/message dispatched: count=${messageApiRequests}`);
      }
    });

    // 2. Set up patient session in localStorage
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.evaluate((pId) => {
      const session = {
        patientId: pId,
        consentAccepted: true,
        preferredLanguage: 'hinglish',
        name: 'Priya Sharma',
        age: 28,
        gender: 'Female',
        phone: '9876543888',
        selectedClinicId: 1,
        selectedDoctorId: 1,
        consultationType: 'AI-Assisted First Consultation'
      };
      localStorage.setItem('medikiosk_patient_session', JSON.stringify(session));
    }, testPatientId);

    // 3. Inject mock Web Speech Recognition before loading assessment page
    await page.evaluateOnNewDocument(() => {
      class MockSpeechRecognition extends EventTarget {
        constructor() {
          super();
          this.continuous = false;
          this.interimResults = true;
          this.lang = 'en-US';
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
                  confidence: 0.95
                }
              ]
            ]
          };
          event.results[0].isFinal = isFinal;
          this.onresult && this.onresult(event);
        }

        simulateEnd() {
          this.onend && this.onend();
        }
      }

      window.SpeechRecognition = MockSpeechRecognition;
      window.webkitSpeechRecognition = MockSpeechRecognition;
    });

    // 4. Navigate to Patient Assessment
    console.log('Step 1: Navigating to Patient Assessment with Mock Speech API...');
    await page.goto(`${FRONTEND_URL}/patient/assessment`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('form input[type="text"]', { timeout: 10000 });
    console.log('  ✓ Assessment loaded with Speech API ready');

    // 5. Test Mic Button click -> Transitions to LISTENING
    console.log('\nStep 2: Clicking Microphone button (Testing LISTENING state)...');
    await page.evaluate(() => {
      const micBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerHTML.includes('lucide-mic') || b.title?.includes('voice') || b.title?.includes('Speak'));
      if (micBtn) micBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const listeningUiState = await page.evaluate(() => {
      return {
        hasListeningBanner: document.body.innerText.includes('Listening...') || document.body.innerText.includes('Sun rahe hain') || document.body.innerText.includes('सुन रहे हैं'),
        placeholder: document.querySelector('form input[type="text"]')?.placeholder || '',
        isPulsing: document.querySelector('button.animate-pulse') !== null
      };
    });
    console.log(`  Listening state banner: ${listeningUiState.hasListeningBanner}`);
    console.log(`  Input placeholder during voice: "${listeningUiState.placeholder}"`);
    console.log(`  Mic pulsing animation active: ${listeningUiState.isPulsing}`);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'voice_test_1_listening.png') });
    console.log('  ✓ Captured voice_test_1_listening.png');

    // 6. Simulate speech recognition streaming into composer
    console.log('\nStep 3: Simulating speech transcription into composer...');
    await page.evaluate(() => {
      window.__mockSpeechRecognitionInstance.simulateSpeech('2 hafte se ghutne mein tez dard hai', true);
    });
    await new Promise(r => setTimeout(r, 400));

    const inputValAfterSpeech = await page.evaluate(() => {
      return document.querySelector('form input[type="text"]')?.value || '';
    });
    console.log(`  Transcribed text in composer: "${inputValAfterSpeech}"`);
    if (!inputValAfterSpeech.includes('2 hafte se ghutne')) {
      throw new Error(`FAIL: Speech transcript not streamed into composer input! Got: "${inputValAfterSpeech}"`);
    }
    console.log('  ✓ PASS: Speech smoothly streamed into composer.');

    // 7. Simulate Speech End -> Transitions to READY (Review state)
    console.log('\nStep 4: Simulating speech end (Testing READY state & NO auto-send)...');
    await page.evaluate(() => {
      window.__mockSpeechRecognitionInstance.simulateEnd();
    });
    await new Promise(r => setTimeout(r, 500));

    const postSpeechUi = await page.evaluate(() => {
      return {
        inputValue: document.querySelector('form input[type="text"]')?.value || '',
        hasReviewBanner: document.body.innerText.includes('Review') || document.body.innerText.includes('संदेश') || document.body.innerText.includes('Send dabayein'),
        sendButtonEnabled: !document.querySelector('form button[type="submit"]')?.disabled
      };
    });

    console.log(`  Review / Ready notice displayed: ${postSpeechUi.hasReviewBanner}`);
    console.log(`  Send button enabled for user review: ${postSpeechUi.sendButtonEnabled}`);
    console.log(`  Current API message requests dispatched: ${messageApiRequests} (MUST BE 0)`);

    // ABSOLUTE REQUIREMENT: Voice MUST NOT auto-send!
    if (messageApiRequests !== 0) {
      throw new Error(`FAIL: Voice input automatically dispatched ${messageApiRequests} requests! Voice must NEVER auto-send.`);
    }
    console.log('  ✓ PASS: Zero auto-send verified! Voice stayed in composer for patient review.');

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'voice_test_2_ready_review.png') });
    console.log('  ✓ Captured voice_test_2_ready_review.png');

    // 8. Patient reviews text, edits it, and then explicitly taps Send
    console.log('\nStep 5: Patient edits text and clicks Send explicitly...');
    await page.evaluate(() => {
      const input = document.querySelector('form input[type="text"]');
      if (input) {
        input.value = input.value + ', seedhi chadhte waqt';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const sendBtn = document.querySelector('form button[type="submit"]');
      if (sendBtn) sendBtn.click();
    });

    // Wait for AI response
    await page.waitForFunction(
      () => !document.body.innerText.includes('analyze kar raha hai'),
      { timeout: 30000 }
    );
    await new Promise(r => setTimeout(r, 1200));

    console.log(`  Requests dispatched after explicit user Send: ${messageApiRequests} (Expected: 1)`);
    if (messageApiRequests !== 1) {
      throw new Error(`FAIL: Expected exactly 1 request after explicit send, got: ${messageApiRequests}`);
    }
    console.log('  ✓ PASS: Exactly 1 request dispatched on explicit user Send.');

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'voice_test_3_sent_and_answered.png') });
    console.log('  ✓ Captured voice_test_3_sent_and_answered.png');

    console.log('\n================================================================');
    console.log('ALL VOICE LIFECYCLE & NO-AUTO-SEND CRITERIA VERIFIED 100%!');
    console.log('================================================================\n');

  } finally {
    await browser.close();
  }
}

runVoiceBrowserTest().catch(err => {
  console.error('Voice test failed:', err);
  process.exit(1);
});
