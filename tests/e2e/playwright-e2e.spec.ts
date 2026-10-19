import { test, expect, type Page } from '@playwright/test';

// Full-flow E2E test for Eldercare Tech, driven entirely through the UI
// (not API shortcuts) so it exercises the real register -> auto-login ->
// CRUD path a brand-new user actually takes.
//
// Flow: register with a Thai name -> auto-login -> add first elder ->
// record a health reading -> add a medication -> add an appointment.
//
// - Run with: npx playwright test tests/e2e/playwright-e2e.spec.ts
// - Assumes the backend is running at http://localhost:8000 and the
//   frontend at http://localhost:3000.

const API_BASE = process.env.API_BASE || 'http://localhost:8000';
const APP_BASE = process.env.APP_BASE || 'http://localhost:3000';

async function registerAndAutoLogin(page: Page, email: string) {
  await page.goto(`${APP_BASE}/register`);
  await page.fill('#firstName', 'สมหญิง');
  await page.fill('#lastName', 'ใจบุญ');
  await page.fill('#regEmail', email);
  await page.fill('#phone', '0891234567');
  await page.fill('#regPassword', '123456');
  await page.fill('#confirmPassword', '123456');
  await page.check('input[type=checkbox]');
  await page.click('button[type=submit]');
  // register/page.tsx logs in automatically and sends a fresh family
  // account straight to the elders page (not /dashboard) since there's
  // nothing to show on the main dashboard yet.
  await page.waitForURL(`${APP_BASE}/dashboard/elders`, { timeout: 15000 });
}

test.describe('Full registration-to-CRUD flow', () => {
  test('register with a Thai name, add an elder, record health data, add a medication and an appointment', async ({ page }) => {
    const email = `e2e_${Date.now()}@example.com`;

    await registerAndAutoLogin(page, email);

    // 1) Add the first elder through the real modal form
    await page.click('[data-test="elder-add-btn"]');
    await expect(page.locator('[data-test="elder-submit-btn"]')).toBeVisible();
    await page.fill('[data-test="elder-input-first-name"]', 'คุณยาย');
    await page.fill('[data-test="elder-input-last-name"]', 'สมศรี');
    await page.click('[data-test="elder-submit-btn"]');
    await expect(page.getByText('คุณยาย สมศรี')).toBeVisible({ timeout: 5000 });

    // 2) Record a health reading for that elder
    await page.goto(`${APP_BASE}/dashboard/health`);
    await page.click('[data-test="health-add-btn"]');
    await expect(page.locator('[data-test="health-submit-btn"]')).toBeVisible();
    await page.fill('[data-test="health-input-heart_rate"]', '82');
    await page.click('[data-test="health-submit-btn"]');
    await expect(page.getByText('82 BPM').first()).toBeVisible({ timeout: 5000 });

    // 3) Add a medication
    await page.goto(`${APP_BASE}/dashboard/medications`);
    const medName = `E2E-Med-${Date.now()}`;
    await page.click('[data-test="medication-create-btn"]');
    await expect(page.locator('[data-test="medication-form"]')).toBeVisible();
    await page.fill('[data-test="medication-input-name"]', medName);
    await page.fill('[data-test="medication-input-dosage"]', '1 เม็ด');
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    await page.fill('[data-test="medication-input-start-date"]', today);
    await page.fill('[data-test="medication-input-end-date"]', nextMonth);
    await page.click('[data-test="medication-submit-btn"]');
    await expect(page.getByText(medName)).toBeVisible({ timeout: 5000 });

    // 4) Add an appointment
    await page.goto(`${APP_BASE}/dashboard/appointments`);
    const hospitalName = `E2E Hospital ${Date.now()}`;
    await page.click('[data-test="appointment-create-btn"]');
    await expect(page.locator('[data-test="appointment-form"]')).toBeVisible();
    await page.fill('[data-test="appointment-input-hospital"]', hospitalName);
    await page.fill('[data-test="appointment-input-doctor"]', 'Dr. E2E');
    await page.fill('[data-test="appointment-input-department"]', 'General');
    await page.fill('[data-test="appointment-input-date"]', nextMonth);
    await page.fill('[data-test="appointment-input-reason"]', 'ตรวจสุขภาพประจำปี');
    await page.click('[data-test="appointment-submit-btn"]');
    await expect(page.getByText(hospitalName)).toBeVisible({ timeout: 5000 });

    // Cleanup: delete the test account (and everything it owns) via the
    // real API the settings page's "delete account" button calls, so this
    // test leaves no data behind.
    const loginResp = await page.request.post(`${API_BASE}/api/auth/login`, {
      data: { email, password: '123456' },
    });
    const { access_token } = await loginResp.json();
    await page.request.delete(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
      data: { password: '123456' },
    });
  });
});
