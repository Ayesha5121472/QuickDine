import { Request, Response } from "express";
import { Restaurant } from "../models/Restaurant.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";

// Get all restaurants with search and filters
// GET /api/restaurants
export const getRestaurants = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { search, priceRange, rating, location, sort } = req.query;

    const queryObj: any = {
      status: "approved",
    };

    if (search) {
      queryObj.$or = [
        { name: { $regex: search as string, $options: "i" } },
        { tags: { $regex: search as string, $options: "i" } },
        { location: { $regex: search as string, $options: "i" } },
      ];
    }

    if (priceRange) {
      const prices = Array.isArray(priceRange)
        ? priceRange
        : [priceRange];

      queryObj.priceRange = {
        $in: prices,
      };
    }

    if (rating) {
      queryObj.rating = {
        $gte: Number(rating),
      };
    }

    if (location) {
      queryObj.location = {
        $regex: location as string,
        $options: "i",
      };
    }

    let sortOption: any = {
      createdAt: -1,
    };

    if (sort === "rating") {
      sortOption = { rating: -1 };
    } else if (sort === "price_low") {
      sortOption = { priceRange: 1 };
    } else if (sort === "price_high") {
      sortOption = { priceRange: -1 };
    }

    const restaurants = await Restaurant.find(queryObj).sort(sortOption);

    res.status(200).json(restaurants);
  } catch (error: any) {
    console.error("Get Restaurants Error:", error);

    res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};

// Get featured and exclusive restaurants
// GET /api/restaurants/featured
export const getFeaturedRestaurants = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const featured = await Restaurant.find({
      status: "approved",
      $or: [
        { featured: true },
        { exclusive: true },
      ],
    }).limit(6);

    res.status(200).json(featured);
  } catch (error: any) {
    console.error("Get Featured Error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get single restaurant by slug
// GET /api/restaurants/:slug
export const getRestaurantsBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOne({
      slug: req.params.slug,
    });

    if (!restaurant) {
      res.status(404).json({
        message: "Restaurant not found",
      });
      return;
    }

    // If not approved, verify authorization
    if (restaurant.status !== "approved") {
      let isAuthorized = false;

      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const token = authHeader.split(" ")[1];

          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
          ) as { id: string };

          const user = await User.findById(decoded.id);

          if (
            user &&
            (user.role === "admin" ||
              (user.role === "owner" &&
                restaurant.owner.toString() === user._id.toString()))
          ) {
            isAuthorized = true;
          }
        } catch (error) {
          isAuthorized = false;
        }
      }

      if (!isAuthorized) {
        res.status(403).json({
          message: "Restaurant not found or pending approval",
        });
        return;
      }
    }

    res.status(200).json(restaurant);
  } catch (error: any) {
    console.error("Get Restaurant By Slug Error:", error);

    res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};

// Get restaurant availability
// GET /api/restaurants/:id/availability
export const getRestaurantAvailability = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { date } = req.query;

    if (!date) {
      res.status(400).json({
        message: "Please provide a date",
      });
      return;
    }

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      res.status(404).json({
        message: "Restaurant not found",
      });
      return;
    }

    const bookingDate = new Date(date as string);

    if (Number.isNaN(bookingDate.getTime())) {
      res.status(400).json({
        message: "Invalid date",
      });
      return;
    }

    const bookings = await Booking.find({
      restaurant: restaurant._id,
      date: bookingDate,
      status: "confirmed",
    });

    const availability = restaurant.availableSlots.map((slot) => {
      const bookedSeats = bookings
        .filter((booking) => booking.time === slot)
        .reduce(
          (sum, booking) => sum + Number(booking.guests || 0),
          0
        );

      const totalSeats = restaurant.totalSeats || 20;
      const availableSeats = Math.max(
        0,
        totalSeats - bookedSeats
      );

      return {
        time: slot,
        availableSeats,
        isAvailable: availableSeats > 0,
      };
    });

    res.status(200).json(availability);
  } catch (error: any) {
    console.error("Get Availability Error:", error);

    res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};