import express from "express";

import {
  createShowtime,
  getAllShowtimes,
  getSingleShowtime,
  getPublicShowtimes,
  getPublicShowtimeDetails,
  updateShowtime,
  cancelShowtime,
  activateShowtime,
  updateShowtimeSeatStatus,
  deleteShowtime,
} from "../controllers/showtimeController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
| These routes are for customers/visitors to view available showtimes.
| Keep public routes before router.use(protect).
*/
router.get("/public", getPublicShowtimes);
router.get("/public/:id", getPublicShowtimeDetails);

/*
|--------------------------------------------------------------------------
| Protected routes
|--------------------------------------------------------------------------
*/
router.use(protect);

router
  .route("/")
  .post(authorizeRoles("admin"), createShowtime)
  .get(authorizeRoles("admin", "staff"), getAllShowtimes);

router.patch(
  "/:id/cancel",
  authorizeRoles("admin"),
  cancelShowtime
);

router.patch(
  "/:id/activate",
  authorizeRoles("admin"),
  activateShowtime
);

router.patch(
  "/:id/seats/:seatCode/status",
  authorizeRoles("admin"),
  updateShowtimeSeatStatus
);

router
  .route("/:id")
  .get(authorizeRoles("admin", "staff"), getSingleShowtime)
  .put(authorizeRoles("admin"), updateShowtime)
  .delete(authorizeRoles("admin"), deleteShowtime);

export default router;