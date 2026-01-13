import { test, expect } from '@playwright/test';

test('Register new user', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en-US');
  });
  await page.goto('/register');

  // Fill name field
  await page.getByRole('textbox', { name: 'Full Name' }).fill('Test User');

  // Fill email field
  const email = `test-${Date.now()}@test.com`;
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill(email);

  // Get the password field container and locate the input and toggle button
  const passwordContainer = page.locator('div:has(> label:text("Password"))').first();
  const passwordField = passwordContainer.locator('input[type="password"], input[type="text"]').first();
  const passwordToggle = passwordContainer.locator('button[aria-label*="password"]').first();

  // Initially password should be hidden (type="password")
  await expect(passwordField).toHaveAttribute('type', 'password');
  await passwordField.fill('TestPassword1234!');

  // Toggle to show password
  await passwordToggle.click();
  await expect(passwordField).toHaveAttribute('type', 'text');

  // Toggle back to hide password
  await passwordToggle.click();
  await expect(passwordField).toHaveAttribute('type', 'password');

  // Fill confirm password field
  const confirmPasswordContainer = page.locator('div:has(> label:text("Confirm Password"))').first();
  const confirmPasswordField = confirmPasswordContainer.locator('input[type="password"], input[type="text"]').first();
  await confirmPasswordField.fill('TestPassword1234!');

  // Submit the form
  await page.getByRole('button', { name: 'Create' }).click();

  // Wait for redirect to create organization page
  await expect(page).toHaveURL(/.*\/create-organization/, { timeout: 15000 });

  // Create organization
  const orgName = `Test Org ${Date.now()}`;
  await page.getByRole('textbox', { name: 'Organization Name' }).fill(orgName);
  // Slug is optional/generated

  // Scope to form to insure we are clicking the right button
  await page.locator('form').getByRole('button', { name: 'Create Organization' }).click();

  // Wait for redirect to monitors page
  await page.waitForURL('**/monitors', { timeout: 1000000 });
  await expect(page).toHaveURL(/.*\/monitors$/);

  await page.context().storageState({ path: 'storageState.json' });
});
