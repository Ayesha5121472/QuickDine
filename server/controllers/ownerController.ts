import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import cloudinary from "../config/cloudinary.js";
import { Booking } from "../models/Booking.js";

const uploadToCloudinary = (
  fileBuffer: Buffer
): Promise<{ secure_url: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "QuickDine" },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Upload failed"));
          return;
        }

        resolve({
          secure_url: result.secure_url,
        });
      }
    );

    stream.end(fileBuffer);
  });
};

// GET /api/owner/restaurant
export const getOwnerRestaurant = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const restaurant = await Restaurant.findOne({
      owner: req.user._id,
    });

    res.status(200).json(restaurant || null);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Failed to get restaurant",
    });
  }
};

// POST /api/owner/restaurant
export const createOwnerRestaurant = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const existing = await Restaurant.findOne({
      owner: req.user._id,
    });

    if (existing) {
      res.status(400).json({
        message: "You already have a restaurant registered",
      });
      return;
    }

    const {
      name,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      tags,
      availableSlots,
      totalSeats,
    } = req.body;

    if (
      !name ||
      !description ||
      !cuisine ||
      !priceRange ||
      !location ||
      !address ||
      !chef
    ) {
      res.status(400).json({
        message: "Please provide all required fields.",
      });
      return;
    }

    const slug = String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const slugExists = await Restaurant.findOne({ slug });

    if (slugExists) {
      res.status(400).json({
        message: "A restaurant name already exists.",
      });
      return;
    }

    let imageUrl = "/default_restaurant_Img.jpeg";

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload failed, falling back to default image:", uploadError);
      }
    }

    const parsedTags =
      typeof tags === "string"
        ? tags.split(",").map((tag: string) => tag.trim()).filter(Boolean)
        : Array.isArray(tags)
        ? tags
        : [];

    const parsedSlots =
      typeof availableSlots === "string"
        ? availableSlots
            .split(",")
            .map((slot: string) => slot.trim())
            .filter(Boolean)
        : Array.isArray(availableSlots)
        ? availableSlots
        : ["17:00", "18:00", "19:00", "20:00", "21:00"];

    const seats = totalSeats ? Number(totalSeats) : 20;

    const restaurant = await Restaurant.create({
      name: String(name).trim(),
      slug,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      image: imageUrl,
      tags: parsedTags,
      availableSlots: parsedSlots,
      totalSeats: seats,
      owner: req.user._id,
      status: "pending",
    });

    res.status(201).json(restaurant);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Failed to create restaurant",
    });
  }
};

// PUT /api/owner/restaurant
export const updateOwnerRestaurant = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const restaurant = await Restaurant.findOne({
      owner: req.user._id,
    });

    if (!restaurant) {
      res.status(404).json({
        message: "Restaurant profile not found",
      });
      return;
    }

    const {
      name,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      tags,
      availableSlots,
      totalSeats,
      phone,
      whatsapp,
      email,
      openingHours,
      closingHours,
      availableDays,
    } = req.body;

    if (name) restaurant.name = name;
    if (description) restaurant.description = description;
    if (cuisine) restaurant.cuisine = cuisine;
    if (priceRange) restaurant.priceRange = priceRange;
    if (location) restaurant.location = location;
    if (address) restaurant.address = address;
    if (chef) restaurant.chef = chef;

    // Contact fields (allow empty string to clear)
    if (phone !== undefined) restaurant.phone = String(phone).trim();
    if (whatsapp !== undefined) restaurant.whatsapp = String(whatsapp).trim();
    if (email !== undefined) restaurant.email = String(email).trim();
    if (openingHours !== undefined) restaurant.openingHours = String(openingHours).trim();
    if (closingHours !== undefined) restaurant.closingHours = String(closingHours).trim();
    if (availableDays !== undefined) restaurant.availableDays = String(availableDays).trim();

    if (totalSeats !== undefined && totalSeats !== "") {
      const seats = Number(totalSeats);

      if (Number.isNaN(seats) || seats <= 0) {
        res.status(400).json({
          message: "Invalid total seats",
        });
        return;
      }

      restaurant.totalSeats = seats;
    }

    if (tags !== undefined) {
      restaurant.tags =
        typeof tags === "string"
          ? tags.split(",").map((tag: string) => tag.trim()).filter(Boolean)
          : Array.isArray(tags)
          ? tags
          : [];
    }

    if (availableSlots !== undefined) {
      restaurant.availableSlots =
        typeof availableSlots === "string"
          ? availableSlots
              .split(",")
              .map((slot: string) => slot.trim())
              .filter(Boolean)
          : Array.isArray(availableSlots)
          ? availableSlots
          : [];
    }

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        restaurant.image = result.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload failed on update:", uploadError);
      }
    }

    const updatedRestaurant = await restaurant.save();

    res.status(200).json(updatedRestaurant);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Failed to update restaurant",
    });
  }
};

// GET /api/owner/bookings
export const getOwnerBookings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { restaurantId } = req.query;

    const restaurants = await Restaurant.find({
      owner: req.user._id,
    });

    if (!restaurants || restaurants.length === 0) {
      res.status(200).json([]);
      return;
    }

    let filter: any = {};
    if (restaurantId) {
      const match = restaurants.find(
        (r) => r._id.toString() === restaurantId || r.slug === restaurantId
      );
      if (!match) {
        res.status(403).json({ message: "Not authorized for this restaurant" });
        return;
      }
      filter.restaurant = match._id;
    } else {
      filter.restaurant = { $in: restaurants.map((r) => r._id) };
    }

    const bookings = await Booking.find(filter)
      .populate("user", "name email phone")
      .populate("restaurant", "name slug location")
      .sort({ date: -1, time: 1 });

    res.status(200).json(bookings);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Failed to get bookings",
    });
  }
};

// PUT /api/owner/bookings/:id/status
export const updateBookingStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { status } = req.body;

    if (
      !status ||
      !["confirmed", "cancelled", "completed"].includes(status)
    ) {
      res.status(400).json({
        message: "Please enter a valid booking status",
      });
      return;
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({
        message: "Booking not found",
      });
      return;
    }

    const restaurant = await Restaurant.findById(booking.restaurant);

    if (!restaurant) {
      res.status(404).json({
        message: "Restaurant not found",
      });
      return;
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      res.status(403).json({
        message: "Not authorized to manage this booking",
      });
      return;
    }

    booking.status = status;

    const updatedBooking = await booking.save();

    res.status(200).json(updatedBooking);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Failed to update booking status",
    });
  }
};