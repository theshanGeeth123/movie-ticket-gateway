import cloudinary from "../config/cloudinary.js";
import Movie from "../models/Movie.js";
import Showtime from "../models/Showtime.js";

const uploadBufferToCloudinary = (fileBuffer, folder = "movie-ticket-gateway/movies") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
  }
};

const parseCast = (cast) => {
  if (!cast) return [];

  if (Array.isArray(cast)) {
    return cast;
  }

  try {
    const parsed = JSON.parse(cast);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return cast
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const buildMovieQuery = ({ search, genre, language, format, status }) => {
  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { genre: { $regex: search, $options: "i" } },
      { language: { $regex: search, $options: "i" } },
      { director: { $regex: search, $options: "i" } },
    ];
  }

  if (genre) {
    query.genre = { $regex: genre, $options: "i" };
  }

  if (language) {
    query.language = { $regex: language, $options: "i" };
  }

  if (format) {
    query.format = format;
  }

  if (status === "active") {
    query.isActive = true;
  }

  if (status === "inactive") {
    query.isActive = false;
  }

  return query;
};

export const createMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      genre,
      language,
      duration,
      releaseDate,
      director,
      cast,
      ageRating,
      trailerUrl,
      format = "2D",
      is3D,
      threeDGlassesFee = 0,
    } = req.body;

    if (!title || !description || !genre || !language || !duration) {
      return res.status(400).json({
        success: false,
        message: "Title, description, genre, language, and duration are required",
      });
    }

    const existingMovie = await Movie.findOne({
      title: { $regex: `^${title}$`, $options: "i" },
    });

    if (existingMovie) {
      return res.status(400).json({
        success: false,
        message: "Movie with this title already exists",
      });
    }

    let mainImage = {
      url: "",
      publicId: "",
    };

    const galleryImages = [];

    if (req.files?.mainImage?.[0]) {
      const uploadedMainImage = await uploadBufferToCloudinary(
        req.files.mainImage[0].buffer
      );

      mainImage = {
        url: uploadedMainImage.secure_url,
        publicId: uploadedMainImage.public_id,
      };
    }

    if (req.files?.galleryImages?.length > 0) {
      for (const file of req.files.galleryImages) {
        const uploadedGalleryImage = await uploadBufferToCloudinary(file.buffer);

        galleryImages.push({
          url: uploadedGalleryImage.secure_url,
          publicId: uploadedGalleryImage.public_id,
        });
      }
    }

    const movie = await Movie.create({
      title,
      description,
      genre,
      language,
      duration,
      releaseDate,
      director,
      cast: parseCast(cast),
      ageRating,
      trailerUrl,
      format,
      is3D: is3D === "true" || is3D === true || format === "3D" || format === "2D/3D",
      threeDGlassesFee,
      mainImage,
      galleryImages,
      createdBy: req.user?._id,
    });

    return res.status(201).json({
      success: true,
      message: "Movie created successfully",
      movie,
    });
  } catch (error) {
    console.error("Create movie error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating movie",
      error: error.message,
    });
  }
};

export const getAllMovies = async (req, res) => {
  try {
    const {
      search,
      genre,
      language,
      format,
      status = "all",
      page = 1,
      limit = 10,
    } = req.query;

    const query = buildMovieQuery({
      search,
      genre,
      language,
      format,
      status,
    });

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const total = await Movie.countDocuments(query);

    const movies = await Movie.find(query)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      count: movies.length,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageSize),
      movies,
    });
  } catch (error) {
    console.error("Get all movies error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching movies",
      error: error.message,
    });
  }
};

export const getPublicMovies = async (req, res) => {
  try {
    const { search, genre, language, format, page = 1, limit = 10 } = req.query;

    const query = buildMovieQuery({
      search,
      genre,
      language,
      format,
      status: "active",
    });

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const total = await Movie.countDocuments(query);

    const movies = await Movie.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      count: movies.length,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageSize),
      movies,
    });
  } catch (error) {
    console.error("Get public movies error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching public movies",
      error: error.message,
    });
  }
};

export const getSingleMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role");

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    return res.status(200).json({
      success: true,
      movie,
    });
  } catch (error) {
    console.error("Get single movie error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching movie",
      error: error.message,
    });
  }
};

export const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    const {
      title,
      description,
      genre,
      language,
      duration,
      releaseDate,
      director,
      cast,
      ageRating,
      trailerUrl,
      format,
      is3D,
      threeDGlassesFee,
    } = req.body;

    if (title && title !== movie.title) {
      const existingMovie = await Movie.findOne({
        _id: { $ne: movie._id },
        title: { $regex: `^${title}$`, $options: "i" },
      });

      if (existingMovie) {
        return res.status(400).json({
          success: false,
          message: "Another movie with this title already exists",
        });
      }

      movie.title = title;
    }

    if (description !== undefined) movie.description = description;
    if (genre !== undefined) movie.genre = genre;
    if (language !== undefined) movie.language = language;
    if (duration !== undefined) movie.duration = duration;
    if (releaseDate !== undefined) movie.releaseDate = releaseDate;
    if (director !== undefined) movie.director = director;
    if (cast !== undefined) movie.cast = parseCast(cast);
    if (ageRating !== undefined) movie.ageRating = ageRating;
    if (trailerUrl !== undefined) movie.trailerUrl = trailerUrl;
    if (format !== undefined) movie.format = format;

    if (is3D !== undefined) {
      movie.is3D = is3D === "true" || is3D === true;
    } else if (format !== undefined) {
      movie.is3D = format === "3D" || format === "2D/3D";
    }

    if (threeDGlassesFee !== undefined) {
      movie.threeDGlassesFee = threeDGlassesFee;
    }

    if (req.files?.mainImage?.[0]) {
      if (movie.mainImage?.publicId) {
        await deleteFromCloudinary(movie.mainImage.publicId);
      }

      const uploadedMainImage = await uploadBufferToCloudinary(
        req.files.mainImage[0].buffer
      );

      movie.mainImage = {
        url: uploadedMainImage.secure_url,
        publicId: uploadedMainImage.public_id,
      };
    }

    if (req.files?.galleryImages?.length > 0) {
      for (const file of req.files.galleryImages) {
        const uploadedGalleryImage = await uploadBufferToCloudinary(file.buffer);

        movie.galleryImages.push({
          url: uploadedGalleryImage.secure_url,
          publicId: uploadedGalleryImage.public_id,
        });
      }
    }

    movie.updatedBy = req.user?._id;

    await movie.save();

    return res.status(200).json({
      success: true,
      message: "Movie updated successfully",
      movie,
    });
  } catch (error) {
    console.error("Update movie error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating movie",
      error: error.message,
    });
  }
};

export const removeMovieGalleryImage = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Image publicId is required",
      });
    }

    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    const imageExists = movie.galleryImages.some(
      (image) => image.publicId === publicId
    );

    if (!imageExists) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    await deleteFromCloudinary(publicId);

    movie.galleryImages = movie.galleryImages.filter(
      (image) => image.publicId !== publicId
    );

    movie.updatedBy = req.user?._id;

    await movie.save();

    return res.status(200).json({
      success: true,
      message: "Gallery image removed successfully",
      movie,
    });
  } catch (error) {
    console.error("Remove gallery image error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while removing gallery image",
      error: error.message,
    });
  }
};

export const disableMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    movie.isActive = false;
    movie.updatedBy = req.user?._id;

    await movie.save();

    return res.status(200).json({
      success: true,
      message: "Movie disabled successfully",
      movie,
    });
  } catch (error) {
    console.error("Disable movie error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while disabling movie",
      error: error.message,
    });
  }
};

export const enableMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    movie.isActive = true;
    movie.updatedBy = req.user?._id;

    await movie.save();

    return res.status(200).json({
      success: true,
      message: "Movie enabled successfully",
      movie,
    });
  } catch (error) {
    console.error("Enable movie error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while enabling movie",
      error: error.message,
    });
  }
};

export const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    const showtimeCount = await Showtime.countDocuments({
      movie: movie._id,
    });

    if (showtimeCount > 0) {
      movie.isActive = false;
      movie.updatedBy = req.user?._id;
      await movie.save({ validateBeforeSave: false });

      return res.status(400).json({
        success: false,
        message:
          "This movie already has showtimes. It was disabled instead of deleted to protect booking history.",
        movie,
      });
    }

    if (movie.mainImage?.publicId) {
      await deleteFromCloudinary(movie.mainImage.publicId);
    }

    if (Array.isArray(movie.galleryImages)) {
      for (const image of movie.galleryImages) {
        await deleteFromCloudinary(image.publicId);
      }
    }

    await movie.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Movie deleted successfully",
    });
  } catch (error) {
    console.error("Delete movie error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting movie",
      error: error.message,
    });
  }
};