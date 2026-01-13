import { test, expect } from '@playwright/test';

const randomOrgName = () => `E2E Org ${Math.random().toString(36).substring(2, 15)}`;

test.describe('Organization Management', () => {
  test.use({ storageState: 'storageState.json' });

  test.beforeEach(async ({ page }) => {
    // Set language to en-US
    await page.addInitScript(() => {
      localStorage.setItem('i18nextLng', 'en-US');
    });

    // Navigate to the app to establish origin for localStorage access
    await page.goto('/');

    // Get the access token from localStorage
    const token = await page.evaluate(() => {
      const storage = localStorage.getItem('auth-storage');
      if (storage) {
        try {
          const parsed = JSON.parse(storage);
          return parsed.state?.accessToken;
        } catch (e) {
          console.error('Failed to parse auth-storage', e);
          return null;
        }
      }
      return null;
    });

    // Fetch user organizations
    const response = await page.request.get('/api/v1/user/organizations', {
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : undefined
    });
    expect(response.ok()).toBeTruthy();
    const json = await response.json();

    // Check if we have any organizations
    if (json.data && json.data.length > 0) {
      const orgId = json.data[0].organization_id;
      // Set default header for all requests in this page context
      await page.setExtraHTTPHeaders({
        'X-Organization-ID': orgId
      });
    }
  });

  test('Create and Update Organization', async ({ page }) => {
    // Navigate to monitors page (already authenticated via storageState.json)
    await page.goto('/monitors');
    await page.waitForURL('**/monitors');

    // Create Organization
    const orgName = randomOrgName();

    // Open organization switcher
    await page.getByRole('button', { name: /organization/i }).first().click();
    await page.getByText('Add Organization').click();

    await expect(page).toHaveURL(/.*\/create-organization/);

    await page.getByRole('textbox', { name: 'Organization Name' }).fill(orgName);
    await page.locator('form').getByRole('button', { name: 'Create Organization' }).click();

    // Verify redirect to new org dashboard
    await page.waitForURL('**/monitors');
    // Check if the new org name is displayed in the switcher or header
    await expect(page.getByText(orgName)).toBeVisible();

    // Update Organization
    // Navigate to settings
    await page.goto(`/${page.url().split('/')[3]}/settings/organization`);
    await page.waitForURL('**/settings/organization');

    const updatedName = `${orgName} Updated`;
    await page.getByRole('textbox', { name: 'Organization Name' }).fill(updatedName);
    await page.getByRole('button', { name: 'Update Organization' }).click();

    // Verify success toast/message
    await expect(page.getByText('Organization updated successfully')).toBeVisible();

    // Verify name change in UI
    await expect(page.getByRole('textbox', { name: 'Organization Name' })).toHaveValue(updatedName);
  });
});
