import { test, expect } from '@playwright/test';

test.describe('Invitation Flow', () => {
    test('Invite Member and Accept as New User', async ({ page, browser }) => {
        // Admin Context: Use authenticated session from storageState.json
        await page.goto('/monitors');
        await page.waitForURL('**/monitors');

        // Navigate to organization settings/members
        await page.getByRole('link', { name: 'Settings' }).click();
        await page.getByRole('link', { name: 'Members' }).click();

        // Invite a new member and intercept the API response to get the token
        const inviteeEmail = `invitee-${Date.now()}@example.com`;
        let invitationToken = '';

        // Set up response listener before making the request
        page.on('response', async (response) => {
            if (response.url().includes('/members') && response.request().method() === 'POST') {
                try {
                    const responseBody = await response.json();
                    if (responseBody.data?.token) {
                        invitationToken = responseBody.data.token;
                    }
                } catch (e) {
                    // Ignore JSON parse errors
                }
            }
        });

        // Fill invitation form
        await page.getByRole('textbox', { name: 'Email' }).fill(inviteeEmail);
        await page.getByRole('button', { name: 'Invite' }).click();

        // Wait for success message
        await expect(page.getByText('Member invited successfully')).toBeVisible();

        // Wait a bit to ensure the response was captured
        await page.waitForTimeout(1000);

        // Verify we captured the token
        expect(invitationToken).toBeTruthy();

        // Invitee Context: Accept invitation as a new user
        const inviteeContext = await browser.newContext();
        const inviteePage = await inviteeContext.newPage();

        await inviteePage.addInitScript(() => {
            localStorage.setItem('i18nextLng', 'en-US');
        });

        // Navigate to invitation page
        await inviteePage.goto(`/invite/${invitationToken}`);

        // Verify invitation details are shown
        await expect(inviteePage.getByText(inviteeEmail)).toBeVisible();

        // Click "Create Account" button
        await inviteePage.getByRole('button', { name: 'Create Account' }).click();

        // Should redirect to register page
        await expect(inviteePage).toHaveURL(/.*\/register/);

        // Complete registration
        await inviteePage.getByRole('textbox', { name: 'Full Name' }).fill('Invited User');
        await inviteePage.getByRole('textbox', { name: 'Email' }).fill(inviteeEmail);

        const passwordContainer = inviteePage.locator('div:has(> label:text("Password"))').first();
        const passwordField = passwordContainer.locator('input[type="password"], input[type="text"]').first();
        await passwordField.fill('InvitedPassword123!');

        const confirmPasswordContainer = inviteePage.locator('div:has(> label:text("Confirm Password"))').first();
        const confirmPasswordField = confirmPasswordContainer.locator('input[type="password"], input[type="text"]').first();
        await confirmPasswordField.fill('InvitedPassword123!');

        await inviteePage.getByRole('button', { name: 'Create' }).click();

        // Should redirect to onboarding/invitation acceptance
        await inviteePage.waitForURL('**/onboarding', { timeout: 15000 });

        // Accept the invitation
        await inviteePage.getByRole('button', { name: 'Accept Invitation' }).click();

        // Should redirect to the organization dashboard
        await inviteePage.waitForURL('**/monitors', { timeout: 10000 });

        // Verify access to organization
        await expect(inviteePage.getByText('Monitors')).toBeVisible();

        await inviteeContext.close();
    });
});
