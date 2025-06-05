import { Request, Response } from "express";
import {
  createGroupService,
  getGroupMembersService,
  submitJoinRequestService,
  getPendingRequestsService,
  reviewJoinRequestService,
  createGroupPostService,
} from "../service/groupService";

export const createGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const creatorId = req.user?.id;
    if (!creatorId) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    const { name, description, privacy, category, rules } = req.body;

    if (!name?.trim() || !description?.trim() || !category?.trim()) {
      res.status(400).json({ message: "Name, description, and category are required" });
      return;
    }

    const cover_image = req.file ? `/uploads/groups/${req.file.filename}` : null;

    const group = await createGroupService(creatorId, {
      name,
      description,
      privacy,
      category,
      rules,
      cover_image,
    });

    res.status(201).json({ message: "Group created successfully", group });
  } catch (error: any) {
    console.error("Create Group Error:", error);
    res.status(500).json({ message: error.message || "Failed to create group" });
  }
};

export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id;
    const members = await getGroupMembersService(groupId);
    res.status(200).json({ message: "Members fetched", members });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const submitJoinRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const groupId = req.params.id;
    const { message } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: No user ID found" });
      return;
    }

    const result = await submitJoinRequestService(userId, groupId, message);

    if (result.autoJoined) {
      res.status(201).json({
        message: "User added directly to public group",
        group: result.group,
      });
    } else {
      res.status(201).json({
        message: "Join request submitted",
        request: result.request,
      });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id;
    const requests = await getPendingRequestsService(groupId);
    res.status(200).json({ message: "Pending requests fetched", requests });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const reviewJoinRequest = async (req: Request, res: Response) => {
  try {
    const reviewerId = req.user?.id;
    const { decision } = req.body;
    const requestId = req.params.requestId;

    if (!["approved", "rejected"].includes(decision)) {
      res.status(400).json({ error: "Invalid decision" });
      return;
    }
    if (!reviewerId) {
      res.status(401).json({ error: "Unauthorized: No user ID found" });
      return;
    }

    const result = await reviewJoinRequestService(reviewerId, requestId, decision);
    res.status(200).json({ message: `Request ${decision}`, result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
import { searchGroupsService } from "../service/groupService";

export const searchGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q?.toString() || "";
    const privacy = req.query.privacy?.toString() || null;
    const isActive = req.query.is_active !== undefined ? req.query.is_active === "true" : null;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (query.trim().length < 2) {
      res.status(400).json({ error: "Search query must be at least 2 characters long" });
      return;
    }

    const groups = await searchGroupsService(query, privacy, isActive, limit, offset);
    res.status(200).json({ message: "Groups fetched", groups });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to search groups" });
  }
};

export const createGroupPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const groupId = req.params.id;
    const { content } = req.body;

    if (!userId || !content) {
      res.status(400).json({ error: "Missing user ID or content" });
    }
    if (!userId) {
      res.status(401).json({ error: "Unauthorized: No user ID found" });
      return;
    }
    const post = await createGroupPostService(userId, groupId, content);
    res.status(201).json({ message: "Post created in group", post });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
