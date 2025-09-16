import app from "./app";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();
const PORT = process.env.PORT || 4000;

const uploadsDir = path.resolve(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
