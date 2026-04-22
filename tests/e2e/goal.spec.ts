import { test, expect } from '@playwright/test';

// Parcours critique : créer un objectif + première contribution.
// Précondition : utilisateur démo seedé.

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

test('création d\u2019un objectif + première contribution', async ({ page }) => {
  await login(page);

  const uniqueSuffix = Date.now().toString().slice(-6);
  const goalName = `Test E2E ${uniqueSuffix}`;

  await page.goto('/goals/new');
  await page.getByLabel(/nom de l/i).fill(goalName);
  await page.getByLabel(/montant cible/i).fill('100000');

  // Date cible : dans 6 mois.
  const sixMonthsLater = new Date();
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  const iso = sixMonthsLater.toISOString().slice(0, 10);
  await page.getByLabel(/date cible/i).fill(iso);

  await page.getByRole('button', { name: /créer l.objectif/i }).click();

  // Redirigé vers le détail
  await page.waitForURL(/\/goals\/[^/]+$/, { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: goalName })).toBeVisible();

  // Contribuer
  const contributeInput = page.getByLabel(/montant/i).first();
  await contributeInput.fill('5000');
  await page.getByRole('button', { name: /enregistrer la contribution/i }).click();

  // Vérifie que la contribution apparaît dans l'historique
  await expect(page.getByText(/historique des contributions|contribution history/i)).toBeVisible({
    timeout: 5_000,
  });
});
