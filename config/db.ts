// config/db.ts

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({
  path: ".env.local",
});

const Database_Url = process.env.Database_Url;

if (!Database_Url) {
  throw new Error("Database_Url is not defined in .env.local");
}

const databaseUrl: string = Database_Url;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || {
  conn: null,
  promise: null,
};

global.mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(databaseUrl, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;

    console.log("MongoDB connected successfully");
  } catch (error) {
    cached.promise = null;

    console.error("MongoDB connection failed:", error);

    throw error;
  }

  return cached.conn;
}