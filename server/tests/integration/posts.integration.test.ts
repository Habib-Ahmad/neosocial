import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import postRouter from '../../routes/posts';
import userRouter from '../../routes/users';
import { cleanupTestData, createTestUser } from './setup';
import bcrypt from 'bcryptjs';
import { driver } from '../../db/neo4j';
import errorHandler from '../../middleware/errorHandler';

const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/posts', postRouter);
  app.use('/api/users', userRouter);
  app.use(errorHandler(false));
  return app;
};

describe('Post Integration Tests', () => {
  let app: Express;
  let authToken: string;
  let userId: string;
  let postId: string;

  beforeAll(async () => {
    app = createTestApp();
    await cleanupTestData();

    const hashedPassword = await bcrypt.hash('TestPass123!', 10);
    const user = await createTestUser({
      id: 'post-test-user',
      email: 'postuser@test.com',
      password: hashedPassword,
      first_name: 'Post',
      last_name: 'User',
    });
    userId = user.id;

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({ email: 'postuser@test.com', password: 'TestPass123!' });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await cleanupTestData();
    await driver.close();
  });

  describe('POST /api/posts/', () => {
    it('should create a new post', async () => {
      const response = await request(app)
        .post('/api/posts/')
        .set('Cookie', `token=${authToken}`)
        .send({ content: 'This is a test post', category: 'general' })
        .expect(201);

      expect(response.body).toHaveProperty('post');
      expect(response.body.post.content).toBe('This is a test post');
      postId = response.body.post.id;
    });

    it('should reject post creation without authentication', async () => {
      await request(app)
        .post('/api/posts/')
        .send({ content: 'Unauthorized post', category: 'general' })
        .expect(401);
    });

    it('should reject post with empty content', async () => {
      await request(app)
        .post('/api/posts/')
        .set('Cookie', `token=${authToken}`)
        .send({ content: '', category: 'general' })
        .expect(400);
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should retrieve a post by ID', async () => {
      const response = await request(app)
        .get(`/api/posts/${postId}`)
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      expect(response.body.post.id).toBe(postId);
      expect(response.body.post.content).toBe('This is a test post');
    });

    it('should return 404 for non-existent post', async () => {
      await request(app)
        .get('/api/posts/non-existent-id')
        .set('Cookie', `token=${authToken}`)
        .expect(400);
    });
  });

  describe('PATCH /api/posts/:id/like', () => {
    it('should like a post', async () => {
      const response = await request(app)
        .patch(`/api/posts/${postId}/like`)
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('Post updated successfully');
    });

    it('should unlike a post when liked again', async () => {
      const response = await request(app)
        .patch(`/api/posts/${postId}/like`)
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('Post updated successfully');
    });
  });

  describe('POST /api/posts/:id/comments', () => {
    it('should add a comment to a post', async () => {
      const response = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Cookie', `token=${authToken}`)
        .send({ content: 'Great post!' })
        .expect(201);

      expect(response.body.comment.content).toBe('Great post!');
      expect(response.body.comment.author.id).toBe(userId);
    });

    it('should reject empty comment', async () => {
      await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Cookie', `token=${authToken}`)
        .send({ content: '' })
        .expect(400);
    });
  });

  describe('GET /api/posts/:id/comments', () => {
    it('should retrieve comments for a post', async () => {
      const response = await request(app)
        .get(`/api/posts/${postId}/comments`)
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      expect(response.body.comments).toBeInstanceOf(Array);
      expect(response.body.comments.length).toBeGreaterThan(0);
      expect(response.body.comments[0].content).toBe('Great post!');
    });
  });

  describe('PATCH /api/posts/:id', () => {
    it('should update a post', async () => {
      const response = await request(app)
        .patch(`/api/posts/${postId}`)
        .set('Cookie', `token=${authToken}`)
        .send({ content: 'Updated test post', category: 'general' })
        .expect(200);

      expect(response.body.post.content).toBe('Updated test post');
    });

    it('should reject update from non-author', async () => {
      const hashedPassword = await bcrypt.hash('OtherPass123!', 10);
      await createTestUser({
        id: 'other-user',
        email: 'other@test.com',
        password: hashedPassword,
        first_name: 'Other',
        last_name: 'User',
      });

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({ email: 'other@test.com', password: 'OtherPass123!' });

      const response = await request(app)
        .patch(`/api/posts/${postId}`)
        .set('Cookie', `token=${loginResponse.body.token}`)
        .send({ content: 'Unauthorized update', category: 'general' })
        .expect(200);

      expect(response.body.post).toBeNull();
    });
  });

  describe('GET /api/posts/latest', () => {
    it('should retrieve latest feed', async () => {
      const response = await request(app)
        .get('/api/posts/latest')
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      expect(response.body.posts).toBeInstanceOf(Array);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete a post', async () => {
      const createResponse = await request(app)
        .post('/api/posts/')
        .set('Cookie', `token=${authToken}`)
        .send({ content: 'Post to delete', category: 'general' });

      const deletePostId = createResponse.body.post.id;

      await request(app)
        .delete(`/api/posts/${deletePostId}`)
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      await request(app)
        .get(`/api/posts/${deletePostId}`)
        .set('Cookie', `token=${authToken}`)
        .expect(400);
    });
  });
});
