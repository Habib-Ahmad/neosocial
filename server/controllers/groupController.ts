import { Request, Response } from "express";
import {
  createGroupService,
  getGroupMembersService,
  submitJoinRequestService,
  acceptJoinRequestService,
  rejectJoinRequestService,
  cancelJoinRequestService,
  getGroupDetailsService,
  getReceivedJoinRequestService,
  getSentJoinRequestService,
  leaveGroupService,
  searchGroupsService,
  suggestGroupsService,
  removeMemberService,
  updateGroupService,
  getAllGroupNamesService,
} from "../service/groupService";
import { validateGroupName } from "../utils/validators";

export const createGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const creatorId = req.user?.id;
    if (!creatorId) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    const { name, description, category, rules } = req.body;

    if (!name?.trim() || !description?.trim() || !category?.trim()) {
      res.status(400).json({ message: "Name, description, and category are required" });
      return;
    }

    // Validate group name
    const existingNames = await getAllGroupNamesService();
    const nameValidation = validateGroupName(name, existingNames);
    if (!nameValidation.isValid) {
      res.status(400).json({
        message: "Group name validation failed",
        errors: nameValidation.errors,
      });
      return;
    }

    const cover_image = req.file
      ? `/uploads/groups/${req.file.filename}`
      : "/uploads/groups/group.jpg";

    const group = await createGroupService(creatorId, {
      name,
      description,
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

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: No user ID found" });
      return;
    }

    const result = await submitJoinRequestService(userId, groupId);

    res.status(201).json({
      message: "Join request submitted",
      request: result.request,
    });
  } catch (error: any) {
    console.error("Join Group Error:", error);
    res.status(400).json({ error: error.message || "Failed to join group" });
  }
};
export const cancelJoinRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const requestId = req.params.requestId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await cancelJoinRequestService(userId, requestId);

    res.status(200).json({ message: "Join request cancelled" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
export const getSentJoinRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const requests = await getSentJoinRequestService(userId);
    res.status(200).json({ message: "Sent requests fetched", requests });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
export const getReceivedJoinRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const requests = await getReceivedJoinRequestService(userId);
    res.status(200).json({ message: "Received requests fetched", requests });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const searchGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query?.toString() || "";

    if (query.trim().length < 2) {
      res.status(400).json({ error: "Search query must be at least 2 characters long" });
      return;
    }

    const groups = await searchGroupsService(query);
    res.status(200).json({ message: "Groups fetched", groups });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to search groups" });
  }
};
// ✅ Accept request
export const acceptJoinRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviewerId = req.user?.id;
    const requestId = req.params.requestId;

    if (!reviewerId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const group = await acceptJoinRequestService(reviewerId, requestId);

    res.status(200).json({ message: "Join request approved", group });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// ❌ Reject request
export const rejectJoinRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviewerId = req.user?.id;
    const requestId = req.params.requestId;

    if (!reviewerId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const group = await rejectJoinRequestService(reviewerId, requestId);

    res.status(200).json({ message: "Join request rejected", group });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const suggestGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const groups = await suggestGroupsService(userId);

    res.status(200).json({
      message: "Suggested groups fetched",
      groups,
    });
  } catch (error: any) {
    console.error("Suggest Groups Error:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch suggested groups",
    });
  }
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId, memberId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await removeMemberService(groupId, memberId, adminId);
    res.status(200).json({ message: "Member removed successfully" });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Failed to remove member" });
  }
};

export const getGroupDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const groupId = req.params.id;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const details = await getGroupDetailsService(groupId, userId);
    res.status(200).json(details);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to fetch group" });
  }
};

export const leaveGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const groupId = req.params.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const updatedGroup = await leaveGroupService(userId, groupId);

    res.status(200).json({ message: "Left group successfully", group: updatedGroup });
  } catch (error: any) {
    console.error("Leave Group Error:", error);
    res.status(400).json({ error: error.message });
  }
};
export const updateGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      res.status(400).json({ message: "No updates provided" });
      return;
    }

    // Call the service to update the group
    const updatedGroup = await updateGroupService(groupId, userId, updates);

    if (!updatedGroup) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    res.status(200).json({ message: "Group updated successfully", group: updatedGroup });
  } catch (error: any) {
    console.error("Update group error:", error);
    res
      .status(500)
      .json({ message: error.message || "Internal server error while updating group" });
  }
};
