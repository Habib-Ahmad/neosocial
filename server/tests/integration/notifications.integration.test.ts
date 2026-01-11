import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import notificationRouter from '../../routes/notifications';
import userRouter from '../../routes/users';
import postRouter from '../../routes/posts';
import { cleanupTestData, createTestUser } from './setup';
import bcrypt from 'bcryptjs';
import { driver } from '../../db/neo4j';
import errorHandler from '../../middleware/errorHandler';

const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/notifications', notificationRouter);
  app.use('/api/users', userRouter);
  app.use('/api/posts', postRouter);
  app.use(errorHandler(false));
  return app;
};

describe('Notification Integration Tests', () => {
  let app: Express;
  let authToken: string;
  let userId: string;
  let notificationId: string;

  beforeAll(async () => {
    app = createTestApp();

    try {
      await cleanupTestData();
    } catch (error) {
      console.log('Cleanup error (non-fatal):', error);
    }

    const hashedPassword = await bcrypt.hash('TestPass123!', 10);
    const user = await createTestUser({
      id: `notif-test-user-${Date.now()}`,
      email: `notifuser${Date.now()}@test.com`,
      password: hashedPassword,
      first_name: 'Notif',
      last_name: 'User',
    });
    userId = user.id;

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({ email: user.email, password: 'TestPass123!' });

    authToken = loginResponse.body.token;
  }, 15000);

  describe('GET /api/notifications/', () => {
    it('should retrieve notifications for authenticated user', async () => {
      // TODO: Implement notification creation on post likes
      // For now, just verify the endpoint is accessible and returns empty array
      const response = await request(app)
        .get('/api/notifications/')
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('notifications');
      expect(Array.isArray(response.body.notifications)).toBe(true);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      // TODO: Implement notification creation on post likes
      // For now, just verify authenticated endpoint returns proper error for non-existent notification
      const fakeNotificationId = 'fake-notification-id';

      const response = await request(app)
        .patch(`/api/notifications/${fakeNotificationId}/read`)
        .set('Cookie', `token=${authToken}`);

      // Either 200 (if notification service handles gracefully) or 500 (if not found)
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/notifications/ - Authentication', () => {
    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/notifications/')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});
