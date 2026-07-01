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

    for (const row of showtime.seatAvailability) {
        const seat = row.seats.find(
            (seatItem) => seatItem.seatCode === formattedSeatCode
        );

        if (seat) {
            return {
                row,
                seat,
            };
        }
    }

    return null;
};

const validateBookingBeforePayment = async (booking, userId) => {
    if (!booking) {
        return {
            valid: false,
            statusCode: 404,
            message: "Booking not found",
        };
    }

    if (booking.customer._id.toString() !== userId.toString()) {
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
        const foundSeat = findSeatInShowtime(showtime, bookingSeat.seatCode);

        if (!foundSeat) {
            throw new Error(`Seat ${bookingSeat.seatCode} not found in showtime`);
        }

        if (foundSeat.seat.status === "booked") {
            continue;
        }

        if (foundSeat.seat.status !== "reserved") {
            throw new Error(
                `Seat ${bookingSeat.seatCode} is not reserved. Current status: ${foundSeat.seat.status}`
            );
        }

        foundSeat.seat.status = "booked";
    }

    await showtime.save();
};

const releaseBookingSeats = async (booking) => {
    const showtime = await Showtime.findById(booking.showtime);

    if (!showtime) {
        return;
    }

    for (const bookingSeat of booking.seats) {
        const foundSeat = findSeatInShowtime(showtime, bookingSeat.seatCode);

        if (foundSeat && foundSeat.seat.status === "reserved") {
            foundSeat.seat.status = "available";
        }
    }

    await showtime.save();
};

export const createStripePaymentIntent = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                success: false,
                message:
                    "Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file.",
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

        const booking = await Booking.findById(bookingId)
            .populate("customer", "name email role")
            .populate("movie", "title")
            .populate("hall", "name screenType")
            .populate("showtime", "showDate startTime endTime");

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

        const showtime = await Showtime.findById(booking.showtime._id);

        if (!showtime) {
            return res.status(404).json({
                success: false,
                message: "Showtime not found",
            });
        }

        for (const bookingSeat of booking.seats) {
            const foundSeat = findSeatInShowtime(showtime, bookingSeat.seatCode);

            if (!foundSeat) {
                return res.status(400).json({
                    success: false,
                    message: `Seat ${bookingSeat.seatCode} does not exist in this showtime`,
                });
            }

            if (foundSeat.seat.status !== "reserved") {
                return res.status(400).json({
                    success: false,
                    message: `Seat ${bookingSeat.seatCode} is not reserved anymore`,
                });
            }
        }

        const currency = process.env.STRIPE_CURRENCY || "usd";
        const amount = getStripeAmount(booking.totalAmount, currency);

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Payment amount must be greater than 0",
            });
        }

        if (booking.stripePaymentIntentId) {
            const existingPaymentIntent =
                await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);

            booking.paymentProvider = "stripe";
            booking.paymentStatus = "processing";
            booking.stripePaymentIntentStatus = existingPaymentIntent.status;

            await booking.save();

            return res.status(200).json({
                success: true,
                message: "Existing Stripe PaymentIntent retrieved successfully",
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

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never",
            },
            receipt_email: booking.customer.email,
            metadata: {
                bookingId: booking._id.toString(),
                bookingReference: booking.bookingReference,
                customerId: booking.customer._id.toString(),
                movieId: booking.movie._id.toString(),
                showtimeId: booking.showtime._id.toString(),
            },
            description: `Movie ticket booking ${booking.bookingReference}`,
        });

        booking.paymentProvider = "stripe";
        booking.paymentStatus = "processing";
        booking.stripePaymentIntentId = paymentIntent.id;
        booking.stripePaymentIntentStatus = paymentIntent.status;
        booking.paymentCreatedAt = new Date();

        await booking.save();

        return res.status(201).json({
            success: true,
            message: "Stripe PaymentIntent created successfully",
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

export const confirmDemoPayment = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                success: false,
                message:
                    "Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file.",
            });
        }

        const { bookingId, demoPaymentMethod = "pm_card_visa" } = req.body;

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: "Booking ID is required",
            });
        }

        await releaseExpiredReservations();

        const booking = await Booking.findById(bookingId)
            .populate("customer", "name email role")
            .populate("movie", "title mainImage galleryImages genre language")
            .populate("hall", "name screenType")
            .populate("showtime", "showDate startTime endTime finalTicketPrice");

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

        if (!booking.stripePaymentIntentId) {
            return res.status(400).json({
                success: false,
                message: "PaymentIntent not found. Please create payment intent first.",
            });
        }

        let paymentIntent = await stripe.paymentIntents.retrieve(
            booking.stripePaymentIntentId
        );

        if (paymentIntent.status !== "succeeded") {
            paymentIntent = await stripe.paymentIntents.confirm(
                booking.stripePaymentIntentId,
                {
                    payment_method: demoPaymentMethod,
                }
            );
        }

        if (paymentIntent.status !== "succeeded") {
            booking.stripePaymentIntentStatus = paymentIntent.status;
            await booking.save();

            return res.status(400).json({
                success: false,
                message: "Demo payment was not completed",
                paymentIntentStatus: paymentIntent.status,
            });
        }

        await markBookingSeatsAsBooked(booking);

        booking.bookingStatus = "confirmed";
        booking.paymentStatus = "paid";
        booking.paymentProvider = "stripe";
        booking.stripePaymentIntentStatus = paymentIntent.status;
        booking.paidAt = new Date();
        booking.confirmedAt = new Date();

        await booking.save();

        const ticket = await createTicketForBooking(booking._id);

        const updatedBooking = await Booking.findById(booking._id)
            .populate("customer", "name email role")
            .populate("movie", "title mainImage galleryImages genre language")
            .populate("hall", "name screenType")
            .populate("showtime", "showDate startTime endTime finalTicketPrice");

        const populatedTicket = await ticket.populate([
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
            message:
                "Demo payment confirmed successfully. Booking is confirmed, ticket generated, and email process completed.",
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
        console.error("Confirm demo payment error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while confirming demo payment",
            error: error.message,
        });
    }
};

export const failDemoPayment = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                success: false,
                message:
                    "Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file.",
            });
        }

        const { bookingId, demoPaymentMethod = "pm_card_chargeDeclined" } = req.body;

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: "Booking ID is required",
            });
        }

        const booking = await Booking.findById(bookingId)
            .populate("customer", "name email role")
            .populate("movie", "title mainImage galleryImages genre language")
            .populate("hall", "name screenType")
            .populate("showtime", "showDate startTime endTime finalTicketPrice");

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        if (booking.customer._id.toString() !== req.user._id.toString()) {
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

        if (!booking.stripePaymentIntentId) {
            return res.status(400).json({
                success: false,
                message: "PaymentIntent not found. Please create payment intent first.",
            });
        }

        let stripeErrorMessage = null;
        let paymentIntentStatus = null;

        try {
            const failedPaymentIntent = await stripe.paymentIntents.confirm(
                booking.stripePaymentIntentId,
                {
                    payment_method: demoPaymentMethod,
                }
            );

            paymentIntentStatus = failedPaymentIntent.status;
        } catch (stripeError) {
            stripeErrorMessage = stripeError.message;
            paymentIntentStatus =
                stripeError.payment_intent?.status || "payment_failed";
        }

        await releaseBookingSeats(booking);

        booking.bookingStatus = "cancelled";
        booking.paymentStatus = "failed";
        booking.paymentProvider = "stripe";
        booking.stripePaymentIntentStatus = paymentIntentStatus;
        booking.cancelledAt = new Date();

        await booking.save();

        const updatedBooking = await Booking.findById(booking._id)
            .populate("customer", "name email role")
            .populate("movie", "title mainImage galleryImages genre language")
            .populate("hall", "name screenType")
            .populate("showtime", "showDate startTime endTime finalTicketPrice");

        return res.status(200).json({
            success: true,
            message: "Demo payment failed. Booking cancelled and seats released.",
            stripeErrorMessage,
            paymentIntentStatus,
            booking: updatedBooking,
        });
    } catch (error) {
        console.error("Fail demo payment error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while failing demo payment",
            error: error.message,
        });
    }
};

export const getBookingPaymentStatus = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                success: false,
                message:
                    "Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file.",
            });
        }

        const booking = await Booking.findById(req.params.bookingId)
            .populate("customer", "name email role")
            .populate("movie", "title")
            .populate("hall", "name screenType")
            .populate("showtime", "showDate startTime endTime");

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
            await booking.save();
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