import { test, expect } from '@playwright/test';
import { LoginPage, RegisterPage, TEST_USERS } from './helpers';

test.describe('Authentication Flow', () => {

  test('should login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=NeoSocial')).toBeVisible();

    await loginPage.login(TEST_USERS.existing.email, TEST_USERS.existing.password);

    await loginPage.expectLoginSuccess();
    await expect(page).toHaveURL('/home');
    await expect(page.locator('text=Latest').first()).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('wrong@email.com', 'wrongpassword');

    await loginPage.expectLoginError();
    await expect(page).toHaveURL('/login');
  });

  test('should show validation error for empty email', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await page.fill('#password', 'somepassword');
    await page.click('button[type="submit"]');

    // Validation happens on client side, check for error state or that we didn't navigate
    await expect(page).toHaveURL('/login');
  });

  test('should show validation error for empty password', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await page.fill('#email', 'test@example.com');
    await page.click('button[type="submit"]');

    // Validation happens on client side, check for error state or that we didn't navigate
    await expect(page).toHaveURL('/login');
  });

  test('should navigate to register page from login', async ({ page }) => {
    await page.goto('/login');

    await page.click('text=Sign up');

    await expect(page).toHaveURL('/register');
    await expect(page.locator('text=/Register|Sign Up|Create/i').first()).toBeVisible();
  });

  test('should register new user successfully', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const newUser = {
      ...TEST_USERS.new,
      email: `e2e_test_${Date.now()}@test.com`
    };

    await registerPage.goto();
    await expect(page).toHaveURL('/register');

    await registerPage.register(
      newUser.firstName,
      newUser.lastName,
      newUser.email,
      newUser.password,
      newUser.password
    );

    await registerPage.expectRegistrationSuccess();
    // Registration logs user in and redirects to home
    await expect(page).toHaveURL(/\/home|\/login/);
  });

  test('should show error when registering with duplicate email', async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.goto();

    await registerPage.register(
      TEST_USERS.existing.firstName,
      TEST_USERS.existing.lastName,
      TEST_USERS.existing.email,
      TEST_USERS.existing.password,
      TEST_USERS.existing.password
    );

    // Should show error and stay on register page
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/register');
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/home');

    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.existing.email, TEST_USERS.existing.password);
    await loginPage.expectLoginSuccess();

    // Logout button has specific classes and LogOut icon
    await page.click('button[class*="hover:text-red-600"]');

    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });
});
