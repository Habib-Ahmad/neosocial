import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { login, logout } from '../../controllers/userController';
import { getUserByEmail } from '../../service/userService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';

jest.mock('../../service/userService');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Authentication Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: any;
  let jsonMock: any;
  let cookieMock: any;

  beforeEach(() => {
    jest.clearAllMocks();

    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    cookieMock = jest.fn().mockReturnThis();

    mockResponse = {
      status: statusMock,
      json: jsonMock,
      cookie: cookieMock,
    } as any;

    process.env.TOKEN_SECRET = 'test-secret';
  });

  describe('login', () => {
    it('should reject login when email is missing', async () => {
      mockRequest = {
        body: { password: 'password123' },
      };

      await expect(login(mockRequest as Request, mockResponse as Response)).rejects.toThrow(
        'Please provide both email and password'
      );
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should reject login when password is missing', async () => {
      mockRequest = {
        body: { email: 'test@example.com' },
      };

      await expect(login(mockRequest as Request, mockResponse as Response)).rejects.toThrow(
        'Please provide both email and password'
      );
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should reject login for non-existent user', async () => {
      mockRequest = {
        body: { email: 'nonexistent@example.com', password: 'password123' },
      };

      (getUserByEmail as any).mockResolvedValue(null);

      await expect(login(mockRequest as Request, mockResponse as Response)).rejects.toThrow(
        'Invalid email or password'
      );
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should reject login with incorrect password', async () => {
      mockRequest = {
        body: { email: 'test@example.com', password: 'wrongpassword' },
      };

      (getUserByEmail as any).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(login(mockRequest as Request, mockResponse as Response)).rejects.toThrow(
        'Invalid email or password'
      );
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should successfully login with valid credentials', async () => {
      mockRequest = {
        body: { email: 'test@example.com', password: 'correctpassword' },
      };

      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
      };

      (getUserByEmail as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any).mockReturnValue('mock-jwt-token');

      await login(mockRequest as Request, mockResponse as Response);

      expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalledWith(
        { user: { id: '123' } },
        'test-secret',
        { expiresIn: '1d' }
      );
      expect(cookieMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          token: 'mock-jwt-token',
        })
      );
    });
  });

  describe('logout', () => {
    it('should clear authentication cookie on logout', async () => {
      mockRequest = {};

      await logout(mockRequest as Request, mockResponse as Response);

      expect(cookieMock).toHaveBeenCalledWith(
        'token',
        '',
        expect.objectContaining({
          httpOnly: true,
          expires: new Date(0),
        })
      );
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Logout successful' });
    });
  });
});
