import Booking from "../models/Booking.js";
import Showtime from "../models/Showtime.js";
import {
  extractBookingSeatCodes,
  releaseSeatsInShowtime,
} from "./seatStatusService.js";

const getExpiredBookingQuery = () => {
  const now = new Date();

  return {
    bookingStatus: "pending_payment",
    paymentStatus: {
      $in: ["unpaid", "processing"],
    },
    reservationExpiresAt: {
      $lte: now,
    },
  };
};

export const releaseExpiredReservations = async () => {
  const expiredBookings = await Booking.find(getExpiredBookingQuery());

  if (!expiredBookings.length) {
    return {
      checkedAt: new Date(),
      releasedCount: 0,
      message: "No expired reservations found",
    };
  }

  let releasedCount = 0;

  for (const booking of expiredBookings) {
    try {
      const showtime = await Showtime.findById(booking.showtime);

      if (showtime) {
        const seatCodes = extractBookingSeatCodes(booking);

        const seatsReleased = releaseSeatsInShowtime(showtime, seatCodes);

        if (seatsReleased) {
          await showtime.save({ validateBeforeSave: false });
        }
      }

      booking.bookingStatus = "expired";
      booking.paymentStatus =
        booking.paymentStatus === "processing" ? "failed" : booking.paymentStatus;
      booking.cancelledAt = new Date();

      await booking.save({ validateBeforeSave: false });

      releasedCount += 1;
    } catch (error) {
      console.error(
        `Failed to release expired booking ${booking._id}:`,
        error.message
      );
    }
  }

  return {
    checkedAt: new Date(),
    releasedCount,
    message: `${releasedCount} expired reservation(s) released`,
  };
};
