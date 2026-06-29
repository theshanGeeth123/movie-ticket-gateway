import Ticket from "../models/Ticket.js";
import Booking from "../models/Booking.js";
import { createTicketForBooking } from "../services/ticketService.js";
import { generateTicketPdfBuffer } from "../services/ticketPdfService.js";

export const generateTicketManually = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.bookingStatus !== "confirmed" || booking.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Ticket can only be generated for confirmed and paid bookings",
      });
    }

    const ticket = await createTicketForBooking(bookingId);

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime")
      .populate("booking", "bookingReference bookingStatus paymentStatus");

    return res.status(201).json({
      success: true,
      message: "Ticket generated successfully",
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error("Generate ticket error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while generating ticket",
      error: error.message,
    });
  }
};

export const getMyTickets = async (req, res) => {
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
      .populate("showtime", "showDate startTime endTime")
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
    console.error("Get my tickets error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching your tickets",
      error: error.message,
    });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const {
      status,
      customer,
      movie,
      hall,
      showtime,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (status) query.ticketStatus = status;
    if (customer) query.customer = customer;
    if (movie) query.movie = movie;
    if (hall) query.hall = hall;
    if (showtime) query.showtime = showtime;

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const total = await Ticket.countDocuments(query);

    const tickets = await Ticket.find(query)
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime")
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
    console.error("Get all tickets error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching tickets",
      error: error.message,
    });
  }
};

export const getSingleTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language description")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime finalTicketPrice")
      .populate("booking", "bookingReference bookingStatus paymentStatus totalAmount");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const isOwner = ticket.customer._id.toString() === req.user._id.toString();
    const isAdminOrStaff = req.user.role === "admin" || req.user.role === "staff";

    if (!isOwner && !isAdminOrStaff) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this ticket",
      });
    }

    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Get single ticket error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching ticket",
      error: error.message,
    });
  }
};

export const getTicketByBooking = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ booking: req.params.bookingId })
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime finalTicketPrice")
      .populate("booking", "bookingReference bookingStatus paymentStatus totalAmount");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found for this booking",
      });
    }

    const isOwner = ticket.customer._id.toString() === req.user._id.toString();
    const isAdminOrStaff = req.user.role === "admin" || req.user.role === "staff";

    if (!isOwner && !isAdminOrStaff) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this ticket",
      });
    }

    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Get ticket by booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching ticket by booking",
      error: error.message,
    });
  }
};

export const cancelTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.ticketStatus === "used") {
      return res.status(400).json({
        success: false,
        message: "Used ticket cannot be cancelled",
      });
    }

    if (ticket.ticketStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Ticket is already cancelled",
      });
    }

    ticket.ticketStatus = "cancelled";
    ticket.cancelledAt = new Date();

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Ticket cancelled successfully",
      ticket,
    });
  } catch (error) {
    console.error("Cancel ticket error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while cancelling ticket",
      error: error.message,
    });
  }
};

export const downloadTicketPdf = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("customer", "name email role")
      .populate("movie", "title poster genre language description")
      .populate("hall", "name screenType")
      .populate("showtime", "showDate startTime endTime finalTicketPrice")
      .populate(
        "booking",
        "bookingReference bookingStatus paymentStatus totalAmount"
      );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const isOwner = ticket.customer._id.toString() === req.user._id.toString();

    const isAdminOrStaff =
      req.user.role === "admin" || req.user.role === "staff";

    if (!isOwner && !isAdminOrStaff) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to download this ticket",
      });
    }

    if (ticket.ticketStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled ticket cannot be downloaded",
      });
    }

    const pdfBuffer = await generateTicketPdfBuffer(ticket);

    const safeTicketNumber = ticket.ticketNumber.replace(/[^a-zA-Z0-9-_]/g, "");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=ticket-${safeTicketNumber}.pdf`
    );

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Download ticket PDF error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while downloading ticket PDF",
      error: error.message,
    });
  }
};