import { Request, Response, NextFunction } from "express";
import errorHandler from "../../middleware/errorHandler";
import { constants } from "../../utils/constants";

describe("Error Handler Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonSpy: jest.Mock;

  beforeEach(() => {
    req = {};
    jsonSpy = jest.fn();
    res = {
      statusCode: 200,
      json: jsonSpy,
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("with stack trace enabled", () => {
    it("should handle 400 Bad Request errors", () => {
      const error = new Error("Validation failed");
      res.statusCode = constants.BAD_REQUEST;

      const handler = errorHandler(true);
      handler(error, req as Request, res as Response, next);

      expect(jsonSpy).toHaveBeenCalledWith({
        title: "Bad Request",
        status: 400,
        message: "Validation failed",
        stackTrace: error.stack,
      });
    });

    it("should handle 401 Unauthorized errors", () => {
      const error = new Error("Not authenticated");
      res.statusCode = constants.UNAUTHORIZED;

      const handler = errorHandler(true);
      handler(error, req as Request, res as Response, next);

      expect(jsonSpy).toHaveBeenCalledWith({
        title: "Unauthorized",
        status: 401,
        message: "Not authenticated",
        stackTrace: error.stack,
      });
    });

    it("should handle 403 Forbidden errors", () => {
      const error = new Error("Access denied");
      res.statusCode = constants.FORBIDDEN;

      const handler = errorHandler(true);
      handler(error, req as Request, res as Response, next);

      expect(jsonSpy).toHaveBeenCalledWith({
        title: "Forbidden",
        status: 403,
        message: "Access denied",
        stackTrace: error.stack,
      });
    });

    it("should handle 404 Not Found errors", () => {
      const error = new Error("Resource not found");
      res.statusCode = constants.NOT_FOUND;

      const handler = errorHandler(true);
      handler(error, req as Request, res as Response, next);

      expect(jsonSpy).toHaveBeenCalledWith({
        title: "Not Found",
        status: 404,
        message: "Resource not found",
        stackTrace: error.stack,
      });
    });

    it("should handle 500 Server Error", () => {
      const error = new Error("Internal server error");
      res.statusCode = constants.SERVER_ERROR;

      const handler = errorHandler(true);
      handler(error, req as Request, res as Response, next);

      expect(jsonSpy).toHaveBeenCalledWith({
        title: "Server Error",
        status: 500,
        message: "Internal server error",
        stackTrace: error.stack,
      });
    });

    it("should default to 500 when statusCode is 200", () => {
      const error = new Error("Unexpected error");
      res.statusCode = 200;

      const handler = errorHandler(true);
      handler(error, req as Request, res as Response, next);

      expect(jsonSpy).toHaveBeenCalledWith({
        title: "Server Error",
        status: 500,
        message: "Unexpected error",
        stackTrace: error.stack,
      });
    });

    it("should handle unknown status codes with default response", () => {
      const error = new Error("Custom error");
      res.statusCode = 418; // I'm a teapot

      const handler = errorHandler(true);
      handler(error, req as Request, res as Response, next);

      expect(jsonSpy).toHaveBeenCalledWith({
        title: "",
        status: 418,
        message: "Custom error",
        stackTrace: error.stack,
      });
    });
  });

  describe("with stack trace disabled", () => {
    it("should not include stack trace when disabled", () => {
      const error = new Error("Test error");
      res.statusCode = 400;

      const handler = errorHandler(false);
      handler(error, req as Request, res as Response, next);

      expect(jsonSpy).toHaveBeenCalledWith({
        title: "Bad Request",
        status: 400,
        message: "Test error",
      });
    });

    it("should handle 500 errors without stack trace", () => {
      const error = new Error("Server error");
      res.statusCode = 500;

      const handler = errorHandler(false);
      handler(error, req as Request, res as Response, next);

      const response = jsonSpy.mock.calls[0][0];
      expect(response.stackTrace).toBeUndefined();
      expect(response.title).toBe("Server Error");
      expect(response.status).toBe(500);
    });
  });
});
