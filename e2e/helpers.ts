import { Page } from '@playwright/test';

// Track created users for cleanup
const createdUsers: Array<{ email: string; password: string }> = [];

export const TEST_USERS = {
  existing: {
    email: 'test_user@mailinator.com',
    password: '123456',
    firstName: 'Test',
    lastName: 'User'
  },
  new: {
    email: `e2e_test_${Date.now()}@test.com`,
    password: 'TestPass123!',
    firstName: 'E2E',
    lastName: 'Tester'
  }
};

/**
 * Create a unique test user for isolated testing
 * User is automatically tracked for cleanup
 */
export async function createUniqueTestUser() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const user = {
    email: `e2e_${timestamp}_${random}@test.com`,
    password: 'TestPass123!',
    firstName: 'E2E',
    lastName: `Test${random}`,
  };

  createdUsers.push({ email: user.email, password: user.password });
  return user;
}

/**
 * Cleanup all created test users
 * Note: Since we don't have a delete user endpoint, this is a placeholder
 * Users will be cleaned by database cleanup scripts
 */
export async function cleanupTestUsers() {
  console.log(`\n🧹 Created ${createdUsers.length} test users during this run`);
  console.log('ℹ️  Users will be cleaned by periodic database cleanup');
  createdUsers.length = 0; // Clear the array
  console.log('✨ Cleanup tracking complete\n');
}

/**
 * Get the list of created users
 */
export function getCreatedUsers() {
  return [...createdUsers];
}

export class LoginPage {
  constructor(private page: Page) { }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('#email', email);
    await this.page.fill('#password', password);
    await this.page.click('button[type="submit"]');
  }

  async expectLoginSuccess() {
    await this.page.waitForURL('/home', { timeout: 10000 });
  }

  async expectLoginError() {
    await this.page.waitForSelector('text=/Login failed|Invalid/i', { timeout: 5000 });
  }
}

export class RegisterPage {
  constructor(private page: Page) { }

  async goto() {
    await this.page.goto('/register');
  }

  async register(firstName: string, lastName: string, email: string, password: string, confirmPassword?: string) {
    await this.page.fill('#firstName', firstName);
    await this.page.fill('#lastName', lastName);
    await this.page.fill('#email', email);
    await this.page.fill('#password', password);
    await this.page.fill('#confirmPassword', confirmPassword || password);
    await this.page.click('button[type="submit"]');
  }

  async expectRegistrationSuccess() {
    await this.page.waitForURL(/\/home|\/login/, { timeout: 10000 });
  }
}

export class HomePage {
  constructor(private page: Page) { }

  async goto() {
    await this.page.goto('/home');
  }

  async createPost(content: string, category: string) {
    await this.page.fill('textarea[placeholder*="What\'s happening"]', content);

    // Open the category dropdown (shadcn Select component)
    await this.page.click('button[role="combobox"]');

    // Wait for the dropdown options to appear
    await this.page.waitForSelector('[role="option"]', { timeout: 5000 });

    // Click the category option
    await this.page.click(`[role="option"]:has-text("${category}")`);

    await this.page.click('button[type="submit"]:has-text("Post")');
  }

  async waitForPost(content: string) {
    await this.page.waitForSelector(`text=${content}`, { timeout: 10000 });
  }

  async likeFirstPost() {
    // Like button is the second button (nth(1)) in the first post
    const firstPost = this.page.locator('article').first();
    await firstPost.locator('button').nth(1).click();
  }

  async commentOnFirstPost(comment: string) {
    await this.page.click('button:has-text("Comment") >> nth=0');
    await this.page.fill('textarea[placeholder*="comment"]', comment);
    await this.page.click('button:has-text("Post Comment")');
  }

  async logout() {
    await this.page.click('button:has-text("Logout")');
  }
}

/**
 * Setup authenticated session with unique user for parallel test execution
 */
export async function setupAuthenticatedSession(page: Page, useUniqueUser = false) {
  if (useUniqueUser) {
    // Create and register a unique user for this test
    const user = await createUniqueTestUser();

    // Register the user via the UI
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(user.firstName, user.lastName, user.email, user.password);

    // Wait for successful registration (should redirect to home or login)
    await page.waitForURL(/\/home/, { timeout: 10000 });
  } else {
    // Use the existing test user (for backward compatibility)
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.existing.email, TEST_USERS.existing.password);
    await loginPage.expectLoginSuccess();
  }
}
