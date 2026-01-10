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
  });
});
