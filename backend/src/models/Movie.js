import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Movie title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Movie description is required"],
      trim: true,
    },

    language: {
      type: String,
      required: [true, "Movie language is required"],
      trim: true,
    },

    genre: {
      type: [String],
      required: [true, "At least one genre is required"],
      default: [],
    },

    durationMinutes: {
      type: Number,
      required: [true, "Movie duration is required"],
      min: [1, "Duration must be greater than 0"],
    },

    movieType: {
      type: String,
      enum: ["2D", "3D"],
      default: "2D",
    },

    glassesFeeEnabled: {
      type: Boolean,
      default: false,
    },

    glassesFee: {
      type: Number,
      default: 0,
      min: [0, "Glasses fee cannot be negative"],
    },

    posterImage: {
      type: String,
      default: "",
    },

    trailerUrl: {
      type: String,
      default: "",
    },

    releaseDate: {
      type: Date,
      required: [true, "Release date is required"],
    },

    status: {
      type: String,
      enum: ["Now Showing", "Coming Soon", "Ended", "Disabled"],
      default: "Coming Soon",
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

movieSchema.pre("save", function () {
  if (this.movieType === "2D") {
    this.glassesFeeEnabled = false;
    this.glassesFee = 0;
  }

  if (this.movieType === "3D" && !this.glassesFeeEnabled) {
    this.glassesFee = 0;
  }
});

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;