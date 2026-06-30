import Showtime from "../models/Showtime.js";
import Booking from "../models/Booking.js";
import Ticket from "../models/Ticket.js";

const getDayRange = (dateValue = new Date()) => {
  const start = new Date(dateValue);
  start.setHours(0, 0, 0, 0);

  const end = new Date(dateValue);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getDateRange = (startDate, endDate, defaultDays = 7) => {
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

export const getStaffDashboardSummary = async (req, res) => {
  try {
    const { start: todayStart, end: todayEnd } = getDayRange();

    const [
      todayShowtimesCount,
      upcomingShowtimesCount,
      todayBookingsCount,
      activeTicketsCount,
      usedTicketsCount,
      cancelledTicketsCount,
      ticketsUsedTodayCount,
      ticketsCheckedByMeTodayCount,
    ] = await Promise.all([
      Showtime.countDocuments({
        isActive: true,
        status: "scheduled",
        showDate: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      }),

      Showtime.countDocuments({
        isActive: true,
        status: "scheduled",
        showDate: {
          $gte: todayStart,
        },
      }),

      Booking.countDocuments({
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      }),

      Ticket.countDocuments({
        ticketStatus: "active",
      }),

      Ticket.countDocuments({
        ticketStatus: "used",
      }),

      Ticket.countDocuments({
        ticketStatus: "cancelled",
      }),

      Ticket.countDocuments({
        ticketStatus: "used",
        usedAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      }),

      Ticket.countDocuments({
        ticketStatus: "used",
        checkedBy: req.user._id,
        usedAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      }),
    ]);

    const todaysShowtimes = await Showtime.find({
      isActive: true,
      status: "scheduled",
      showDate: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    })
      .populate("movie", "title poster genre language duration")
      .populate("hall", "name screenType totalSeats")
      .sort({ startTime: 1 })
      .limit(10);

    const upcomingShowtimes = await Showtime.find({
      isActive: true,
      status: "scheduled",
      showDate: {
        $gte: todayStart,
      },
    })
      .populate("movie", "title poster genre language duration")
      .populate("hall", "name screenType totalSeats")
      .sort({ showDate: 1, startTime: 1 })
      .limit(10);

    const latestUsedTickets = await Ticket.find({
      ticketStatus: "used",
    })
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime")
      .populate("checkedBy", "name email role")
      .sort({ usedAt: -1 })
      .limit(10);

    const latestActiveTickets = await Ticket.find({
      ticketStatus: "active",
    })
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime")
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      summary: {
        showtimes: {
          todayShowtimesCount,
          upcomingShowtimesCount,
        },
        bookings: {
          todayBookingsCount,
        },
        tickets: {
          activeTicketsCount,
          usedTicketsCount,
          cancelledTicketsCount,
          ticketsUsedTodayCount,
          ticketsCheckedByMeTodayCount,
        },
      },
      todaysShowtimes,
      upcomingShowtimes,
      latestUsedTickets,
      latestActiveTickets,
    });
  } catch (error) {
    console.error("Staff dashboard summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching staff dashboard summary",
      error: error.message,
    });
  }
};

export const getStaffTodayShowtimes = async (req, res) => {
  try {
    const { date } = req.query;

    const { start, end } = getDayRange(date || new Date());

    const showtimes = await Showtime.find({
      isActive: true,
      status: "scheduled",
      showDate: {
        $gte: start,
        $lte: end,
      },
    })
      .populate("movie", "title poster genre language duration")
      .populate("hall", "name screenType totalSeats")
      .sort({ startTime: 1 });

    return res.status(200).json({
      success: true,
      date: date || new Date(),
      count: showtimes.length,
      showtimes,
    });
  } catch (error) {
    console.error("Staff today showtimes error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching staff showtimes",
      error: error.message,
    });
  }
};

export const getStaffTicketVerificationReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      checkedBy,
      page = 1,
      limit = 10,
    } = req.query;

    const { start, end } = getDateRange(startDate, endDate, 7);

    const query = {
      createdAt: {
        $gte: start,
        $lte: end,
      },
    };

    if (status) {
      query.ticketStatus = status;
    }

    if (checkedBy) {
      query.checkedBy = checkedBy;
    }

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const total = await Ticket.countDocuments(query);

    const tickets = await Ticket.find(query)
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime")
      .populate("checkedBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const verificationStats = await Ticket.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: "$ticketStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      dateRange: {
        start,
        end,
      },
      stats: verificationStats,
      count: tickets.length,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageSize),
      tickets,
    });
  } catch (error) {
    console.error("Staff ticket verification report error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching ticket verification report",
      error: error.message,
    });
  }
};

export const getMyTicketCheckHistory = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const { start, end } = getDateRange(startDate, endDate, 7);

    const query = {
      checkedBy: req.user._id,
      ticketStatus: "used",
      usedAt: {
        $gte: start,
        $lte: end,
      },
    };

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const total = await Ticket.countDocuments(query);

    const tickets = await Ticket.find(query)
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime")
      .populate("checkedBy", "name email role")
      .sort({ usedAt: -1 })
      .skip(skip)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      dateRange: {
        start,
        end,
      },
      count: tickets.length,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageSize),
      tickets,
    });
  } catch (error) {
    console.error("My ticket check history error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching your ticket check history",
      error: error.message,
    });
  }
};