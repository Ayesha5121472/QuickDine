import { Router } from "express";
import { getRestaurants, getFeaturedRestaurants, getRestaurantsBySlug, getRestaurantAvailability } from "../controllers/restaurantController.js";

const restaurantRouter = Router();

restaurantRouter.get('/', getRestaurants);
restaurantRouter.get('/', getFeaturedRestaurants);
restaurantRouter.get('/:slug', getRestaurantsBySlug);
restaurantRouter.get('/:id/availibilty', getRestaurantAvailability);

export default restaurantRouter;






