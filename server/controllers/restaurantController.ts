import { Request, Response } from "express";
import { Restaurant } from "../models/Restaurant.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";

// get all restaurants with search and filters
// GET /api/restaraunts
export const getRestaurants = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { search, priceRange, rating, location, sort } = req.query;

    // build query object
    const queryObj: any = { status: "approved" };

    if (search) {
      queryObj.$or = [
        { name: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    if (priceRange) {
      const prices = Array.isArray(priceRange) ? priceRange : [priceRange];
      queryObj.price = { $in: prices };
    }

    if (rating) {
      queryObj.rating = {
        $gte: parseFloat(rating as string),
      };
    }

    if (location) {
      queryObj.location = {
        $regex: location as string,
        $options: "i",
      };
    }

    // sorting
    let sortOption: any = { createdAt: -1 };

    if (sort === "rating") {
      sortOption = { rating: -1 };
    } else if (sort === "price_low") {
      sortOption = { priceRange: 1 };
    } else if (sort === "price_high") {
      sortOption = { priceRange: -1 };
    }

    const restaurant = await Restaurant.find(queryObj).sort(sortOption);

    res.json(restaurant);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// get featured and exclusive restaurants
// GET /api/restaraunts/featured
export const getFeaturedRestaurants = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const featured = await Restaurant.find({
      status: "approved",
      $or: [{ isFeatured: true }, { isExclusive: true }],
    }).limit(6);

    res.json(featured);
  } catch (error) {
    console.error("Get Featured Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// get single restaurant by slug
// GET /api/restaraunts/:slug
export const getRestaurantsBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOne({
      slug: req.params.slug,
    });

    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }

    // if not approved verify authorization (owner or admin)
    if (restaurant.status !== "approved") {
      let isAuthorized = false;

      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        try {
          const token = req.headers.authorization.split(" ")[1];

          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
          ) as { id: string };

          const user = await User.findById(decoded.id);

          if (
            user &&
            (user.role == "admin" ||
              (user.role == "owner" &&
                restaurant.owner.toString() === user._id.toString()))
          ) {
            isAuthorized = true;
          }
        } catch (err) {
          // Ignore token verify error
        }
      }

      if (!isAuthorized) {
        res.status(403).json({
          message: "Restaurant not found or pending approval",
        });
        return;
      }
    }

    res.json(restaurant);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// get restaurant availability for slots
// GET /api/restaraunts/:id/availability
export const getRestaurantAvailability = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { date } = req.query;

    if (!date) {
      res.status(400).json({ message: "Please provide a date" });
      return;
    }

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      res.status(400).json({ message: "Restaurant not found" });
      return;
    }

    const bookingDate = new Date(date as string);

    // Get all active bookings on this date for the restaurant
    const bookings = await Booking.find({
      restaurant: restaurant._id,
      date: bookingDate,
      status: "confirmed",
    });

    // Map slots to available capacities
    const availabilty = restaurant.availableSLots.map((slot) => {
      const bookedSeats = bookings
        .filter((b) => b.time === slot)
        .reduce((sum, b) => sum + b.guests, 0);

      const totalSeats = restaurant.totalSeats || 20;
      const availableSeats = Math.max(0, totalSeats - bookedSeats);

      return {
        time: slot,
        availableSeats,
        isAvailable: availableSeats > 0,
      };
    });

    res.json(availabilty);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};