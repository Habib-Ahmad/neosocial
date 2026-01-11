import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createNotificationService,
  getUserNotificationsService,
  markNotificationAsReadService,
} from '../../service/notificationService';
import { driver } from '../../db/neo4j';

jest.mock('../../db/neo4j', () => ({
  driver: {
    session: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

describe('Notification Service', () => {
  let mockSession: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = {
      run: jest.fn(),
      close: jest.fn(),
    };
    (driver.session as jest.Mock).mockReturnValue(mockSession);
  });

  describe('createNotificationService', () => {
    it('should create a notification for a post like', async () => {
      const mockNotification = {
        id: 'notif-mock-uuid-123',
        type: 'like',
        post_id: 'post123',
        is_read: false,
      };

      mockSession.run.mockResolvedValueOnce({
        records: [{
          get: (key: string) => {
            if (key === 'n') return { properties: mockNotification };
            if (key === 'actor_first_name') return 'John';
            if (key === 'actor_last_name') return 'Doe';
          }
        }],
      });

      const result = await createNotificationService({
        userId: 'user123',
        actorId: 'user456',
        type: 'like',
        postId: 'post123',
      });

      expect(result.id).toBe('notif-mock-uuid-123');
      expect(result.type).toBe('like');
      expect(result.post_id).toBe('post123');
      expect(result.is_read).toBe(false);
      expect(result.actor_name).toBe('John Doe');
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (n:Notification'),
        expect.objectContaining({
          userId: 'user123',
          actorId: 'user456',
          type: 'like',
          postId: 'post123',
        })
      );
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('getUserNotificationsService', () => {
    it('should retrieve all notifications for a user', async () => {
      const mockNotifications = [
        { id: 'notif-1', type: 'like', post_id: 'post1', is_read: false },
        { id: 'notif-2', type: 'like', post_id: 'post2', is_read: true },
      ];

      mockSession.run.mockResolvedValueOnce({
        records: mockNotifications.map((notif) => ({
          get: (key: string) => {
            if (key === 'n') return { properties: notif };
            if (key === 'actor_first_name') return 'Jane';
            if (key === 'actor_last_name') return 'Smith';
            if (key === 'actor_id') return 'actor123';
          }
        })),
      });

      const result = await getUserNotificationsService('user123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('notif-1');
      expect(result[0].actor_name).toBe('Jane Smith');
      expect(result[1].id).toBe('notif-2');
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (u:User {id: $userId})-[:RECEIVES]->(n:Notification)'),
        expect.objectContaining({ userId: 'user123' })
      );
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should return empty array when user has no notifications', async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [],
      });

      const result = await getUserNotificationsService('user-no-notifs');

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('markNotificationAsReadService', () => {
    it('should mark a notification as read', async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [],
      });

      await markNotificationAsReadService('notif-123');

      expect(mockSession.run).toHaveBeenCalledTimes(1);
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('SET n.is_read = true'),
        expect.objectContaining({ notifId: 'notif-123' })
      );
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
});
