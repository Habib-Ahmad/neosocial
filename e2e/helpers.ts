import { Page } from '@playwright/test';

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

export async function setupAuthenticatedSession(page: Page, email: string = TEST_USERS.existing.email, password: string = TEST_USERS.existing.password) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await loginPage.expectLoginSuccess();
}
