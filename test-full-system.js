import "dotenv/config";
import connectDB from "./config/db.js";
import TelegramBot from "node-telegram-bot-api";
import trxScanner from "./services/trxWalletScanner.js";

async function testFullSystem() {
  try {
    console.log("🧪 Full TRX Payment System Test");
    console.log("=================================");

    // اتصال به دیتابیس
    console.log("🔌 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected successfully");

    // ایجاد bot instance برای تست
    console.log("🤖 Creating bot instance for testing...");
    const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

    // اتصال bot به سرویس اسکن
    trxScanner.setBotInstance(bot);
    console.log("🔗 Bot connected to TRX scanner");

    // فعال‌سازی حالت تست
    trxScanner.enableTestMode();

    // اجرای اسکن کامل
    console.log("\n🚀 Running full system test...");
    await trxScanner.runFullTest();

    console.log("\n✅ Full system test completed!");
  } catch (error) {
    console.error("❌ Full system test failed:", error.message);
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

testFullSystem();
