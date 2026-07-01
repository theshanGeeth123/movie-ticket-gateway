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
      trim: true,
      uppercase: true,
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
      trim: true,
      uppercase: true,
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
      max: [26, "Total rows cannot exceed 26"],
    },

    seatsPerRow: {
      type: Number,
      required: [true, "Seats per row are required"],
      min: [1, "Seats per row must be at least 1"],
    },

    totalSeats: {
      type: Number,
      default: 0,
    },

    facilities: [
      {
        type: String,
        trim: true,
      },
    ],

    seatLayout: [seatRowSchema],

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

  for (let rowIndex = 0; rowIndex < totalRows; rowIndex += 1) {
    const rowLabel = String.fromCharCode(65 + rowIndex);
    const seats = [];

    for (let seatIndex = 1; seatIndex <= seatsPerRow; seatIndex += 1) {
      seats.push({
        seatNumber: seatIndex,
        seatCode: `${rowLabel}${seatIndex}`,
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

hallSchema.pre("validate", function () {
  if (!this.totalRows || !this.seatsPerRow) {
    return;
  }

  this.totalSeats = Number(this.totalRows) * Number(this.seatsPerRow);

  const shouldGenerateSeatLayout =
    this.isNew ||
    this.isModified("totalRows") ||
    this.isModified("seatsPerRow") ||
    !Array.isArray(this.seatLayout) ||
    this.seatLayout.length === 0;

  if (shouldGenerateSeatLayout) {
    this.seatLayout = generateSeatLayout(
      Number(this.totalRows),
      Number(this.seatsPerRow)
    );
  }
});

const Hall = mongoose.model("Hall", hallSchema);

export default Hall;