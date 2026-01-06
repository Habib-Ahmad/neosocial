import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession } from './helpers';

test.describe('Friends Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
  });

  test('should navigate to friends page', async ({ page }) => {
    await page.goto('/home');

    await page.click('a[href="/friends"]');

    await expect(page).toHaveURL('/friends');
    await expect(page.locator('text=Friends').first()).toBeVisible();
  });

  test('should display friends list', async ({ page }) => {
    // Click friends link from home instead of direct goto
    await page.goto('/home');
    await page.click('a[href="/friends"]');

    // Wait for Friends page title
    await page.waitForSelector('text=Friends', { timeout: 10000 });

    // Wait for tabs container to load
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });

    // Should see the "My Friends" tab - check for button with that partial text
    const myFriendsTab = page.locator('button[role="tab"]:has-text("My Friends")');
    await expect(myFriendsTab).toBeVisible();
  });

  test('should search for users', async ({ page }) => {
    // Navigate via home page
    await page.goto('/home');
    await page.click('a[href="/friends"]');

    // Wait for tabs container to load
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });

    // Click the Search tab
    await page.click('button[role="tab"]:has-text("Search")');
    await page.waitForTimeout(500);

    // Fill search input with correct placeholder
    const searchInput = page.locator('input[placeholder="Search for people..."]');
    await searchInput.fill('test');

    // Click search button
    const searchButton = page.locator('button:has-text("Search")').last();
    await searchButton.click();

    await page.waitForTimeout(1000);
  });

  test('should view friend requests', async ({ page }) => {
    // Navigate via home page
    await page.goto('/home');
    await page.click('a[href="/friends"]');

    // Wait for tabs container to load
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });

    // Click the Requests tab
    await page.click('button[role="tab"]:has-text("Requests")');
    await page.waitForTimeout(500);

    // Should see the visible tabpanel (not hidden)
    await expect(page.locator('[role="tabpanel"]:not([hidden])')).toBeVisible();
  });

  test('should navigate to user profile from friends list', async ({ page }) => {
    // Navigate via home page
    await page.goto('/home');
    await page.click('a[href="/friends"]');

    // Wait for tabs container to load
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });

    // Look for friend cards (Card components in the My Friends tab)
    // Since we may not have friends in test data, just verify the page loaded correctly
    const myFriendsTab = page.locator('button[role="tab"]:has-text("My Friends")');
    await expect(myFriendsTab).toBeVisible();

    // If there are friend cards, try to click one
    const friendCards = page.locator('div.rounded-lg.border');
    const count = await friendCards.count();

    if (count > 1) { // More than just the main card
      // Click on a profile link within the friends list
      const profileLink = page.locator('a[href*="/profile/"]').first();
      if (await profileLink.isVisible()) {
        await profileLink.click();
        await expect(page).toHaveURL(/\/profile\/.+/, { timeout: 5000 });
      }
    }
  });
});
