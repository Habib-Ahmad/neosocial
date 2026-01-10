import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { validateToken } from "../../middleware/validateToken";

jest.mock("jsonwebtoken");

describe("ValidateToken Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  const originalEnv = process.env;

  beforeEach(() => {
    req = {
      cookies: {},
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    process.env = { ...originalEnv, TOKEN_SECRET: "test-secret" };
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  it("should validate token from cookies successfully", () => {
    const mockUser = { id: "user123" };
    req.cookies = { token: "valid-token" };
    (jwt.verify as jest.Mock).mockReturnValue({ user: mockUser });

    validateToken(req as Request, res as Response, next);

    expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it("should validate token from authorization header successfully", () => {
    const mockUser = { id: "user456" };
    req.headers = { authorization: "Bearer valid-token-header" };
    (jwt.verify as jest.Mock).mockReturnValue({ user: mockUser });

    validateToken(req as Request, res as Response, next);

    expect(jwt.verify).toHaveBeenCalledWith("valid-token-header", "test-secret");
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it("should throw error if no token provided", () => {
    req.cookies = {};
    req.headers = {};

    expect(() => validateToken(req as Request, res as Response, next)).toThrow("No token provided");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should throw error if TOKEN_SECRET is not defined", () => {
    delete process.env.TOKEN_SECRET;
    req.cookies = { token: "some-token" };

    expect(() => validateToken(req as Request, res as Response, next)).toThrow(
      "Token secret not defined in environment"
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should throw error for invalid token", () => {
    req.cookies = { token: "invalid-token" };
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    expect(() => validateToken(req as Request, res as Response, next)).toThrow("Invalid token");
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should throw specific error for expired token", () => {
    req.cookies = { token: "expired-token" };
    const expiredError = new jwt.TokenExpiredError("jwt expired", new Date());
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw expiredError;
    });

    expect(() => validateToken(req as Request, res as Response, next)).toThrow("Token expired");
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should prefer cookie token over authorization header", () => {
    const mockUser = { id: "user789" };
    req.cookies = { token: "cookie-token" };
    req.headers = { authorization: "Bearer header-token" };
    (jwt.verify as jest.Mock).mockReturnValue({ user: mockUser });

    validateToken(req as Request, res as Response, next);

    expect(jwt.verify).toHaveBeenCalledWith("cookie-token", "test-secret");
    expect(jwt.verify).not.toHaveBeenCalledWith("header-token", "test-secret");
  });
});
