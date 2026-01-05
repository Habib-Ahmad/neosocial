import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createPostService,
  deletePostService,
  togglePostLikeService,
  createCommentForPostService,
  updatePostService,
} from '../../service/postService';
import { driver } from '../../db/neo4j';

jest.mock('../../db/neo4j', () => ({
  driver: {
    session: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

describe('Post Service', () => {
  let mockSession: any;
  let mockRun: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRun = jest.fn();
    mockSession = {
      run: mockRun,
      close: jest.fn(),
    };
    (driver.session as any).mockReturnValue(mockSession);
  });

  describe('createPostService', () => {
    it('should create a post with content and category', async () => {
      const mockPost = {
        id: 'mock-uuid-123',
        content: 'Test post content',
        category: 'Technology',
        likes_count: 0,
        comments_count: 0,
      };

      mockRun.mockResolvedValueOnce({
        records: [{ get: () => ({ properties: mockPost }) }],
      });

      const result = await createPostService('user123', {
        content: 'Test post content',
        category: 'Technology',
      });

      expect(result.content).toBe('Test post content');
      expect((result as any).category).toBe('Technology');
      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (p:Post'),
        expect.objectContaining({
          userId: 'user123',
          content: 'Test post content',
          category: 'Technology',
        })
      );
    });

    it('should create post with media URLs', async () => {
      const mockPost = {
        id: 'mock-uuid-123',
        content: 'Post with images',
        category: 'Travel',
        media_urls: ['/uploads/posts/img1.jpg', '/uploads/posts/img2.jpg'],
      };

      mockRun.mockResolvedValueOnce({
        records: [{ get: () => ({ properties: mockPost }) }],
      });

      const result = await createPostService('user123', {
        content: 'Post with images',
        category: 'Travel',
        mediaUrls: ['/uploads/posts/img1.jpg', '/uploads/posts/img2.jpg'],
      });

      expect((result as any).media_urls).toHaveLength(2);
      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          mediaUrls: ['/uploads/posts/img1.jpg', '/uploads/posts/img2.jpg'],
        })
      );
    });
  });

  describe('deletePostService', () => {
    it('should successfully delete own post', async () => {
      mockRun.mockResolvedValueOnce({
        records: [{ get: () => 'post123' }],
      });

      const result = await deletePostService('user123', 'post123');

      expect(result).toBe(true);
      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('SET p.is_deleted = true'),
        expect.objectContaining({ userId: 'user123', postId: 'post123' })
      );
    });

    it('should return false when post does not exist', async () => {
      mockRun.mockResolvedValueOnce({
        records: [],
      });

      const result = await deletePostService('user123', 'nonexistent-post');

      expect(result).toBe(false);
    });

    it('should return false when user is not the post author', async () => {
      mockRun.mockResolvedValueOnce({
        records: [],
      });

      const result = await deletePostService('user123', 'other-user-post');

      expect(result).toBe(false);
    });
  });

  describe('togglePostLikeService', () => {
    it('should add like when user has not liked post', async () => {
      const mockTimestamp = {
        year: 2024,
        month: 1,
        day: 15,
        hour: 10,
        minute: 30,
        second: 0,
        nanosecond: 0,
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'liked_by_me') return true;
              return {
                properties: {
                  id: 'post123',
                  likes_count: 1,
                  comments_count: 0,
                  reposts_count: 0,
                  created_at: mockTimestamp,
                  updated_at: mockTimestamp,
                },
              };
            },
          },
        ],
      });

      const result = await togglePostLikeService('user123', 'post123');

      expect(result.id).toBe('post123');
      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (u)-[:LIKED]->(p)'),
        expect.objectContaining({ userId: 'user123', postId: 'post123' })
      );
    });

    it('should remove like when user has already liked post', async () => {
      const mockTimestamp = {
        year: 2024,
        month: 1,
        day: 15,
        hour: 10,
        minute: 30,
        second: 0,
        nanosecond: 0,
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'liked_by_me') return false;
              return {
                properties: {
                  id: 'post123',
                  likes_count: 0,
                  comments_count: 0,
                  reposts_count: 0,
                  created_at: mockTimestamp,
                  updated_at: mockTimestamp,
                },
              };
            },
          },
        ],
      });

      const result = await togglePostLikeService('user123', 'post123');

      expect(result.id).toBe('post123');
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('createCommentForPostService', () => {
    it('should successfully add comment to post', async () => {
      const mockComment = {
        id: 'comment-mock-uuid-123',
        content: 'Great post!',
        likes_count: 0,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUser = {
        id: 'user123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        profile_picture: '/uploads/users/john.jpg',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'c') return { properties: mockComment };
              if (key === 'u') return { properties: mockUser };
            },
          },
        ],
      });

      const result = await createCommentForPostService('user123', 'post123', 'Great post!');

      expect(result.content).toBe('Great post!');
      expect(result.author.name).toBe('John Doe');
      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (c:Comment'),
        expect.objectContaining({
          userId: 'user123',
          postId: 'post123',
          content: 'Great post!',
        })
      );
    });

    it('should create comment with correct timestamp', async () => {
      const now = new Date().toISOString();
      const mockComment = {
        id: 'comment-123',
        content: 'Test comment',
        created_at: now,
        updated_at: now,
        likes_count: 0,
        is_deleted: false,
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'c') return { properties: mockComment };
              return {
                properties: {
                  id: 'user123',
                  first_name: 'Test',
                  last_name: 'User',
                  email: 'test@example.com',
                },
              };
            },
          },
        ],
      });

      const result = await createCommentForPostService('user123', 'post123', 'Test comment');

      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
    });
  });

  describe('updatePostService', () => {
    it('should update post content', async () => {
      const now = new Date().toISOString();
      const updatedPost = {
        id: 'post123',
        content: 'Updated content',
        created_at: now,
        updated_at: now,
      };

      mockRun.mockResolvedValueOnce({
        records: [{ get: () => ({ properties: updatedPost }) }],
      });

      const result = await updatePostService('user123', 'post123', {
        content: 'Updated content',
      });

      expect(result).toBeDefined();
      expect(result?.content).toBe('Updated content');
      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('SET p.content = $content'),
        expect.objectContaining({
          userId: 'user123',
          postId: 'post123',
          content: 'Updated content',
        })
      );
    });

    it('should return null when updating non-existent post', async () => {
      mockRun.mockResolvedValueOnce({
        records: [],
      });

      const result = await updatePostService('user123', 'nonexistent-post', {
        content: 'New content',
      });

      expect(result).toBeNull();
    });

    it('should return null when user is not the author', async () => {
      mockRun.mockResolvedValueOnce({
        records: [],
      });

      const result = await updatePostService('user123', 'other-user-post', {
        content: 'Trying to edit',
      });

      expect(result).toBeNull();
    });
  });
});
