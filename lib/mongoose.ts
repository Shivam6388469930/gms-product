// lib/mongoose.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.Database_Url || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gms_research_pltform";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    // Already connected
    return mongoose;
  }
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
    return mongoose;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}

export default mongoose;
