import express from "express";

import {
  generateTicketManually,
  getMyTickets,
  getAllTickets,
  getSingleTicket,
  getTicketByBooking,
  cancelTicket,
  downloadTicketPdf,
  sendTicketEmailManually,
  verifyTicket,
  markTicketAsUsed,
} from "../controllers/ticketController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

/*
|--------------------------------------------------------------------------
| Customer routes
|--------------------------------------------------------------------------
*/
router.get("/my-tickets", authorizeRoles("customer"), getMyTickets);

/*
|--------------------------------------------------------------------------
| Admin / Staff routes
|--------------------------------------------------------------------------
*/
router.get("/admin/all", authorizeRoles("admin", "staff"), getAllTickets);

router.post(
  "/admin/generate",
  authorizeRoles("admin"),
  generateTicketManually
);

router.patch(
  "/admin/:id/cancel",
  authorizeRoles("admin"),
  cancelTicket
);

router.post(
  "/verify",
  authorizeRoles("admin", "staff"),
  verifyTicket
);

/*
|--------------------------------------------------------------------------
| Shared routes
|--------------------------------------------------------------------------
*/
router.get(
  "/booking/:bookingId",
  authorizeRoles("customer", "admin", "staff"),
  getTicketByBooking
);

router.get(
  "/:id/download",
  authorizeRoles("customer", "admin", "staff"),
  downloadTicketPdf
);

router.post(
  "/:id/email",
  authorizeRoles("customer", "admin", "staff"),
  sendTicketEmailManually
);

router.patch(
  "/:id/mark-used",
  authorizeRoles("admin", "staff"),
  markTicketAsUsed
);

router.get(
  "/:id",
  authorizeRoles("customer", "admin", "staff"),
  getSingleTicket
);

export default router;