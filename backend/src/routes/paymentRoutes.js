import express from "express";

import {
  createStripePaymentIntent,
  confirmDemoPayment,
  failDemoPayment,
  getBookingPaymentStatus,
} from "../controllers/paymentController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post(
  "/create-payment-intent",
  authorizeRoles("customer"),
  createStripePaymentIntent
);

router.post(
  "/demo-confirm",
  authorizeRoles("customer"),
  confirmDemoPayment
);

router.post(
  "/demo-fail",
  authorizeRoles("customer"),
  failDemoPayment
);

router.get(
  "/booking/:bookingId/status",
  authorizeRoles("customer", "admin", "staff"),
  getBookingPaymentStatus
);

export default router;