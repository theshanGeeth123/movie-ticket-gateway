import Hall from "../models/Hall.js";

export const createHall = async (req, res) => {
  try {
    const { name, screenType, totalRows, seatsPerRow, facilities } = req.body;

    if (!name || !totalRows || !seatsPerRow) {
      return res.status(400).json({
        success: false,
        message: "Name, total rows, and seats per row are required",
      });
    }

    const existingHall = await Hall.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (existingHall) {
      return res.status(400).json({
        success: false,
        message: "Hall with this name already exists",
      });
    }

    const hall = await Hall.create({
      name,
      screenType,
      totalRows,
      seatsPerRow,
      facilities,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Hall created successfully",
      hall,
    });
  } catch (error) {
    console.error("Create hall error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating hall",
      error: error.message,
    });
  }
};

export const getAllHalls = async (req, res) => {
  try {
    const {
      search,
      screenType,
      status = "all",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { screenType: { $regex: search, $options: "i" } },
        { facilities: { $regex: search, $options: "i" } },
      ];
    }

    if (screenType) {
      query.screenType = screenType;
    }

    if (status === "active") {
      query.isActive = true;
    }

    if (status === "inactive") {
      query.isActive = false;
    }

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const total = await Hall.countDocuments(query);

    const halls = await Hall.find(query)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      count: halls.length,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageSize),
      halls,
    });
  } catch (error) {
    console.error("Get halls error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching halls",
      error: error.message,
    });
  }
};

export const getSingleHall = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role");

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    return res.status(200).json({
      success: true,
      hall,
    });
  } catch (error) {
    console.error("Get single hall error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching hall",
      error: error.message,
    });
  }
};

export const updateHall = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    const { name, screenType, totalRows, seatsPerRow, facilities } = req.body;

    if (name && name !== hall.name) {
      const existingHall = await Hall.findOne({
        _id: { $ne: hall._id },
        name: { $regex: `^${name}$`, $options: "i" },
      });

      if (existingHall) {
        return res.status(400).json({
          success: false,
          message: "Another hall with this name already exists",
        });
      }

      hall.name = name;
    }

    if (screenType !== undefined) hall.screenType = screenType;
    if (totalRows !== undefined) hall.totalRows = totalRows;
    if (seatsPerRow !== undefined) hall.seatsPerRow = seatsPerRow;
    if (facilities !== undefined) hall.facilities = facilities;

    hall.updatedBy = req.user._id;

    const updatedHall = await hall.save();

    return res.status(200).json({
      success: true,
      message: "Hall updated successfully",
      hall: updatedHall,
    });
  } catch (error) {
    console.error("Update hall error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating hall",
      error: error.message,
    });
  }
};

export const disableHall = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    hall.isActive = false;
    hall.updatedBy = req.user._id;

    await hall.save();

    return res.status(200).json({
      success: true,
      message: "Hall disabled successfully",
      hall,
    });
  } catch (error) {
    console.error("Disable hall error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while disabling hall",
      error: error.message,
    });
  }
};

export const enableHall = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    hall.isActive = true;
    hall.updatedBy = req.user._id;

    await hall.save();

    return res.status(200).json({
      success: true,
      message: "Hall enabled successfully",
      hall,
    });
  } catch (error) {
    console.error("Enable hall error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while enabling hall",
      error: error.message,
    });
  }
};

export const updateSeatStatus = async (req, res) => {
  try {
    const { seatCode } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    const formattedSeatCode = seatCode.toUpperCase();

    let selectedSeat = null;

    for (const row of hall.seatLayout) {
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

    selectedSeat.isActive = isActive;
    hall.updatedBy = req.user._id;

    await hall.save();

    return res.status(200).json({
      success: true,
      message: `Seat ${formattedSeatCode} updated successfully`,
      seat: selectedSeat,
      hall,
    });
  } catch (error) {
    console.error("Update seat status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating seat status",
      error: error.message,
    });
  }
};