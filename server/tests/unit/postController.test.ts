import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import {
  createPost,
  createGroupPost,
  getPostById,
  togglePostLike,
  updatePost,
  deletePost,
  createCommentForPost,
  toggleCommentLike,
  getDiscoverFeed,
  getLatestFeed,
  getPostsByUserId,
  getCommentsForPost,
  repostPost,
} from '../../controllers/postController';
import * as postService from '../../service/postService';

jest.mock('../../service/postService');

describe('Post Controller Unit Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockRes = { status: statusMock as any, json: jsonMock as any };
    mockReq = { user: { id: 'user-123' }, body: {}, params: {}, files: [] };
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create post successfully', async () => {
      mockReq.body = { content: 'Test post', category: 'general' };
      (postService.createPostService as any).mockResolvedValue({ id: 'post-123' });

      await createPost(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: 'Post created successfully' }));
    });

    it('should reject unauthenticated request', async () => {
      mockReq.user = undefined;
      await createPost(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should reject empty content', async () => {
      mockReq.body = { content: '   ', category: 'general' };
      await createPost(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should reject missing category', async () => {
      mockReq.body = { content: 'Test' };
      await createPost(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should handle media files', async () => {
      mockReq.body = { content: 'Post with media', category: 'photos' };
      mockReq.files = [{ filename: 'img.jpg' }] as Express.Multer.File[];
      (postService.createPostService as any).mockResolvedValue({ id: 'post-456' });

      await createPost(mockReq as Request, mockRes as Response);

      expect(postService.createPostService).toHaveBeenCalledWith('user-123',
        expect.objectContaining({ mediaUrls: ['/uploads/posts/img.jpg'] }));
    });
  });

  describe('createGroupPost', () => {
    it('should create group post successfully', async () => {
      mockReq.params = { groupId: 'group-123' };
      mockReq.body = { content: 'Group post', category: 'announcement' };
      (postService.createGroupPostService as any).mockResolvedValue({ id: 'post-789' });

      await createGroupPost(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('should reject unauthenticated request', async () => {
      mockReq.user = undefined;
      await createGroupPost(mockReq as Request, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  describe('getPostById', () => {
    it('should fetch post successfully', async () => {
      mockReq.params = { id: 'post-123' };
      (postService.getPostByIdService as any).mockResolvedValue({ id: 'post-123', is_deleted: false });

      await getPostById(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 404 if post not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      (postService.getPostByIdService as any).mockResolvedValue(null);

      await expect(getPostById(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 404 if post is deleted', async () => {
      mockReq.params = { id: 'deleted' };
      (postService.getPostByIdService as any).mockResolvedValue({ is_deleted: true });

      await expect(getPostById(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('togglePostLike', () => {
    it('should toggle like successfully', async () => {
      mockReq.params = { id: 'post-123' };
      (postService.togglePostLikeService as any).mockResolvedValue({ liked: true });

      await togglePostLike(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('updatePost', () => {
    it('should update post successfully', async () => {
      mockReq.params = { id: 'post-123' };
      mockReq.body = { content: 'Updated' };
      (postService.updatePostService as any).mockResolvedValue({ id: 'post-123' });

      await updatePost(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('deletePost', () => {
    it('should delete post successfully', async () => {
      mockReq.params = { id: 'post-123' };
      (postService.deletePostService as any).mockResolvedValue(true);

      await deletePost(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 404 if post not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      (postService.deletePostService as any).mockResolvedValue(false);

      await expect(deletePost(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('createCommentForPost', () => {
    it('should create comment successfully', async () => {
      mockReq.params = { id: 'post-123' };
      mockReq.body = { content: 'Great post!' };
      (postService.createCommentForPostService as any).mockResolvedValue({ id: 'comment-123' });

      await createCommentForPost(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('should reject missing content', async () => {
      mockReq.params = { id: 'post-123' };
      mockReq.body = {};

      await createCommentForPost(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('toggleCommentLike', () => {
    it('should toggle comment like successfully', async () => {
      mockReq.params = { id: 'comment-123' };
      (postService.toggleCommentLikeService as any).mockResolvedValue({ liked: true });

      await toggleCommentLike(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('getDiscoverFeed', () => {
    it('should get discover feed successfully', async () => {
      mockReq.user = { id: 'user-123' };
      const mockPosts = [{ id: 'post1' }, { id: 'post2' }];
      (postService.getDiscoverFeedService as any).mockResolvedValue(mockPosts);

      await getDiscoverFeed(mockReq as Request, mockRes as Response);

      expect(postService.getDiscoverFeedService).toHaveBeenCalledWith('user-123');
      expect(jsonMock).toHaveBeenCalledWith({ message: "Fetched all posts successfully", posts: mockPosts });
    });
  });

  describe('getLatestFeed', () => {
    it('should get latest feed successfully', async () => {
      mockReq.user = { id: 'user-123' };
      const mockPosts = [{ id: 'post1', createdAt: new Date() }];
      (postService.getLatestFeedService as any).mockResolvedValue(mockPosts);

      await getLatestFeed(mockReq as Request, mockRes as Response);

      expect(postService.getLatestFeedService).toHaveBeenCalledWith('user-123');
      expect(jsonMock).toHaveBeenCalledWith({ message: "Fetched all posts successfully", posts: mockPosts });
    });
  });

  describe('getPostsByUserId', () => {
    it('should get posts by user ID successfully', async () => {
      mockReq.params = { id: 'user-456' };
      mockReq.user = { id: 'user-123' };
      const mockPosts = [{ id: 'post1' }];
      (postService.getPostsByUserIdService as any).mockResolvedValue(mockPosts);

      await getPostsByUserId(mockReq as Request, mockRes as Response);

      expect(postService.getPostsByUserIdService).toHaveBeenCalledWith('user-456', 'user-123');
      expect(jsonMock).toHaveBeenCalledWith({ message: "Fetched user posts successfully", posts: mockPosts });
    });
  });

  describe('getCommentsForPost', () => {
    it('should get comments for post successfully', async () => {
      mockReq.params = { id: 'post-123' };
      mockReq.user = { id: 'user-123' };
      const mockComments = [{ id: 'comment1', content: 'Great post!' }];
      (postService.getCommentsForPostService as any).mockResolvedValue(mockComments);

      await getCommentsForPost(mockReq as Request, mockRes as Response);

      expect(postService.getCommentsForPostService).toHaveBeenCalledWith('post-123', 'user-123');
      expect(jsonMock).toHaveBeenCalledWith({ message: "Comments fetched", comments: mockComments });
    });
  });

  describe('repostPost', () => {
    it('should repost successfully', async () => {
      mockReq.params = { id: 'post-123' };
      mockReq.user = { id: 'user-123' };
      const mockRepost = { message: 'Post reposted successfully' };
      (postService.repostPostService as any).mockResolvedValue(mockRepost);

      await repostPost(mockReq as Request, mockRes as Response);

      expect(postService.repostPostService).toHaveBeenCalledWith('user-123', 'post-123');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Post reposted successfully' });
    });
  });
});
