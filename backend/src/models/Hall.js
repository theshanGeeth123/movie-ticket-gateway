import mongoose from "mongoose";

const seatSchema = new mongoose.Schema(
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

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const seatRowSchema = new mongoose.Schema(
  {
    rowLabel: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    seats: [seatSchema],
  },
  { _id: false }
);

const hallSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hall name is required"],
      unique: true,
      trim: true,
    },

    screenType: {
      type: String,
      enum: ["2D", "3D", "IMAX", "VIP"],
      default: "2D",
    },

    totalRows: {
      type: Number,
      required: [true, "Total rows are required"],
      min: [1, "Total rows must be at least 1"],
      max: [26, "Maximum 26 rows are allowed"],
    },

    seatsPerRow: {
      type: Number,
      required: [true, "Seats per row are required"],
      min: [1, "Seats per row must be at least 1"],
      max: [50, "Maximum 50 seats per row are allowed"],
    },

    totalSeats: {
      type: Number,
      default: 0,
    },

    seatLayout: [seatRowSchema],

    facilities: [
      {
        type: String,
        trim: true,
      },
    ],

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

const generateSeatLayout = (totalRows, seatsPerRow) => {
  const layout = [];

  for (let i = 0; i < totalRows; i++) {
    const rowLabel = String.fromCharCode(65 + i);
    const seats = [];

    for (let j = 1; j <= seatsPerRow; j++) {
      seats.push({
        seatNumber: j,
        seatCode: `${rowLabel}${j}`,
        seatType: "regular",
        isActive: true,
      });
    }

    layout.push({
      rowLabel,
      seats,
    });
  }

  return layout;
};

hallSchema.pre("validate", function (next) {
  if (
    this.isNew ||
    this.isModified("totalRows") ||
    this.isModified("seatsPerRow") ||
    !this.seatLayout ||
    this.seatLayout.length === 0
  ) {
    this.seatLayout = generateSeatLayout(this.totalRows, this.seatsPerRow);
  }

  this.totalSeats = this.totalRows * this.seatsPerRow;

  next();
});

const Hall = mongoose.model("Hall", hallSchema);

export default Hall;