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
