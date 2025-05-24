import express from "express";
import {
  getCurrentUser,
  login,
  logout,
  registerUser,
  updateUserProfile,
} from "../controllers/userController";
import { validateToken } from "../middleware/validateToken";

const router = express.Router();

router.post("/", registerUser);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", validateToken, getCurrentUser);
router.patch("/update", validateToken, updateUserProfile);
router.patch("/update/password", validateToken, updateUserProfile);

export default router;
