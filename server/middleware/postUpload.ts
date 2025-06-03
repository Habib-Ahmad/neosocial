import multer from "multer";
import path from "path";
import fs from "fs";

const postUploadDir = path.join(process.cwd(), "uploads", "posts"); // ✅ Always from project root

if (!fs.existsSync(postUploadDir)) {
  fs.mkdirSync(postUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, postUploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const postUpload = multer({ storage });
