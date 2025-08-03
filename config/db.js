// * This module sets up a connection to MongoDB using Mongoose.
// * It exports an async function that connects to the database and handles errors.
import mongoose from "mongoose";

const mongoURI = process.env.MONGO_URL;

async function connectDB() {
  try {
    await mongoose.connect(mongoURI);
    console.log('\x1b[32m%s\x1b[0m', '✔ MongoDB connected successfully');
  } catch (err) {
    console.error('\x1b[41m\x1b[37m❌ MongoDB connection error:\x1b[0m', err);
    process.exit(1);
  }
}

export default connectDB;