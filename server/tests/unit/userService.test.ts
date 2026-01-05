import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendFriendRequestService,
  acceptFriendRequestService,
  getUserByEmail,
  updateUser,
} from '../../service/userService';
import { driver } from '../../db/neo4j';

jest.mock('../../db/neo4j', () => ({
  driver: {
    session: jest.fn(),
  },
}));

describe('User Service', () => {
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

  describe('sendFriendRequestService', () => {
    it('should prevent sending duplicate friend requests', async () => {
      mockRun.mockResolvedValueOnce({
        records: [{ get: () => ({ type: 'SENT_FRIEND_REQUEST' }) }],
      });

      const result = await sendFriendRequestService('user1', 'user2');

      expect(result).toBe(false);
    });

    it('should prevent sending friend request if already friends', async () => {
      mockRun.mockResolvedValueOnce({
        records: [{ get: () => ({ type: 'FRIENDS_WITH' }) }],
      });

      const result = await sendFriendRequestService('user1', 'user2');

      expect(result).toBe(false);
    });

    it('should successfully send new friend request', async () => {
      mockRun.mockResolvedValueOnce({ records: [] });
      mockRun.mockResolvedValueOnce({ records: [] });

      const result = await sendFriendRequestService('user1', 'user2');

      expect(result).toBe(true);
      expect(mockRun).toHaveBeenCalledTimes(2);
    });
  });

  describe('acceptFriendRequestService', () => {
    it('should create bidirectional friendship on accept', async () => {
      mockRun.mockResolvedValueOnce({
        records: [{ get: () => 'user1' }],
      });

      const result = await acceptFriendRequestService('user1', 'user2');

      expect(result).toBe(true);
      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('FRIENDS_WITH'),
        { fromId: 'user1', toId: 'user2' }
      );
    });

    it('should return false if no pending request exists', async () => {
      mockRun.mockResolvedValueOnce({
        records: [],
      });

      const result = await acceptFriendRequestService('user1', 'user2');

      expect(result).toBe(false);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when email exists', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      };

      mockRun.mockResolvedValueOnce({
        records: [{ get: () => ({ properties: mockUser }) }],
      });

      const result = await getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (u:User {email: $email})'),
        { email: 'test@example.com' }
      );
    });

    it('should return null when email does not exist', async () => {
      mockRun.mockResolvedValueOnce({
        records: [],
      });

      const result = await getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user profile fields', async () => {
      const updates = {
        first_name: 'Updated',
        profile_picture: '/new-pic.jpg',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: () => ({
              properties: { id: '123', ...updates },
            }),
          },
        ],
      });

      const result = await updateUser('123', updates);

      expect(result).toMatchObject(updates);
      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('SET'),
        expect.objectContaining({ id: '123', ...updates })
      );
    });

    it('should return null if user does not exist', async () => {
      mockRun.mockResolvedValueOnce({
        records: [],
      });

      const result = await updateUser('nonexistent-id', { first_name: 'Test' });

      expect(result).toBeNull();
    });
  });
});
