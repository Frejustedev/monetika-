import { test, expect } from '@playwright/test';

// Vérifie le flow /login → PIN avec l'utilisateur démo seed.
// Précondition : Neon seed avec koffi@monetika.demo + PIN 483726.

test('connexion PIN de l\u2019utilisateur démo redirige vers le dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('tab', { name: /pin/i }).click();

  await page.getByLabel(/e-mail/i).fill('koffi@monetika.demo');

  // Saisit le PIN via le pavé numérique on-screen.
  const pinDigits = ['4', '8', '3', '7', '2', '6'];
  for (const d of pinDigits) {
    await page.getByRole('button', { name: `Chiffre ${d}` }).click();
  }

  await page.getByRole('button', { name: /se connecter/i }).click();

  // Attendu : redirection vers /dashboard (ou la home qui redirige).
  await page.waitForURL(/\/(dashboard)?$/, { timeout: 10_000 });
  await expect(page.getByText(/aujourd/i)).toBeVisible({ timeout: 5_000 });
});
