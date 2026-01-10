import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { registerUser, login, logout } from "../../controllers/userController";
import { getUserByEmail, createUser } from "../../service/userService";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

jest.mock("../../service/userService");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-123"),
}));

describe("Authentication Controller", () => {
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

    process.env.TOKEN_SECRET = "test-secret";
  });

  describe("registerUser", () => {
    it("should reject registration when email is missing", async () => {
      mockRequest = {
        body: {
          password: "Password123",
          first_name: "John",
          last_name: "Doe",
        },
      };

      await expect(registerUser(mockRequest as Request, mockResponse as Response)).rejects.toThrow(
        "Please provide all required fields including privacy"
      );
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should reject registration when password is missing", async () => {
      mockRequest = {
        body: {
          email: "test@example.com",
          first_name: "John",
          last_name: "Doe",
        },
      };

      await expect(registerUser(mockRequest as Request, mockResponse as Response)).rejects.toThrow(
        "Please provide all required fields including privacy"
      );
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should reject registration when first_name is missing", async () => {
      mockRequest = {
        body: {
          email: "test@example.com",
          password: "Password123",
          last_name: "Doe",
        },
      };

      await expect(registerUser(mockRequest as Request, mockResponse as Response)).rejects.toThrow(
        "Please provide all required fields including privacy"
      );
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should reject registration when last_name is missing", async () => {
      mockRequest = {
        body: {
          email: "test@example.com",
          password: "Password123",
          first_name: "John",
        },
      };

      await expect(registerUser(mockRequest as Request, mockResponse as Response)).rejects.toThrow(
        "Please provide all required fields including privacy"
      );
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should reject registration when user already exists", async () => {
      mockRequest = {
        body: {
          email: "existing@example.com",
          password: "Password123",
          first_name: "John",
          last_name: "Doe",
        },
      };

      (getUserByEmail as any).mockResolvedValue({
        id: "123",
        email: "existing@example.com",
      });

      await expect(registerUser(mockRequest as Request, mockResponse as Response)).rejects.toThrow(
        "User with this email already exists"
      );
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should successfully register a new user without profile picture", async () => {
      mockRequest = {
        body: {
          email: "newuser@example.com",
          password: "SecurePass123!",
          first_name: "Jane",
          last_name: "Smith",
        },
      };

      const mockCreatedUser = {
        id: "mock-uuid-123",
        email: "newuser@example.com",
        password_hash: "hashed_password",
        first_name: "Jane",
        last_name: "Smith",
        profile_picture: "/uploads/users/user.jpg",
      };

      (getUserByEmail as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue("hashed_password");
      (createUser as any).mockResolvedValue(mockCreatedUser);
      (jwt.sign as any).mockReturnValue("mock-jwt-token");

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(getUserByEmail).toHaveBeenCalledWith("newuser@example.com");
      expect(bcrypt.hash).toHaveBeenCalledWith("SecurePass123!", 10);
      expect(createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "newuser@example.com",
          password: "hashed_password",
          first_name: "Jane",
          last_name: "Smith",
          id: "mock-uuid-123",
          profile_picture: "/uploads/users/user.jpg",
        })
      );
      expect(jwt.sign).toHaveBeenCalledWith({ user: { id: "mock-uuid-123" } }, "test-secret", {
        expiresIn: "1d",
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(cookieMock).toHaveBeenCalledWith(
        "token",
        "mock-jwt-token",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "none",
        })
      );
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User registered successfully",
          token: "mock-jwt-token",
          user: expect.not.objectContaining({ password_hash: expect.anything() }),
        })
      );
    });

    it("should successfully register a new user with profile picture", async () => {
      mockRequest = {
        body: {
          email: "newuser@example.com",
          password: "SecurePass123!",
          first_name: "Jane",
          last_name: "Smith",
        },
        file: {
          filename: "profile-123.jpg",
        } as any,
      };

      const mockCreatedUser = {
        id: "mock-uuid-123",
        email: "newuser@example.com",
        password_hash: "hashed_password",
        first_name: "Jane",
        last_name: "Smith",
        profile_picture: "/uploads/users/profile-123.jpg",
      };

      (getUserByEmail as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue("hashed_password");
      (createUser as any).mockResolvedValue(mockCreatedUser);
      (jwt.sign as any).mockReturnValue("mock-jwt-token");

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          profile_picture: "/uploads/users/profile-123.jpg",
        })
      );
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("should hash the password before creating user", async () => {
      mockRequest = {
        body: {
          email: "test@example.com",
          password: "PlainTextPassword",
          first_name: "Test",
          last_name: "User",
        },
      };

      (getUserByEmail as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue("hashed-password-result");
      (createUser as any).mockResolvedValue({
        id: "mock-uuid-123",
        email: "test@example.com",
        password_hash: "hashed-password-result",
      });
      (jwt.sign as any).mockReturnValue("token");

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(bcrypt.hash).toHaveBeenCalledWith("PlainTextPassword", 10);
      expect(createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          password: "hashed-password-result",
        })
      );
    });
  });

  describe("login", () => {
    it("should reject login when email is missing", async () => {
      mockRequest = {
        body: { password: "password123" },
      };

      await expect(login(mockRequest as Request, mockResponse as Response)).rejects.toThrow(
        "Please provide both email and password"
      );
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should reject login when password is missing", async () => {
      mockRequest = {
        body: { email: "test@example.com" },
      };

      await expect(login(mockRequest as Request, mockResponse as Response)).rejects.toThrow(
        "Please provide both email and password"
      );
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should reject login for non-existent user", async () => {
      mockRequest = {
        body: { email: "nonexistent@example.com", password: "password123" },
      };

      (getUserByEmail as any).mockResolvedValue(null);

      await expect(login(mockRequest as Request, mockResponse as Response)).rejects.toThrow(
        "Invalid email or password"
      );
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it("should reject login with incorrect password", async () => {
      mockRequest = {
        body: { email: "test@example.com", password: "wrongpassword" },
      };

      (getUserByEmail as any).mockResolvedValue({
        id: "123",
        email: "test@example.com",
        password_hash: "hashed_password",
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(login(mockRequest as Request, mockResponse as Response)).rejects.toThrow(
        "Invalid email or password"
      );
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it("should successfully login with valid credentials", async () => {
      mockRequest = {
        body: { email: "test@example.com", password: "correctpassword" },
      };

      const mockUser = {
        id: "123",
        email: "test@example.com",
        password_hash: "hashed_password",
        first_name: "John",
        last_name: "Doe",
      };

      (getUserByEmail as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any).mockReturnValue("mock-jwt-token");

      await login(mockRequest as Request, mockResponse as Response);

      expect(bcrypt.compare).toHaveBeenCalledWith("correctpassword", "hashed_password");
      expect(jwt.sign).toHaveBeenCalledWith({ user: { id: "123" } }, "test-secret", {
        expiresIn: "1d",
      });
      expect(cookieMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Login successful",
          token: "mock-jwt-token",
        })
      );
    });
  });

  describe("logout", () => {
    it("should clear authentication cookie on logout", async () => {
      mockRequest = {};

      await logout(mockRequest as Request, mockResponse as Response);

      expect(cookieMock).toHaveBeenCalledWith(
        "token",
        "",
        expect.objectContaining({
          httpOnly: true,
          expires: new Date(0),
        })
      );
      expect(jsonMock).toHaveBeenCalledWith({ message: "Logout successful" });
    });
  });
});
