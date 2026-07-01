import cron from "node-cron";
import { releaseExpiredReservations } from "../services/reservationCleanupService.js";

export const startExpiredReservationJob = () => {
  cron.schedule("*/2 * * * *", async () => {
    try {
      const result = await releaseExpiredReservations();

      if (result.releasedCount > 0) {
        console.log(`[Reservation Cleanup] ${result.message}`);
      }
    } catch (error) {
      console.error("[Reservation Cleanup] Job failed:", error.message);
    }
  });

  console.log("Expired reservation cleanup job started. Runs every 2 minutes.");
};