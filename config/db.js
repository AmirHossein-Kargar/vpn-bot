// * Mongoose library to connect to MongoDB
const mongoose = require("mongoose");

// * Get the MongoDB connection URL from environment variables
const mongoURI = process.env.mongo_URL;

// * Asynchronously connects to MongoDB using Mongoose.
// * if the connection is successful, it logs a success meessage.
// * if the connection fails, it logs the error and stops the process
async function connectDB() {
  try {
    await mongoose.connect(mongoURI); // * Attempt to connect to the database
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err); // * Log the connection error
    process.exit(1); // * Exit the app with a failure code
  }
}

module.exports = connectDB;
