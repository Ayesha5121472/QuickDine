import mongoose from "mongoose";

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }

    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }

        await mongoose.connect(uri);
        console.log("MongoDB Connected successfully");
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        throw error;
    }
};

export default connectDB;