import express from "express";

import {
  createMovie,
  getAllMovies,
  getPublicMovies,
  getSingleMovie,
  updateMovie,
  removeMovieGalleryImage,
  disableMovie,
  enableMovie,
  deleteMovie,
} from "../controllers/movieController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { uploadMovieImages } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/
router.get("/public", getPublicMovies);

/*
|--------------------------------------------------------------------------
| Protected routes
|--------------------------------------------------------------------------
*/
router.use(protect);

router
  .route("/")
  .post(authorizeRoles("admin"), uploadMovieImages, createMovie)
  .get(authorizeRoles("admin", "staff"), getAllMovies);

router
  .route("/:id")
  .get(authorizeRoles("admin", "staff"), getSingleMovie)
  .put(authorizeRoles("admin"), uploadMovieImages, updateMovie)
  .delete(authorizeRoles("admin"), deleteMovie);

router.patch(
  "/:id/gallery/remove",
  authorizeRoles("admin"),
  removeMovieGalleryImage
);

router.patch("/:id/disable", authorizeRoles("admin"), disableMovie);

router.patch("/:id/enable", authorizeRoles("admin"), enableMovie);

export default router;