import express from "express";
import {
  cancelFriendRequest,
  getUserById,
  getUserFriends,
  handleFriendRequest,
  login,
  logout,
  registerUser,
  sendFriendRequest,
  updateUserProfile,
} from "../controllers/userController";
import { validateToken } from "../middleware/validateToken";

const router = express.Router();

router.post("/", registerUser);
router.post("/login", login);
router.post("/logout", logout);
router.get("/:id", validateToken, getUserById);
router.patch("/update", validateToken, updateUserProfile);
router.patch("/update/password", validateToken, updateUserProfile);
router.post("/friend-request", validateToken, sendFriendRequest);
router.post("/friend-request/accept", validateToken, handleFriendRequest);
router.post("/friend-request/reject", validateToken, handleFriendRequest);
router.post("/friend-request/cancel", validateToken, cancelFriendRequest);
router.get("/friends/:id", validateToken, getUserFriends);

export default router;
