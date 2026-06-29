import mongoose from "mongoose";

const bookingSeatSchema = new mongoose.Schema(
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

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },

    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Showtime",
      required: [true, "Showtime is required"],
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

    seats: {
      type: [bookingSeatSchema],
      required: true,
      validate: {
        validator: function (seats) {
          return seats && seats.length > 0;
        },
        message: "At least one seat is required",
      },
    },

    ticketCount: {
      type: Number,
      required: true,
      min: [1, "Ticket count must be at least 1"],
    },

    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
    },

    serviceFee: {
      type: Number,
      default: 0,
      min: [0, "Service fee cannot be negative"],
    },

    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },

    bookingStatus: {
      type: String,
      enum: ["pending_payment", "confirmed", "cancelled", "expired"],
      default: "pending_payment",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "processing", "paid", "failed", "refunded"],
      default: "unpaid",
    },

    paymentProvider: {
      type: String,
      enum: ["stripe", "cash", "none"],
      default: "none",
    },

    stripePaymentIntentId: {
      type: String,
      trim: true,
    },

    stripePaymentIntentStatus: {
      type: String,
      trim: true,
    },

    paymentCreatedAt: {
      type: Date,
    },

    paidAt: {
      type: Date,
    },

    reservationExpiresAt: {
      type: Date,
      required: true,
    },

    confirmedAt: {
      type: Date,
    },

    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ showtime: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ reservationExpiresAt: 1 });
bookingSchema.index({ stripePaymentIntentId: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;