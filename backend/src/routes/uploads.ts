import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: path.resolve(__dirname, "..", "..", "uploads") });

// simple local upload endpoint - returns public URL
router.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file as any;
  if (!file) return res.status(400).json({ error: "No file" });
  // return accessible path
  const url = `/uploads/${file.filename}`;
  res.json({ url });
});

export default router;
