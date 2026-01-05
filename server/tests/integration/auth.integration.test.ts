import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Express, NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import userRouter from '../../routes/users';
import { cleanupTestData, createTestUser } from './setup';
import bcrypt from 'bcryptjs';
import { driver } from '../../db/neo4j';
import errorHandler from '../../middleware/errorHandler';

// Create a test Express app
const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/users', userRouter);

  // Use the actual error handler
  app.use(errorHandler(false));

  return app;
};

describe('Authentication Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    app = createTestApp();
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await driver.close();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'integration-register@test.com',
        password: 'SecurePass123!',
        first_name: 'Integration',
        last_name: 'TestUser',
      };

      const response = await request(app)
        .post('/api/users/')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.first_name).toBe(userData.first_name);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('token');
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'SecurePass123!',
        first_name: 'Duplicate',
        last_name: 'User',
      };

      // First registration
      await request(app).post('/api/users/').send(userData).expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/users/')
        .send({ ...userData, first_name: 'Another' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/users/')
        .send({ email: 'incomplete@test.com' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/users/login', () => {
    beforeAll(async () => {
      // Create a user for login tests
      const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
      await createTestUser({
        id: 'login-test-user',
        email: 'login@test.com',
        password: hashedPassword,
        first_name: 'Login',
        last_name: 'User',
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'login@test.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'login@test.com');
      expect(response.body.user).not.toHaveProperty('password_hash');
      expect(response.body).toHaveProperty('token');

      // Check for JWT token in cookies
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      if (Array.isArray(cookies)) {
        const tokenCookie = cookies.find((cookie: string) => cookie.startsWith('token='));
        expect(tokenCookie).toBeDefined();
      }
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'login@test.com',
          password: 'WrongPassword123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'TestPassword123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({ email: 'login@test.com' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('email and password');
    });
  });

  describe('POST /api/users/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/users/logout')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Logout successful');

      // Check that token cookie is cleared
      const cookies = response.headers['set-cookie'];
      if (Array.isArray(cookies)) {
        const tokenCookie = cookies.find((cookie: string) => cookie.startsWith('token='));
        expect(tokenCookie).toMatch(/Expires|Max-Age=0/);
      }
    });
  });

  describe('Authentication Flow - Register → Login → Logout', () => {
    it('should complete full authentication flow', async () => {
      const userData = {
        email: 'flow@test.com',
        password: 'FlowPass123!',
        first_name: 'Flow',
        last_name: 'User',
      };

      // Step 1: Register
      const registerResponse = await request(app)
        .post('/api/users/')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.user.email).toBe(userData.email);
      const userId = registerResponse.body.user.id;

      // Step 2: Login
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.user.id).toBe(userId);
      const cookies = loginResponse.headers['set-cookie'];
      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('token='))
        : undefined;
      expect(tokenCookie).toBeDefined();

      // Step 3: Logout
      const logoutResponse = await request(app)
        .post('/api/users/logout')
        .expect(200);

      expect(logoutResponse.body.message).toContain('Logout successful');
    });
  });
});
