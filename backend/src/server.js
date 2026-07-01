import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startExpiredReservationJob } from "./jobs/expiredReservationJob.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`);

      startExpiredReservationJob();
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
};

startServer();