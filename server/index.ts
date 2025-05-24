import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { userRouter } from "./routes";
import errorHandler from "./middleware/errorHandler";
import { constants } from "./utils/constants";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();
const app: Express = express();

app.use(express.json());

app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    origin: ["http://localhost:3000", "http://localhost:3001"],
  })
);

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Neo4j User API");
});

// Routers
app.use("/api/users", userRouter);

// Handle 404 Not Found
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(constants.NOT_FOUND);
  const error = new Error("Not Found");
  next(error);
});

app.use(errorHandler(false));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
