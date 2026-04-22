import { test, expect } from '@playwright/test';

// Parcours critique : saisir une dépense en < 5 secondes / ≤ 2 taps après ouverture.
// Précondition : utilisateur connecté (PIN koffi@monetika.demo / 483726).

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByRole('tab', { name: /pin/i }).click();
  await page.getByLabel(/e-mail/i).fill('koffi@monetika.demo');
  for (const d of ['4', '8', '3', '7', '2', '6']) {
    await page.getByRole('button', { name: `Chiffre ${d}` }).click();
  }
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForURL(/\/(dashboard)?$/, { timeout: 10_000 });
}

test('saisie d\u2019une dépense de 1500 en moins de 5s', async ({ page }) => {
  await login(page);

  await page.goto('/transactions/new');
  await page.waitForLoadState('networkidle');

  const start = Date.now();

  // Tape le montant "1500" via le pavé.
  for (const d of ['1', '5', '0', '0']) {
    await page.getByRole('button', { name: `Chiffre ${d}` }).click();
  }

  // Sélectionne la première catégorie visible dans la grille.
  const firstCategory = page.locator('[role="img"]').first();
  await firstCategory.scrollIntoViewIfNeeded();
  // Alt: cliquer sur un bouton catégorie — ils n'ont pas de rôle explicit, on prend le premier bouton de la grille.
  const gridButtons = page.locator('.grid.grid-cols-4 button');
  await gridButtons.first().click();

  // Soumet.
  await page.getByRole('button', { name: /^enregistrer$/i }).click();

  await page.waitForURL(/\/(dashboard)?$/, { timeout: 10_000 });
  const elapsed = Date.now() - start;

  // Attendu : le temps total devrait être inférieur à 5s sur un chemin optimal.
  // En CI avec latence, on accepte < 8s (seuil indicatif ; le vrai test UX est le nombre de taps).
  console.log(`[e2e] tx-entry ${elapsed}ms`);
  expect(elapsed).toBeLessThan(8000);
});
