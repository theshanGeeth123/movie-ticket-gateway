import User from "../models/User.js";
import Movie from "../models/Movie.js";
import Hall from "../models/Hall.js";
import Showtime from "../models/Showtime.js";
import Booking from "../models/Booking.js";
import Ticket from "../models/Ticket.js";

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

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const getAdminDashboardSummary = async (req, res) => {
  try {
    const { start, end } = getDateRange(null, null, 7);
    const { start: todayStart, end: todayEnd } = getTodayRange();

    const [
      totalUsers,
      totalCustomers,
      totalStaff,
      totalAdmins,
      activeUsers,

      totalMovies,
      activeMovies,
      inactiveMovies,

      totalHalls,
      activeHalls,
      inactiveHalls,

      totalShowtimes,
      scheduledShowtimes,
      cancelledShowtimes,
      completedShowtimes,

      totalBookings,
      confirmedBookings,
      pendingPaymentBookings,
      cancelledBookings,
      expiredBookings,

      totalTickets,
      activeTickets,
      usedTickets,
      cancelledTickets,

      todayBookings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "staff" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isActive: true }),

      Movie.countDocuments(),
      Movie.countDocuments({ isActive: true }),
      Movie.countDocuments({ isActive: false }),

      Hall.countDocuments(),
      Hall.countDocuments({ isActive: true }),
      Hall.countDocuments({ isActive: false }),

      Showtime.countDocuments(),
      Showtime.countDocuments({ status: "scheduled" }),
      Showtime.countDocuments({ status: "cancelled" }),
      Showtime.countDocuments({ status: "completed" }),

      Booking.countDocuments(),
      Booking.countDocuments({ bookingStatus: "confirmed" }),
      Booking.countDocuments({ bookingStatus: "pending_payment" }),
      Booking.countDocuments({ bookingStatus: "cancelled" }),
      Booking.countDocuments({ bookingStatus: "expired" }),

      Ticket.countDocuments(),
      Ticket.countDocuments({ ticketStatus: "active" }),
      Ticket.countDocuments({ ticketStatus: "used" }),
      Ticket.countDocuments({ ticketStatus: "cancelled" }),

      Booking.countDocuments({
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      }),
    ]);

    const totalRevenueResult = await Booking.aggregate([
      {
        $match: {
          bookingStatus: "confirmed",
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const todayRevenueResult = await Booking.aggregate([
      {
        $match: {
          bookingStatus: "confirmed",
          paymentStatus: "paid",
          createdAt: {
            $gte: todayStart,
            $lte: todayEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          todayRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const revenueChart = await Booking.aggregate([
      {
        $match: {
          bookingStatus: "confirmed",
          paymentStatus: "paid",
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          revenue: { $sum: "$totalAmount" },
          bookings: { $sum: 1 },
          tickets: { $sum: "$ticketCount" },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          revenue: 1,
          bookings: 1,
          tickets: 1,
        },
      },
    ]);

    const topMovies = await Booking.aggregate([
      {
        $match: {
          bookingStatus: "confirmed",
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: "$movie",
          totalBookings: { $sum: 1 },
          totalTickets: { $sum: "$ticketCount" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: {
          revenue: -1,
        },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "movies",
          localField: "_id",
          foreignField: "_id",
          as: "movie",
        },
      },
      {
        $unwind: {
          path: "$movie",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          movieId: "$_id",
          title: "$movie.title",
          poster: "$movie.poster",
          genre: "$movie.genre",
          language: "$movie.language",
          totalBookings: 1,
          totalTickets: 1,
          revenue: 1,
        },
      },
    ]);

    const upcomingShowtimes = await Showtime.find({
      isActive: true,
      status: "scheduled",
      showDate: {
        $gte: todayStart,
      },
    })
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .sort({ showDate: 1, startTime: 1 })
      .limit(5);

    const latestBookings = await Booking.find()
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      summary: {
        users: {
          totalUsers,
          totalCustomers,
          totalStaff,
          totalAdmins,
          activeUsers,
        },

        movies: {
          totalMovies,
          activeMovies,
          inactiveMovies,
        },

        halls: {
          totalHalls,
          activeHalls,
          inactiveHalls,
        },

        showtimes: {
          totalShowtimes,
          scheduledShowtimes,
          cancelledShowtimes,
          completedShowtimes,
        },

        bookings: {
          totalBookings,
          confirmedBookings,
          pendingPaymentBookings,
          cancelledBookings,
          expiredBookings,
          todayBookings,
        },

        tickets: {
          totalTickets,
          activeTickets,
          usedTickets,
          cancelledTickets,
        },

        revenue: {
          totalRevenue: totalRevenueResult[0]?.totalRevenue || 0,
          todayRevenue: todayRevenueResult[0]?.todayRevenue || 0,
        },
      },

      charts: {
        revenueChart,
        topMovies,
      },

      upcomingShowtimes,
      latestBookings,
    });
  } catch (error) {
    console.error("Admin dashboard summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching admin dashboard summary",
      error: error.message,
    });
  }
};

export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const { start, end } = getDateRange(startDate, endDate, 30);

    const revenueByDate = await Booking.aggregate([
      {
        $match: {
          bookingStatus: "confirmed",
          paymentStatus: "paid",
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          revenue: { $sum: "$totalAmount" },
          bookings: { $sum: 1 },
          tickets: { $sum: "$ticketCount" },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          revenue: 1,
          bookings: 1,
          tickets: 1,
        },
      },
    ]);

    const summary = await Booking.aggregate([
      {
        $match: {
          bookingStatus: "confirmed",
          paymentStatus: "paid",
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalBookings: { $sum: 1 },
          totalTickets: { $sum: "$ticketCount" },
          averageBookingValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      dateRange: {
        start,
        end,
      },
      summary: {
        totalRevenue: summary[0]?.totalRevenue || 0,
        totalBookings: summary[0]?.totalBookings || 0,
        totalTickets: summary[0]?.totalTickets || 0,
        averageBookingValue: summary[0]?.averageBookingValue || 0,
      },
      revenueByDate,
    });
  } catch (error) {
    console.error("Revenue report error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching revenue report",
      error: error.message,
    });
  }
};

export const getBookingReport = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

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
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime")
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
    console.error("Booking report error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching booking report",
      error: error.message,
    });
  }
};

export const getMoviePerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const { start, end } = getDateRange(startDate, endDate, 30);

    const moviePerformance = await Booking.aggregate([
      {
        $match: {
          bookingStatus: "confirmed",
          paymentStatus: "paid",
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: "$movie",
          totalBookings: { $sum: 1 },
          totalTickets: { $sum: "$ticketCount" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: {
          revenue: -1,
        },
      },
      {
        $limit: Number(limit),
      },
      {
        $lookup: {
          from: "movies",
          localField: "_id",
          foreignField: "_id",
          as: "movie",
        },
      },
      {
        $unwind: {
          path: "$movie",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          movieId: "$_id",
          title: "$movie.title",
          poster: "$movie.poster",
          genre: "$movie.genre",
          language: "$movie.language",
          totalBookings: 1,
          totalTickets: 1,
          revenue: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      dateRange: {
        start,
        end,
      },
      count: moviePerformance.length,
      moviePerformance,
    });
  } catch (error) {
    console.error("Movie performance report error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching movie performance report",
      error: error.message,
    });
  }
};