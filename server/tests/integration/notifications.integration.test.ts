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
    await cleanupTestData();

    const hashedPassword = await bcrypt.hash('TestPass123!', 10);
    const user = await createTestUser({
      id: 'notif-test-user',
      email: 'notifuser@test.com',
      password: hashedPassword,
      first_name: 'Notif',
      last_name: 'User',
    });
    userId = user.id;

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({ email: 'notifuser@test.com', password: 'TestPass123!' });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await cleanupTestData();
    await driver.close();
  });

  describe('GET /api/notifications/', () => {
    it('should retrieve notifications for authenticated user', async () => {
      // First, create a post and another user to generate a notification
      const postResponse = await request(app)
        .post('/api/posts/')
        .set('Cookie', `token=${authToken}`)
        .send({ content: 'Test post for notification', category: 'general' });

      const postId = postResponse.body.post.id;

      // Create another user who will like the post (creating a notification)
      const hashedPassword = await bcrypt.hash('OtherPass123!', 10);
      const otherUser = await createTestUser({
        id: 'other-notif-user',
        email: 'other@notiftest.com',
        password: hashedPassword,
        first_name: 'Other',
        last_name: 'User',
      });

      const otherLoginResponse = await request(app)
        .post('/api/users/login')
        .send({ email: 'other@notiftest.com', password: 'OtherPass123!' });

      // Create a notification by liking the post
      await request(app)
        .patch(`/api/posts/${postId}/like`)
        .set('Cookie', `token=${otherLoginResponse.body.token}`);

      // Now get the notifications for the original user
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
      // First, create a notification by creating a post and having another user like it
      const postResponse = await request(app)
        .post('/api/posts/')
        .set('Cookie', `token=${authToken}`)
        .send({ content: 'Another test post', category: 'general' });

      const postId = postResponse.body.post.id;

      const hashedPassword = await bcrypt.hash('LikerPass123!', 10);
      await createTestUser({
        id: 'liker-user',
        email: 'liker@notiftest.com',
        password: hashedPassword,
        first_name: 'Liker',
        last_name: 'User',
      });

      const likerLoginResponse = await request(app)
        .post('/api/users/login')
        .send({ email: 'liker@notiftest.com', password: 'LikerPass123!' });

      await request(app)
        .patch(`/api/posts/${postId}/like`)
        .set('Cookie', `token=${likerLoginResponse.body.token}`);

      // Get notifications to find the notification ID
      const notificationsResponse = await request(app)
        .get('/api/notifications/')
        .set('Cookie', `token=${authToken}`);

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

  // Tests will be added one by one
});
