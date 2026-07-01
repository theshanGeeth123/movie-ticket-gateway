import mongoose from "mongoose";

const movieImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

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

    genre: {
      type: String,
      required: [true, "Movie genre is required"],
      trim: true,
    },

    language: {
      type: String,
      required: [true, "Movie language is required"],
      trim: true,
    },

    duration: {
      type: Number,
      required: [true, "Movie duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },

    releaseDate: {
      type: Date,
    },

    director: {
      type: String,
      trim: true,
    },

    cast: [
      {
        type: String,
        trim: true,
      },
    ],

    ageRating: {
      type: String,
      enum: ["G", "PG", "PG-13", "R", "18+"],
      default: "PG",
    },

    trailerUrl: {
      type: String,
      trim: true,
    },

    format: {
      type: String,
      enum: ["2D", "3D", "2D/3D"],
      default: "2D",
    },

    is3D: {
      type: Boolean,
      default: false,
    },

    threeDGlassesFee: {
      type: Number,
      default: 0,
      min: [0, "3D glasses fee cannot be negative"],
    },

    mainImage: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },

    galleryImages: [movieImageSchema],

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

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;