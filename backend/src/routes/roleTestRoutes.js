import express from "express";
import {
  adminOnlyTest,
  staffOrAdminTest,
  customerOnlyTest,
} from "../controllers/roleTestController.js";
import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/admin-only", protect, authorizeRoles("admin"), adminOnlyTest);

router.get(
  "/staff-or-admin",
  protect,
  authorizeRoles("staff", "admin"),
  staffOrAdminTest
);

router.get(
  "/customer-only",
  protect,
  authorizeRoles("customer"),
  customerOnlyTest
);

export default router;