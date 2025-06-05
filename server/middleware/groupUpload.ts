// src/middleware/groupUpload.ts
import multer from "multer";
import path from "path";
import fs from "fs";

const groupUploadDir = path.join(process.cwd(), "uploads", "groups");

if (!fs.existsSync(groupUploadDir)) {
  fs.mkdirSync(groupUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, groupUploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const groupUpload = multer({ storage });
