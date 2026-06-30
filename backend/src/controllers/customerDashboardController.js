import Booking from "../models/Booking.js";
import Ticket from "../models/Ticket.js";
import Showtime from "../models/Showtime.js";

const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getDateRange = (startDate, endDate, defaultDays = 30) => {
  let start;
  let end;

  if (startDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date();
    start.setDate(start.getDate() - defaultDays);
    start.setHours(0, 0, 0, 0);
  }

  if (endDate) {
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else {
    end = new Date();
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

export const getCustomerDashboardSummary = async (req, res) => {
  try {
    const customerId = req.user._id;
    const todayStart = getTodayStart();

    const [
      totalBookings,
      confirmedBookings,
      pendingPaymentBookings,
      cancelledBookings,
      expiredBookings,

      totalTickets,
      activeTickets,
      usedTickets,
      cancelledTickets,
    ] = await Promise.all([
      Booking.countDocuments({ customer: customerId }),
      Booking.countDocuments({
        customer: customerId,
        bookingStatus: "confirmed",
      }),
      Booking.countDocuments({
        customer: customerId,
        bookingStatus: "pending_payment",
      }),
      Booking.countDocuments({
        customer: customerId,
        bookingStatus: "cancelled",
      }),
      Booking.countDocuments({
        customer: customerId,
        bookingStatus: "expired",
      }),

      Ticket.countDocuments({ customer: customerId }),
      Ticket.countDocuments({
        customer: customerId,
        ticketStatus: "active",
      }),
      Ticket.countDocuments({
        customer: customerId,
        ticketStatus: "used",
      }),
      Ticket.countDocuments({
        customer: customerId,
        ticketStatus: "cancelled",
      }),
    ]);

    const spendingResult = await Booking.aggregate([
      {
        $match: {
          customer: customerId,
          bookingStatus: "confirmed",
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$totalAmount" },
          totalTicketsPurchased: { $sum: "$ticketCount" },
        },
      },
    ]);

    const upcomingBookings = await Booking.find({
      customer: customerId,
      bookingStatus: "confirmed",
      paymentStatus: "paid",
    })
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate({
        path: "showtime",
        select: "showDate startTime endTime finalTicketPrice",
        match: {
          showDate: {
            $gte: todayStart,
          },
        },
      })
      .sort({ createdAt: -1 })
      .limit(10);

    const filteredUpcomingBookings = upcomingBookings.filter(
      (booking) => booking.showtime !== null
    );

    const latestBookings = await Booking.find({
      customer: customerId,
    })
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime finalTicketPrice")
      .sort({ createdAt: -1 })
      .limit(5);

    const latestTickets = await Ticket.find({
      customer: customerId,
    })
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime finalTicketPrice")
      .populate("booking", "bookingReference bookingStatus paymentStatus")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      summary: {
        bookings: {
          totalBookings,
          confirmedBookings,
          pendingPaymentBookings,
          cancelledBookings,
          expiredBookings,
        },
        tickets: {
          totalTickets,
          activeTickets,
          usedTickets,
          cancelledTickets,
        },
        spending: {
          totalSpent: spendingResult[0]?.totalSpent || 0,
          totalTicketsPurchased:
            spendingResult[0]?.totalTicketsPurchased || 0,
        },
      },
      upcomingBookings: filteredUpcomingBookings,
      latestBookings,
      latestTickets,
    });
  } catch (error) {
    console.error("Customer dashboard summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching customer dashboard summary",
      error: error.message,
    });
  }
};

export const getCustomerBookingHistory = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {
      customer: req.user._id,
    };

    if (status) {
      query.bookingStatus = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      const { start, end } = getDateRange(startDate, endDate, 30);

      query.createdAt = {
        $gte: start,
        $lte: end,
      };
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
    console.error("Customer booking history error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching booking history",
      error: error.message,
    });
  }
};

export const getCustomerTicketHistory = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {
      customer: req.user._id,
    };

    if (status) {
      query.ticketStatus = status;
    }

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const total = await Ticket.countDocuments(query);

    const tickets = await Ticket.find(query)
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime finalTicketPrice")
      .populate("booking", "bookingReference bookingStatus paymentStatus")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      count: tickets.length,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageSize),
      tickets,
    });
  } catch (error) {
    console.error("Customer ticket history error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching ticket history",
      error: error.message,
    });
  }
};

export const getCustomerUpcomingShowtimes = async (req, res) => {
  try {
    const todayStart = getTodayStart();

    const showtimes = await Showtime.find({
      isActive: true,
      status: "scheduled",
      showDate: {
        $gte: todayStart,
      },
    })
      .populate("movie", "title poster genre language duration")
      .populate("hall", "name screenType")
      .sort({ showDate: 1, startTime: 1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      count: showtimes.length,
      showtimes,
    });
  } catch (error) {
    console.error("Customer upcoming showtimes error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching upcoming showtimes",
      error: error.message,
    });
  }
};