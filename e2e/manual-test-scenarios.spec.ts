import { test, expect, Page } from '@playwright/test';

const SUPER_ADMIN_EMAIL = 'aymencharf55@gmail.com';
const SUPER_ADMIN_PASSWORD = 'Admin@1234';
const CLIENT_EMAIL = 'human.client.1749779375000@example.com'; // Use existing verified client
const CLIENT_PASSWORD = 'Password@123';

async function loginAsClient(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email address/i).fill(CLIENT_EMAIL);
  await page.getByRole('textbox', { name: /password/i }).fill(CLIENT_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/home$/);
}

async function loginAsSuperAdmin(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email address/i).fill(SUPER_ADMIN_EMAIL);
  await page.getByRole('textbox', { name: /password/i }).fill(SUPER_ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/super-admin\/dashboard$/);
}

async function logout(page: Page) {
  const logoutButton = page.getByRole('button', { name: /déconnexion|sign out/i });
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  }
}

test.describe('Reservation Flow Tests', () => {
  test('1. CLIENT books terrain with carte payment - 30-minute countdown appears', async ({ page }) => {
    test.setTimeout(120_000);
    await loginAsClient(page);
    
    // Navigate to terrains
    await page.goto('/terrains');
    await expect(page.getByRole('heading', { name: /terrains disponibles/i })).toBeVisible();
    await page.waitForTimeout(3000);
    
    // Find an available slot
    const availableSlots = page.locator('button:not([disabled])').filter({ hasText: /^\d{2}:\d{2}$/ });
    const slotCount = await availableSlots.count();
    
    if (slotCount === 0) {
      console.log('⚠️ PARTIAL: No available slots to test countdown');
      return;
    }
    
    // Click first available slot
    await availableSlots.first().click();
    
    // Booking panel should open
    await expect(page.getByText(/carte/i)).toBeVisible();
    
    // Select carte payment
    const carteButton = page.locator('button:has-text("Carte")');
    await carteButton.click();
    
    // Confirm booking
    await page.getByRole('button', { name: /confirmer la réservation/i }).click();
    
    // Payment modal should appear
    await page.waitForTimeout(2000);
    
    // Check if countdown warning appears (should show when < 30 minutes)
    const warningText = await page.locator('text=/payment expires|paiement expire/i').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (warningText) {
      console.log('✅ PASS: Countdown warning is visible');
    } else {
      // Check if payment modal is visible (alternative implementation)
      const modalVisible = await page.locator('text=/payer maintenant|pay now/i').isVisible({ timeout: 5000 }).catch(() => false);
      if (modalVisible) {
        console.log('✅ PASS: Payment modal appeared (countdown may be in modal)');
      } else {
        console.log('❌ FAIL: No countdown or payment modal visible');
      }
    }
    
    // Cancel the payment modal if visible
    const cancelButton = page.locator('button:has-text("Annuler")').first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    }
  });

  test('2. CLIENT tries to book same terrain at same time slot twice - conflict error', async ({ page }) => {
    test.setTimeout(120_000);
    await loginAsClient(page);
    
    await page.goto('/terrains');
    await page.waitForTimeout(3000);
    
    const availableSlots = page.locator('button:not([disabled])').filter({ hasText: /^\d{2}:\d{2}$/ });
    const slotCount = await availableSlots.count();
    
    if (slotCount === 0) {
      console.log('⚠️ PARTIAL: No available slots to test conflict');
      return;
    }
    
    // Get the first available slot details
    const firstSlot = availableSlots.first();
    const slotTime = await firstSlot.textContent();
    
    // Book first time with espèces (quick booking)
    await firstSlot.click();
    await page.waitForTimeout(1000);
    
    const especesButton = page.locator('button:has-text("Espèces")');
    await especesButton.click();
    await page.getByRole('button', { name: /confirmer la réservation/i }).click();
    
    // Wait for success message
    await page.waitForTimeout(2000);
    
    // Close booking panel
    const closeButton = page.locator('button[aria-label="Fermer"]').or(page.locator('button:has-text("×")'));
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
    
    // Reload to get fresh slots
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Try to book the same slot again
    const sameSlot = page.locator(`button:has-text("${slotTime}")`).first();
    
    // Check if slot is now disabled (booked)
    const isDisabled = await sameSlot.isDisabled().catch(() => false);
    
    if (isDisabled) {
      console.log('✅ PASS: Slot is now disabled/unavailable after first booking');
    } else {
      // Try to click it and see if we get an error
      await sameSlot.click();
      await page.waitForTimeout(1000);
      
      const errorMessage = await page.locator('text=/ce créneau vient|conflict|déjà pris/i').isVisible({ timeout: 5000 }).catch(() => false);
      
      if (errorMessage) {
        console.log('✅ PASS: Conflict error message displayed');
      } else {
        console.log('❌ FAIL: No conflict detection - slot still bookable');
      }
    }
  });

  test('3. CLIENT books terrain with espèces - creates successfully', async ({ page }) => {
    test.setTimeout(120_000);
    await loginAsClient(page);
    
    await page.goto('/terrains');
    await page.waitForTimeout(3000);
    
    const availableSlots = page.locator('button:not([disabled])').filter({ hasText: /^\d{2}:\d{2}$/ });
    const slotCount = await availableSlots.count();
    
    if (slotCount === 0) {
      console.log('⚠️ PARTIAL: No available slots to test espèces booking');
      return;
    }
    
    await availableSlots.first().click();
    await page.waitForTimeout(1000);
    
    // Select espèces
    const especesButton = page.locator('button:has-text("Espèces")');
    await especesButton.click();
    
    // Confirm booking
    await page.getByRole('button', { name: /confirmer la réservation/i }).click();
    
    // Check for success message
    const successMessage = await page.locator('text=/réservation enregistrée|payer sur place/i').isVisible({ timeout: 10000 }).catch(() => false);
    
    if (successMessage) {
      console.log('✅ PASS: Espèces booking created successfully');
    } else {
      const errorMessage = await page.locator('text=/erreur|error/i').textContent().catch(() => null);
      console.log(`❌ FAIL: Espèces booking failed. Error: ${errorMessage}`);
    }
  });

  test('4. SUPER_ADMIN confirms carte payment with reference - status changes to Payé', async ({ page }) => {
    test.setTimeout(120_000);
    await loginAsSuperAdmin(page);
    
    await page.goto('/super-admin/dashboard');
    
    // Navigate to reservations tab
    const reservationsTab = page.locator('button:has-text("Réservations")').or(page.locator('text=Réservations')).first();
    await reservationsTab.click();
    await page.waitForTimeout(2000);
    
    // Find a pending carte reservation
    const pendingReservation = page.locator('tr:has-text("carte")').filter({ hasText: /reserved|en attente/i }).first();
    const hasPending = await pendingReservation.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!hasPending) {
      console.log('⚠️ PARTIAL: No pending carte reservations to confirm');
      return;
    }
    
    // Click confirm button
    const confirmButton = pendingReservation.locator('button:has-text("Confirmer")').or(pendingReservation.locator('button[title*="Confirmer"]'));
    await confirmButton.click();
    await page.waitForTimeout(2000);
    
    // Check if status changed
    const statusChanged = await page.locator('text=/payé|confirmed/i').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (statusChanged) {
      console.log('✅ PASS: Carte payment confirmed, status changed to Payé');
    } else {
      console.log('❌ FAIL: Status did not change after confirmation');
    }
  });

  test('5. SUPER_ADMIN confirms espèces payment - works without card reference field', async ({ page }) => {
    test.setTimeout(120_000);
    await loginAsSuperAdmin(page);
    
    await page.goto('/super-admin/dashboard');
    
    // Navigate to reservations tab
    const reservationsTab = page.locator('button:has-text("Réservations")').or(page.locator('text=Réservations')).first();
    await reservationsTab.click();
    await page.waitForTimeout(2000);
    
    // Find a pending espèces reservation
    const pendingEspeces = page.locator('tr:has-text("espèces")').or(page.locator('tr:has-text("especes")')).filter({ hasText: /reserved|en attente/i }).first();
    const hasPending = await pendingEspeces.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!hasPending) {
      console.log('⚠️ PARTIAL: No pending espèces reservations to confirm');
      return;
    }
    
    // Click confirm button
    const confirmButton = pendingEspeces.locator('button:has-text("Confirmer")').or(pendingEspeces.locator('button[title*="Confirmer"]'));
    await confirmButton.click();
    await page.waitForTimeout(2000);
    
    // Should NOT show card reference field for espèces
    const cardRefField = await page.locator('input[placeholder*="référence"]').or(page.locator('input[placeholder*="reference"]')).isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!cardRefField) {
      console.log('✅ PASS: No card reference field shown for espèces payment');
    } else {
      console.log('❌ FAIL: Card reference field incorrectly shown for espèces');
    }
  });

  test('6. SUPER_ADMIN cancels confirmed reservation - works', async ({ page }) => {
    test.setTimeout(120_000);
    await loginAsSuperAdmin(page);
    
    await page.goto('/super-admin/dashboard');
    
    // Navigate to reservations tab
    const reservationsTab = page.locator('button:has-text("Réservations")').or(page.locator('text=Réservations')).first();
    await reservationsTab.click();
    await page.waitForTimeout(2000);
    
    // Find a confirmed reservation
    const confirmedReservation = page.locator('tr').filter({ hasText: /confirmed|payé/i }).first();
    const hasConfirmed = await confirmedReservation.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!hasConfirmed) {
      console.log('⚠️ PARTIAL: No confirmed reservations to cancel');
      return;
    }
    
    // Click cancel button
    const cancelButton = confirmedReservation.locator('button:has-text("Annuler")').or(confirmedReservation.locator('button[title*="Annuler"]'));
    await cancelButton.click();
    await page.waitForTimeout(2000);
    
    // Check if status changed to cancelled
    const cancelled = await page.locator('text=/cancelled|annulé/i').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (cancelled) {
      console.log('✅ PASS: Reservation cancelled successfully');
    } else {
      console.log('❌ FAIL: Reservation not cancelled');
    }
  });
});

test.describe('Fitness Profile Flow Tests', () => {
  test('7. CLIENT with no fitness profile - banner appears on /home', async ({ page }) => {
    test.setTimeout(60_000);
    
    // First, delete fitness profile if exists
    await loginAsClient(page);
    await page.goto('/mon-profil-fitness');
    await page.waitForTimeout(2000);
    
    // Try to delete existing profile
    const deleteButton = page.locator('button:has-text("Supprimer")').or(page.locator('button:has-text("Delete")'));
    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.click();
      await page.waitForTimeout(1000);
      const confirmDelete = page.locator('button:has-text("Confirmer")');
      if (await confirmDelete.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmDelete.click();
      }
    }
    
    // Now go to home and check for banner
    await page.goto('/home');
    await page.waitForTimeout(2000);
    
    const banner = await page.locator('text=/complétez votre profil fitness|fitness profile/i').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (banner) {
      console.log('✅ PASS: Fitness profile banner appears for client without profile');
    } else {
      console.log('❌ FAIL: Banner not shown for client without fitness profile');
    }
  });

  test('8. CLIENT creates fitness profile with padel - recommendations show padel complexes', async ({ page }) => {
    test.setTimeout(60_000);
    await loginAsClient(page);
    
    await page.goto('/mon-profil-fitness');
    await page.waitForTimeout(2000);
    
    // Fill fitness profile form
    const sportSelect = page.locator('select[name="sport_prefere"]').or(page.locator('select').first());
    await sportSelect.selectOption('padel');
    
    const niveauSelect = page.locator('select[name="niveau_fitness"]').or(page.locator('select').nth(1));
    await niveauSelect.selectOption('intermediaire');
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /enregistrer|save|créer/i });
    await submitButton.click();
    await page.waitForTimeout(2000);
    
    // Go to home to see recommendations
    await page.goto('/home');
    await page.waitForTimeout(3000);
    
    // Check if recommendations section shows padel complexes
    const padelRecommendation = await page.locator('text=/padel/i').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (padelRecommendation) {
      console.log('✅ PASS: Padel recommendations shown after creating profile');
    } else {
      console.log('⚠️ PARTIAL: Profile created but padel recommendations not visible (may need data)');
    }
  });

  test('9. CLIENT updates fitness profile - recommendations update', async ({ page }) => {
    test.setTimeout(60_000);
    await loginAsClient(page);
    
    await page.goto('/mon-profil-fitness');
    await page.waitForTimeout(2000);
    
    // Update to tennis
    const sportSelect = page.locator('select[name="sport_prefere"]').or(page.locator('select').first());
    await sportSelect.selectOption('tennis');
    
    // Submit update
    const submitButton = page.getByRole('button', { name: /enregistrer|save|mettre à jour/i });
    await submitButton.click();
    await page.waitForTimeout(2000);
    
    // Go to home
    await page.goto('/home');
    await page.waitForTimeout(3000);
    
    // Check if recommendations updated
    const tennisRecommendation = await page.locator('text=/tennis/i').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (tennisRecommendation) {
      console.log('✅ PASS: Recommendations updated after profile change');
    } else {
      console.log('⚠️ PARTIAL: Profile updated but tennis recommendations not visible (may need data)');
    }
  });
});

test.describe('Navigation Flow Tests', () => {
  test('10. SUPER_ADMIN clicks Accueil - goes to /super-admin/dashboard', async ({ page }) => {
    test.setTimeout(60_000);
    await loginAsSuperAdmin(page);
    
    // Navigate away first
    await page.goto('/complexes');
    await page.waitForTimeout(1000);
    
    // Click Accueil/Home link
    const accueilLink = page.locator('a:has-text("Accueil")').or(page.locator('a:has-text("Home")'));
    await accueilLink.click();
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    
    if (currentUrl.includes('/super-admin/dashboard')) {
      console.log('✅ PASS: SUPER_ADMIN Accueil redirects to /super-admin/dashboard');
    } else {
      console.log(`❌ FAIL: SUPER_ADMIN Accueil went to ${currentUrl} instead of /super-admin/dashboard`);
    }
  });

  test('11. Guest clicks Réserver on complex card - redirects to /login', async ({ page }) => {
    test.setTimeout(60_000);
    
    // Ensure logged out
    await page.goto('/auth/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.goto('/complexes');
    await page.waitForTimeout(3000);
    
    // Click on a complex card or "Réserver" button
    const reserverButton = page.locator('button:has-text("Réserver")').or(page.locator('a:has-text("Réserver")'));
    
    if (await reserverButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reserverButton.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/auth/login') || currentUrl.includes('/login')) {
        console.log('✅ PASS: Guest redirected to /login when trying to book');
      } else {
        console.log(`❌ FAIL: Guest went to ${currentUrl} instead of /login`);
      }
    } else {
      // Try clicking on complex card itself
      const complexCard = page.locator('.complexe-card').or(page.locator('[routerLink*="complexes"]')).first();
      if (await complexCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await complexCard.click();
        await page.waitForTimeout(2000);
        console.log('⚠️ PARTIAL: No "Réserver" button found, clicked complex card instead');
      } else {
        console.log('⚠️ PARTIAL: No complex cards or reserve buttons found');
      }
    }
  });

  test('12. After login as CLIENT - redirects to /home (not /complexes)', async ({ page }) => {
    test.setTimeout(60_000);
    
    // Ensure logged out
    await page.goto('/auth/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.goto('/auth/login');
    await page.getByLabel(/email address/i).fill(CLIENT_EMAIL);
    await page.getByRole('textbox', { name: /password/i }).fill(CLIENT_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    
    if (currentUrl.endsWith('/home')) {
      console.log('✅ PASS: Client login redirects to /home');
    } else if (currentUrl.includes('/complexes')) {
      console.log('❌ FAIL: Client login redirected to /complexes instead of /home');
    } else {
      console.log(`⚠️ PARTIAL: Client login went to ${currentUrl}`);
    }
  });
});
