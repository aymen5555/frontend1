import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const backendLog = path.resolve(__dirname, '../../backend/storage/logs/laravel.log');
const clientPassword = 'Password@123';

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

test('user can register, verify email, and create a cash subscription', async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now();
  const email = `sub.user.${stamp}@example.test`;
  const firstName = `Subscriber${stamp}`;
  const beforeTokens = tokenCount();

  // Register
  await page.goto('/auth/register');
  await page.locator('input[id="first_name"]').fill(firstName);
  await page.locator('input[id="last_name"]').fill('Tester');
  await page.locator('input[id="email"]').fill(email);
  await page.locator('input[id="phone"]').fill('+21600000003');
  await page.locator('input[id="password"]').fill(clientPassword);
  await page.locator('input[id="password_confirmation"]').fill(clientPassword);
  await page.getByRole('button', { name: /créer un compte|create account/i }).click();

  // Wait for verify-pending
  await expect(page.getByRole('heading', { name: /email verification/i })).toBeVisible();

  // Get token from backend log and verify
  const token = await latestVerificationToken(beforeTokens);
  await page.goto(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByText(/your email is verified|votre email est verifié/i)).toBeVisible();

  // Should redirect to /home
  await expect(page).toHaveURL(/\/home$/);

  // Go to abonnements
  await page.goto('/abonnements');
  await expect(page.getByRole('heading', { name: /gestion de l'abonnement/i })).toBeVisible();

  // Select cash payment and submit
  await page.selectOption('#payment_method', 'especes');
  await page.getByRole('button', { name: /souscrire/i }).click();

  // Expect success message
  await expect(page.getByText(/abonnement créé/i)).toBeVisible({ timeout: 10000 });
});
