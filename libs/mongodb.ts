import mongoose from "mongoose";

const MONGODB_URI:any = process.env.MONGODB_URI;

console.log("MongoDB URL:", MONGODB_URI ? "FOUND" : "NOT FOUND");

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

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

export async function connectDB() {
  try {
    // Already connected
    if (cached.conn) {
      console.log("✅ MongoDB: Already connected");
      return cached.conn;
    }

    // Connection is already being established
    if (!cached.promise) {
      console.log("🔄 MongoDB: Connecting to database...");

      cached.promise = mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
      });
    }

    // Wait for connection
    cached.conn = await cached.promise;

    console.log("✅ MongoDB: Connection established successfully");
    console.log("📦 Database:", mongoose.connection.name);
    console.log("🌐 Host:", mongoose.connection.host);

    return cached.conn;
  } catch (error) {
    console.error("❌ MongoDB: Connection rejected/failed");
    console.error(error);

    // Reset promise so the next request can retry
    cached.promise = null;
    cached.conn = null;

    // IMPORTANT: don't swallow the error
    throw error;
  }
}