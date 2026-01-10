import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendFriendRequestService,
  acceptFriendRequestService,
  rejectFriendRequestService,
  cancelFriendRequestService,
  getUserByEmail,
  updateUser,
  searchUsersService,
  getUserFriendsService,
  getUserByIdService,
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

  describe('rejectFriendRequestService', () => {
    it('should reject friend request successfully', async () => {
      mockRun.mockResolvedValueOnce({
        records: [{ get: () => 'user1' }],
      });

      const result = await rejectFriendRequestService('user1', 'user2');

      expect(result).toBe(true);
      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('DELETE r'),
        { fromId: 'user1', toId: 'user2' }
      );
    });

    it('should return false if no request exists to reject', async () => {
      mockRun.mockResolvedValueOnce({
        records: [],
      });

      const result = await rejectFriendRequestService('user1', 'user2');

      expect(result).toBe(false);
    });
  });

  describe('cancelFriendRequestService', () => {
    it('should cancel sent friend request successfully', async () => {
      mockRun.mockResolvedValueOnce({
        records: [{ get: () => 'user1' }],
      });

      const result = await cancelFriendRequestService('user1', 'user2');

      expect(result).toBe(true);
      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('DELETE r'),
        { fromId: 'user1', toId: 'user2' }
      );
    });

    it('should return false if no request exists to cancel', async () => {
      mockRun.mockResolvedValueOnce({
        records: [],
      });

      const result = await cancelFriendRequestService('user1', 'user2');

      expect(result).toBe(false);
    });
  });

  describe('searchUsersService', () => {
    it('should search users by query', async () => {
      const mockUser = {
        id: 'user1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        username: 'johndoe',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'u') return { properties: mockUser };
              if (key === 'mutual_friends_count') return { toInt: () => 3 };
            },
          },
        ],
      });

      const result = await searchUsersService('john', null, 20, 0, 'current-user');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('first_name', 'John');
      expect(result[0]).toHaveProperty('mutual_friends_count', 3);
      expect(result[0]).not.toHaveProperty('password_hash');
    });

    it('should filter by status when provided', async () => {
      mockRun.mockResolvedValueOnce({ records: [] });

      await searchUsersService('john', 'active', 20, 0, 'current-user');

      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 'active',
        })
      );
    });

    it('should exclude current user from results', async () => {
      mockRun.mockResolvedValueOnce({ records: [] });

      await searchUsersService('john', null, 20, 0, 'current-user-123');

      expect(mockRun).toHaveBeenCalledWith(
        expect.stringContaining('u.id <> $currentUserId'),
        expect.objectContaining({
          currentUserId: 'current-user-123',
        })
      );
    });
  });

  describe('getUserFriendsService', () => {
    it('should return friends with mutual friends count', async () => {
      const mockFriend = {
        id: 'friend1',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@test.com',
        profile_picture: '/pics/jane.jpg',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'friend') return { properties: mockFriend };
              if (key === 'mutualCount') return { toInt: () => 5 };
            },
          },
        ],
      });

      const result = await getUserFriendsService('user123');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('first_name', 'Jane');
      expect(result[0]).toHaveProperty('mutual_friends_count', 5);
    });

    it('should return empty array when user has no friends', async () => {
      mockRun.mockResolvedValueOnce({ records: [] });

      const result = await getUserFriendsService('user123');

      expect(result).toHaveLength(0);
    });
  });

  describe('getUserByIdService', () => {
    it('should return user with all relationship flags', async () => {
      const mockUser = {
        id: 'user123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        profile_picture: '/pics/john.jpg',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'u') return { properties: mockUser };
              if (key === 'friend_count') return { toNumber: () => 10 };
              if (key === 'post_count') return { toNumber: () => 25 };
              if (key === 'is_friend') return true;
              if (key === 'sent_request') return false;
              if (key === 'received_request') return false;
              return null;
            },
          },
        ],
      });

      const result = await getUserByIdService('user123', 'currentUser');

      expect(result).toHaveProperty('id', 'user123');
      expect(result).toHaveProperty('friend_count', 10);
      expect(result).toHaveProperty('post_count', 25);
      expect(result).toHaveProperty('is_friend', true);
      expect(result).toHaveProperty('sent_request', false);
      expect(result).toHaveProperty('received_request', false);
    });

    it('should return user with sent_request flag', async () => {
      const mockUser = {
        id: 'user456',
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@test.com',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'u') return { properties: mockUser };
              if (key === 'friend_count') return { toNumber: () => 5 };
              if (key === 'post_count') return { toNumber: () => 3 };
              if (key === 'is_friend') return false;
              if (key === 'sent_request') return true;
              if (key === 'received_request') return false;
              return null;
            },
          },
        ],
      });

      const result = await getUserByIdService('user456', 'currentUser');

      expect(result).toHaveProperty('is_friend', false);
      expect(result).toHaveProperty('sent_request', true);
      expect(result).toHaveProperty('received_request', false);
    });

    it('should return user with received_request flag', async () => {
      const mockUser = {
        id: 'user789',
        first_name: 'Bob',
        last_name: 'Smith',
        email: 'bob@test.com',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'u') return { properties: mockUser };
              if (key === 'friend_count') return { toNumber: () => 8 };
              if (key === 'post_count') return { toNumber: () => 12 };
              if (key === 'is_friend') return false;
              if (key === 'sent_request') return false;
              if (key === 'received_request') return true;
              return null;
            },
          },
        ],
      });

      const result = await getUserByIdService('user789', 'currentUser');

      expect(result).toHaveProperty('sent_request', false);
      expect(result).toHaveProperty('received_request', true);
    });

    it('should return null when user not found', async () => {
      mockRun.mockResolvedValueOnce({
        records: [],
      });

      const result = await getUserByIdService('nonexistent', 'currentUser');

      expect(result).toBeNull();
    });

    it('should work without currentUserId parameter', async () => {
      const mockUser = {
        id: 'user999',
        first_name: 'Charlie',
        last_name: 'Brown',
        email: 'charlie@test.com',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'u') return { properties: mockUser };
              if (key === 'friend_count') return { toNumber: () => 0 };
              if (key === 'post_count') return { toNumber: () => 0 };
              if (key === 'is_friend') return false;
              if (key === 'sent_request') return false;
              if (key === 'received_request') return false;
              return null;
            },
          },
        ],
      });

      const result = await getUserByIdService('user999');

      expect(result).toHaveProperty('id', 'user999');
      expect(result).toHaveProperty('is_friend', false);
      expect(result).toHaveProperty('sent_request', false);
      expect(result).toHaveProperty('received_request', false);
    });
  });

  describe('sendFriendRequestService - additional branches', () => {
    it('should successfully send a new friend request', async () => {
      // No existing relationship
      mockRun.mockResolvedValueOnce({
        records: [],
      });
      // Create request
      mockRun.mockResolvedValueOnce({
        records: [{ get: () => true }],
      });

      const result = await sendFriendRequestService('user1', 'user2');

      expect(result).toBe(true);
      expect(mockRun).toHaveBeenCalledTimes(2);
    });

    it('should prevent receiving duplicate request (reverse direction)', async () => {
      mockRun.mockResolvedValueOnce({
        records: [{ get: () => ({ type: 'RECEIVED_FRIEND_REQUEST' }) }],
      });

      const result = await sendFriendRequestService('user1', 'user2');

      expect(result).toBe(false);
    });
  });

  describe('acceptFriendRequestService - additional branches', () => {
    it('should successfully accept friend request', async () => {
      mockRun.mockResolvedValueOnce({
        records: [{ get: () => true }],
      });

      const result = await acceptFriendRequestService('receivingUser', 'sendingUser');

      expect(result).toBe(true);
    });
  });

  describe('rejectFriendRequestService - additional branches', () => {
    it('should successfully reject friend request', async () => {
      mockRun.mockResolvedValueOnce({
        records: [{ get: () => true }],
      });

      const result = await rejectFriendRequestService('receivingUser', 'sendingUser');

      expect(result).toBe(true);
    });
  });

  describe('cancelFriendRequestService - additional branches', () => {
    it('should successfully cancel friend request', async () => {
      mockRun.mockResolvedValueOnce({
        records: [{ get: () => true }],
      });

      const result = await cancelFriendRequestService('sendingUser', 'receivingUser');

      expect(result).toBe(true);
    });
  });

  describe('getUserFriendsService - additional branches', () => {
    it('should fetch friends successfully', async () => {
      const mockFriends = [
        { id: 'friend1', first_name: 'Friend', last_name: 'One', email: 'f1@test.com', profile_picture: '/pic1.jpg' },
        { id: 'friend2', first_name: 'Friend', last_name: 'Two', email: 'f2@test.com', profile_picture: '/pic2.jpg' },
      ];

      mockRun.mockResolvedValueOnce({
        records: mockFriends.map(f => ({
          get: (key: string) => {
            if (key === 'friend') return { properties: f };
            if (key === 'mutualCount') return { toInt: () => 3 };
            return null;
          }
        }))
      });

      const result = await getUserFriendsService('user1');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'friend1');
      expect(result[0]).toHaveProperty('mutual_friends_count', 3);
    });

    it('should return empty array when user has no friends', async () => {
      mockRun.mockResolvedValueOnce({
        records: []
      });

      const result = await getUserFriendsService('user1');

      expect(result).toEqual([]);
    });
  });

  describe('searchUsersService - additional branches', () => {
    it('should search users by name successfully', async () => {
      const mockUsers = [
        { id: 'user1', first_name: 'John', last_name: 'Doe', email: 'john@test.com' },
        { id: 'user2', first_name: 'Jane', last_name: 'Doe', email: 'jane@test.com' },
      ];

      mockRun.mockResolvedValueOnce({
        records: mockUsers.map(u => ({
          get: (key: string) => {
            if (key === 'u') return { properties: { ...u, password_hash: 'hash' } };
            if (key === 'mutual_friends_count') return { toInt: () => 5 };
            return null;
          }
        }))
      });

      const result = await searchUsersService('John', null, 20, 0, 'currentUser');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('mutual_friends_count', 5);
    });

    it('should return empty array when no users match', async () => {
      mockRun.mockResolvedValueOnce({
        records: []
      });

      const result = await searchUsersService('NonexistentName', null, 20, 0, 'currentUser');

      expect(result).toEqual([]);
    });
  });

  describe('getUserByIdService - friendship status branches', () => {
    it('should correctly identify sent friend request', async () => {
      const mockUser = {
        id: 'user123',
        first_name: 'Test',
        last_name: 'User',
        email: 'test@test.com',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'u') return { properties: mockUser };
              if (key === 'friend_count') return { toNumber: () => 5 };
              if (key === 'post_count') return { toNumber: () => 10 };
              if (key === 'is_friend') return false;
              if (key === 'sent_request') return true;
              if (key === 'received_request') return false;
              return null;
            },
          },
        ],
      });

      const result = await getUserByIdService('user123', 'currentUser');

      expect(result).toHaveProperty('sent_request', true);
      expect(result).toHaveProperty('received_request', false);
      expect(result).toHaveProperty('is_friend', false);
    });

    it('should correctly identify when users are friends', async () => {
      const mockUser = {
        id: 'user456',
        first_name: 'Friend',
        last_name: 'User',
        email: 'friend@test.com',
      };

      mockRun.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'u') return { properties: mockUser };
              if (key === 'friend_count') return { toNumber: () => 15 };
              if (key === 'post_count') return { toNumber: () => 20 };
              if (key === 'is_friend') return true;
              if (key === 'sent_request') return false;
              if (key === 'received_request') return false;
              return null;
            },
          },
        ],
      });

      const result = await getUserByIdService('user456', 'currentUser');

      expect(result).toHaveProperty('is_friend', true);
      expect(result).toHaveProperty('sent_request', false);
      expect(result).toHaveProperty('received_request', false);
    });
  });
});
