import express from "express";

import {
  getAdminDashboardSummary,
  getRevenueReport,
  getBookingReport,
  getMoviePerformanceReport,
} from "../controllers/dashboardController.js";

import {
  getStaffDashboardSummary,
  getStaffTodayShowtimes,
  getStaffTicketVerificationReport,
  getMyTicketCheckHistory,
} from "../controllers/staffDashboardController.js";

import {
  getCustomerDashboardSummary,
  getCustomerBookingHistory,
  getCustomerTicketHistory,
  getCustomerUpcomingShowtimes,
} from "../controllers/customerDashboardController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

/*
|--------------------------------------------------------------------------
| Admin dashboard routes
|--------------------------------------------------------------------------
*/
router.get(
  "/admin/summary",
  authorizeRoles("admin"),
  getAdminDashboardSummary
);

router.get(
  "/admin/revenue-report",
  authorizeRoles("admin"),
  getRevenueReport
);

router.get(
  "/admin/booking-report",
  authorizeRoles("admin"),
  getBookingReport
);

router.get(
  "/admin/movie-performance",
  authorizeRoles("admin"),
  getMoviePerformanceReport
);

/*
|--------------------------------------------------------------------------
| Staff dashboard routes
|--------------------------------------------------------------------------
| Admin can also access staff dashboard for monitoring.
*/
router.get(
  "/staff/summary",
  authorizeRoles("admin", "staff"),
  getStaffDashboardSummary
);

router.get(
  "/staff/today-showtimes",
  authorizeRoles("admin", "staff"),
  getStaffTodayShowtimes
);

router.get(
  "/staff/ticket-verification-report",
  authorizeRoles("admin", "staff"),
  getStaffTicketVerificationReport
);

router.get(
  "/staff/my-check-history",
  authorizeRoles("admin", "staff"),
  getMyTicketCheckHistory
);

/*
|--------------------------------------------------------------------------
| Customer dashboard routes
|--------------------------------------------------------------------------
*/
router.get(
  "/customer/summary",
  authorizeRoles("customer"),
  getCustomerDashboardSummary
);

router.get(
  "/customer/booking-history",
  authorizeRoles("customer"),
  getCustomerBookingHistory
);

router.get(
  "/customer/ticket-history",
  authorizeRoles("customer"),
  getCustomerTicketHistory
);

router.get(
  "/customer/upcoming-showtimes",
  authorizeRoles("customer"),
  getCustomerUpcomingShowtimes
);

export default router;