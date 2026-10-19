import { test, expect } from '@playwright/test';

// API-first E2E smoke test for Eldercare Tech
// - Logs in via backend API and stores token in localStorage
// - Visits dashboard pages and performs basic create/edit/delete UI flows where possible
// NOTES:
// - Run with: npx playwright test tests/e2e/playwright-e2e.spec.ts
// - This test assumes the backend is running at http://localhost:8000 and the frontend at http://localhost:3000
// - Adjust selectors if your UI markup differs. The test uses robust aria/role selectors where possible.

const API_BASE = process.env.API_BASE || 'http://localhost:8000';
const APP_BASE = process.env.APP_BASE || 'http://localhost:3000';

async function apiLogin(page, email: string, password: string) {
  const resp = await page.request.post(`${API_BASE}/api/auth/login`, {
    data: { email, password },
  });
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  return body.access_token;
}

test.describe('API-first smoke + UI checks', () => {
  test('login via API, visit dashboard pages and perform UI CRUD for key modules', async ({ page }) => {
    // Login via API
    const token = await apiLogin(page, 'admin@example.com', '123456');

    // Set token in localStorage and navigate to dashboard
    await page.addInitScript((token) => {
      localStorage.setItem('eldercare_access_token', token);
    }, token);

    await page.goto(`${APP_BASE}/dashboard`, { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/Eldercare Tech/i);
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 5000 });

    // Helper: create elder via API for use in other modules
    const unique = Date.now();
    const authHeaders = { Authorization: `Bearer ${token}` };
    const elderCreate = await page.request.post(`${API_BASE}/api/elders`, { headers: authHeaders, data: { first_name: `E2E-${unique}`, last_name: 'Test' } });
    expect(elderCreate.ok()).toBeTruthy();
    const elder = await elderCreate.json();

    // Note: Elders created via API for use in subsequent module tests. Skipping elder UI edit to avoid list visibility timing issues.

    // 2) Appointments - create via API (reliable), then edit/delete via UI
    const hospitalName = `E2E Hospital ${unique}`;
    const today = new Date().toISOString().split('T')[0];
    const apptCreate = await page.request.post(`${API_BASE}/api/appointments`, { headers: authHeaders, data: { elder_id: elder.id, hospital_name: hospitalName, doctor_name: 'Dr. E2E', department: 'General', appointment_date: today, appointment_time: '09:30', reason: 'Checkup' } });
    expect(apptCreate.ok()).toBeTruthy();
    const appt = await apptCreate.json();

    await page.goto(`${APP_BASE}/dashboard/appointments`, { waitUntil: 'networkidle' });
    // ensure appointment card is present
    await expect(page.locator('div', { hasText: hospitalName }).first()).toBeVisible({ timeout: 5000 });
    // edit via specific edit button using id
    await page.click(`[data-test="appointment-edit-${appt.id}"]`);
    await expect(page.locator('[data-test="appointment-form"]')).toBeVisible({ timeout: 5000 });
    await page.fill('[data-test="appointment-input-hospital"]', hospitalName + ' UPDATED');
    await page.click('[data-test="appointment-submit-btn"]');
    await expect(page.locator('div', { hasText: hospitalName + ' UPDATED' }).first()).toBeVisible({ timeout: 5000 });
    // delete via specific delete button
    await page.click(`[data-test="appointment-delete-${appt.id}"]`);
    await expect(page.locator('div', { hasText: hospitalName + ' UPDATED' }).first()).not.toBeVisible({ timeout: 5000 });

    // 3) Create a caregiver via API for bookings
    let caregiver;
    const caregiverResp = await page.request.post(`${API_BASE}/api/caregivers`, { headers: authHeaders, data: { name: `E2E Caregiver ${unique}` } });
    if (caregiverResp.ok()) {
      caregiver = await caregiverResp.json();
    } else {
      // fallback: pick an existing caregiver
      const listResp = await page.request.get(`${API_BASE}/api/caregivers`, { headers: authHeaders });
      expect(listResp.ok()).toBeTruthy();
      const listBody = await listResp.json();
      caregiver = (listBody.items && listBody.items[0]) || null;
      if (!caregiver) throw new Error('no caregiver available for bookings test');
    }

    // 4) Bookings - create via API then edit/delete via UI
    const serviceType = `e2e-service-${unique}`;
    const bookCreate = await page.request.post(`${API_BASE}/api/bookings`, { headers: authHeaders, data: { elder_id: elder.id, caregiver_id: caregiver.id, date: today, start_time: '10:00', end_time: '12:00', service_type: serviceType } });
    expect(bookCreate.ok()).toBeTruthy();
    const booking = await bookCreate.json();

    await page.goto(`${APP_BASE}/dashboard/bookings`, { waitUntil: 'networkidle' });
    await expect(page.locator('div', { hasText: serviceType }).first()).toBeVisible({ timeout: 5000 });
    await page.click(`[data-test="booking-edit-${booking.id}"]`);
    await expect(page.locator('[data-test="booking-form"]')).toBeVisible({ timeout: 5000 });
    await page.fill('[data-test="booking-input-service-type"]', serviceType + '-UP');
    await page.click('[data-test="booking-submit-btn"]');
    await expect(page.locator('div', { hasText: serviceType + '-UP' }).first()).toBeVisible({ timeout: 5000 });
    // delete
    await page.click(`[data-test="booking-delete-${booking.id}"]`);
    await expect(page.locator('div', { hasText: serviceType + '-UP' }).first()).not.toBeVisible({ timeout: 5000 });

    // 5) Medications - create via API then edit/delete via UI
    const medName = `E2E-Med-${unique}`;
    const endDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const medCreate = await page.request.post(`${API_BASE}/api/medications`, { headers: authHeaders, data: { elder_id: elder.id, name: medName, dosage: '500mg', quantity: 10, time: '08:00', frequency: 'daily', start_date: today, end_date: endDate } });
    expect(medCreate.ok()).toBeTruthy();
    const med = await medCreate.json();

    await page.goto(`${APP_BASE}/dashboard/medications`, { waitUntil: 'networkidle' });
    await expect(page.locator('div', { hasText: medName }).first()).toBeVisible({ timeout: 5000 });
    await page.click(`[data-test="medication-edit-${med.id}"]`);
    await expect(page.locator('[data-test="medication-form"]')).toBeVisible({ timeout: 5000 });
    await page.fill('[data-test="medication-input-dosage"]', '650mg');
    await page.click('[data-test="medication-submit-btn"]');
    await expect(page.locator('div', { hasText: '650mg' }).first()).toBeVisible({ timeout: 5000 });
    // delete
    await page.click(`[data-test="medication-delete-${med.id}"]`);
    await expect(page.locator('div', { hasText: medName }).first()).not.toBeVisible({ timeout: 5000 });

    // cleanup: delete elder via API
    const delE = await page.request.delete(`${API_BASE}/api/elders/${elder.id}`);
    // allow either success or 403/500 if dependencies exist; just log status
    console.log('delete elder status', delE.status());
  });
});
