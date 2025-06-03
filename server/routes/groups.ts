import express from "express";
import { validateToken } from "../middleware/validateToken";
import {
  createGroup,
  getGroupMembers,
  submitJoinRequest,
  getPendingRequests,
  reviewJoinRequest,
  searchGroups,
  createGroupPost,
} from "../controllers/groupController";

const router = express.Router();

router.post("/", validateToken, createGroup);
router.get("/:id/members", validateToken, getGroupMembers);
router.post("/:id/join", validateToken, submitJoinRequest);
router.get("/:id/requests", validateToken, getPendingRequests);
router.patch("/:id/requests/:requestId", validateToken, reviewJoinRequest);
router.get("/search", validateToken, searchGroups);
router.post("/:id/posts", validateToken, createGroupPost);

export default router;
