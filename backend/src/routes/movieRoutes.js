import express from "express";
import {
  createMovie,
  getAllMoviesForAdmin,
  getPublicMovies,
  getMovieById,
  updateMovie,
  disableMovie,
  enableMovie,
} from "../controllers/movieController.js";
import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/public", getPublicMovies);
router.get("/:id", getMovieById);

// Admin routes
router.post("/", protect, authorizeRoles("admin"), createMovie);
router.get("/", protect, authorizeRoles("admin"), getAllMoviesForAdmin);
router.put("/:id", protect, authorizeRoles("admin"), updateMovie);
router.patch("/:id/disable", protect, authorizeRoles("admin"), disableMovie);
router.patch("/:id/enable", protect, authorizeRoles("admin"), enableMovie);

export default router;