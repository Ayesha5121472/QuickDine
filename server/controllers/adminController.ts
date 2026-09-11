import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";

// Get all restaurants for admin management
// GET /api/admin/restaurants
export const getAllRestaurants = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const restaurants = await Restaurant.find({})
            .populate("owner", "name email phone")
            .sort({ createdAt: -1 });

        res.status(200).json(restaurants);
    } catch (error: any) {
        console.error("Get all restaurants error:", error);
        res.status(500).json({
            message: error.message || "Failed to get restaurants",
        });
    }
};

// Approve / reject a restaurant profile
// PUT /api/admin/restaurants/:id/approve
export const approveRestaurant = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { status } = req.body;

        if (
            !status ||
            !["approved", "rejected", "pending"].includes(status)
        ) {
            res.status(400).json({
                message: "Please provide a valid approval status",
            });
            return;
        }

        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            res.status(404).json({
                message: "Restaurant profile not found",
            });
            return;
        }

        restaurant.status = status;
        await restaurant.save();

        res.status(200).json({
            message: `Restaurant ${status} successfully`,
            restaurant,
        });
    } catch (error: any) {
        console.error("Approve restaurant error:", error);
        res.status(500).json({
            message: error.message || "Failed to update restaurant status",
        });
    }
};

// Get system statistics
// GET /api/admin/stats
export const getAdminStats = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const totalUsers = await User.countDocuments({ role: "user" });
        const totalOwners = await User.countDocuments({ role: "owner" });
        const totalBookings = await Booking.countDocuments({});
        const totalRestaurants = await Restaurant.countDocuments({});

        // Get latest 10 bookings
        const latestBookings = await Booking.find({})
            .populate("user", "name email")
            .populate("restaurant", "name")
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            users: {
                totalUsers,
                totalOwners,
                total: totalUsers + totalOwners,
            },
            restaurants: {
                total: totalRestaurants,
            },
            bookings: {
                total: totalBookings,
            },
            latestBookings,
        });
    } catch (error: any) {
        console.error("Get admin stats error:", error);
        res.status(500).json({
            message: error.message || "Failed to get admin statistics",
        });
    }
};