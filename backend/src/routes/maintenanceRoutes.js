import express from "express";
import { releaseExpiredReservationsManually } from "../controllers/maintenanceController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post(
  "/release-expired-reservations",
  authorizeRoles("admin"),
  releaseExpiredReservationsManually
);

export default router;