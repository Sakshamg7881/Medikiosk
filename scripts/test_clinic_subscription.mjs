import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRONTEND_URL = 'http://localhost:5173';
const ARTIFACTS_DIR = 'C:\\Users\\itsan\\.gemini\\antigravity\\brain\\2b413da1-29a5-4ebf-a4b6-cdb6972f85f4';

async function runClinicSubscriptionTests() {
  console.log('================================================================');
  console.log('STARTING CLINIC SUBSCRIPTION REGISTRATION & DASHBOARD TEST SUITE');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // -------------------------------------------------------------------------
    // TEST 1: Navigate to Clinic Registration & Check Step 1
    // -------------------------------------------------------------------------
    console.log('1. Navigating to /clinic/register...');
    await page.goto(`${FRONTEND_URL}/clinic/register`, { waitUntil: 'networkidle0', timeout: 15000 });

    // Check step pills
    const step1Active = await page.evaluate(() => {
      const stepPills = Array.from(document.querySelectorAll('button, div, span'));
      return stepPills.some(el => el.textContent.includes('Clinic Details'));
    });
    console.log(`[CHECK] Step 1 (Clinic Details) rendered: ${step1Active}`);

    // Fill Step 1 Form
    const testPhone = '98200' + Math.floor(10000 + Math.random() * 90000);
    console.log(`2. Filling Clinic Registration Details (Phone: ${testPhone})...`);

    await page.type('input[placeholder*="Sanjeevani"]', 'Aarogyam Ayurvedic Centre');
    await page.type('input[placeholder*="Verma"]', 'Dr. Arvind Vaidya');
    await page.type('input[placeholder="98765 43210"]', testPhone);
    
    // Passwords
    const passwordInputs = await page.$$('input[type="password"]');
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].type('AyurPass123');
      await passwordInputs[1].type('AyurPass123');
    }

    await page.type('input[placeholder*="Civil Lines"]', '402 FC Road, Deccan Gymkhana');
    await page.type('input[placeholder*="Jaipur"]', 'Pune');

    // Submit Step 1 -> Advance to Step 2
    console.log('3. Submitting Step 1 to choose subscription plan...');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 600));

    // -------------------------------------------------------------------------
    // TEST 2: Verify Step 2 - Subscription Plan Selection
    // -------------------------------------------------------------------------
    console.log('4. Verifying Step 2 (Choose Subscription Plan)...');
    const plansRendered = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.includes('Starter') && body.includes('Professional') && body.includes('Enterprise') && body.includes('₹2,499');
    });
    console.log(`[CHECK] All 3 plans (Starter, Professional, Enterprise) rendered: ${plansRendered}`);
    if (!plansRendered) {
      throw new Error('FAIL: Subscription plan cards not rendered in Step 2!');
    }

    // Capture screenshot of Step 2
    const step2Screenshot = path.join(ARTIFACTS_DIR, 'clinic_registration_step2_plans.png');
    await page.screenshot({ path: step2Screenshot, fullPage: true });
    console.log(`[PASS] Saved Step 2 screenshot: ${step2Screenshot}`);

    // Test feature comparison drawer toggle
    console.log('5. Testing Plan Limits comparison drawer...');
    const drawerClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const drawerBtn = btns.find(b => b.textContent.includes('Compare All Plan Limits'));
      if (drawerBtn) {
        drawerBtn.click();
        return true;
      }
      return false;
    });
    console.log(`[CHECK] Feature comparison drawer opened: ${drawerClicked}`);
    await new Promise(r => setTimeout(r, 400));

    // Select Professional Plan
    console.log('6. Selecting Professional Plan & Activating Demo...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div'));
      const proCard = cards.find(el => el.textContent.includes('Professional') && el.textContent.includes('₹2,499'));
      if (proCard) proCard.click();
    });
    await new Promise(r => setTimeout(r, 300));

    // Click Continue with Professional
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const activateBtn = btns.find(b => b.textContent.includes('Continue with Professional'));
      if (activateBtn) activateBtn.click();
    });

    // Wait for backend registration and transition to Step 3
    await new Promise(r => setTimeout(r, 1200));

    // -------------------------------------------------------------------------
    // TEST 3: Verify Step 3 - Demo Activation Confirmation
    // -------------------------------------------------------------------------
    console.log('7. Verifying Step 3 (Demo Activation screen)...');
    const step3Info = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        hasSuccess: body.includes("You're all set"),
        hasClinicName: body.includes('Aarogyam Ayurvedic Centre'),
        hasPlan: body.includes('Professional'),
        hasActiveDemo: body.includes('Active (Demo)')
      };
    });
    console.log('[CHECK] Step 3 content:', step3Info);
    if (!step3Info.hasSuccess || !step3Info.hasPlan || !step3Info.hasActiveDemo) {
      throw new Error('FAIL: Step 3 Demo Activation details missing!');
    }

    const step3Screenshot = path.join(ARTIFACTS_DIR, 'clinic_registration_step3_activated.png');
    await page.screenshot({ path: step3Screenshot, fullPage: true });
    console.log(`[PASS] Saved Step 3 screenshot: ${step3Screenshot}`);

    // Click "Go to Clinic Login"
    console.log('8. Clicking "Go to Clinic Login"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const loginBtn = btns.find(b => b.textContent.includes('Go to Clinic Login'));
      if (loginBtn) loginBtn.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 500));
    console.log(`[CHECK] Current URL: ${page.url()}`);

    // -------------------------------------------------------------------------
    // TEST 4: Clinic Login with new credentials
    // -------------------------------------------------------------------------
    console.log(`9. Logging in as newly registered clinic (${testPhone})...`);
    // Phone may already be prefilled, clear and retype to be certain
    await page.evaluate(() => {
      const phoneInput = document.querySelector('input[type="tel"]');
      if (phoneInput) phoneInput.value = '';
    });
    await page.type('input[type="tel"]', testPhone);
    await page.type('input[type="password"]', 'AyurPass123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));
    console.log(`[CHECK] Current URL after login: ${page.url()}`);

    // -------------------------------------------------------------------------
    // TEST 5: Verify Clinic Dashboard Overview Tab
    // -------------------------------------------------------------------------
    console.log('10. Verifying Clinic Dashboard Overview Tab with Subscription Plan...');
    const overviewDetails = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        hasClinicName: body.includes('Aarogyam Ayurvedic Centre'),
        hasPlanBadge: body.includes('Professional Plan') || body.includes('Professional'),
        hasActiveDemo: body.includes('Active (Demo)'),
        hasTierStrip: body.includes('Professional')
      };
    });
    console.log('[CHECK] Overview subscription details:', overviewDetails);
    if (!overviewDetails.hasClinicName || !overviewDetails.hasPlanBadge) {
      throw new Error('FAIL: Overview tab does not display subscription plan badge!');
    }

    const dashboardScreenshot = path.join(ARTIFACTS_DIR, 'clinic_dashboard_overview_subscription.png');
    await page.screenshot({ path: dashboardScreenshot, fullPage: true });
    console.log(`[PASS] Saved Overview Dashboard screenshot: ${dashboardScreenshot}`);

    // -------------------------------------------------------------------------
    // TEST 6: Verify Clinic Profile Tab Subscription Card
    // -------------------------------------------------------------------------
    console.log('11. Navigating to Clinic Profile Tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const profileTab = btns.find(b => b.textContent.includes('Clinic Profile'));
      if (profileTab) profileTab.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const profileSubscriptionDetails = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        hasSubscriptionCard: body.includes('Subscription & Plan'),
        hasProfessionalTier: body.includes('Professional Tier'),
        hasDemoActiveStatus: body.includes('Active (Demo)'),
        hasCapacityLimits: body.includes('Tier Capacity & Features') || body.includes('Up to 5 Doctor Accounts'),
        hasDemoNotice: body.includes('Prototype / Demo Plan')
      };
    });
    console.log('[CHECK] Profile Tab Subscription card details:', profileSubscriptionDetails);
    if (!profileSubscriptionDetails.hasSubscriptionCard || !profileSubscriptionDetails.hasProfessionalTier) {
      throw new Error('FAIL: Profile tab subscription card details missing!');
    }

    const profileScreenshot = path.join(ARTIFACTS_DIR, 'clinic_dashboard_profile_subscription.png');
    await page.screenshot({ path: profileScreenshot, fullPage: true });
    console.log(`[PASS] Saved Profile Tab screenshot: ${profileScreenshot}`);

    // -------------------------------------------------------------------------
    // TEST 7: Test Adding a Doctor under the newly subscribed clinic
    // -------------------------------------------------------------------------
    console.log('12. Testing Doctor Creation under new facility...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const docsTab = btns.find(b => b.textContent.includes('Doctors'));
      if (docsTab) docsTab.click();
    });
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addDocBtn = btns.find(b => b.textContent.includes('Add Doctor') || b.textContent.includes('+ Add Doctor'));
      if (addDocBtn) addDocBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const docPhone = '98200' + Math.floor(10000 + Math.random() * 90000);
    await page.type('input[placeholder*="Rajeshwari"]', 'Dr. Radhika Sharma');
    await page.type('input[placeholder="e.g. 9876500002"]', docPhone);
    
    // Submit add doctor form
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button[type="submit"]'));
      const submitBtn = btns.find(b => b.textContent.includes('Add Doctor'));
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const docAdded = await page.evaluate(() => {
      return document.body.innerText.includes('Dr. Radhika Sharma');
    });
    console.log(`[CHECK] Doctor added successfully: ${docAdded}`);

    // -------------------------------------------------------------------------
    // TEST 8: Test Page Refresh Persistence
    // -------------------------------------------------------------------------
    console.log('13. Testing page refresh persistence of subscription state...');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const refreshedDetails = await page.evaluate(() => {
      return {
        name: document.body.innerText.includes('Aarogyam Ayurvedic Centre'),
        plan: document.body.innerText.includes('Professional Plan') || document.body.innerText.includes('Professional')
      };
    });
    console.log('[CHECK] Session and plan persisted across reload:', refreshedDetails);
    if (!refreshedDetails.name || !refreshedDetails.plan) {
      throw new Error('FAIL: Subscription state lost after reload!');
    }

    console.log('\n================================================================');
    console.log('ALL CLINIC SUBSCRIPTION ACCEPTANCE TESTS PASSED SUCCESSFULLY! ✓');
    console.log('================================================================\n');

  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runClinicSubscriptionTests();
