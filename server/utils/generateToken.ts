import { Response } from "express";
import jwt from "jsonwebtoken";

export const generateToken = (res: Response, userId: string) => {
  const tokenSecret = process.env.TOKEN_SECRET;

  if (!tokenSecret) {
    res.status(500);
    throw new Error("Internal server error - Token secret not defined");
  }

  const token = jwt.sign({ user: { id: userId } }, tokenSecret, { expiresIn: "1d" });

  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  return { token, tokenExpiry };
};
