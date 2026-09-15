import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRONTEND_URL = 'http://localhost:5173';
const ARTIFACTS_DIR = 'C:\\Users\\itsan\\.gemini\\antigravity\\brain\\2b413da1-29a5-4ebf-a4b6-cdb6972f85f4';

async function runWelcomeAndAssetsVerification() {
  console.log('====================================================');
  console.log('STARTING WELCOME ANIMATION & APPROVED ASSETS TEST');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Initial Load: Check Welcome Animation Sequence
    console.log('1. Loading landing page for the first time...');
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Confirm splash screen is visible immediately
    let splashVisible = await page.evaluate(() => {
      const splash = document.querySelector('[aria-label="Welcome to MediKiosk"]');
      return splash !== null && window.getComputedStyle(splash).display !== 'none';
    });
    console.log(`Splash screen visible on initial load: ${splashVisible}`);
    if (!splashVisible) {
      throw new Error('FAIL: Welcome splash screen was not rendered on initial load!');
    }

    // Capture screenshot of the active welcome animation
    await new Promise(r => setTimeout(r, 1200));
    const splashScreenshot = path.join(ARTIFACTS_DIR, 'welcome_animation_active.png');
    await page.screenshot({ path: splashScreenshot });
    console.log(`[PASS] Welcome animation screenshot saved: ${splashScreenshot}`);

    // Wait for the full animation to complete and transition to landing page (~3.5s)
    await new Promise(r => setTimeout(r, 2600));

    // Confirm splash screen has exited
    let splashExited = await page.evaluate(() => {
      const splash = document.querySelector('[aria-label="Welcome to MediKiosk"]');
      return splash === null;
    });
    console.log(`Splash screen smoothly exited: ${splashExited}`);
    if (!splashExited) {
      throw new Error('FAIL: Welcome splash screen did not exit after ~3.5 seconds!');
    }

    // 2. Client-side Navigation to /patient/login -> Splash MUST NOT appear
    console.log('\n2. Testing client-side navigation to /patient/login...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const btn = links.find(a => a.textContent.includes('Continue as Patient'));
      if (btn) btn.click();
    });
    await page.waitForFunction(() => window.location.pathname === '/patient/login', { timeout: 8000 });
    console.log(`Navigated client-side to: ${page.url()}`);

    let splashOnPatientLogin = await page.evaluate(() => {
      return document.querySelector('[aria-label="Welcome to MediKiosk"]') !== null;
    });
    console.log(`[CHECK] Splash present on /patient/login: ${splashOnPatientLogin}`);
    if (splashOnPatientLogin) {
      throw new Error('FAIL: Splash appeared unexpectedly on /patient/login!');
    }

    // 3. Return to Home via Logo Click -> Splash MUST NOT appear
    console.log('\n3. Clicking logo to return client-side to Home (/)...\nSplash MUST NOT appear!');
    await page.evaluate(() => {
      const logoLink = document.querySelector('a[href="/"]');
      if (logoLink) logoLink.click();
    });
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 8000 });
    console.log(`Navigated back to Home: ${page.url()}`);

    // Check immediately and after 1 second
    let splashOnReturnToHome = await page.evaluate(() => {
      return document.querySelector('[aria-label="Welcome to MediKiosk"]') !== null;
    });
    console.log(`[CHECK] Splash visible immediately after returning to Home: ${splashOnReturnToHome}`);
    await new Promise(r => setTimeout(r, 1000));
    splashOnReturnToHome = await page.evaluate(() => {
      return document.querySelector('[aria-label="Welcome to MediKiosk"]') !== null;
    });
    console.log(`[CHECK] Splash visible 1s after returning to Home: ${splashOnReturnToHome}`);
    if (splashOnReturnToHome) {
      throw new Error('FAIL: Splash animation appeared when navigating back to Home client-side!');
    }
    console.log('[PASS] Splash animation did NOT appear on client-side route return to Home!');

    // 4. Test Browser Refresh on '/' -> Splash MUST replay!
    console.log('\n4. Performing Browser Refresh (page.reload()) on Home (/)...\nSplash MUST replay!');
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });

    splashVisible = await page.evaluate(() => {
      const splash = document.querySelector('[aria-label="Welcome to MediKiosk"]');
      return splash !== null && window.getComputedStyle(splash).display !== 'none';
    });
    console.log(`[CHECK] Splash screen visible on browser refresh of /: ${splashVisible}`);
    if (!splashVisible) {
      throw new Error('FAIL: Splash animation did NOT replay on browser refresh of /!');
    }
    console.log('[PASS] Splash animation successfully replayed on browser refresh!');

    // Wait for splash to finish (~2.7s)
    await new Promise(r => setTimeout(r, 3000));

    // 5. Browser Refresh on Non-Root Page (/patient/login) -> NO Splash Over Page
    console.log('\n5. Navigating to /patient/login and performing browser refresh...');
    await page.goto(`${FRONTEND_URL}/patient/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });

    const splashOnReloadNonRoot = await page.evaluate(() => {
      return document.querySelector('[aria-label="Welcome to MediKiosk"]') !== null;
    });
    console.log(`[CHECK] Splash present on reload of /patient/login: ${splashOnReloadNonRoot}`);
    if (splashOnReloadNonRoot) {
      throw new Error('FAIL: Splash animation was forced over /patient/login on browser refresh!');
    }
    console.log('[PASS] Splash did NOT appear on /patient/login browser reload!');

    // Navigate client-side from reloaded /patient/login back to Home
    console.log('Navigating client-side from reloaded /patient/login back to Home (/)...');
    await page.evaluate(() => {
      const logoLink = document.querySelector('a[href="/"]');
      if (logoLink) logoLink.click();
    });
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1000));

    const splashAfterReloadAndNavigate = await page.evaluate(() => {
      return document.querySelector('[aria-label="Welcome to MediKiosk"]') !== null;
    });
    if (splashAfterReloadAndNavigate) {
      throw new Error('FAIL: Splash appeared when navigating to Home after non-root reload!');
    }
    console.log('[PASS] Splash did NOT appear when navigating to Home after non-root reload!');

    // 6. Verify Stylish Brand Texts (Real HTML Text — NOT images)
    console.log('\n6. Verifying stylish brand text typography...');
    const brandTexts = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      const p1 = allElements.find(e => e.children.length === 0 && e.textContent.includes('Same You,'));
      const p2 = allElements.find(e => e.children.length === 0 && e.textContent.includes('Rooted in Wisdom.'));

      return {
        p1Found: !!p1,
        p1Selectable: p1 ? window.getComputedStyle(p1.closest('.select-text') || p1).userSelect !== 'none' : false,
        p1Text: p1 ? (p1.closest('.select-text') || p1).textContent.trim() : null,
        p2Found: !!p2,
        p2Selectable: p2 ? window.getComputedStyle(p2.closest('.select-text') || p2).userSelect !== 'none' : false,
        p2Text: p2 ? (p2.closest('.select-text') || p2).textContent.trim() : null,
      };
    });

    console.log('Phrase 1 status:', { found: brandTexts.p1Found, selectable: brandTexts.p1Selectable, text: brandTexts.p1Text });
    console.log('Phrase 2 status:', { found: brandTexts.p2Found, selectable: brandTexts.p2Selectable, text: brandTexts.p2Text });
    if (!brandTexts.p1Found || !brandTexts.p1Selectable) {
      throw new Error('FAIL: Phrase 1 ("Same You, A Healthier Tomorrow") is not selectable HTML text!');
    }
    if (!brandTexts.p2Found || !brandTexts.p2Selectable) {
      throw new Error('FAIL: Phrase 2 ("Rooted in Wisdom. Built for What’s Next.") is not selectable HTML text!');
    }
    console.log('[PASS] Both brand phrases are genuine, selectable, styled HTML text!');

    // 7. Desktop Layout & Screenshot
    console.log('\n7. Scrolling to trigger in-view animations and capturing Desktop Screenshot...');
    await page.evaluate(async () => {
      const p2 = Array.from(document.querySelectorAll('*')).find(e => e.children.length === 0 && e.textContent.includes('Rooted in Wisdom.'));
      if (p2) p2.scrollIntoView({ block: 'center' });
      await new Promise(r => setTimeout(r, 500));
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 600));

    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`Desktop (1440px) horizontal overflow: ${desktopOverflow}`);
    if (desktopOverflow) {
      throw new Error('FAIL: Desktop layout has horizontal overflow!');
    }
    const desktopScreenshot = path.join(ARTIFACTS_DIR, 'landing_approved_assets_desktop.png');
    await page.screenshot({ path: desktopScreenshot, fullPage: true });
    console.log(`[PASS] Desktop screenshot with approved assets saved: ${desktopScreenshot}`);

    // 8. Mobile 375px Layout & Screenshot
    console.log('\n8. Checking Mobile Viewport (375 x 812)...');
    await page.setViewport({ width: 375, height: 812 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
    // Wait for animation to finish on mobile
    await new Promise(r => setTimeout(r, 3200));

    await page.evaluate(async () => {
      const p2 = Array.from(document.querySelectorAll('*')).find(e => e.children.length === 0 && e.textContent.includes('Rooted in Wisdom.'));
      if (p2) p2.scrollIntoView({ block: 'center' });
      await new Promise(r => setTimeout(r, 600));
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 600));

    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`Mobile (375px) horizontal overflow: ${mobileOverflow}`);
    if (mobileOverflow) {
      throw new Error('FAIL: Mobile layout has horizontal overflow!');
    }
    const mobileScreenshot = path.join(ARTIFACTS_DIR, 'landing_approved_assets_mobile.png');
    await page.screenshot({ path: mobileScreenshot, fullPage: true });
    console.log(`[PASS] Mobile screenshot with approved assets saved: ${mobileScreenshot}`);

    // 9. Routing Integrity Verification
    console.log('\n9. Verifying Navigation Routing...');
    await page.setViewport({ width: 1440, height: 900 });

    // Test Healthcare Provider Login
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    // Click to skip splash if active
    await page.click('[role="dialog"]').catch(() => {});
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const providerBtn = links.find(a => a.textContent.includes('Healthcare Provider Login'));
      if (providerBtn) providerBtn.click();
    });
    await page.waitForFunction(() => window.location.pathname.includes('/provider/login'), { timeout: 8000 });
    console.log(`[PASS] Healthcare Provider Login navigated to: ${page.url()}`);

    // Test Hero Continue as Patient CTA
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.click('[role="dialog"]').catch(() => {});
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const continueBtn = links.find(a => a.textContent.includes('Continue as Patient'));
      if (continueBtn) continueBtn.click();
    });
    await page.waitForFunction(() => window.location.pathname.includes('/patient/login'), { timeout: 8000 });
    console.log(`[PASS] Continue as Patient CTA navigated to: ${page.url()}`);

    console.log('\n====================================================');
    console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
    console.log('====================================================\n');
  } finally {
    await browser.close();
  }
}

runWelcomeAndAssetsVerification().catch(err => {
  console.error('\n[VERIFICATION ERROR]:', err);
  process.exit(1);
});
