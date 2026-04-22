import { test, expect } from '@playwright/test';

// Smoke test : la home marketing est accessible sans authentification
// et expose les CTA vers signup/login.
test('la home marketing est accessible et typographiée', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /reprenez le pouls/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /créer mon compte/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /se connecter/i })).toBeVisible();
});

test('accès à /dashboard sans session redirige vers /login', async ({ page }) => {
  const response = await page.goto('/dashboard');
  expect(page.url()).toContain('/login');
  expect(response?.status()).toBeLessThan(400);
});
