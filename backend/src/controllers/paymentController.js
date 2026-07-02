import stripe from "../config/stripe.js";
import Booking from "../models/Booking.js";
import Showtime from "../models/Showtime.js";
import { releaseExpiredReservations } from "./bookingController.js";
import { createTicketForBooking } from "../services/ticketService.js";
import { sendTicketEmail } from "../services/ticketEmailService.js";

const zeroDecimalCurrencies = [
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
];

const getStripeAmount = (amount, currency) => {
  const normalizedCurrency = currency.toLowerCase();

  if (zeroDecimalCurrencies.includes(normalizedCurrency)) {
    return Math.round(Number(amount));
  }

  return Math.round(Number(amount) * 100);
};

const findSeatInShowtime = (showtime, seatCode) => {
  const formattedSeatCode = seatCode.toUpperCase();

  for (const row of showtime.seatAvailability || []) {
    const seat = row.seats.find(
      (seatItem) => seatItem.seatCode === formattedSeatCode
    );

    if (seat) {
      return seat;
    }
  }

  return null;
};

const validateBookingOwner = (booking, userId) => {
  return booking?.customer?._id?.toString() === userId.toString();
};

const validateBookingBeforePayment = async (booking, userId) => {
  if (!booking) {
    return {
      valid: false,
      statusCode: 404,
      message: "Booking not found",
    };
  }

  if (!validateBookingOwner(booking, userId)) {
    return {
      valid: false,
      statusCode: 403,
      message: "You are not allowed to pay for this booking",
    };
  }

  if (booking.bookingStatus !== "pending_payment") {
    return {
      valid: false,
      statusCode: 400,
      message: "Only pending payment bookings can be paid",
    };
  }

  if (booking.paymentStatus === "paid") {
    return {
      valid: false,
      statusCode: 400,
      message: "This booking is already paid",
    };
  }

  if (booking.paymentStatus === "refunded") {
    return {
      valid: false,
      statusCode: 400,
      message: "Refunded booking cannot be paid again",
    };
  }

  if (booking.reservationExpiresAt <= new Date()) {
    return {
      valid: false,
      statusCode: 400,
      message: "Booking reservation has expired. Please reserve seats again.",
    };
  }

  return {
    valid: true,
  };
};

const markBookingSeatsAsBooked = async (booking) => {
  const showtime = await Showtime.findById(booking.showtime);

  if (!showtime) {
    throw new Error("Showtime not found while confirming booking");
  }

  for (const bookingSeat of booking.seats) {
    const seat = findSeatInShowtime(showtime, bookingSeat.seatCode);

    if (!seat) {
      throw new Error(`Seat ${bookingSeat.seatCode} not found in showtime`);
    }

    if (seat.status === "booked") {
      continue;
    }

    if (seat.status !== "reserved") {
      throw new Error(
        `Seat ${bookingSeat.seatCode} is not reserved. Current status: ${seat.status}`
      );
    }

    seat.status = "booked";
  }

  await showtime.save({ validateBeforeSave: false });
};

const releaseBookingSeats = async (booking) => {
  const showtime = await Showtime.findById(booking.showtime);

  if (!showtime) return;

  for (const bookingSeat of booking.seats) {
    const seat = findSeatInShowtime(showtime, bookingSeat.seatCode);

    if (seat && seat.status === "reserved") {
      seat.status = "available";
    }
  }

  await showtime.save({ validateBeforeSave: false });
};

const populateBooking = async (bookingId) => {
  return await Booking.findById(bookingId)
    .populate("customer", "name email role")
    .populate("movie", "title mainImage galleryImages genre language")
    .populate("hall", "name screenType")
    .populate("showtime", "showDate startTime endTime finalTicketPrice");
};

const populateTicket = async (ticket) => {
  return await ticket.populate([
    {
      path: "customer",
      select: "name email role",
    },
    {
      path: "movie",
      select: "title mainImage galleryImages genre language",
    },
    {
      path: "hall",
      select: "name screenType",
    },
    {
      path: "showtime",
      select: "showDate startTime endTime finalTicketPrice",
    },
    {
      path: "booking",
      select: "bookingReference bookingStatus paymentStatus",
    },
  ]);
};

const getObjectIdValue = (value) => {
  return value?._id || value;
};

const isReusableCardOnlyPaymentIntent = (paymentIntent) => {
  const methods = paymentIntent?.payment_method_types || [];

  const isCardOnly =
    methods.length === 1 && methods[0] === "card";

  const reusableStatuses = [
    "requires_payment_method",
    "requires_confirmation",
    "requires_action",
    "processing",
  ];

  return (
    isCardOnly &&
    reusableStatuses.includes(paymentIntent.status) &&
    paymentIntent.client_secret
  );
};

const tryCancelPaymentIntent = async (paymentIntentId) => {
  if (!paymentIntentId) return;

  try {
    await stripe.paymentIntents.cancel(paymentIntentId);
  } catch (error) {
    console.log(
      `Could not cancel old PaymentIntent ${paymentIntentId}:`,
      error.message
    );
  }
};

const createCardOnlyPaymentIntent = async ({ booking, amount, currency }) => {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    payment_method_types: ["card"],
    receipt_email: booking.customer.email,
    metadata: {
      bookingId: booking._id.toString(),
      bookingReference: booking.bookingReference,
      customerId: booking.customer._id.toString(),
      movieId: getObjectIdValue(booking.movie).toString(),
      showtimeId: getObjectIdValue(booking.showtime).toString(),
    },
    description: `Movie ticket booking ${booking.bookingReference}`,
  });
};

export const createStripePaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message:
          "Stripe is not configured. Please add STRIPE_SECRET_KEY to backend .env file.",
      });
    }

    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    await releaseExpiredReservations();

    const booking = await populateBooking(bookingId);

    const validation = await validateBookingBeforePayment(
      booking,
      req.user._id
    );

    if (!validation.valid) {
      return res.status(validation.statusCode).json({
        success: false,
        message: validation.message,
      });
    }

    const showtime = await Showtime.findById(getObjectIdValue(booking.showtime));

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    for (const bookingSeat of booking.seats) {
      const seat = findSeatInShowtime(showtime, bookingSeat.seatCode);

      if (!seat) {
        return res.status(400).json({
          success: false,
          message: `Seat ${bookingSeat.seatCode} does not exist in this showtime`,
        });
      }

      if (seat.status !== "reserved") {
        return res.status(400).json({
          success: false,
          message: `Seat ${bookingSeat.seatCode} is not reserved anymore`,
        });
      }
    }

    const currency = (process.env.STRIPE_CURRENCY || "usd").toLowerCase();
    const amount = getStripeAmount(booking.totalAmount, currency);

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than 0",
      });
    }

    if (booking.stripePaymentIntentId) {
      const existingPaymentIntent = await stripe.paymentIntents.retrieve(
        booking.stripePaymentIntentId
      );

      if (existingPaymentIntent.status === "succeeded") {
        return res.status(400).json({
          success: false,
          message:
            "This Stripe payment already succeeded. Please check your ticket or create a new booking.",
        });
      }

      if (isReusableCardOnlyPaymentIntent(existingPaymentIntent)) {
        booking.paymentProvider = "stripe";
        booking.paymentStatus = "processing";
        booking.stripePaymentIntentStatus = existingPaymentIntent.status;

        await booking.save({ validateBeforeSave: false });

        return res.status(200).json({
          success: true,
          message: "Existing card-only Stripe PaymentIntent loaded successfully",
          payment: {
            bookingId: booking._id,
            bookingReference: booking.bookingReference,
            paymentIntentId: existingPaymentIntent.id,
            clientSecret: existingPaymentIntent.client_secret,
            amount: existingPaymentIntent.amount,
            currency: existingPaymentIntent.currency,
            status: existingPaymentIntent.status,
          },
        });
      }

      await tryCancelPaymentIntent(booking.stripePaymentIntentId);

      booking.stripePaymentIntentId = undefined;
      booking.stripePaymentIntentStatus = undefined;
      booking.paymentStatus = "unpaid";

      await booking.save({ validateBeforeSave: false });
    }

    const paymentIntent = await createCardOnlyPaymentIntent({
      booking,
      amount,
      currency,
    });

    booking.paymentProvider = "stripe";
    booking.paymentStatus = "processing";
    booking.stripePaymentIntentId = paymentIntent.id;
    booking.stripePaymentIntentStatus = paymentIntent.status;
    booking.paymentCreatedAt = new Date();

    await booking.save({ validateBeforeSave: false });

    return res.status(201).json({
      success: true,
      message: "Stripe card PaymentIntent created successfully",
      payment: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
    });
  } catch (error) {
    console.error("Create Stripe PaymentIntent error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating Stripe PaymentIntent",
      error: error.message,
    });
  }
};

export const confirmStripePayment = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message:
          "Stripe is not configured. Please add STRIPE_SECRET_KEY to backend .env file.",
      });
    }

    const { bookingId, paymentIntentId } = req.body;

    if (!bookingId || !paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and PaymentIntent ID are required",
      });
    }

    const booking = await populateBooking(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!validateBookingOwner(booking, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to confirm this booking payment",
      });
    }

    if (!booking.stripePaymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "PaymentIntent not found for this booking",
      });
    }

    if (booking.stripePaymentIntentId !== paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "PaymentIntent does not match this booking",
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    booking.stripePaymentIntentStatus = paymentIntent.status;

    if (paymentIntent.status !== "succeeded") {
      await booking.save({ validateBeforeSave: false });

      return res.status(400).json({
        success: false,
        message: `Stripe payment is not successful yet. Current status: ${paymentIntent.status}`,
        paymentIntentStatus: paymentIntent.status,
      });
    }

    if (
      booking.paymentStatus === "paid" &&
      booking.bookingStatus === "confirmed"
    ) {
      const ticket = await createTicketForBooking(booking._id);
      const populatedTicket = await populateTicket(ticket);

      return res.status(200).json({
        success: true,
        message: "Payment already confirmed",
        payment: {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
        booking,
        ticket: populatedTicket,
      });
    }

    if (booking.bookingStatus !== "pending_payment") {
      return res.status(400).json({
        success: false,
        message: "Only pending payment bookings can be confirmed",
      });
    }

    await markBookingSeatsAsBooked(booking);

    booking.bookingStatus = "confirmed";
    booking.paymentStatus = "paid";
    booking.paymentProvider = "stripe";
    booking.stripePaymentIntentStatus = paymentIntent.status;
    booking.paidAt = new Date();
    booking.confirmedAt = new Date();

    await booking.save({ validateBeforeSave: false });

    const ticket = await createTicketForBooking(booking._id);
    const populatedTicket = await populateTicket(ticket);
    const updatedBooking = await populateBooking(booking._id);

    let emailResult = null;

    try {
      emailResult = await sendTicketEmail(ticket._id);
    } catch (emailError) {
      console.error("Ticket email sending failed:", emailError.message);

      emailResult = {
        sent: false,
        error: emailError.message,
      };
    }

    return res.status(200).json({
      success: true,
      message: "Payment successful. Booking confirmed and ticket generated.",
      payment: {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
      booking: updatedBooking,
      ticket: populatedTicket,
      email: emailResult,
    });
  } catch (error) {
    console.error("Confirm Stripe payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while confirming Stripe payment",
      error: error.message,
    });
  }
};

export const failStripePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await populateBooking(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!validateBookingOwner(booking, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to fail this booking payment",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Paid booking cannot be marked as failed",
      });
    }

    await releaseBookingSeats(booking);

    booking.bookingStatus = "cancelled";
    booking.paymentStatus = "failed";
    booking.paymentProvider = "stripe";
    booking.cancelledAt = new Date();

    await booking.save({ validateBeforeSave: false });

    const updatedBooking = await populateBooking(booking._id);

    return res.status(200).json({
      success: true,
      message: "Payment failed. Booking cancelled and seats released.",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Fail Stripe payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while failing payment",
      error: error.message,
    });
  }
};

export const confirmDemoPayment = async (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "Demo payment is disabled. Please use the real Stripe payment form.",
  });
};

export const failDemoPayment = async (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "Demo payment is disabled. Please use the real Stripe payment form.",
  });
};

export const getBookingPaymentStatus = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message:
          "Stripe is not configured. Please add STRIPE_SECRET_KEY to backend .env file.",
      });
    }

    const booking = await populateBooking(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const isOwner =
      booking.customer._id.toString() === req.user._id.toString();

    const isAdminOrStaff =
      req.user.role === "admin" || req.user.role === "staff";

    if (!isOwner && !isAdminOrStaff) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this payment status",
      });
    }

    let stripePaymentIntent = null;

    if (booking.stripePaymentIntentId) {
      stripePaymentIntent = await stripe.paymentIntents.retrieve(
        booking.stripePaymentIntentId
      );

      booking.stripePaymentIntentStatus = stripePaymentIntent.status;
      await booking.save({ validateBeforeSave: false });
    }

    return res.status(200).json({
      success: true,
      booking: {
        id: booking._id,
        bookingReference: booking.bookingReference,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        paymentProvider: booking.paymentProvider,
        stripePaymentIntentId: booking.stripePaymentIntentId,
        stripePaymentIntentStatus: booking.stripePaymentIntentStatus,
        totalAmount: booking.totalAmount,
        reservationExpiresAt: booking.reservationExpiresAt,
      },
      stripePaymentIntent: stripePaymentIntent
        ? {
            id: stripePaymentIntent.id,
            amount: stripePaymentIntent.amount,
            currency: stripePaymentIntent.currency,
            status: stripePaymentIntent.status,
          }
        : null,
    });
  } catch (error) {
    console.error("Get booking payment status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching payment status",
      error: error.message,
    });
  }
};