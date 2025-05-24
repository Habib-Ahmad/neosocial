import { Request, Response } from "express";
import { getFriendsByUserId } from "../service/userService";

export const getUserFriends = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const friends = await getFriendsByUserId(userId);
    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch friends");
  }
};
