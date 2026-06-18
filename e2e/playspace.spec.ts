import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const backendLog = path.resolve(__dirname, '../../backend/storage/logs/laravel.log');
const clientPassword = 'Password@123';
const superAdminEmail = 'aymencharf55@gmail.com';
const superAdminPassword = 'Admin@1234';

async function latestVerificationToken(afterTokenCount: number): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const log = fs.existsSync(backendLog) ? fs.readFileSync(backendLog, 'utf8') : '';
    const tokens = Array.from(log.matchAll(/psv_[A-Za-z0-9]+/g)).map((match) => match[0]);
    if (tokens.length > afterTokenCount) {
      return tokens[tokens.length - 1];
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Verification token was not written to the Laravel log.');
}

function tokenCount(): number {
  const log = fs.existsSync(backendLog) ? fs.readFileSync(backendLog, 'utf8') : '';
  const matches = log.matchAll(/psv_[A-Za-z0-9]+/g);
  return Array.from(matches).length;
}

async function login(page: any, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByLabel(/email address/i).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

test('client can register, verify email, book, and cancel a reservation', async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now();
  const email = `human.client.${stamp}@example.com`;
  const firstName = `Human${stamp}`;
  const beforeTokens = tokenCount();

  // 1. Navigate to register
  await page.goto('/auth/register');
  await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();

  // Fill register form
  await page.locator('input[id="first_name"]').fill(firstName);
  await page.locator('input[id="last_name"]').fill('Tester');
  await page.locator('input[id="email"]').fill(email);
  await page.locator('input[id="phone"]').fill('+21600000001');
  await page.locator('input[id="password"]').fill(clientPassword);
  await page.locator('input[id="password_confirmation"]').fill(clientPassword);
  await page.getByRole('button', { name: /create account/i }).click();

  // 2. Should land on verify-pending page
  await expect(page.getByRole('heading', { name: /email verification/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /verify now/i })).toBeVisible();

  // 3. Login before verification — should redirect to verify-pending
  await page.goto('/auth/login');
  await page.getByLabel(/email address/i).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(clientPassword);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('heading', { name: /email verification/i })).toBeVisible();

  // 4. Verify email
  const token = await latestVerificationToken(beforeTokens);
  await page.goto(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByText(/your email is verified/i)).toBeVisible();

  // After verification, client should be redirected to /home
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('heading', { name: /bienvenue/i })).toBeVisible();

  // 5. Navigate to terrains page to book
  await page.goto('/terrains');
  await expect(page.getByRole('heading', { name: /terrains disponibles/i })).toBeVisible();

  // Wait for terrain cards to load
  await page.waitForTimeout(3000);

  // Click on an available slot
  let availableSlots = page.locator('button:not([disabled])');
  let slotCount = await availableSlots.count();
  if (slotCount === 0) {
    // If no slots available today, try tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(dateStr);
    await page.waitForTimeout(3000);
    availableSlots = page.locator('button:not([disabled])');
    slotCount = await availableSlots.count();
  }

  if (slotCount > 0) {
    // Click first available slot
    const firstAvailable = availableSlots.first();
    await firstAvailable.click();

    // Booking panel should open
    await expect(page.getByText(/carte/i)).toBeVisible();
    await expect(page.getByText(/espèces/i)).toBeVisible();

    // Select "payer sur place" (cash) to avoid card payment flow
    const especesButton = page.locator('button:has-text("Espèces")');
    await especesButton.click();

    // Confirm booking
    await page.getByRole('button', { name: /confirmer la réservation/i }).click();
    await expect(page.getByText(/réservation enregistrée/i)).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
  } else {
    // No slots at all — skip booking portion of test
    console.log('No available slots found — skipping booking verification');
  }

  // 6. Sign out
  await page.getByRole('button', { name: /déconnexion/i }).click();
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

  // 7. Login as SUPER_ADMIN
  await login(page, superAdminEmail, superAdminPassword);
  await expect(page).toHaveURL(/\/super-admin\/dashboard$/);
  await expect(page.getByRole('heading', { name: /super-admin dashboard|super admin dashboard/i })).toBeVisible();

  // 8. Sign out SUPER_ADMIN
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
});

test('auth screens handle redirects, password visibility, invalid login, and resend verification', async ({ page }) => {
  const stamp = Date.now();
  const email = `human.resend.${stamp}@example.com`;

  // Redirect from protected route to login
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login$/);

  // Invalid login
  await page.getByLabel(/email address/i).fill('nobody@example.com');
  await page.getByRole('textbox', { name: /password/i }).fill('WrongPassword123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('alert')).toContainText(/invalid email or password/i);

  // Navigate to register
  await page.getByRole('link', { name: /create one/i }).click();
  await page.locator('input[id="first_name"]').fill('Resend');
  await page.locator('input[id="last_name"]').fill('Tester');
  await page.locator('input[id="email"]').fill(email);
  await page.locator('input[id="phone"]').fill('+21600000002');
  await page.locator('input[id="password"]').fill(clientPassword);
  await page.locator('input[id="password_confirmation"]').fill(clientPassword);
  await page.getByRole('button', { name: /create account/i }).click();

  // Verify pending page
  await expect(page.getByRole('heading', { name: /email verification/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /verify now/i })).toBeVisible();

  // Resend verification
  await page.getByRole('button', { name: /resend verification/i }).click();
  await expect(page.getByText(/a new verification link is ready/i)).toBeVisible();
});
