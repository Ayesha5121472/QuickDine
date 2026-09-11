import { NextFunction, Response, Request } from "express";
import { IUser, User } from "../models/User.js";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      if (!token) {
        res.status(401).json({
          message: "Not authorized, no token",
        });
        return;
      }

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as { id: string };

      // Get user from token, exclude password
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        res.status(401).json({
          message: "Not authorized, user not found",
        });
        return;
      }

      req.user = user;
      next();
      return;
    } catch (error) {
      console.error("Auth Middleware Error:", error);

      res.status(401).json({
        message: "Not authorized, token failed",
      });
      return;
    }
  }

  res.status(401).json({
    message: "Not authorized, no token",
  });
};

// Admin only
export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role === "admin") {
    next();
    return;
  }

  res.status(403).json({
    message: "Access denied, admin only",
  });
};

// Owner only
export const ownerOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (
    req.user &&
    (req.user.role === "owner" || req.user.role === "admin")
  ) {
    next();
    return;
  }

  res.status(403).json({
    message: "Access denied, restaurant owner role required",
  });
};