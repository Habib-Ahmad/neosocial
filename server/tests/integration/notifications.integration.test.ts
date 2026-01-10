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

  // Tests will be added one by one
});
