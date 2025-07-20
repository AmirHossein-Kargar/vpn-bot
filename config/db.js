// * This module sets up a connection to MongoDB using Mongoose.
// * It exports an async function that connects to the database and handles errors.
import mongoose from "mongoose";

const mongoURI = process.env.MONGO_URL;

async function connectDB() {
  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

export default connectDB;