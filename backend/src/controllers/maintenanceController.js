import { releaseExpiredReservations } from "../services/reservationCleanupService.js";

export const releaseExpiredReservationsManually = async (req, res) => {
  try {
    const result = await releaseExpiredReservations();

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Manual reservation cleanup error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to release expired reservations",
      error: error.message,
    });
  }
};