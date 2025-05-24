import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const validateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401);
    throw new Error("No token provided");
  }

  if (!process.env.TOKEN_SECRET) {
    res.status(500);
    throw new Error("Token secret not defined in environment");
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    console.log("Decoded token:", decoded);
    req.user = (decoded as any).user;
    next();
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(401);
    throw new Error("Invalid token");
  }
};
