import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createPostService,
  createGroupPostService,
  deletePostService,
  togglePostLikeService,
  createCommentForPostService,
  updatePostService,
  getDiscoverFeedService,
  repostPostService,
  toggleCommentLikeService,
  getRepostedPostsByUserIdService,
  getPostsByUserIdService,
  getPostByIdService,
  getLatestFeedService,
} from '../../service/postService';
import { driver } from '../../db/neo4j';

jest.mock('../../db/neo4j', () => ({
  driver: {
    session: jest.fn(),
  },
}));

jest.mock('neo4j-driver', () => ({
  default: {
    int: (value: any) => value,
    isInt: (value: any) => typeof value === 'object' && value?.toNumber !== undefined,
  },
  int: (value: any) => value,
  isInt: (value: any) => typeof value === 'object' && value?.toNumber !== undefined,
  integer: {
    toNumber: (value: any) => (typeof value === 'number' ? value : value?.toNumber?.() || 0),
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
    it('should throw error when content is empty', async () => {
      await expect(
        updatePostService('user123', 'post123', { content: '' })
      ).rejects.toThrow('Post content is required');
    });

    it('should throw error when content is only whitespace', async () => {
      await expect(
        updatePostService('user123', 'post123', { content: '   ' })
      ).rejects.toThrow('Post content is required');
    });

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

  describe('createGroupPostService', () => {
    it('should create group post when user is a member', async () => {
      const mockPost = {
        id: 'mock-uuid-123',
        content: 'Group post content',
        category: 'Discussion',
        post_type: 'group',
      };

      // Mock membership check - user IS a member
      mockRun
        .mockResolvedValueOnce({
          records: [{ get: () => ({ properties: { id: 'group-123' } }) }],
        })
        .mockResolvedValueOnce({
          records: [{ get: () => ({ properties: mockPost }) }],
        });

      const result = await createGroupPostService('user123', 'group-123', {
        content: 'Group post content',
        category: 'Discussion',
      });

      expect(result.content).toBe('Group post content');
      expect((result as any).post_type).toBe('group');
      expect(mockRun).toHaveBeenCalledTimes(2);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should throw error when user is not a member of the group', async () => {
      // Mock membership check - user is NOT a member
      mockRun.mockResolvedValueOnce({ records: [] });

      await expect(
        createGroupPostService('user123', 'group-123', {
          content: 'Group post',
        })
      ).rejects.toThrow('User is not a member of this group');

      expect(mockRun).toHaveBeenCalledTimes(1);
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('getDiscoverFeedService', () => {
    it('should return personalized posts when user has liked categories', async () => {
      const mockTimestamp = {
        year: 2024,
        month: 1,
        day: 15,
        hour: 10,
        minute: 30,
        second: 0,
        nanosecond: 0,
      };

      // Mock liked categories
      mockRun
        .mockResolvedValueOnce({
          records: [
            {
              get: (key: string) => {
                if (key === 'category') return 'tech';
                if (key === 'likeCount') return { toNumber: () => 5 };
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          records: [
            {
              get: (key: string) => {
                if (key === 'p') {
                  return {
                    properties: {
                      id: 'post-1',
                      content: 'Tech post',
                      category: 'tech',
                      likes_count: { toNumber: () => 10 },
                      comments_count: { toNumber: () => 5 },
                      reposts_count: { toNumber: () => 2 },
                      created_at: mockTimestamp,
                      updated_at: mockTimestamp,
                    },
                  };
                }
                if (key === 'author') {
                  return {
                    properties: {
                      id: 'user-2',
                      first_name: 'John',
                      last_name: 'Doe',
                      email: 'john@test.com',
                      profile_picture: '',
                    },
                  };
                }
              },
            },
          ],
        })
        .mockResolvedValueOnce({ records: [] }); // Filler posts

      const result = await getDiscoverFeedService('user123');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('content', 'Tech post');
      expect(mockRun).toHaveBeenCalledTimes(3);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should return only filler posts when user has no liked categories', async () => {
      const mockTimestamp = {
        year: 2024,
        month: 1,
        day: 15,
        hour: 10,
        minute: 30,
        second: 0,
        nanosecond: 0,
      };

      // Mock no liked categories
      mockRun
        .mockResolvedValueOnce({ records: [] })
        .mockResolvedValueOnce({
          records: [
            {
              get: (key: string) => {
                if (key === 'p') {
                  return {
                    properties: {
                      id: 'post-2',
                      content: 'Random post',
                      likes_count: { toNumber: () => 3 },
                      comments_count: { toNumber: () => 1 },
                      reposts_count: { toNumber: () => 0 },
                      created_at: mockTimestamp,
                      updated_at: mockTimestamp,
                    },
                  };
                }
                if (key === 's') {
                  return {
                    properties: {
                      id: 'user-3',
                      first_name: 'Jane',
                      last_name: 'Smith',
                      email: 'jane@test.com',
                      profile_picture: '',
                    },
                  };
                }
              },
            },
          ],
        });

      const result = await getDiscoverFeedService('user123');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('content', 'Random post');
      expect(mockRun).toHaveBeenCalledTimes(2);
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('repostPostService', () => {
    it('should repost a post successfully when user has not reposted yet', async () => {
      // Mock: no existing repost
      mockRun
        .mockResolvedValueOnce({
          records: [{ get: () => null }],
        })
        .mockResolvedValueOnce({
          records: [
            {
              get: () => ({
                properties: {
                  id: 'post-1',
                  reposts_count: { toNumber: () => 1 },
                },
              }),
            },
          ],
        });

      const result = await repostPostService('user123', 'post-1');

      expect(result).toHaveProperty('message', 'Post reposted successfully.');
      expect(mockRun).toHaveBeenCalledTimes(2);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should throw error when user has already reposted the post', async () => {
      // Mock: existing repost
      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: () => ({
              type: 'REPOSTED',
              properties: {},
            }),
          },
        ],
      });

      await expect(repostPostService('user123', 'post-1')).rejects.toThrow(
        'You have already reposted this post.'
      );

      expect(mockRun).toHaveBeenCalledTimes(1);
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('toggleCommentLikeService', () => {
    it('should like a comment when not already liked', async () => {
      const mockComment = {
        id: 'comment-1',
        content: 'Nice comment',
        likes_count: 1, // Will be converted by neo4j.integer.toNumber in the service
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: () => ({ properties: mockComment }),
          },
        ],
      });

      const result = await toggleCommentLikeService('user123', 'comment-1');

      expect(result).toHaveProperty('id', 'comment-1');
      expect(result).toHaveProperty('likes_count', 1);
      expect(mockRun).toHaveBeenCalled();
    });

    it('should unlike a comment when already liked', async () => {
      const mockComment = {
        id: 'comment-1',
        content: 'Nice comment',
        likes_count: 0, // Will be converted by neo4j.integer.toNumber in the service
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: () => ({ properties: mockComment }),
          },
        ],
      });

      const result = await toggleCommentLikeService('user123', 'comment-1');

      expect(result).toHaveProperty('likes_count', 0);
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('getRepostedPostsByUserIdService', () => {
    it('should return reposts with all properties including reposted_by_me flag', async () => {
      const mockPost = {
        id: 'post-1',
        content: 'Test post content',
        likes_count: { toNumber: () => 5 },
        comments_count: { toNumber: () => 3 },
        reposts_count: { toNumber: () => 2 },
        created_at: { year: 2024, month: 1, day: 1 },
        updated_at: { year: 2024, month: 1, day: 2 },
        is_deleted: false,
      };

      const mockUser = {
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        profile_picture: 'pic.jpg',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'repostedPost') return { properties: mockPost };
              if (key === 'user') return { properties: mockUser };
              if (key === 'liked_by_me') return true;
              if (key === 'reposted_by_me') return true;
              if (key === 'group_name') return 'Test Group';
              return null;
            },
            has: (key: string) => key === 'group_name',
          },
        ],
      });

      const result = await getRepostedPostsByUserIdService('user-1', 'viewer-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'post-1');
      expect(result[0]).toHaveProperty('liked_by_me', true);
      expect(result[0]).toHaveProperty('reposted_by_me', true);
      expect(result[0]).toHaveProperty('group_name', 'Test Group');
      expect(result[0].author).toHaveProperty('name', 'John Doe');
    });

    it('should handle posts without group_name', async () => {
      const mockPost = {
        id: 'post-2',
        content: 'Post without group',
        likes_count: { toNumber: () => 0 },
        comments_count: { toNumber: () => 0 },
        reposts_count: { toNumber: () => 0 },
        created_at: { year: 2024, month: 1, day: 1 },
        updated_at: { year: 2024, month: 1, day: 1 },
        is_deleted: false,
      };

      const mockUser = {
        id: 'user-1',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'repostedPost') return { properties: mockPost };
              if (key === 'user') return { properties: mockUser };
              if (key === 'liked_by_me') return false;
              if (key === 'reposted_by_me') return false;
              return null;
            },
            has: () => false,
          },
        ],
      });

      const result = await getRepostedPostsByUserIdService('user-1', 'viewer-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('group_name', null);
      expect(result[0].author).toHaveProperty('profile_picture', '');
    });
  });

  describe('getPostsByUserIdService', () => {
    it('should return user posts with reposted_by_me flag', async () => {
      const mockPost = {
        id: 'post-1',
        content: 'User post',
        likes_count: { toNumber: () => 10 },
        comments_count: { toNumber: () => 5 },
        reposts_count: { toNumber: () => 3 },
        created_at: { year: 2024, month: 1, day: 1 },
        updated_at: { year: 2024, month: 1, day: 1 },
        is_deleted: false,
      };

      const mockAuthor = {
        id: 'author-1',
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@example.com',
        profile_picture: 'alice.jpg',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'p') return { properties: mockPost };
              if (key === 'author') return { properties: mockAuthor };
              if (key === 'liked_by_me') return true;
              if (key === 'reposted_by_me') return true;
              if (key === 'group_name') return 'My Group';
              return null;
            },
            has: (key: string) => key === 'group_name',
          },
        ],
      });

      const result = await getPostsByUserIdService('author-1', 'viewer-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('reposted_by_me', true);
      expect(result[0]).toHaveProperty('group_name', 'My Group');
    });

    it('should handle posts without group and profile picture', async () => {
      const mockPost = {
        id: 'post-2',
        content: 'Another post',
        likes_count: { toNumber: () => 0 },
        comments_count: { toNumber: () => 0 },
        reposts_count: { toNumber: () => 0 },
        created_at: { year: 2024, month: 1, day: 1 },
        updated_at: { year: 2024, month: 1, day: 1 },
        is_deleted: false,
      };

      const mockAuthor = {
        id: 'author-2',
        first_name: 'Bob',
        last_name: 'Brown',
        email: 'bob@example.com',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'p') return { properties: mockPost };
              if (key === 'author') return { properties: mockAuthor };
              if (key === 'liked_by_me') return false;
              if (key === 'reposted_by_me') return false;
              return null;
            },
            has: () => false,
          },
        ],
      });

      const result = await getPostsByUserIdService('author-2', 'viewer-1');

      expect(result).toHaveLength(1);
      expect(result[0].author).toHaveProperty('profile_picture', '');
      expect(result[0]).toHaveProperty('group_name', null);
    });
  });

  describe('getPostByIdService', () => {
    it('should return post with comments', async () => {
      const mockPost = {
        id: 'post-1',
        content: 'Post with comments',
        likes_count: { toNumber: () => 5 },
        comments_count: { toNumber: () => 2 },
        reposts_count: { toNumber: () => 1 },
        created_at: { year: 2024, month: 1, day: 1 },
        updated_at: { year: 2024, month: 1, day: 1 },
        is_deleted: false,
        media_urls: ['image1.jpg', 'image2.jpg'],
      };

      const mockAuthor = {
        id: 'author-1',
        first_name: 'Charlie',
        last_name: 'Davis',
        email: 'charlie@example.com',
        profile_picture: 'charlie.jpg',
      };

      const mockComments = [
        {
          id: 'comment-1',
          content: 'Great post!',
          created_at: { year: 2024, month: 1, day: 1 },
          likes_count: 2,
          liked_by_user: true,
          author: {
            id: 'commenter-1',
            name: 'Commenter One',
            email: 'commenter1@example.com',
            profile_picture: 'commenter1.jpg',
          },
        },
      ];

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'p') return { properties: mockPost };
              if (key === 'u') return { properties: mockAuthor };
              if (key === 'liked_by_me') return true;
              if (key === 'comments') return mockComments;
              return null;
            },
          },
        ],
      });

      const result = await getPostByIdService('post-1', 'viewer-1') as any;

      expect(result).toHaveProperty('id', 'post-1');
      expect(result).toHaveProperty('media_urls');
      expect(result.media_urls).toEqual(['image1.jpg', 'image2.jpg']);
      expect(result.comments).toHaveLength(1);
      expect(result.comments[0]).toHaveProperty('id', 'comment-1');
    });

    it('should filter comments without id or author.id', async () => {
      const mockPost = {
        id: 'post-2',
        content: 'Post with invalid comments',
        likes_count: { toNumber: () => 0 },
        comments_count: { toNumber: () => 0 },
        reposts_count: { toNumber: () => 0 },
        created_at: { year: 2024, month: 1, day: 1 },
        updated_at: { year: 2024, month: 1, day: 1 },
        is_deleted: false,
      };

      const mockAuthor = {
        id: 'author-2',
        first_name: 'Diana',
        last_name: 'Evans',
        email: 'diana@example.com',
      };

      const mockComments = [
        {
          id: null,
          content: 'Invalid comment 1',
          created_at: { year: 2024, month: 1, day: 1 },
        },
        {
          id: 'comment-2',
          content: 'Invalid comment 2',
          created_at: { year: 2024, month: 1, day: 1 },
          author: null,
        },
        {
          id: 'comment-3',
          content: 'Valid comment',
          created_at: { year: 2024, month: 1, day: 1 },
          author: { id: 'commenter-3' },
        },
      ];

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'p') return { properties: mockPost };
              if (key === 'u') return { properties: mockAuthor };
              if (key === 'liked_by_me') return false;
              if (key === 'comments') return mockComments;
              return null;
            },
          },
        ],
      });

      const result = await getPostByIdService('post-2', 'viewer-1') as any;

      expect(result.comments).toHaveLength(1);
      expect(result.comments[0]).toHaveProperty('id', 'comment-3');
    });

    it('should return null when post not found', async () => {
      mockRun.mockResolvedValueOnce({
        records: [],
      });

      const result = await getPostByIdService('nonexistent', 'viewer-1');

      expect(result).toBeNull();
    });
  });

  describe('getLatestFeedService', () => {
    it('should return latest posts from friends and user', async () => {
      const mockPost = {
        id: 'post-1',
        content: 'Latest post',
        likes_count: { toNumber: () => 10 },
        comments_count: { toNumber: () => 5 },
        reposts_count: { toNumber: () => 2 },
        created_at: { year: 2024, month: 1, day: 1 },
        updated_at: { year: 2024, month: 1, day: 1 },
        is_deleted: false,
        media_urls: ['img.jpg'],
      };

      const mockAuthor = {
        id: 'author-1',
        first_name: 'Henry',
        last_name: 'Ivy',
        email: 'henry@example.com',
        profile_picture: 'henry.jpg',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'post') return { properties: mockPost };
              if (key === 'author') return { properties: mockAuthor };
              if (key === 'liked_by_me') return true;
              if (key === 'comments_count') return { toInt: () => 5 };
              if (key === 'group_name') return null;
              return null;
            },
            has: (key: string) => key !== 'group_name',
          },
        ],
      });

      const result = await getLatestFeedService('viewer-1');

      expect(result).toHaveLength(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'post-1');
      expect(result[0]).toHaveProperty('liked_by_me', true);
      expect(result[0]).toHaveProperty('media_urls');
    });

    it('should handle posts with group_name', async () => {
      const mockPost = {
        id: 'post-2',
        content: 'Group post',
        likes_count: { toNumber: () => 3 },
        comments_count: { toNumber: () => 1 },
        reposts_count: { toNumber: () => 0 },
        created_at: { year: 2024, month: 1, day: 1 },
        updated_at: { year: 2024, month: 1, day: 1 },
        is_deleted: false,
      };

      const mockAuthor = {
        id: 'author-2',
        first_name: 'Irene',
        last_name: 'Jones',
        email: 'irene@example.com',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'post') return { properties: mockPost };
              if (key === 'author') return { properties: mockAuthor };
              if (key === 'liked_by_me') return false;
              if (key === 'comments_count') return { toInt: () => 1 };
              if (key === 'group_name') return 'Tech Group';
              return null;
            },
            has: (key: string) => key === 'group_name',
          },
        ],
      });

      const result = await getLatestFeedService('viewer-1');

      expect(result[0]).toHaveProperty('group_name', 'Tech Group');
      expect(result[0].author).toHaveProperty('profile_picture', '');
    });
  });
});
