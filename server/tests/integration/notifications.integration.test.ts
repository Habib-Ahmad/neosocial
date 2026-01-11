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

  afterAll(async () => {
    await cleanupTestData();
    await driver.close();
  });

  describe('GET /api/notifications/', () => {
    it('should retrieve notifications for authenticated user', async () => {
      // Create another user who will like the post
      const hashedPassword = await bcrypt.hash('OtherPass123!', 10);
      const otherUser = await createTestUser({
        id: `other-notif-user-${Date.now()}`,
        email: `other${Date.now()}@notiftest.com`,
        password: hashedPassword,
        first_name: 'Other',
        last_name: 'User',
      });

      const otherLoginResponse = await request(app)
        .post('/api/users/login')
        .send({ email: otherUser.email, password: 'OtherPass123!' });

      // Create a post as the main user
      const postResponse = await request(app)
        .post('/api/posts/')
        .set('Cookie', `token=${authToken}`)
        .send({ content: 'Test post for notification', category: 'general' });

      expect(postResponse.status).toBe(201);
      const postId = postResponse.body.post.id;

      // Other user likes the post (this should create a notification)
      await request(app)
        .patch(`/api/posts/${postId}/like`)
        .set('Cookie', `token=${otherLoginResponse.body.token}`)
        .expect(200);

      // Wait a bit for notification to be created
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get notifications for the main user
      const response = await request(app)
        .get('/api/notifications/')
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('notifications');
      expect(Array.isArray(response.body.notifications)).toBe(true);
      expect(response.body.notifications.length).toBeGreaterThan(0);

      const notification = response.body.notifications[0];
      expect(notification.type).toBe('like');
      expect(notification.post_id).toBe(postId);
      expect(notification.is_read).toBe(false);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      // Create a liker user
      const hashedPassword = await bcrypt.hash('LikerPass123!', 10);
      const likerUser = await createTestUser({
        id: `liker-user-${Date.now()}`,
        email: `liker${Date.now()}@notiftest.com`,
        password: hashedPassword,
        first_name: 'Liker',
        last_name: 'User',
      });

      const likerLoginResponse = await request(app)
        .post('/api/users/login')
        .send({ email: likerUser.email, password: 'LikerPass123!' });

      // Create a post
      const postResponse = await request(app)
        .post('/api/posts/')
        .set('Cookie', `token=${authToken}`)
        .send({ content: 'Another test post', category: 'general' });

      expect(postResponse.status).toBe(201);
      const postId = postResponse.body.post.id;

      // Like the post to create a notification
      await request(app)
        .patch(`/api/posts/${postId}/like`)
        .set('Cookie', `token=${likerLoginResponse.body.token}`)
        .expect(200);

      // Wait for notification to be created
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get notifications to find the notification ID
      const notificationsResponse = await request(app)
        .get('/api/notifications/')
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      const notifications = notificationsResponse.body.notifications;
      expect(notifications.length).toBeGreaterThan(0);
      notificationId = notifications[0].id;

      // Mark the notification as read
      const response = await request(app)
        .patch(`/api/notifications/${notificationId}/read`)
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Notification marked as read');
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
