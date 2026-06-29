import mongoose from "mongoose";

const ticketSeatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: Number,
      required: true,
    },

    seatCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    rowLabel: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    seatType: {
      type: String,
      enum: ["regular", "premium", "vip"],
      default: "regular",
    },

    price: {
      type: Number,
      required: true,
      min: [0, "Seat price cannot be negative"],
    },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required"],
      unique: true,
    },

    bookingReference: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },

    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: [true, "Movie is required"],
    },

    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: [true, "Hall is required"],
    },

    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Showtime",
      required: [true, "Showtime is required"],
    },

    seats: {
      type: [ticketSeatSchema],
      required: true,
    },

    ticketCount: {
      type: Number,
      required: true,
      min: [1, "Ticket count must be at least 1"],
    },

    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },

    paymentProvider: {
      type: String,
      enum: ["stripe", "cash", "none"],
      default: "stripe",
    },

    paymentStatus: {
      type: String,
      enum: ["paid", "refunded"],
      default: "paid",
    },

    ticketStatus: {
      type: String,
      enum: ["active", "used", "cancelled"],
      default: "active",
    },

    qrCodeData: {
      type: String,
      required: true,
      trim: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    usedAt: {
      type: Date,
    },

    cancelledAt: {
      type: Date,
    },

    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({ customer: 1, createdAt: -1 });
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ bookingReference: 1 });
ticketSchema.index({ ticketStatus: 1 });
ticketSchema.index({ showtime: 1 });

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;