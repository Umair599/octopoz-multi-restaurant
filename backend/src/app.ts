import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import restaurantsRoutes from "./routes/restaurants";
import menuRoutes from "./routes/menu";
import ordersRoutes from "./routes/orders";
import uploadsRoutes from "./routes/uploads";
import promotionsRoutes from "./routes/promotions";
import reservationsRoutes from "./routes/reservations";
import reportsRoutes from "./routes/reports";
import path from "path";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantsRoutes);
app.use("/api", ordersRoutes);
app.use("/api", menuRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api", promotionsRoutes);
app.use("/api", reservationsRoutes);
app.use("/api", reportsRoutes);

// serve local uploads
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

export default app;
