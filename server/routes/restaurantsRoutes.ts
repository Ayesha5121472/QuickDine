import { Router } from "express";
import { getRestaurants, getFeaturedRestaurants, getRestaurantsBySlug, getRestaurantAvailability } from "../controllers/restaurantController.js";

const restaurantRouter = Router();

restaurantRouter.get("/", getRestaurants);
restaurantRouter.get("/featured", getFeaturedRestaurants);
restaurantRouter.get("/:id/availability", getRestaurantAvailability);
restaurantRouter.get("/:slug", getRestaurantsBySlug);

export default restaurantRouter;






