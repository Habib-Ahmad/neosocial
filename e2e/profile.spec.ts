import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession } from './helpers';

test.describe('Profile Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
  });

  test('should navigate to own profile', async ({ page }) => {
    await page.goto('/home');

    const profileLink = page.locator('a[href*="/profile"], button:has-text("Profile")').first();
    await profileLink.click();

    await expect(page).toHaveURL(/\/profile/, { timeout: 5000 });
  });

  test('should display profile information', async ({ page }) => {
    await page.goto('/home');

    // Click the Profile nav link
    await page.click('a[href="/profile"]');
    await page.waitForURL(/\/profile/);

    // Wait for profile card to load (Card component with user info)
    await page.waitForSelector('div.rounded-lg.border', { timeout: 10000 });

    // Should show user's name somewhere on the page (Test User is the default test account)
    await expect(page.locator('h1:has-text("Test User")').first()).toBeVisible();
  });

  test('should have edit profile button on own profile', async ({ page }) => {
    await page.goto('/home');

    // Click the Profile nav link
    await page.click('a[href="/profile"]');
    await page.waitForURL(/\/profile/);

    // Wait for profile card to load
    await page.waitForSelector('div.rounded-lg.border', { timeout: 10000 });

    // Edit Profile is a Link to /edit-profile containing a Button
    const editLink = page.locator('a[href="/edit-profile"]');
    await expect(editLink).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to edit profile page', async ({ page }) => {
    await page.goto('/home');

    // Click the Profile nav link
    await page.click('a[href="/profile"]');
    await page.waitForURL(/\/profile/);

    // Wait for profile card to load
    await page.waitForSelector('div.rounded-lg.border', { timeout: 10000 });

    await page.click('a[href="/edit-profile"]');

    await expect(page).toHaveURL('/edit-profile');
  });

  test('should update profile information', async ({ page }) => {
    const newBio = `Updated bio ${Date.now()}`;

    // Navigate to profile first, then click edit
    await page.goto('/home');
    await page.click('a[href="/profile"]');
    await page.waitForURL(/\/profile/);

    // Wait for profile to load and click edit
    await page.waitForSelector('a[href="/edit-profile"]', { timeout: 10000 });
    await page.click('a[href="/edit-profile"]');
    await page.waitForURL('/edit-profile');

    // Wait for edit form to load - textarea with id="bio"
    await page.waitForSelector('textarea#bio', { timeout: 10000 });

    const bioTextarea = page.locator('textarea#bio');
    await bioTextarea.clear();
    await bioTextarea.fill(newBio);

    await page.click('button:has-text("Update Profile")');

    await page.waitForTimeout(2000);

    // Verify we're back on profile page or home
    await expect(page).toHaveURL(/\/(profile|home)/);
  });

  test('should view another user profile', async ({ page }) => {
    await page.goto('/home');

    // Wait for posts to load
    const posts = page.locator('div.rounded-lg.border');
    await posts.first().waitFor({ timeout: 10000 });

    // Check if we have at least 2 cards (create form + at least one post)
    const count = await posts.count();
    if (count > 1) {
      // Click on author name in first post (skip create form at nth(0))
      const firstPost = posts.nth(1);
      const authorLink = firstPost.locator('a[href*="/profile/"]').first();
      await authorLink.click();

      await expect(page).toHaveURL(/\/profile\/.+/, { timeout: 5000 });
    }
  });

  // test('should NOT show edit button on other user profiles', async ({ page }) => {
  //   await page.goto('/home');

  //   // Wait for posts to load
  //   const posts = page.locator('div.rounded-lg.border');
  //   await posts.first().waitFor({ timeout: 10000 });

  //   // Check if we have at least 2 cards (create form + at least one post)
  //   const count = await posts.count();
  //   if (count > 1) {
  //     // Click on author name in first post
  //     const firstPost = posts.nth(1);
  //     const authorLink = firstPost.locator('a[href*="/profile/"]').first();
  //     await authorLink.click();

  //     await page.waitForURL(/\/profile\/.+/);

  //     // Wait for profile to load
  //     await page.waitForSelector('div.rounded-lg.border', { timeout: 10000 });

  //     // Edit link should not exist on other user's profile
  //     const editLink = page.locator('a[href="/edit-profile"]');
  //     await expect(editLink).toHaveCount(0);
  //   }
  // });
});
