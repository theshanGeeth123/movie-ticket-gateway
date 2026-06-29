import mongoose from "mongoose";
import Movie from "../models/Movie.js";

const allowedStatuses = ["Now Showing", "Coming Soon", "Ended", "Disabled"];

const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const formatMovie = (movie) => {
  return {
    id: movie._id,
    title: movie.title,
    description: movie.description,
    language: movie.language,
    genre: movie.genre,
    durationMinutes: movie.durationMinutes,
    movieType: movie.movieType,
    glassesFeeEnabled: movie.glassesFeeEnabled,
    glassesFee: movie.glassesFee,
    posterImage: movie.posterImage,
    trailerUrl: movie.trailerUrl,
    releaseDate: movie.releaseDate,
    status: movie.status,
    isActive: movie.isActive,
    createdBy: movie.createdBy,
    updatedBy: movie.updatedBy,
    createdAt: movie.createdAt,
    updatedAt: movie.updatedAt,
  };
};

export const createMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      language,
      genre,
      durationMinutes,
      movieType = "2D",
      glassesFeeEnabled = false,
      glassesFee = 0,
      posterImage = "",
      trailerUrl = "",
      releaseDate,
      status = "Coming Soon",
    } = req.body;

    if (!title || !description || !language || !durationMinutes || !releaseDate) {
      return res.status(400).json({
        success: false,
        message:
          "Title, description, language, durationMinutes, and releaseDate are required.",
      });
    }

    if (!["2D", "3D"].includes(movieType)) {
      return res.status(400).json({
        success: false,
        message: "Movie type must be either 2D or 3D.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie status.",
      });
    }

    const genreArray = Array.isArray(genre)
      ? genre
      : typeof genre === "string"
      ? genre.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

    if (genreArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one genre is required.",
      });
    }

    const movie = await Movie.create({
      title,
      description,
      language,
      genre: genreArray,
      durationMinutes,
      movieType,
      glassesFeeEnabled,
      glassesFee,
      posterImage,
      trailerUrl,
      releaseDate,
      status,
      isActive: status !== "Disabled",
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Movie created successfully.",
      movie: formatMovie(movie),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create movie.",
      error: error.message,
    });
  }
};

export const getAllMoviesForAdmin = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      movieType = "all",
      language = "all",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (status !== "all") {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter.",
        });
      }

      filter.status = status;
    }

    if (movieType !== "all") {
      if (!["2D", "3D"].includes(movieType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid movie type filter.",
        });
      }

      filter.movieType = movieType;
    }

    if (language !== "all") {
      filter.language = language;
    }

    if (search.trim()) {
      const safeSearch = escapeRegex(search.trim());

      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { language: { $regex: safeSearch, $options: "i" } },
        { genre: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    const [movies, totalMovies] = await Promise.all([
      Movie.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("createdBy", "name email role")
        .populate("updatedBy", "name email role"),
      Movie.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: movies.length,
      totalMovies,
      totalPages: Math.ceil(totalMovies / limitNumber),
      currentPage: pageNumber,
      movies: movies.map(formatMovie),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch movies.",
      error: error.message,
    });
  }
};

export const getPublicMovies = async (req, res) => {
  try {
    const { search = "", status = "Now Showing" } = req.query;

    const filter = {
      isActive: true,
      status,
    };

    if (!["Now Showing", "Coming Soon"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Public movie status must be Now Showing or Coming Soon.",
      });
    }

    if (search.trim()) {
      const safeSearch = escapeRegex(search.trim());

      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { language: { $regex: safeSearch, $options: "i" } },
        { genre: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const movies = await Movie.find(filter).sort({ releaseDate: -1 });

    res.status(200).json({
      success: true,
      count: movies.length,
      movies: movies.map(formatMovie),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch public movies.",
      error: error.message,
    });
  }
};

export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID.",
      });
    }

    const movie = await Movie.findById(id)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role");

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found.",
      });
    }

    res.status(200).json({
      success: true,
      movie: formatMovie(movie),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch movie.",
      error: error.message,
    });
  }
};

export const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID.",
      });
    }

    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found.",
      });
    }

    const {
      title,
      description,
      language,
      genre,
      durationMinutes,
      movieType,
      glassesFeeEnabled,
      glassesFee,
      posterImage,
      trailerUrl,
      releaseDate,
      status,
    } = req.body;

    if (title !== undefined) movie.title = title;
    if (description !== undefined) movie.description = description;
    if (language !== undefined) movie.language = language;

    if (genre !== undefined) {
      movie.genre = Array.isArray(genre)
        ? genre
        : typeof genre === "string"
        ? genre.split(",").map((item) => item.trim()).filter(Boolean)
        : movie.genre;
    }

    if (durationMinutes !== undefined) movie.durationMinutes = durationMinutes;

    if (movieType !== undefined) {
      if (!["2D", "3D"].includes(movieType)) {
        return res.status(400).json({
          success: false,
          message: "Movie type must be either 2D or 3D.",
        });
      }

      movie.movieType = movieType;
    }

    if (glassesFeeEnabled !== undefined) {
      movie.glassesFeeEnabled = Boolean(glassesFeeEnabled);
    }

    if (glassesFee !== undefined) {
      movie.glassesFee = Number(glassesFee);
    }

    if (posterImage !== undefined) movie.posterImage = posterImage;
    if (trailerUrl !== undefined) movie.trailerUrl = trailerUrl;
    if (releaseDate !== undefined) movie.releaseDate = releaseDate;

    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid movie status.",
        });
      }

      movie.status = status;
      movie.isActive = status !== "Disabled";
    }

    movie.updatedBy = req.user._id;

    await movie.save();

    res.status(200).json({
      success: true,
      message: "Movie updated successfully.",
      movie: formatMovie(movie),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update movie.",
      error: error.message,
    });
  }
};

export const disableMovie = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID.",
      });
    }

    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found.",
      });
    }

    movie.status = "Disabled";
    movie.isActive = false;
    movie.updatedBy = req.user._id;

    await movie.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Movie disabled successfully.",
      movie: formatMovie(movie),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to disable movie.",
      error: error.message,
    });
  }
};

export const enableMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = "Now Showing" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID.",
      });
    }

    if (!["Now Showing", "Coming Soon", "Ended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Now Showing, Coming Soon, or Ended.",
      });
    }

    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found.",
      });
    }

    movie.status = status;
    movie.isActive = true;
    movie.updatedBy = req.user._id;

    await movie.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Movie enabled successfully.",
      movie: formatMovie(movie),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to enable movie.",
      error: error.message,
    });
  }
};