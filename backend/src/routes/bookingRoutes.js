import express from "express";

import {
  reserveSeats,
  getMyBookings,
  getAllBookings,
  getSingleBooking,
  cancelPendingBooking,
  releaseExpiredReservationsManually,
} from "../controllers/bookingController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

/*
|--------------------------------------------------------------------------
| Customer booking routes
|--------------------------------------------------------------------------
*/
router.post("/reserve", authorizeRoles("customer"), reserveSeats);

router.get("/my-bookings", authorizeRoles("customer"), getMyBookings);

/*
|--------------------------------------------------------------------------
| Admin/staff booking routes
|--------------------------------------------------------------------------
*/
router.get("/admin/all", authorizeRoles("admin", "staff"), getAllBookings);

router.post(
  "/admin/release-expired",
  authorizeRoles("admin", "staff"),
  releaseExpiredReservationsManually
);

/*
|--------------------------------------------------------------------------
| Shared booking routes
|--------------------------------------------------------------------------
| Customer can view own booking.
| Admin/staff can view any booking.
*/
router.get(
  "/:id",
  authorizeRoles("customer", "admin", "staff"),
  getSingleBooking
);

router.patch(
  "/:id/cancel",
  authorizeRoles("customer", "admin"),
  cancelPendingBooking
);

export default router;