import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession, HomePage, TEST_USERS } from './helpers';

test.describe('Posts Workflow', () => {

  // Tests that create new content - use unique users for isolation
  test.describe('Post Creation', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedSession(page, true);
    });

    test('should create a new text post', async ({ page }) => {
      const homePage = new HomePage(page);
      const postContent = `E2E Test Post ${Date.now()}`;

      await homePage.goto();

      await expect(page.locator('textarea[placeholder*="What\'s happening"]')).toBeVisible();

      await homePage.createPost(postContent, 'Technology');

      // After posting, the textarea should be cleared
      const textarea = page.locator('textarea[placeholder*="What\'s happening"]');
      await expect(textarea).toHaveValue('');

      // Wait a bit for the post to appear in feed
      await page.waitForTimeout(2000);
    });

    test('should show validation error for empty post', async ({ page }) => {
      const homePage = new HomePage(page);

      await homePage.goto();

      // Post button should be disabled when content is empty
      const postButton = page.locator('button[type="submit"]:has-text("Post")');
      await expect(postButton).toBeDisabled();

      // Verify we're still on home page
      await expect(page).toHaveURL('/home');
    });
  });

  // Tests that interact with existing content - use shared user
  test.describe('Post Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedSession(page, false);
    });

    test('should switch between Latest and Discover feeds', async ({ page }) => {
      const homePage = new HomePage(page);

      await homePage.goto();

      await expect(page.locator('text=Latest')).toBeVisible();
      await expect(page.locator('text=Discover')).toBeVisible();

      await page.click('text=Discover');
      await page.waitForTimeout(500);

      await page.click('text=Latest');
      await page.waitForTimeout(500);

      // Just verify both tabs are clickable and we stay on home page
      await expect(page).toHaveURL('/home');
    });

    test('should like a post', async ({ page }) => {
      const homePage = new HomePage(page);

      await homePage.goto();

      // Wait for posts to load - PostCard is a Card component (div with specific classes)
      await page.waitForSelector('div.rounded-lg.border', { timeout: 10000 });

      // Get the SECOND card (first is the create post form)
      const firstPost = page.locator('div.rounded-lg.border').nth(1);

      // Like button contains Heart icon - it's in the footer section
      let likeButton = null;
      const buttons = await firstPost.locator('button').all();
      for (const button of buttons) {
        const text = await button.textContent();
        // Like button has text like "0", "1", "2" etc (just digits)
        if (text && /^\d+$/.test(text.trim())) {
          likeButton = button;
          break;
        }
      }

      expect(likeButton).not.toBeNull();
      const initialLikes = await likeButton!.textContent();

      await likeButton!.click();
      await page.waitForTimeout(1000);

      const updatedLikes = await likeButton!.textContent();
      expect(updatedLikes).not.toBe(initialLikes);
    });

    test('should unlike a liked post', async ({ page }) => {
      const homePage = new HomePage(page);

      await homePage.goto();

      // Wait for posts to load - PostCard is a Card component (div with specific classes)
      await page.waitForSelector('div.rounded-lg.border', { timeout: 10000 });

      // Get the SECOND card (first is the create post form)
      const firstPost = page.locator('div.rounded-lg.border').nth(1);
      const buttons = await firstPost.locator('button').all();
      let likeButton = null;
      for (const button of buttons) {
        const text = await button.textContent();
        if (text && /^\d+$/.test(text.trim())) {
          likeButton = button;
          break;
        }
      }

      expect(likeButton).not.toBeNull();

      // Like the post
      await likeButton!.click();
      await page.waitForTimeout(500);
      const likedCount = await likeButton!.textContent();

      // Unlike the post
      await likeButton!.click();
      await page.waitForTimeout(500);
      const unlikedCount = await likeButton!.textContent();

      // Count should have changed
      expect(unlikedCount).not.toBe(likedCount);
    });

    test('should navigate to post detail view', async ({ page }) => {
      const homePage = new HomePage(page);

      await homePage.goto();

      // Wait for posts and click on first actual post (nth(1) - skip create form)
      await page.waitForSelector('div.rounded-lg.border', { timeout: 10000 });

      const firstPost = page.locator('div.rounded-lg.border').nth(1);
      // Click the post content link (skip author link) - look for link with /post/ href
      await firstPost.locator('a[href*="/post/"]').first().click();

      await expect(page).toHaveURL(/\/post\/.+/, { timeout: 5000 });
    });

    test('should add a comment to a post', async ({ page }) => {
      const homePage = new HomePage(page);
      const commentText = `Test comment ${Date.now()}`;

      await homePage.goto();

      // Wait for posts and navigate to first actual post
      await page.waitForSelector('div.rounded-lg.border', { timeout: 10000 });
      const firstPost = page.locator('div.rounded-lg.border').nth(1);
      await firstPost.locator('a[href*="/post/"]').first().click();

      await page.waitForURL(/\/post\/.+/);

      const commentTextarea = page.locator('textarea').first();
      await commentTextarea.fill(commentText);

      await page.click('button:has-text("Comment"), button:has-text("Post Comment")');

      await expect(page.locator(`text=${commentText}`)).toBeVisible({ timeout: 5000 });
    });

    test('should show comment count on posts', async ({ page }) => {
      const homePage = new HomePage(page);

      await homePage.goto();

      // Wait for posts to load
      await page.waitForSelector('div.rounded-lg.border', { timeout: 10000 });

      // Comment count link - just check a link with number exists (might be "0", "1", etc.)
      const firstPost = page.locator('div.rounded-lg.border').nth(1);
      const commentLink = firstPost.locator('a[href*="/post/"]').nth(1); // Second link is comment link
      await expect(commentLink).toBeVisible();
    });
  }); // End Post Interactions describe
});
