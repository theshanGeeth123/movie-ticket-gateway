import express from "express";

import {
  createHall,
  getAllHalls,
  getSingleHall,
  updateHall,
  disableHall,
  enableHall,
  updateSeatStatus,
  deleteHall,
} from "../controllers/hallController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(authorizeRoles("admin"), createHall)
  .get(authorizeRoles("admin", "staff"), getAllHalls);

router.patch("/:id/disable", authorizeRoles("admin"), disableHall);

router.patch("/:id/enable", authorizeRoles("admin"), enableHall);

router.patch(
  "/:id/seats/:seatCode/status",
  authorizeRoles("admin"),
  updateSeatStatus
);

router
  .route("/:id")
  .get(authorizeRoles("admin", "staff"), getSingleHall)
  .put(authorizeRoles("admin"), updateHall)
  .delete(authorizeRoles("admin"), deleteHall);

export default router;