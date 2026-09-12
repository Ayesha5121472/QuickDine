
// Create a new booking
// POST /api/bookings
// @access Private
import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import { Booking } from "../models/Booking.js";

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?._id) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }

        // Log incoming body for debugging (remove after confirmed working)
        console.log("Create Booking - req.body:", JSON.stringify(req.body));

        const { restaurantId, date, time, guests, occasion, specialRequests } = req.body;
        const rawRestaurantId = restaurantId || req.body.restaurant || req.body.id;

        // Explicit field-by-field validation with clear messages
        if (!rawRestaurantId) {
            res.status(400).json({ message: "Restaurant ID is required." });
            return;
        }
        if (!date) {
            res.status(400).json({ message: "Date is required." });
            return;
        }
        if (!time) {
            res.status(400).json({ message: "Time slot is required." });
            return;
        }
        if (guests === undefined || guests === null || guests === "") {
            res.status(400).json({ message: "Number of guests is required." });
            return;
        }

        // Check if restaurant exists (by ObjectId or slug)
        const isObjectId = mongoose.Types.ObjectId.isValid(rawRestaurantId) && String(rawRestaurantId).length === 24;
        const restaurant = isObjectId
            ? await Restaurant.findById(rawRestaurantId)
            : await Restaurant.findOne({ slug: rawRestaurantId });

        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found." });
            return;
        }

        // Verify Restaurant is approved
        if (restaurant.status !== "approved") {
            res.status(400).json({ message: "Reservations are not open for this restaurant yet." });
            return;
        }

        // Verify guests count
        const requestedGuests = Number(guests);
        if (Number.isNaN(requestedGuests) || requestedGuests < 1) {
            res.status(400).json({ message: "Please specify a valid number of guests (minimum 1)." });
            return;
        }

        // Validate time
        const cleanTime = String(time || "").trim();
        if (!cleanTime) {
            res.status(400).json({ message: "Please specify a dining time slot." });
            return;
        }

        // Parse date and normalize to UTC start of day
        const dateStr = String(date).split("T")[0];
        const parsedDate = new Date(`${dateStr}T00:00:00.000Z`);
        if (Number.isNaN(parsedDate.getTime())) {
            res.status(400).json({ message: "Invalid date format." });
            return;
        }

        const startOfDay = new Date(parsedDate);
        const endOfDay = new Date(parsedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Prevent past date reservations (compare date strings only, timezone-safe)
        const nowUtc = new Date();
        // Build today's date string in UTC and compare against submitted date string
        const todayDateStr = `${nowUtc.getUTCFullYear()}-${String(nowUtc.getUTCMonth() + 1).padStart(2, "0")}-${String(nowUtc.getUTCDate()).padStart(2, "0")}`;
        if (dateStr < todayDateStr) {
            res.status(400).json({ message: "Cannot make a reservation for a past date." });
            return;
        }

        // Verify seat availability for requested time slot
        const existingBookings = await Booking.find({
            restaurant: restaurant._id,
            date: { $gte: startOfDay, $lte: endOfDay },
            time: cleanTime,
            status: "confirmed",
        });

        const bookedSeats = existingBookings.reduce((sum, b) => sum + (Number(b.guests) || 0), 0);
        const totalSeats = restaurant.totalSeats || 20;
        const availableSeats = totalSeats - bookedSeats;

        if (requestedGuests > availableSeats) {
            res.status(400).json({
                message: `Unable to reserve. Only ${Math.max(0, availableSeats)} seats are available for this time slot.`,
            });
            return;
        }

        const booking = await Booking.create({
            user: req.user._id,
            restaurant: restaurant._id,
            date: startOfDay,
            time: cleanTime,
            guests: requestedGuests,
            occasion: occasion ? String(occasion).trim() : "",
            specialRequests: specialRequests ? String(specialRequests).trim() : "",
            status: "confirmed",
        });

        // Populate restaurant info before returning
        const populatedBooking = await booking.populate("restaurant", "name location image address slug");
        res.status(201).json(populatedBooking);
    } catch (error: any) {
        console.error("Create Booking Error:", error);
        res.status(400).json({ message: error.message || "Failed to create reservation" });
    }
};

// Get logged-in user bookings
// GET /api/bookings/my
// @access Private
export const getMyBooking = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?._id) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }

        const bookings = await Booking.find({ user: req.user._id })
            .populate("restaurant", "name location image address slug")
            .sort({ date: -1, time: -1 });

        res.status(200).json(bookings);
    } catch (error: any) {
        console.error("Get My Bookings Error:", error);
        res.status(500).json({ message: error.message || "Failed to load bookings" });
    }
};

// Cancel a booking
// PUT /api/bookings/:id/cancel
// @access Private
export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?._id) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            res.status(404).json({ message: "Booking not found" });
            return;
        }

        // Verify user owns this booking
        if (booking.user.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: "Not authorized to cancel this booking" });
            return;
        }

        booking.status = "cancelled";
        await booking.save();

        const populatedBooking = await booking.populate("restaurant", "name location image address slug");
        res.status(200).json(populatedBooking);
    } catch (error: any) {
        console.error("Cancel Booking Error:", error);
        res.status(400).json({ message: error.message || "Failed to cancel booking" });
    }
};