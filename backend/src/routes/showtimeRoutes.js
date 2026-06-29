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
} from "../controllers/showtimeController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
| Customers can view available showtimes without login.
*/
router.get("/public", getPublicShowtimes);
router.get("/public/:id", getPublicShowtimeDetails);

/*
|--------------------------------------------------------------------------
| Protected routes
|--------------------------------------------------------------------------
| Admin and staff can manage/view showtimes.
*/
router.use(protect);

router
  .route("/")
  .post(authorizeRoles("admin"), createShowtime)
  .get(authorizeRoles("admin", "staff"), getAllShowtimes);

router
  .route("/:id")
  .get(authorizeRoles("admin", "staff"), getSingleShowtime)
  .put(authorizeRoles("admin"), updateShowtime);

router.patch("/:id/cancel", authorizeRoles("admin"), cancelShowtime);

router.patch("/:id/activate", authorizeRoles("admin"), activateShowtime);

router.patch(
  "/:id/seats/:seatCode/status",
  authorizeRoles("admin"),
  updateShowtimeSeatStatus
);

export default router;