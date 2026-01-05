import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import userRouter from '../../routes/users';
import { cleanupTestData, createTestUser } from './setup';
import bcrypt from 'bcryptjs';
import { driver } from '../../db/neo4j';
import errorHandler from '../../middleware/errorHandler';

const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/users', userRouter);
  app.use(errorHandler(false));
  return app;
};

describe('Friend Workflow Integration Tests', () => {
  let app: Express;
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  beforeAll(async () => {
    app = createTestApp();
    await cleanupTestData();

    const hashedPassword1 = await bcrypt.hash('User1Pass123!', 10);
    const user1 = await createTestUser({
      id: 'friend-user-1',
      email: 'user1@test.com',
      password: hashedPassword1,
      first_name: 'User',
      last_name: 'One',
    });
    user1Id = user1.id;

    const hashedPassword2 = await bcrypt.hash('User2Pass123!', 10);
    const user2 = await createTestUser({
      id: 'friend-user-2',
      email: 'user2@test.com',
      password: hashedPassword2,
      first_name: 'User',
      last_name: 'Two',
    });
    user2Id = user2.id;

    const login1 = await request(app)
      .post('/api/users/login')
      .send({ email: 'user1@test.com', password: 'User1Pass123!' });
    user1Token = login1.body.token;

    const login2 = await request(app)
      .post('/api/users/login')
      .send({ email: 'user2@test.com', password: 'User2Pass123!' });
    user2Token = login2.body.token;
  });

  afterAll(async () => {
    await cleanupTestData();
    await driver.close();
  });

  describe('POST /api/users/friend-request', () => {
    it('should send a friend request', async () => {
      const response = await request(app)
        .post('/api/users/friend-request')
        .set('Cookie', `token=${user1Token}`)
        .send({ id: user2Id })
        .expect(200);

      expect(response.body.message).toContain('sent');
    });

    it('should reject duplicate friend request', async () => {
      await request(app)
        .post('/api/users/friend-request')
        .set('Cookie', `token=${user1Token}`)
        .send({ id: user2Id })
        .expect(400);
    });

    it('should reject friend request to self', async () => {
      await request(app)
        .post('/api/users/friend-request')
        .set('Cookie', `token=${user1Token}`)
        .send({ id: user1Id })
        .expect(400);
    });
  });

  describe('GET /api/users/friend-requests', () => {
    it('should retrieve friend requests for user2', async () => {
      const response = await request(app)
        .get('/api/users/friend-requests')
        .set('Cookie', `token=${user2Token}`)
        .expect(200);

      expect(response.body.friendRequests).toBeInstanceOf(Array);
      expect(response.body.friendRequests.length).toBeGreaterThan(0);
      expect(response.body.friendRequests[0].id).toBe(user1Id);
    });
  });

  describe('POST /api/users/friend-request/accept', () => {
    it('should accept a friend request', async () => {
      const response = await request(app)
        .post('/api/users/friend-request/accept')
        .set('Cookie', `token=${user2Token}`)
        .send({ senderId: user1Id, action: 'accept' })
        .expect(200);

      expect(response.body.message).toContain('accepted');
    });

    it('should show both users as friends', async () => {
      const response = await request(app)
        .get(`/api/users/friends/${user1Id}`)
        .set('Cookie', `token=${user1Token}`)
        .expect(200);

      expect(response.body.friends).toBeInstanceOf(Array);
      expect(response.body.friends.some((f: any) => f.id === user2Id)).toBe(true);
    });
  });

  describe('DELETE /api/users/friends/remove', () => {
    it('should remove a friend', async () => {
      const response = await request(app)
        .delete('/api/users/friends/remove')
        .set('Cookie', `token=${user1Token}`)
        .send({ friendId: user2Id })
        .expect(200);

      expect(response.body.message).toContain('removed');
    });

    it('should verify friend removal', async () => {
      const response = await request(app)
        .get(`/api/users/friends/${user1Id}`)
        .set('Cookie', `token=${user1Token}`)
        .expect(200);

      expect(response.body.friends.some((f: any) => f.id === user2Id)).toBe(false);
    });
  });

  describe('Friend Request Rejection Flow', () => {
    it('should send and reject a friend request', async () => {
      const hashedPassword3 = await bcrypt.hash('User3Pass123!', 10);
      const user3 = await createTestUser({
        id: 'friend-user-3',
        email: 'user3@test.com',
        password: hashedPassword3,
        first_name: 'User',
        last_name: 'Three',
      });

      const login3 = await request(app)
        .post('/api/users/login')
        .send({ email: 'user3@test.com', password: 'User3Pass123!' });
      const user3Token = login3.body.token;
      const user3Id = user3.id;

      await request(app)
        .post('/api/users/friend-request')
        .set('Cookie', `token=${user1Token}`)
        .send({ id: user3Id })
        .expect(200);

      const rejectResponse = await request(app)
        .post('/api/users/friend-request/reject')
        .set('Cookie', `token=${user3Token}`)
        .send({ senderId: user1Id, action: 'reject' })
        .expect(200);

      expect(rejectResponse.body.message).toContain('rejected');
    });
  });

  describe('POST /api/users/friend-request/cancel', () => {
    it('should cancel a sent friend request', async () => {
      const hashedPassword4 = await bcrypt.hash('User4Pass123!', 10);
      const user4 = await createTestUser({
        id: 'friend-user-4',
        email: 'user4@test.com',
        password: hashedPassword4,
        first_name: 'User',
        last_name: 'Four',
      });
      const user4Id = user4.id;

      await request(app)
        .post('/api/users/friend-request')
        .set('Cookie', `token=${user1Token}`)
        .send({ id: user4Id })
        .expect(200);

      const cancelResponse = await request(app)
        .post('/api/users/friend-request/cancel')
        .set('Cookie', `token=${user1Token}`)
        .send({ receivingUserId: user4Id })
        .expect(200);

      expect(cancelResponse.body.message).toContain('cancelled');
    });
  });
});
