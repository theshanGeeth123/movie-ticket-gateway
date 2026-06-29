import mongoose from "mongoose";

const showtimeSeatSchema = new mongoose.Schema(
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

    seatType: {
      type: String,
      enum: ["regular", "premium", "vip"],
      default: "regular",
    },

    status: {
      type: String,
      enum: ["available", "reserved", "booked", "blocked"],
      default: "available",
    },

    price: {
      type: Number,
      required: true,
      min: [0, "Seat price cannot be negative"],
    },
  },
  { _id: false }
);

const showtimeSeatRowSchema = new mongoose.Schema(
  {
    rowLabel: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    seats: [showtimeSeatSchema],
  },
  { _id: false }
);

const showtimeSchema = new mongoose.Schema(
  {
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

    showDate: {
      type: Date,
      required: [true, "Show date is required"],
    },

    startTime: {
      type: String,
      required: [true, "Start time is required"],
      trim: true,
    },

    endTime: {
      type: String,
      required: [true, "End time is required"],
      trim: true,
    },

    baseTicketPrice: {
      type: Number,
      required: [true, "Base ticket price is required"],
      min: [0, "Ticket price cannot be negative"],
    },

    threeDGlassesFee: {
      type: Number,
      default: 0,
      min: [0, "3D glasses fee cannot be negative"],
    },

    finalTicketPrice: {
      type: Number,
      default: 0,
    },

    seatAvailability: [showtimeSeatRowSchema],

    totalSeats: {
      type: Number,
      default: 0,
    },

    availableSeats: {
      type: Number,
      default: 0,
    },

    bookedSeats: {
      type: Number,
      default: 0,
    },

    reservedSeats: {
      type: Number,
      default: 0,
    },

    blockedSeats: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

showtimeSchema.pre("save", function (next) {
  this.finalTicketPrice =
    Number(this.baseTicketPrice || 0) + Number(this.threeDGlassesFee || 0);

  let totalSeats = 0;
  let availableSeats = 0;
  let bookedSeats = 0;
  let reservedSeats = 0;
  let blockedSeats = 0;

  this.seatAvailability.forEach((row) => {
    row.seats.forEach((seat) => {
      totalSeats += 1;

      if (seat.status === "available") availableSeats += 1;
      if (seat.status === "booked") bookedSeats += 1;
      if (seat.status === "reserved") reservedSeats += 1;
      if (seat.status === "blocked") blockedSeats += 1;

      seat.price = this.finalTicketPrice;
    });
  });

  this.totalSeats = totalSeats;
  this.availableSeats = availableSeats;
  this.bookedSeats = bookedSeats;
  this.reservedSeats = reservedSeats;
  this.blockedSeats = blockedSeats;

  next();
});

const Showtime = mongoose.model("Showtime", showtimeSchema);

export default Showtime;