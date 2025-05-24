import e, { Request, Response } from "express";
import { createUser, getUserByEmail, getUserById, updateUser } from "../service/userService";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const user = req.body;

    if (!user || !user.email || !user.password || !user.first_name || !user.last_name) {
      throw new Error("Please provide all required fields: email, password, first_name, last_name");
    }

    const existingUser = await getUserByEmail(user.email);
    if (existingUser) {
      res.status(400);
      throw new Error("User with this email already exists");
    }

    if (!process.env.TOKEN_SECRET) {
      res.status(500);
      throw new Error("Internal server error - Token secret not defined");
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    user.id = uuidv4();

    const result = await createUser(user);

    const tokenSecret = process.env.TOKEN_SECRET;
    const token = jwt.sign({ user: { id: result.id } }, tokenSecret, { expiresIn: "1d" });
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hrs

    const { password_hash, ...userWithoutPassword } = result;

    res
      .status(201)
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "none",
        secure: process.env.NODE_ENV === "production",
        expires: tokenExpiry,
      })
      .json({
        message: "User registered successfully",
        user: userWithoutPassword,
        token,
        tokenExpiry: tokenExpiry,
      });
  } catch (error: any) {
    res.status(400);
    throw new Error(error.message);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Please provide both email and password");
    }

    const user = await getUserByEmail(email);
    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    if (!process.env.TOKEN_SECRET) {
      res.status(500);
      throw new Error("Internal server error - Token secret not defined");
    }
    const tokenSecret = process.env.TOKEN_SECRET;
    const token = jwt.sign({ user: { id: user.id } }, tokenSecret, { expiresIn: "1d" });
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hrs

    const { password_hash, ...userWithoutPassword } = user;

    res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "none",
        secure: process.env.NODE_ENV === "production",
        expires: tokenExpiry,
      })
      .json({
        message: "Login successful",
        user: userWithoutPassword,
        token,
        tokenExpiry: tokenExpiry,
      });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(400);
    throw new Error(error.message);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res
      .status(200)
      .cookie("token", "", {
        httpOnly: true,
        sameSite: "none",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0),
      })
      .json({ message: "Logout successful" });
  } catch (error: any) {
    console.error("Logout error:", error);
    res.status(500);
    throw new Error("Internal server error during logout");
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401);
      throw new Error("User not authenticated");
    }

    const userDetails = await getUserById(user.id);
    console.log("User details:", userDetails);
    if (!userDetails) {
      res.status(404);
      throw new Error("User not found");
    }

    res.status(200).json({ user: userDetails });
  } catch (error: any) {
    console.error("Get current user error:", error);
    res.status(500);
    throw new Error("Internal server error while fetching current user");
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401);
      throw new Error("User not authenticated");
    }

    const updates = req.body;
    if (!updates || Object.keys(updates).length === 0) {
      res.status(400);
      throw new Error("No updates provided");
    }

    // Handle password update separately
    if (updates.password || updates.password_hash) {
      delete updates.password;
      delete updates.password_hash;
    }

    const updatedUser = await updateUser(user.id, updates);
    if (!updatedUser) {
      res.status(404);
      throw new Error("User not found");
    }

    const { password_hash, ...userResponse } = updatedUser;
    res.status(200).json({ message: "User updated successfully", user: userResponse });
  } catch (error: any) {
    console.error("Update user error:", error);
    res.status(500);
    throw new Error("Internal server error while updating user");
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401);
      throw new Error("User not authenticated");
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error("Please provide both current and new passwords");
    }

    const existingUser = await getUserById(user.id);
    if (!existingUser) {
      res.status(404);
      throw new Error("User not found");
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      existingUser.password_hash
    );
    if (!isCurrentPasswordValid) {
      res.status(401);
      throw new Error("Current password is incorrect");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await updateUser(user.id, { password: hashedNewPassword });

    if (!updatedUser) {
      res.status(404);
      throw new Error("User not found");
    }

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error: any) {
    console.error("Change password error:", error);
    res.status(500);
    throw new Error("Internal server error while changing password");
  }
};
