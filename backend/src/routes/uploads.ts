import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authMiddleware, AuthRequest } from "../auth/auth";

const router = express.Router();

// Configure multer for file uploads with better naming
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve(__dirname, "..", "..", "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload single image (requires authentication)
router.post("/upload", authMiddleware, upload.single("file"), (req: AuthRequest, res) => {
  const file = req.file as any;
  if (!file) return res.status(400).json({ error: "No file uploaded" });
  
  // Return accessible URL
  const url = `/uploads/${file.filename}`;
  res.json({ 
    url,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype
  });
});

// Upload multiple images for menu items
router.post("/upload-multiple", authMiddleware, upload.array("files", 5), (req: AuthRequest, res) => {
  const files = req.files as any[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }
  
  const uploadedFiles = files.map(file => ({
    url: `/uploads/${file.filename}`,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype
  }));
  
  res.json({ files: uploadedFiles });
});

// Delete uploaded file
router.delete("/upload/:filename", authMiddleware, (req: AuthRequest, res) => {
  const { filename } = req.params;
  const filepath = path.resolve(__dirname, "..", "..", "uploads", filename);
  
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    res.json({ message: "File deleted successfully" });
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

export default router;
