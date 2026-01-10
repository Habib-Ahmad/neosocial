import { Response } from "express";
import jwt from "jsonwebtoken";
import { generateToken } from "../../utils/generateToken";

jest.mock("jsonwebtoken");

describe("Generate Token Utility", () => {
  let res: Partial<Response>;
  const originalEnv = process.env;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
    };
    process.env = { ...originalEnv, TOKEN_SECRET: "test-secret-key" };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should generate token successfully with valid secret", () => {
    const userId = "user123";
    const mockToken = "mock-jwt-token";
    (jwt.sign as jest.Mock).mockReturnValue(mockToken);

    const result = generateToken(res as Response, userId);

    expect(jwt.sign).toHaveBeenCalledWith(
      { user: { id: userId } },
      "test-secret-key",
      { expiresIn: "1d" }
    );
    expect(result.token).toBe(mockToken);
    expect(result.tokenExpiry).toBeInstanceOf(Date);
  });

  it("should set token expiry to 24 hours from now", () => {
    const userId = "user456";
    const mockToken = "another-token";
    (jwt.sign as jest.Mock).mockReturnValue(mockToken);

    const beforeCall = Date.now();
    const result = generateToken(res as Response, userId);
    const afterCall = Date.now();

    const expectedExpiry = beforeCall + 24 * 60 * 60 * 1000;
    const actualExpiry = result.tokenExpiry.getTime();

    expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry);
    expect(actualExpiry).toBeLessThanOrEqual(expectedExpiry + (afterCall - beforeCall));
  });

  it("should throw error if TOKEN_SECRET is not defined", () => {
    delete process.env.TOKEN_SECRET;
    const userId = "user789";

    expect(() => generateToken(res as Response, userId)).toThrow(
      "Internal server error - Token secret not defined"
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should throw error if TOKEN_SECRET is empty string", () => {
    process.env.TOKEN_SECRET = "";
    const userId = "user000";

    expect(() => generateToken(res as Response, userId)).toThrow(
      "Internal server error - Token secret not defined"
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should handle different user IDs correctly", () => {
    const userIds = ["user1", "user2", "user3"];
    (jwt.sign as jest.Mock).mockReturnValue("token");

    userIds.forEach((userId) => {
      generateToken(res as Response, userId);
      expect(jwt.sign).toHaveBeenCalledWith(
        { user: { id: userId } },
        "test-secret-key",
        { expiresIn: "1d" }
      );
    });
  });
});
