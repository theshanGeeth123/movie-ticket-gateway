import Showtime from "../models/Showtime.js";
import Movie from "../models/Movie.js";
import Hall from "../models/Hall.js";
import Booking from "../models/Booking.js";

const isValidTimeFormat = (time) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
};

const getDayRange = (dateValue) => {
  const start = new Date(dateValue);
  start.setHours(0, 0, 0, 0);

  const end = new Date(dateValue);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const generateShowtimeSeats = (hall, finalTicketPrice) => {
  if (!hall?.seatLayout || !Array.isArray(hall.seatLayout)) {
    return [];
  }

  return hall.seatLayout.map((row) => ({
    rowLabel: row.rowLabel,
    seats: row.seats.map((seat) => ({
      seatNumber: seat.seatNumber,
      seatCode: seat.seatCode,
      seatType: seat.seatType || "regular",
      status: seat.isActive ? "available" : "blocked",
      price: finalTicketPrice,
    })),
  }));
};

const hasBookedOrReservedSeats = (showtime) => {
  if (!showtime?.seatAvailability || !Array.isArray(showtime.seatAvailability)) {
    return false;
  }

  return showtime.seatAvailability.some((row) =>
    row.seats.some(
      (seat) => seat.status === "booked" || seat.status === "reserved"
    )
  );
};

const checkTimeConflict = async ({
  hallId,
  showDate,
  startTime,
  endTime,
  excludeShowtimeId = null,
}) => {
  const { start, end } = getDayRange(showDate);

  const query = {
    hall: hallId,
    showDate: {
      $gte: start,
      $lte: end,
    },
    status: "scheduled",
    isActive: true,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (excludeShowtimeId) {
    query._id = { $ne: excludeShowtimeId };
  }

  return await Showtime.findOne(query);
};

export const createShowtime = async (req, res) => {
  try {
    const {
      movie,
      hall,
      showDate,
      startTime,
      endTime,
      baseTicketPrice,
      threeDGlassesFee = 0,
    } = req.body;

    if (!movie || !hall || !showDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Movie, hall, show date, start time, and end time are required",
      });
    }

    if (baseTicketPrice === undefined || baseTicketPrice === null) {
      return res.status(400).json({
        success: false,
        message: "Base ticket price is required",
      });
    }

    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Time format must be HH:mm. Example: 18:30",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "Start time must be earlier than end time",
      });
    }

    const parsedBaseTicketPrice = Number(baseTicketPrice);
    const parsedThreeDGlassesFee = Number(threeDGlassesFee || 0);

    if (Number.isNaN(parsedBaseTicketPrice) || parsedBaseTicketPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Base ticket price must be a valid positive number",
      });
    }

    if (Number.isNaN(parsedThreeDGlassesFee) || parsedThreeDGlassesFee < 0) {
      return res.status(400).json({
        success: false,
        message: "3D glasses fee must be a valid positive number",
      });
    }

    const selectedMovie = await Movie.findById(movie);

    if (!selectedMovie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    if (selectedMovie.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Cannot create showtime for inactive movie",
      });
    }

    const selectedHall = await Hall.findById(hall);

    if (!selectedHall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    if (selectedHall.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Cannot create showtime for inactive hall",
      });
    }

    const conflictShowtime = await checkTimeConflict({
      hallId: hall,
      showDate,
      startTime,
      endTime,
    });

    if (conflictShowtime) {
      return res.status(400).json({
        success: false,
        message: "This hall already has another showtime during this time",
      });
    }

    const finalTicketPrice = parsedBaseTicketPrice + parsedThreeDGlassesFee;

    const seatAvailability = generateShowtimeSeats(
      selectedHall,
      finalTicketPrice
    );

    if (!seatAvailability.length) {
      return res.status(400).json({
        success: false,
        message: "Selected hall does not have a valid seat layout",
      });
    }

    const showtime = await Showtime.create({
      movie,
      hall,
      showDate,
      startTime,
      endTime,
      baseTicketPrice: parsedBaseTicketPrice,
      threeDGlassesFee: parsedThreeDGlassesFee,
      seatAvailability,
      createdBy: req.user?._id,
    });

    const populatedShowtime = await Showtime.findById(showtime._id)
      .populate("movie", "title mainImage poster genre language duration isActive")
      .populate("hall", "name screenType totalRows seatsPerRow totalSeats")
      .populate("createdBy", "name email role");

    return res.status(201).json({
      success: true,
      message: "Showtime created successfully",
      showtime: populatedShowtime,
    });
  } catch (error) {
    console.error("Create showtime error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating showtime",
      error: error.message,
    });
  }
};

export const getAllShowtimes = async (req, res) => {
  try {
    const {
      search,
      movie,
      hall,
      status = "all",
      date,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (movie) {
      query.movie = movie;
    }

    if (hall) {
      query.hall = hall;
    }

    if (status !== "all") {
      query.status = status;
    }

    if (date) {
      const { start, end } = getDayRange(date);
      query.showDate = {
        $gte: start,
        $lte: end,
      };
    }

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    let showtimes = await Showtime.find(query)
      .populate("movie", "title mainImage poster genre language duration")
      .populate("hall", "name screenType")
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .sort({ showDate: 1, startTime: 1 })
      .skip(skip)
      .limit(pageSize);

    if (search) {
      const keyword = search.toLowerCase();

      showtimes = showtimes.filter((showtime) => {
        const movieTitle = showtime.movie?.title?.toLowerCase() || "";
        const hallName = showtime.hall?.name?.toLowerCase() || "";
        const screenType = showtime.hall?.screenType?.toLowerCase() || "";

        return (
          movieTitle.includes(keyword) ||
          hallName.includes(keyword) ||
          screenType.includes(keyword)
        );
      });
    }

    const total = await Showtime.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: showtimes.length,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageSize),
      showtimes,
    });
  } catch (error) {
    console.error("Get all showtimes error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching showtimes",
      error: error.message,
    });
  }
};

export const getSingleShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate("movie", "title mainImage poster genre language duration description")
      .populate("hall", "name screenType totalRows seatsPerRow totalSeats")
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role");

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    return res.status(200).json({
      success: true,
      showtime,
    });
  } catch (error) {
    console.error("Get single showtime error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching showtime",
      error: error.message,
    });
  }
};

export const getPublicShowtimes = async (req, res) => {
  try {
    const { movie, date } = req.query;

    const query = {
      isActive: true,
      status: "scheduled",
    };

    if (movie) {
      query.movie = movie;
    }

    if (date) {
      const { start, end } = getDayRange(date);
      query.showDate = {
        $gte: start,
        $lte: end,
      };
    }

    const showtimes = await Showtime.find(query)
      .populate("movie", "title mainImage poster genre language duration")
      .populate("hall", "name screenType")
      .sort({ showDate: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      count: showtimes.length,
      showtimes,
    });
  } catch (error) {
    console.error("Get public showtimes error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching public showtimes",
      error: error.message,
    });
  }
};

export const getPublicShowtimeDetails = async (req, res) => {
  try {
    const showtime = await Showtime.findOne({
      _id: req.params.id,
      isActive: true,
      status: "scheduled",
    })
      .populate("movie", "title mainImage poster genre language duration description")
      .populate("hall", "name screenType totalRows seatsPerRow totalSeats");

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    return res.status(200).json({
      success: true,
      showtime,
    });
  } catch (error) {
    console.error("Get public showtime details error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching public showtime details",
      error: error.message,
    });
  }
};

export const updateShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    if (showtime.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled showtime cannot be updated",
      });
    }

    const {
      movie,
      hall,
      showDate,
      startTime,
      endTime,
      baseTicketPrice,
      threeDGlassesFee,
    } = req.body;

    const newMovie = movie || showtime.movie;
    const newHall = hall || showtime.hall;
    const newShowDate = showDate || showtime.showDate;
    const newStartTime = startTime || showtime.startTime;
    const newEndTime = endTime || showtime.endTime;

    if (!isValidTimeFormat(newStartTime) || !isValidTimeFormat(newEndTime)) {
      return res.status(400).json({
        success: false,
        message: "Time format must be HH:mm. Example: 18:30",
      });
    }

    if (newStartTime >= newEndTime) {
      return res.status(400).json({
        success: false,
        message: "Start time must be earlier than end time",
      });
    }

    const selectedMovie = await Movie.findById(newMovie);

    if (!selectedMovie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    if (selectedMovie.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign inactive movie",
      });
    }

    const selectedHall = await Hall.findById(newHall);

    if (!selectedHall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    if (selectedHall.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign inactive hall",
      });
    }

    const conflictShowtime = await checkTimeConflict({
      hallId: newHall,
      showDate: newShowDate,
      startTime: newStartTime,
      endTime: newEndTime,
      excludeShowtimeId: showtime._id,
    });

    if (conflictShowtime) {
      return res.status(400).json({
        success: false,
        message: "This hall already has another showtime during this time",
      });
    }

    const movieChanged = movie && String(movie) !== String(showtime.movie);
    const hallChanged = hall && String(hall) !== String(showtime.hall);
    const dateChanged =
      showDate && new Date(showDate).toDateString() !== new Date(showtime.showDate).toDateString();
    const timeChanged =
      startTime !== undefined ||
      endTime !== undefined;
    const priceChanged =
      baseTicketPrice !== undefined || threeDGlassesFee !== undefined;

    const criticalChanged =
      movieChanged || hallChanged || dateChanged || timeChanged || priceChanged;

    if (criticalChanged && hasBookedOrReservedSeats(showtime)) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot change movie, hall, date, time, or ticket price after seats are booked or reserved",
      });
    }

    showtime.movie = newMovie;
    showtime.hall = newHall;
    showtime.showDate = newShowDate;
    showtime.startTime = newStartTime;
    showtime.endTime = newEndTime;

    if (baseTicketPrice !== undefined) {
      const parsedBaseTicketPrice = Number(baseTicketPrice);

      if (Number.isNaN(parsedBaseTicketPrice) || parsedBaseTicketPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Base ticket price must be a valid positive number",
        });
      }

      showtime.baseTicketPrice = parsedBaseTicketPrice;
    }

    if (threeDGlassesFee !== undefined) {
      const parsedThreeDGlassesFee = Number(threeDGlassesFee);

      if (Number.isNaN(parsedThreeDGlassesFee) || parsedThreeDGlassesFee < 0) {
        return res.status(400).json({
          success: false,
          message: "3D glasses fee must be a valid positive number",
        });
      }

      showtime.threeDGlassesFee = parsedThreeDGlassesFee;
    }

    if (hallChanged || priceChanged) {
      const finalTicketPrice =
        Number(showtime.baseTicketPrice || 0) +
        Number(showtime.threeDGlassesFee || 0);

      showtime.seatAvailability = generateShowtimeSeats(
        selectedHall,
        finalTicketPrice
      );
    }

    showtime.updatedBy = req.user?._id;

    await showtime.save();

    const updatedShowtime = await Showtime.findById(showtime._id)
      .populate("movie", "title mainImage poster genre language duration")
      .populate("hall", "name screenType")
      .populate("updatedBy", "name email role");

    return res.status(200).json({
      success: true,
      message: "Showtime updated successfully",
      showtime: updatedShowtime,
    });
  } catch (error) {
    console.error("Update showtime error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating showtime",
      error: error.message,
    });
  }
};

export const cancelShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    if (hasBookedOrReservedSeats(showtime)) {
      return res.status(400).json({
        success: false,
        message:
          "This showtime has booked or reserved seats. Refund/cancellation handling should be done before cancelling.",
      });
    }

    showtime.status = "cancelled";
    showtime.isActive = false;
    showtime.updatedBy = req.user?._id;

    await showtime.save();

    return res.status(200).json({
      success: true,
      message: "Showtime cancelled successfully",
      showtime,
    });
  } catch (error) {
    console.error("Cancel showtime error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while cancelling showtime",
      error: error.message,
    });
  }
};

export const activateShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    const conflictShowtime = await checkTimeConflict({
      hallId: showtime.hall,
      showDate: showtime.showDate,
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      excludeShowtimeId: showtime._id,
    });

    if (conflictShowtime) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot activate showtime because another showtime already exists during this time",
      });
    }

    showtime.status = "scheduled";
    showtime.isActive = true;
    showtime.updatedBy = req.user?._id;

    await showtime.save();

    return res.status(200).json({
      success: true,
      message: "Showtime activated successfully",
      showtime,
    });
  } catch (error) {
    console.error("Activate showtime error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while activating showtime",
      error: error.message,
    });
  }
};

export const updateShowtimeSeatStatus = async (req, res) => {
  try {
    const { seatCode } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["available", "blocked"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Admin can only set seat status to available or blocked",
      });
    }

    const showtime = await Showtime.findById(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    const formattedSeatCode = seatCode.toUpperCase();

    let selectedSeat = null;

    for (const row of showtime.seatAvailability) {
      selectedSeat = row.seats.find(
        (seat) => seat.seatCode === formattedSeatCode
      );

      if (selectedSeat) break;
    }

    if (!selectedSeat) {
      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    if (
      selectedSeat.status === "booked" ||
      selectedSeat.status === "reserved"
    ) {
      return res.status(400).json({
        success: false,
        message: "Booked or reserved seat cannot be manually changed",
      });
    }

    selectedSeat.status = status;
    showtime.updatedBy = req.user?._id;

    await showtime.save();

    return res.status(200).json({
      success: true,
      message: `Seat ${formattedSeatCode} status updated successfully`,
      seat: selectedSeat,
      showtime,
    });
  } catch (error) {
    console.error("Update showtime seat status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating showtime seat status",
      error: error.message,
    });
  }
};

export const deleteShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    const bookingCount = await Booking.countDocuments({
      showtime: showtime._id,
    });

    if (bookingCount > 0) {
      showtime.isActive = false;
      showtime.updatedBy = req.user?._id;

      await showtime.save({ validateBeforeSave: false });

      return res.status(400).json({
        success: false,
        message:
          "This showtime already has bookings. It was disabled instead of deleted to protect booking and ticket history.",
        showtime,
      });
    }

    await showtime.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Showtime deleted successfully",
    });
  } catch (error) {
    console.error("Delete showtime error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting showtime",
      error: error.message,
    });
  }
};