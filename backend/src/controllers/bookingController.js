import Booking from "../models/Booking.js";
import Showtime from "../models/Showtime.js";

const RESERVATION_MINUTES = 10;

const generateBookingReference = () => {
  const timestamp = Date.now();
  const randomNumber = Math.floor(1000 + Math.random() * 9000);

  return `MTB-${timestamp}-${randomNumber}`;
};

const getShowStartDateTime = (showDate, startTime) => {
  const date = new Date(showDate);
  const [hours, minutes] = startTime.split(":").map(Number);

  date.setHours(hours, minutes, 0, 0);

  return date;
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

export const releaseExpiredReservations = async (showtimeId = null) => {
  const now = new Date();

  const query = {
    bookingStatus: "pending_payment",
    paymentStatus: "unpaid",
    reservationExpiresAt: { $lte: now },
  };

  if (showtimeId) {
    query.showtime = showtimeId;
  }

  const expiredBookings = await Booking.find(query);

  for (const booking of expiredBookings) {
    const showtime = await Showtime.findById(booking.showtime);

    if (showtime) {
      for (const bookingSeat of booking.seats) {
        const foundSeat = findSeatInShowtime(showtime, bookingSeat.seatCode);

        if (foundSeat && foundSeat.seat.status === "reserved") {
          foundSeat.seat.status = "available";
        }
      }

      await showtime.save();
    }

    booking.bookingStatus = "expired";
    await booking.save();
  }

  return expiredBookings.length;
};

export const reserveSeats = async (req, res) => {
  try {
    const { showtimeId, seats } = req.body;

    if (!showtimeId) {
      return res.status(400).json({
        success: false,
        message: "Showtime ID is required",
      });
    }

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one seat",
      });
    }

    const uniqueSeatCodes = [
      ...new Set(seats.map((seatCode) => seatCode.toUpperCase().trim())),
    ];

    if (uniqueSeatCodes.length !== seats.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate seats are not allowed",
      });
    }

    await releaseExpiredReservations(showtimeId);

    const showtime = await Showtime.findById(showtimeId)
      .populate("movie", "title isActive")
      .populate("hall", "name screenType isActive");

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    if (!showtime.isActive || showtime.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "This showtime is not available for booking",
      });
    }

    if (!showtime.movie || showtime.movie.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Movie is not available for booking",
      });
    }

    if (!showtime.hall || showtime.hall.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Hall is not available for booking",
      });
    }

    const showStartDateTime = getShowStartDateTime(
      showtime.showDate,
      showtime.startTime
    );

    if (showStartDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot book seats for a past showtime",
      });
    }

    const unavailableSeats = [];
    const selectedSeats = [];

    for (const seatCode of uniqueSeatCodes) {
      const foundSeat = findSeatInShowtime(showtime, seatCode);

      if (!foundSeat) {
        unavailableSeats.push({
          seatCode,
          reason: "Seat does not exist",
        });

        continue;
      }

      if (foundSeat.seat.status !== "available") {
        unavailableSeats.push({
          seatCode,
          reason: `Seat is ${foundSeat.seat.status}`,
        });

        continue;
      }

      selectedSeats.push({
        seatNumber: foundSeat.seat.seatNumber,
        seatCode: foundSeat.seat.seatCode,
        rowLabel: foundSeat.row.rowLabel,
        seatType: foundSeat.seat.seatType,
        price: foundSeat.seat.price,
      });
    }

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some selected seats are not available",
        unavailableSeats,
      });
    }

    for (const seatData of selectedSeats) {
      const foundSeat = findSeatInShowtime(showtime, seatData.seatCode);
      foundSeat.seat.status = "reserved";
    }

    await showtime.save();

    const subtotal = selectedSeats.reduce(
      (total, seat) => total + Number(seat.price),
      0
    );

    const serviceFee = 0;
    const totalAmount = subtotal + serviceFee;

    const reservationExpiresAt = new Date(
      Date.now() + RESERVATION_MINUTES * 60 * 1000
    );

    let booking;

    try {
      booking = await Booking.create({
        bookingReference: generateBookingReference(),
        customer: req.user._id,
        showtime: showtime._id,
        movie: showtime.movie._id,
        hall: showtime.hall._id,
        seats: selectedSeats,
        ticketCount: selectedSeats.length,
        subtotal,
        serviceFee,
        totalAmount,
        bookingStatus: "pending_payment",
        paymentStatus: "unpaid",
        reservationExpiresAt,
      });
    } catch (bookingError) {
      for (const seatData of selectedSeats) {
        const foundSeat = findSeatInShowtime(showtime, seatData.seatCode);

        if (foundSeat && foundSeat.seat.status === "reserved") {
          foundSeat.seat.status = "available";
        }
      }

      await showtime.save();

      throw bookingError;
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime finalTicketPrice");

    return res.status(201).json({
      success: true,
      message: `Seats reserved successfully. Please complete payment within ${RESERVATION_MINUTES} minutes.`,
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Reserve seats error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while reserving seats",
      error: error.message,
    });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    await releaseExpiredReservations();

    const { status, paymentStatus, page = 1, limit = 10 } = req.query;

    const query = {
      customer: req.user._id,
    };

    if (status) {
      query.bookingStatus = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const total = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime finalTicketPrice")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageSize),
      bookings,
    });
  } catch (error) {
    console.error("Get my bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching your bookings",
      error: error.message,
    });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    await releaseExpiredReservations();

    const {
      status,
      paymentStatus,
      customer,
      movie,
      hall,
      showtime,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (status) query.bookingStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (customer) query.customer = customer;
    if (movie) query.movie = movie;
    if (hall) query.hall = hall;
    if (showtime) query.showtime = showtime;

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const total = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime finalTicketPrice")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageSize),
      bookings,
    });
  } catch (error) {
    console.error("Get all bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching bookings",
      error: error.message,
    });
  }
};

export const getSingleBooking = async (req, res) => {
  try {
    await releaseExpiredReservations();

    const booking = await Booking.findById(req.params.id)
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime finalTicketPrice");

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
        message: "You are not allowed to view this booking",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Get single booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching booking",
      error: error.message,
    });
  }
};

export const cancelPendingBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const isOwner = booking.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to cancel this booking",
      });
    }

    if (booking.bookingStatus !== "pending_payment") {
      return res.status(400).json({
        success: false,
        message: "Only pending payment bookings can be cancelled now",
      });
    }

    const showtime = await Showtime.findById(booking.showtime);

    if (showtime) {
      for (const bookingSeat of booking.seats) {
        const foundSeat = findSeatInShowtime(showtime, bookingSeat.seatCode);

        if (foundSeat && foundSeat.seat.status === "reserved") {
          foundSeat.seat.status = "available";
        }
      }

      await showtime.save();
    }

    booking.bookingStatus = "cancelled";
    booking.cancelledAt = new Date();

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime finalTicketPrice");

    return res.status(200).json({
      success: true,
      message: "Booking cancelled and seats released successfully",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Cancel pending booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while cancelling booking",
      error: error.message,
    });
  }
};

export const releaseExpiredReservationsManually = async (req, res) => {
  try {
    const releasedCount = await releaseExpiredReservations();

    return res.status(200).json({
      success: true,
      message: `${releasedCount} expired reservation(s) released successfully`,
      releasedCount,
    });
  } catch (error) {
    console.error("Release expired reservations error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while releasing expired reservations",
      error: error.message,
    });
  }
};