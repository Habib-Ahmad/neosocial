import express from "express";
import {
  cancelFriendRequest,
  getCurrentUser,
  handleFriendRequest,
  login,
  logout,
  registerUser,
  sendFriendRequest,
  updateUserProfile,
  searchUsers,
} from "../controllers/userController";
import { validateToken } from "../middleware/validateToken";

const router = express.Router();

router.post("/", registerUser);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", validateToken, getCurrentUser);
router.patch("/update", validateToken, updateUserProfile);
router.patch("/update/password", validateToken, updateUserProfile);
router.post("/friend-request", validateToken, sendFriendRequest);
router.post("/friend-request/accept", validateToken, handleFriendRequest);
router.post("/friend-request/reject", validateToken, handleFriendRequest);
router.post("/friend-request/cancel", validateToken, cancelFriendRequest);
router.get("/search", validateToken, searchUsers);

export default router;
