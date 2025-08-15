import "dotenv/config";
import connectDB from "./config/db.js";
import trxScanner from "./services/trxWalletScanner.js";

async function quickTest() {
  try {
    console.log("🚀 Quick TRX Scanner Test");
    console.log("==========================");

    // اتصال به دیتابیس
    console.log("🔌 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected successfully");

    // فعال‌سازی حالت تست
    trxScanner.enableTestMode();

    // اجرای اسکن
    await trxScanner.scanWallet();

    // نمایش نتایج
    await trxScanner.showTestResults();

    console.log("\n✅ Quick test completed!");
  } catch (error) {
    console.error("❌ Quick test failed:", error.message);
  } finally {
    // بستن اتصال دیتابیس
    try {
      await mongoose.connection.close();
      console.log("🔌 Database connection closed");
    } catch (closeError) {
      console.log("⚠️ Error closing database connection:", closeError.message);
    }
    process.exit(0);
  }
}

quickTest();
