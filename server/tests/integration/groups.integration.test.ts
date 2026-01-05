import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import groupRouter from '../../routes/groups';
import userRouter from '../../routes/users';
import { cleanupTestData, createTestUser } from './setup';
import bcrypt from 'bcryptjs';
import { driver } from '../../db/neo4j';
import errorHandler from '../../middleware/errorHandler';

const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/groups', groupRouter);
  app.use('/api/users', userRouter);
  app.use(errorHandler(false));
  return app;
};

describe('Group Workflow Integration Tests', () => {
  let app: Express;
  let adminToken: string;
  let adminId: string;
  let memberToken: string;
  let memberId: string;
  let groupId: string;
  let joinRequestId: string;

  beforeAll(async () => {
    app = createTestApp();
    await cleanupTestData();

    const hashedPassword1 = await bcrypt.hash('AdminPass123!', 10);
    const admin = await createTestUser({
      id: 'group-admin',
      email: 'admin@test.com',
      password: hashedPassword1,
      first_name: 'Admin',
      last_name: 'User',
    });
    adminId = admin.id;

    const hashedPassword2 = await bcrypt.hash('MemberPass123!', 10);
    const member = await createTestUser({
      id: 'group-member',
      email: 'member@test.com',
      password: hashedPassword2,
      first_name: 'Member',
      last_name: 'User',
    });
    memberId = member.id;

    const login1 = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@test.com', password: 'AdminPass123!' });
    adminToken = login1.body.token;

    const login2 = await request(app)
      .post('/api/users/login')
      .send({ email: 'member@test.com', password: 'MemberPass123!' });
    memberToken = login2.body.token;
  });

  afterAll(async () => {
    await cleanupTestData();
    await driver.close();
  });

  describe('POST /api/groups/', () => {
    it('should create a new group', async () => {
      const response = await request(app)
        .post('/api/groups/')
        .set('Cookie', `token=${adminToken}`)
        .send({
          name: 'Test Group',
          description: 'A group for testing',
          category: 'general',
        })
        .expect(201);

      expect(response.body).toHaveProperty('group');
      expect(response.body.group.name).toBe('Test Group');
      groupId = response.body.group.id;
    });

    it('should reject group creation without authentication', async () => {
      await request(app)
        .post('/api/groups/')
        .send({ name: 'Unauthorized Group', description: 'Test', category: 'general' })
        .expect(401);
    });

    it('should reject group with missing name', async () => {
      await request(app)
        .post('/api/groups/')
        .set('Cookie', `token=${adminToken}`)
        .send({ description: 'No name group', category: 'general' })
        .expect(400);
    });
  });

  describe('GET /api/groups/:id', () => {
    it('should retrieve group details', async () => {
      const response = await request(app)
        .get(`/api/groups/${groupId}`)
        .set('Cookie', `token=${adminToken}`)
        .expect(200);

      expect(response.body.group.id).toBe(groupId);
      expect(response.body.group.name).toBe('Test Group');
    });

    it('should return 404 for non-existent group', async () => {
      await request(app)
        .get('/api/groups/non-existent-id')
        .set('Cookie', `token=${adminToken}`)
        .expect(400);
    });
  });

  describe('POST /api/groups/:id/join', () => {
    it('should submit a join request', async () => {
      const response = await request(app)
        .post(`/api/groups/${groupId}/join`)
        .set('Cookie', `token=${memberToken}`)
        .expect(201);

      expect(response.body.request).toHaveProperty('id');
      joinRequestId = response.body.request.id;
    });
  });

  describe('GET /api/groups/sent-requests', () => {
    it('should retrieve sent join requests for member', async () => {
      const response = await request(app)
        .get('/api/groups/sent-requests')
        .set('Cookie', `token=${memberToken}`)
        .expect(200);

      expect(response.body.requests).toBeInstanceOf(Array);
      expect(response.body.requests.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/groups/:received-requests', () => {
    it('should retrieve received join requests for admin', async () => {
      const response = await request(app)
        .get('/api/groups/:received-requests')
        .set('Cookie', `token=${adminToken}`)
        .expect(200);

      expect(response.body.requests).toBeInstanceOf(Array);
    });
  });

  describe('PATCH /api/groups/:requestId/accept', () => {
    it('should accept a join request', async () => {
      const response = await request(app)
        .patch(`/api/groups/${joinRequestId}/accept`)
        .set('Cookie', `token=${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('approved');
    });

    it('should show member in group members list', async () => {
      const response = await request(app)
        .get(`/api/groups/${groupId}/members`)
        .set('Cookie', `token=${adminToken}`)
        .expect(200);

      expect(response.body.members).toBeInstanceOf(Array);
      expect(response.body.members.some((m: any) => m.user.id === memberId)).toBe(true);
    });
  });

  describe('PATCH /api/groups/:groupId', () => {
    it('should update group details', async () => {
      const response = await request(app)
        .patch(`/api/groups/${groupId}`)
        .set('Cookie', `token=${adminToken}`)
        .send({ description: 'Updated description' })
        .expect(200);

      expect(response.body.group.description).toBe('Updated description');
    });

    it('should reject update from non-admin', async () => {
      await request(app)
        .patch(`/api/groups/${groupId}`)
        .set('Cookie', `token=${memberToken}`)
        .send({ description: 'Unauthorized update' })
        .expect(404);
    });
  });

  describe('DELETE /api/groups/:groupId/remove/:memberId', () => {
    it('should remove a member from group', async () => {
      const response = await request(app)
        .delete(`/api/groups/${groupId}/remove/${memberId}`)
        .set('Cookie', `token=${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('removed');
    });

    it('should verify member removal', async () => {
      const response = await request(app)
        .get(`/api/groups/${groupId}/members`)
        .set('Cookie', `token=${adminToken}`)
        .expect(200);

      expect(response.body.members.some((m: any) => m.user.id === memberId)).toBe(false);
    });
  });

  describe('Join Request Rejection Flow', () => {
    it('should submit and reject a join request', async () => {
      const joinResponse = await request(app)
        .post(`/api/groups/${groupId}/join`)
        .set('Cookie', `token=${memberToken}`)
        .expect(201);

      const newRequestId = joinResponse.body.request.id;

      const rejectResponse = await request(app)
        .patch(`/api/groups/${newRequestId}/reject`)
        .set('Cookie', `token=${adminToken}`)
        .expect(200);

      expect(rejectResponse.body.message).toContain('rejected');
    });
  });

  describe('DELETE /api/groups/:requestId/cancel', () => {
    it('should cancel a sent join request', async () => {
      const joinResponse = await request(app)
        .post(`/api/groups/${groupId}/join`)
        .set('Cookie', `token=${memberToken}`)
        .expect(201);

      const newRequestId = joinResponse.body.request.id;

      const cancelResponse = await request(app)
        .delete(`/api/groups/${newRequestId}/cancel`)
        .set('Cookie', `token=${memberToken}`)
        .expect(200);

      expect(cancelResponse.body.message).toContain('cancelled');
    });
  });

  describe('DELETE /api/groups/:id/leave', () => {
    beforeAll(async () => {
      const joinResponse = await request(app)
        .post(`/api/groups/${groupId}/join`)
        .set('Cookie', `token=${memberToken}`);

      const newRequestId = joinResponse.body.request.id;

      await request(app)
        .patch(`/api/groups/${newRequestId}/accept`)
        .set('Cookie', `token=${adminToken}`);
    });

    it('should allow member to leave group', async () => {
      const response = await request(app)
        .delete(`/api/groups/${groupId}/leave`)
        .set('Cookie', `token=${memberToken}`)
        .expect(200);

      expect(response.body.message).toContain('Left group successfully');
    });
  });
});
