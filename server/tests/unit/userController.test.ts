import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import {
  registerUser,
  login,
  logout,
  getUserById,
  updateUserProfile,
  changePassword,
  sendFriendRequest,
  handleFriendRequest,
  searchUsers,
  getUserFriends,
  removeFriend,
  cancelFriendRequest,
} from '../../controllers/userController';
import * as userService from '../../service/userService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../service/userService');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

describe('User Controller Unit Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let cookieMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    cookieMock = jest.fn().mockReturnThis();
    mockRes = { status: statusMock as any, json: jsonMock as any, cookie: cookieMock as any };
    mockReq = { user: { id: 'user-123' }, body: {}, params: {}, query: {} };
    process.env.TOKEN_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register user successfully', async () => {
      mockReq.body = { email: 'test@test.com', password: 'Pass123!', first_name: 'John', last_name: 'Doe' };
      (userService.getUserByEmail as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue('hashed');
      (userService.createUser as any).mockResolvedValue({ id: 'mock-uuid', email: 'test@test.com' });
      (jwt.sign as any).mockReturnValue('token');

      await registerUser(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(cookieMock).toHaveBeenCalled();
    });

    it('should reject if user exists', async () => {
      mockReq.body = { email: 'existing@test.com', password: 'Pass123!', first_name: 'John', last_name: 'Doe' };
      (userService.getUserByEmail as any).mockResolvedValue({ id: 'existing' });

      await expect(registerUser(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should use default profile picture', async () => {
      mockReq.body = { email: 'test@test.com', password: 'Pass123!', first_name: 'John', last_name: 'Doe' };
      mockReq.file = undefined;
      (userService.getUserByEmail as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue('hashed');
      (userService.createUser as any).mockResolvedValue({ id: 'mock-uuid' });
      (jwt.sign as any).mockReturnValue('token');

      await registerUser(mockReq as Request, mockRes as Response);

      expect(userService.createUser).toHaveBeenCalledWith(expect.objectContaining({
        profile_picture: '/uploads/users/user.jpg'
      }));
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      mockReq.body = { email: 'test@test.com', password: 'Pass123!' };
      (userService.getUserByEmail as any).mockResolvedValue({ id: 'user-123', password_hash: 'hashed' });
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any).mockReturnValue('token');

      await login(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(cookieMock).toHaveBeenCalled();
    });

    it('should reject missing credentials', async () => {
      mockReq.body = { email: 'test@test.com' };

      await expect(login(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should reject invalid email', async () => {
      mockReq.body = { email: 'wrong@test.com', password: 'Pass123!' };
      (userService.getUserByEmail as any).mockResolvedValue(null);

      await expect(login(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should reject incorrect password', async () => {
      mockReq.body = { email: 'test@test.com', password: 'Wrong!' };
      (userService.getUserByEmail as any).mockResolvedValue({ password_hash: 'hashed' });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(login(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  describe('getUserById', () => {
    it('should fetch user successfully', async () => {
      mockReq.params = { id: 'target-user' };
      (userService.getUserByIdService as any).mockResolvedValue({ id: 'target-user', password_hash: 'hashed' });

      await getUserById(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.not.objectContaining({ password_hash: expect.anything() })
      }));
    });

    it('should return 404 if user not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      (userService.getUserByIdService as any).mockResolvedValue(null);

      await expect(getUserById(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('updateUserProfile', () => {
    it('should update profile successfully', async () => {
      mockReq.body = { first_name: 'Updated' };
      (userService.updateUser as any).mockResolvedValue({ id: 'user-123', first_name: 'Updated' });

      await updateUserProfile(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should reject invalid privacy level', async () => {
      mockReq.body = { privacy_level: 'invalid' };

      await expect(updateUserProfile(mockReq as Request, mockRes as Response)).rejects.toThrow();
    });

    it('should remove password from updates', async () => {
      mockReq.body = { password: 'new', first_name: 'John' };
      (userService.updateUser as any).mockResolvedValue({ id: 'user-123' });

      await updateUserProfile(mockReq as Request, mockRes as Response);

      expect(userService.updateUser).toHaveBeenCalledWith('user-123', { first_name: 'John' });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockReq.body = { currentPassword: 'Old123!', newPassword: 'New456!' };
      (userService.getUserByIdService as any).mockResolvedValue({ password_hash: 'old-hash' });
      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue('new-hash');
      (userService.updateUser as any).mockResolvedValue({ id: 'user-123' });

      await changePassword(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should reject incorrect current password', async () => {
      mockReq.body = { currentPassword: 'Wrong!', newPassword: 'New456!' };
      (userService.getUserByIdService as any).mockResolvedValue({ password_hash: 'hash' });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(changePassword(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  describe('sendFriendRequest', () => {
    it('should send friend request successfully', async () => {
      mockReq.body = { id: 'target-user' };
      (userService.sendFriendRequestService as any).mockResolvedValue(true);

      await sendFriendRequest(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should reject request to self', async () => {
      mockReq.body = { id: 'user-123' };

      await expect(sendFriendRequest(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('handleFriendRequest', () => {
    it('should accept friend request', async () => {
      mockReq.body = { senderId: 'sender-123', action: 'accept' };
      (userService.acceptFriendRequestService as any).mockResolvedValue(true);

      await handleFriendRequest(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should reject friend request', async () => {
      mockReq.body = { senderId: 'sender-123', action: 'reject' };
      (userService.rejectFriendRequestService as any).mockResolvedValue(true);

      await handleFriendRequest(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should reject invalid action', async () => {
      mockReq.body = { senderId: 'sender-123', action: 'invalid' };

      await expect(handleFriendRequest(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      mockReq.query = { query: 'john' };
      (userService.searchUsersService as any).mockResolvedValue([{ id: 'user-1' }]);

      await searchUsers(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should reject short query', async () => {
      mockReq.query = { query: 'a' };

      await searchUsers(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should reject unauthenticated request', async () => {
      mockReq.user = undefined;
      mockReq.query = { query: 'john' };

      await searchUsers(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  describe('getUserFriends', () => {
    it('should get user friends successfully', async () => {
      mockReq.params = { id: 'user-123' };
      const mockFriends = [{ id: 'friend1' }, { id: 'friend2' }];
      (userService.getUserFriendsService as any).mockResolvedValue(mockFriends);

      await getUserFriends(mockReq as Request, mockRes as Response);

      expect(userService.getUserFriendsService).toHaveBeenCalledWith('user-123');
      expect(jsonMock).toHaveBeenCalledWith({ message: "Friends fetched successfully", friends: mockFriends });
    });
  });

  describe('removeFriend', () => {
    it('should remove friend successfully', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { friendId: 'friend-456' };
      (userService.removeFriendService as any).mockResolvedValue(true);

      await removeFriend(mockReq as Request, mockRes as Response);

      expect(userService.removeFriendService).toHaveBeenCalledWith('user-123', 'friend-456');
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Friend removed successfully' });
    });
  });

  describe('cancelFriendRequest', () => {
    it('should cancel friend request successfully', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { receivingUserId: 'user-456' };
      (userService.cancelFriendRequestService as any).mockResolvedValue(true);

      await cancelFriendRequest(mockReq as Request, mockRes as Response);

      expect(userService.cancelFriendRequestService).toHaveBeenCalledWith('user-123', 'user-456');
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Friend request cancelled' });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      await logout(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(cookieMock).toHaveBeenCalledWith('token', '', expect.objectContaining({
        httpOnly: true,
        expires: expect.any(Date)
      }));
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Logout successful' });
    });
  });

  describe('updateUserProfile - additional branches', () => {
    it('should reject unauthenticated user', async () => {
      mockReq.user = undefined;
      mockReq.body = { first_name: 'Updated' };

      await expect(updateUserProfile(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should reject when no updates provided', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = {};

      await expect(updateUserProfile(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should remove password from updates', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { first_name: 'John', password: 'newpass', password_hash: 'hash' };
      (userService.updateUser as any).mockResolvedValue({ id: 'user-123', first_name: 'John', password_hash: 'old' });

      await updateUserProfile(mockReq as Request, mockRes as Response);

      expect(userService.updateUser).toHaveBeenCalledWith('user-123', expect.not.objectContaining({
        password: expect.anything(),
        password_hash: expect.anything()
      }));
    });

    it('should reject when user not found', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { first_name: 'Updated' };
      (userService.updateUser as any).mockResolvedValue(null);

      await expect(updateUserProfile(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('changePassword - additional branches', () => {
    it('should reject unauthenticated user', async () => {
      mockReq.user = undefined;
      mockReq.body = { currentPassword: 'old', newPassword: 'new' };

      await expect(changePassword(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should reject when passwords not provided', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { currentPassword: 'old' };

      await expect(changePassword(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should reject when user not found', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { currentPassword: 'old', newPassword: 'new' };
      (userService.getUserByIdService as any).mockResolvedValue(null);

      await expect(changePassword(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('login - TOKEN_SECRET branch', () => {
    it('should handle missing TOKEN_SECRET', async () => {
      const originalSecret = process.env.TOKEN_SECRET;
      delete process.env.TOKEN_SECRET;

      mockReq.body = { email: 'test@test.com', password: 'Pass123!' };
      (userService.getUserByEmail as any).mockResolvedValue({ id: 'user-123', password_hash: 'hashed' });
      (bcrypt.compare as any).mockResolvedValue(true);

      await expect(login(mockReq as Request, mockRes as Response)).rejects.toThrow('Internal server error - Token secret not defined');
      expect(statusMock).toHaveBeenCalledWith(500);

      process.env.TOKEN_SECRET = originalSecret;
    });
  });

  describe('registerUser - file upload branch', () => {
    it('should use uploaded file as profile picture', async () => {
      mockReq.body = { email: 'test@test.com', password: 'Pass123!', first_name: 'John', last_name: 'Doe' };
      mockReq.file = { filename: 'uploaded.jpg' } as any;
      (userService.getUserByEmail as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue('hashed');
      (userService.createUser as any).mockResolvedValue({ id: 'mock-uuid' });
      (jwt.sign as any).mockReturnValue('token');

      await registerUser(mockReq as Request, mockRes as Response);

      expect(userService.createUser).toHaveBeenCalledWith(expect.objectContaining({
        profile_picture: '/uploads/users/uploaded.jpg'
      }));
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      mockReq.query = { query: 'john' };
      const mockUsers = [{ id: 'user-1', first_name: 'John' }];
      (userService.searchUsersService as any).mockResolvedValue(mockUsers);

      await searchUsers(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ users: mockUsers });
    });

    it('should handle empty search query', async () => {
      mockReq.query = { query: '' };

      await searchUsers(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Search query must be at least 2 characters' });
    });
  });

  describe('sendFriendRequest - additional branches', () => {
    it('should reject when target user not provided', async () => {
      mockReq.body = {};

      await expect(sendFriendRequest(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should reject unauthenticated user', async () => {
      mockReq.user = undefined;
      mockReq.body = { id: 'target-user' };

      await expect(sendFriendRequest(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('handleFriendRequest - additional branches', () => {
    it('should reject unauthenticated user', async () => {
      mockReq.user = undefined;
      mockReq.body = { sendingUserId: 'sender', accept: true };

      await expect(handleFriendRequest(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should reject when sendingUserId not provided', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { accept: true };

      await expect(handleFriendRequest(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('getUserFriends - additional branches', () => {
    it('should reject unauthenticated user', async () => {
      mockReq.user = undefined;

      await expect(getUserFriends(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('removeFriend - additional branches', () => {
    it('should reject unauthenticated user', async () => {
      mockReq.user = undefined;
      mockReq.body = { friendId: 'friend-123' };

      await expect(removeFriend(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should reject when friendId not provided', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = {};

      await expect(removeFriend(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('cancelFriendRequest - additional branches', () => {
    it('should reject unauthenticated user', async () => {
      mockReq.user = undefined;
      mockReq.body = { receivingUserId: 'receiver-123' };

      await expect(cancelFriendRequest(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should reject when receivingUserId not provided', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = {};

      await expect(cancelFriendRequest(mockReq as Request, mockRes as Response)).rejects.toThrow();
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });
});
