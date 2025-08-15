import "dotenv/config";
import trxScanner from "./services/trxWalletScanner.js";

async function testTRXScanner() {
  try {
    console.log("🧪 TRX Wallet Scanner Test Suite");
    console.log("=================================");

    // تست 1: اسکن دستی با حالت تست
    console.log("\n1️⃣ Testing manual scan with test mode...");
    await trxScanner.runFullTest();

    console.log("\n⏳ Waiting 3 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // تست 2: اسکن دستی عادی
    console.log("\n2️⃣ Testing manual scan without test mode...");
    await trxScanner.manualScan();

    console.log("\n⏳ Waiting 3 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // تست 3: تست کامل سیستم
    console.log("\n3️⃣ Running comprehensive system test...");
    await trxScanner.runFullTest();

    console.log("\n✅ All tests completed successfully");
  } catch (error) {
    console.error("❌ Test suite failed:", error.message);
  } finally {
    // توقف اسکن و خروج
    console.log("\n🛑 Stopping scanner and exiting...");
    trxScanner.stopAutoScan();
    process.exit(0);
  }
}

// اجرای تست
testTRXScanner();
