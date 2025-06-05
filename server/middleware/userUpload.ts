import multer from "multer";
import path from "path";
import fs from "fs";

const userUploadDir = path.join(process.cwd(), "uploads", "users");

if (!fs.existsSync(userUploadDir)) {
  fs.mkdirSync(userUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, userUploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const userUpload = multer({ storage });
