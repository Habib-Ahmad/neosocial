import express from "express";
import {
  cancelFriendRequest,
  getUserById,
  getUserFriendRequests,
  getUserFriends,
  handleFriendRequest,
  login,
  logout,
  registerUser,
  removeFriend,
  sendFriendRequest,
  suggestFriends,
  updateUserProfile,
} from "../controllers/userController";
import { validateToken } from "../middleware/validateToken";

const router = express.Router();

router.post("/", registerUser);
router.post("/login", login);
router.post("/logout", logout);
router.patch("/update", validateToken, updateUserProfile);
router.patch("/update/password", validateToken, updateUserProfile);
router.post("/friend-request", validateToken, sendFriendRequest);
router.post("/friend-request/accept", validateToken, handleFriendRequest);
router.post("/friend-request/reject", validateToken, handleFriendRequest);
router.post("/friend-request/cancel", validateToken, cancelFriendRequest);
router.delete("/friends/remove", validateToken, removeFriend);
router.get("/friend-requests", validateToken, getUserFriendRequests);
router.get("/friends/:id", validateToken, getUserFriends);
router.get("/friend-suggestions", validateToken, suggestFriends);
router.get("/:id", validateToken, getUserById);

export default router;
