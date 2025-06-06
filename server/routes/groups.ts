import express from "express";
import { validateToken } from "../middleware/validateToken";
import {
  createGroup,
  getGroupMembers,
  submitJoinRequest,
  acceptJoinRequest,
  rejectJoinRequest,
  cancelJoinRequest,
  getSentJoinRequests,
  getReceivedJoinRequests,
  searchGroups,
  getGroupDetails,
  leaveGroup,
  suggestGroups,
  removeMember,
  updateGroup,
} from "../controllers/groupController";
import { groupUpload } from "../middleware/groupUpload";
import { postUpload } from "../middleware/postUpload";

const router = express.Router();
router.post("/", validateToken, groupUpload.single("cover_image"), createGroup);
router.get("/:id/members", validateToken, getGroupMembers);
router.post("/:id/join", validateToken, submitJoinRequest);
router.get("/sent-requests", validateToken, getSentJoinRequests);
router.get("/:received-requests", validateToken, getReceivedJoinRequests);
router.patch("/:requestId/accept", validateToken, acceptJoinRequest);
router.patch("/:requestId/reject", validateToken, rejectJoinRequest);
router.get("/suggest", validateToken, suggestGroups);
router.delete("/:requestId/cancel", validateToken, cancelJoinRequest);
router.get("/search", validateToken, searchGroups);
router.get("/:id", validateToken, getGroupDetails);
router.delete("/:id/leave", validateToken, leaveGroup);
router.delete("/:groupId/remove/:memberId", validateToken, removeMember);
router.patch("/:groupId", validateToken, updateGroup); // Add route to update group

export default router;
