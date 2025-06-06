import { Request, Response } from "express";
import {
  acceptFriendRequestService,
  cancelFriendRequestService,
  createUser,
  getFriendRequestsService,
  getUserByEmail,
  getUserByIdService,
  getUserFriendsService,
  rejectFriendRequestService,
  removeFriendService,
  sendFriendRequestService,
  suggestFriendsService,
  updateUser,
  searchUsersService,
  getUserGroupsService,
} from "../service/userService";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const user = req.body;

    if (!user || !user.email || !user.password || !user.first_name || !user.last_name) {
      throw new Error("Please provide all required fields");
    }

    const existingUser = await getUserByEmail(user.email);
    if (existingUser) {
      res.status(400);
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    user.id = uuidv4();

    user.profile_picture = req.file
      ? `/uploads/users/${req.file.filename}`
      : "https://www.svgrepo.com/show/452030/avatar-default.svg";

    const result = await createUser(user);

    const tokenSecret = process.env.TOKEN_SECRET!;
    const token = jwt.sign({ user: { id: result.id } }, tokenSecret, { expiresIn: "1d" });
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

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
        tokenExpiry,
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

export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const currentUserId = (req.query.viewer as string) || req.user?.id;

    if (!userId) {
      res.status(400);
      throw new Error("User ID is required");
    }

    const user = await getUserByIdService(userId, currentUserId);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const { password_hash, ...userResponse } = user;
    res.status(200).json({
      message: "User fetched successfully",
      user: userResponse,
    });
  } catch (error: any) {
    console.error("Get user by ID error:", error);
    res.status(400);
    throw new Error("Internal server error while fetching user by ID");
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

    const existingUser = await getUserByIdService(user.id);
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

export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const fromId = req.user?.id;
    const toId = req.body.id;

    if (!fromId || !toId || fromId === toId) {
      res.status(400);
      throw new Error("Invalid request");
    }
    const success = await sendFriendRequestService(fromId, toId);

    if (!success) {
      throw new Error("Friend request already sent or users are already friends");
    }

    res.status(200).json({ message: "Friend request sent" });
  } catch (error: any) {
    console.error("Send friend request error:", error);
    res.status(400);
    throw new Error(error.message || "Error sending friend request");
  }
};

export const handleFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { senderId, action } = req.body;

    if (!userId || !senderId || !action) {
      res.status(400);
      throw new Error("Invalid request");
    }

    if (action !== "accept" && action !== "reject") {
      res.status(400);
      throw new Error("Invalid action");
    }

    if (action === "accept") {
      const success = await acceptFriendRequestService(senderId, userId);
      if (!success) {
        throw new Error("Failed to accept friend request or request not found");
      }
      res.status(200).json({ message: "Friend request accepted" });
    }

    if (action === "reject") {
      const success = await rejectFriendRequestService(senderId, userId);
      if (!success) {
        throw new Error("Failed to reject friend request or request not found");
      }
      res.status(200).json({ message: "Friend request rejected" });
    }
  } catch (error: any) {
    console.error("Handle friend request error:", error);
    res.status(400);
    throw new Error(error.message || "Error handling friend request");
  }
};

export const cancelFriendRequest = async (req: Request, res: Response) => {
  try {
    const fromId = req.user?.id;
    const toId = req.body.receivingUserId;

    if (!fromId || !toId || fromId === toId) {
      res.status(400);
      throw new Error("Invalid request");
    }

    const success = await cancelFriendRequestService(fromId, toId);
    if (!success) {
      throw new Error("Failed to cancel friend request or request not found");
    }

    res.status(200).json({ message: "Friend request cancelled" });
  } catch (error: any) {
    console.error("Cancel friend request error:", error);
    res.status(400);
    throw new Error(error.message || "Error cancelling friend request");
  }
};

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query?.toString() || ""; // matches ?query=something
    const status = req.query.status?.toString() || null;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!query || query.trim().length < 2) {
      res.status(400).json({ error: "Search query must be at least 2 characters" });
      return;
    }
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const users = await searchUsersService(query, status, limit, offset, userId);
    res.status(200).json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to search users" });
  }
};
export const getUserFriends = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(400);
      throw new Error("User ID is required");
    }

    const friends = await getUserFriendsService(userId);
    if (!friends) {
      res.status(404);
      throw new Error("User not found");
    }

    res.status(200).json({ message: "Friends fetched successfully", friends });
  } catch (error: any) {
    console.error("Get user friends error:", error);
    res.status(400);
    throw new Error("Internal server error while fetching user friends");
  }
};

export const getUserFriendRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error("User not authenticated");
    }

    const friendRequests = await getFriendRequestsService(userId);
    if (!friendRequests) {
      res.status(404);
      throw new Error("No friend requests found");
    }

    res.status(200).json({ message: "Friend requests fetched successfully", friendRequests });
  } catch (error: any) {
    console.error("Get user friend requests error:", error);
    res.status(500);
    throw new Error("Internal server error while fetching friend requests");
  }
};

export const removeFriend = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { friendId } = req.body;

    if (!userId || !friendId || userId === friendId) {
      res.status(400);
      throw new Error("Invalid request");
    }

    const success = await removeFriendService(userId, friendId);
    if (!success) {
      throw new Error("Failed to remove friend or not friends");
    }

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error: any) {
    console.error("Remove friend error:", error);
    res.status(400);
    throw new Error(error.message || "Error removing friend");
  }
};

export const suggestFriends = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error("User not authenticated");
    }

    const suggestions = await suggestFriendsService(userId);

    res.status(200).json({ message: "Suggested friends fetched successfully", suggestions });
  } catch (error: any) {
    console.error("Suggest friends error:", error);
    res.status(500);
    throw new Error("Internal server error while fetching suggested friends");
  }
};
export const getUserGroups = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error("User not authenticated");
    }

    // Assuming you have a service to get user groups
    const groups = await getUserGroupsService(userId);

    res.status(200).json({ message: "User groups fetched successfully", groups });
  } catch (error: any) {
    console.error("Get user groups error:", error);
    res.status(500);
    throw new Error("Internal server error while fetching user groups");
  }
};
