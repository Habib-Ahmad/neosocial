import express from "express";
import { getUserFriends } from "../controllers/userController";

const router = express.Router();

router.get("/:id/friends", getUserFriends);

export default router;
