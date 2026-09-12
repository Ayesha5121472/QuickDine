import "dotenv/config";
import express, { Request, Response, NextFunction } from 'express';
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import restaurantRouter from "./routes/restaurantsRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import adminRouter from "./routes/adminRoutes.js";

const app = express();

// Middleware — must come before routes
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Connect to MongoDB on every cold start (Vercel serverless safe — connectDB is idempotent)
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
    try {
        await connectDB();
    } catch (err) {
        console.error("MongoDB connection failed:", err);
    }
    next();
});

const port = process.env.PORT || 5000;

app.get("/", (_req: Request, res: Response) => {
    res.send("Server is Live!");
});

app.use("/api/auth", authRouter);
app.use("/api/restaurants", restaurantRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/owner", ownerRouter);
app.use("/api/admin", adminRouter);

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
});

if (process.env.VERCEL !== "1") {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

export default app;