import {Router} from "express";
import { createOwnerRestaurant, getOwnerBookings, getOwnerRestaurant, updateBookingStatus, updateOwnerRestaurant } from "../controllers/ownerController.js";
import { ownwerOnly, protect } from "../middlewares/auth.js";

const ownerRouter= Router();

ownerRouter.use(protect)
ownerRouter.use(ownwerOnly)

ownerRouter.get("/restaurant", getOwnerRestaurant)
ownerRouter.post("/restaurant",upload.single("image"), createOwnerRestaurant)
ownerRouter.put("/restaurant",upload.single("image"), updateOwnerRestaurant)
ownerRouter.get("/bookings",getOwnerBookings)
ownerRouter.put("/bookings/:id/status", updateBookingStatus)


export default ownerRouter;
