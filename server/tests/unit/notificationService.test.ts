import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createNotificationService,
  getUserNotificationsService,
  markNotificationAsReadService,
} from '../../service/notificationService';
import { session } from '../../db/neo4j';

jest.mock('../../db/neo4j', () => ({
  session: {
    run: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

describe('Notification Service', () => {
  let mockRun: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRun = session.run as jest.MockedFunction<typeof session.run>;
  });

  describe('createNotificationService', () => {
    it('should create a notification with basic properties', async () => {
      const mockNotification = {
        id: 'notif-mock-uuid-123',
        type: 'LIKE',
        title: 'New Like',
        message: 'John liked your post',
        is_read: false,
        action_url: '/posts/post123',
        metadata: null,
      };

      mockRun.mockResolvedValueOnce({
        records: [{ get: () => ({ properties: mockNotification }) }],
      });

      const result = await createNotificationService({
        recipientId: 'user123',
        actorId: 'user456',
        type: 'LIKE',
        title: 'New Like',
        message: 'John liked your post',
        targetId: 'post123',
        targetLabel: 'Post',
        action: 'LIKED',
        actionUrl: '/posts/post123',
      });

      expect(result.id).toBe('notif-mock-uuid-123');
      expect(result.type).toBe('LIKE');
      expect(result.title).toBe('New Like');
      expect(result.message).toBe('John liked your post');
      expect(result.is_read).toBe(false);
      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (n:Notification'),
        expect.objectContaining({
          recipientId: 'user123',
          actorId: 'user456',
          type: 'LIKE',
          targetId: 'post123',
          targetLabel: 'Post',
        })
      );
    });

    it('should create a notification with metadata', async () => {
      const mockNotification = {
        id: 'notif-mock-uuid-123',
        type: 'COMMENT',
        title: 'New Comment',
        message: 'Jane commented on your post',
        is_read: false,
        action_url: '/posts/post456',
        metadata: JSON.stringify({ commentId: 'comment789', postTitle: 'My Post' }),
      };

      mockRun.mockResolvedValueOnce({
        records: [{ get: () => ({ properties: mockNotification }) }],
      });

      const result = await createNotificationService({
        recipientId: 'user123',
        actorId: 'user789',
        type: 'COMMENT',
        title: 'New Comment',
        message: 'Jane commented on your post',
        targetId: 'post456',
        targetLabel: 'Post',
        action: 'COMMENTED',
        actionUrl: '/posts/post456',
        metadata: { commentId: 'comment789', postTitle: 'My Post' },
      });

      expect(result.metadata).toBeDefined();
      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (n:Notification'),
        expect.objectContaining({
          metadata: JSON.stringify({ commentId: 'comment789', postTitle: 'My Post' }),
        })
      );
    });
  });

  describe('getUserNotificationsService', () => {
    it('should retrieve all notifications for a user', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'LIKE',
          title: 'New Like',
          message: 'Someone liked your post',
          is_read: false,
        },
        {
          id: 'notif-2',
          type: 'COMMENT',
          title: 'New Comment',
          message: 'Someone commented on your post',
          is_read: true,
        },
      ];

      mockRun.mockResolvedValueOnce({
        records: mockNotifications.map((notif) => ({
          get: () => ({ properties: notif }),
        })),
      });

      const result = await getUserNotificationsService('user123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('notif-1');
      expect(result[1].id).toBe('notif-2');
      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (:User {id: $userId})-[:RECEIVES]->(n:Notification)'),
        expect.objectContaining({ userId: 'user123' })
      );
    });

    it('should return empty array when user has no notifications', async () => {
      mockRun.mockResolvedValueOnce({
        records: [],
      });

      const result = await getUserNotificationsService('user-no-notifs');

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe('markNotificationAsReadService', () => {
    it('should mark a notification as read', async () => {
      mockRun.mockResolvedValueOnce({
        records: [],
      });

      await markNotificationAsReadService('notif-123');

      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('SET n.is_read = true')
      );
      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (n:Notification {id: $notifId})'),
        undefined
      );
    });
  });
});
