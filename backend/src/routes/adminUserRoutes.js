import express from "express";
import {
  createUserByAdmin,
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deactivateUser,
  activateUser,
} from "../controllers/adminUserController.js";
import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("admin"));

router.post("/", createUserByAdmin);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUserByAdmin);
router.patch("/:id/deactivate", deactivateUser);
router.patch("/:id/activate", activateUser);

export default router;