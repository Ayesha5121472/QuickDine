import { Router } from "express";
import multer from "multer";

import {
  createOwnerRestaurant,
  getOwnerBookings,
  getOwnerRestaurant,
  updateBookingStatus,
  updateOwnerRestaurant,
} from "../controllers/ownerController.js";

import { ownerOnly, protect } from "../middlewares/auth.js";

const ownerRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

ownerRouter.use(protect);
ownerRouter.use(ownerOnly);

ownerRouter.get("/restaurant", getOwnerRestaurant);

ownerRouter.post(
  "/restaurant",
  upload.single("image"),
  createOwnerRestaurant
);

ownerRouter.put(
  "/restaurant",
  upload.single("image"),
  updateOwnerRestaurant
);

ownerRouter.get("/bookings", getOwnerBookings);

ownerRouter.put(
  "/bookings/:id/status",
  updateBookingStatus
);

export default ownerRouter;