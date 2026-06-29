import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import roleTestRoutes from "./routes/roleTestRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import hallRoutes from "./routes/hallRoutes.js";
import showtimeRoutes from "./routes/showtimeRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Online Movie Ticket Booking API",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/role-test", roleTestRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/halls", hallRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/bookings", bookingRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

export default app;