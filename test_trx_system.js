import "dotenv/config";
import { TRXPrice } from "./api/TRXPrice.js";
import { USDPrice } from "./api/USDPrice.js";
import trxScanner from "./services/trxWalletScanner.js";

async function testTRXSystem() {
  console.log("🧪 Testing TRX System...");
  console.log("========================");

  try {
    // Test 1: Check environment variables
    console.log("\n1️⃣ Environment Variables:");
    console.log(`TRX_WALLET: ${process.env.TRX_WALLET || "NOT SET"}`);
    console.log(`CMC_API_KEY: ${process.env.CMC_API_KEY ? "SET" : "NOT SET"}`);

    // Test 2: Test TRX Price API
    console.log("\n2️⃣ TRX Price API:");
    try {
      const trxPrice = await TRXPrice();
      console.log(`TRX Price: $${trxPrice || "FAILED"}`);
    } catch (error) {
      console.log(`TRX Price Error: ${error.message}`);
    }

    // Test 3: Test USD Price API
    console.log("\n3️⃣ USD Price API:");
    try {
      const usdPrice = await USDPrice();
      console.log(`USD Price: ${usdPrice || "FAILED"} تومان`);
    } catch (error) {
      console.log(`USD Price Error: ${error.message}`);
    }

    // Test 4: Test Wallet Balance
    console.log("\n4️⃣ Wallet Balance:");
    try {
      const balance = await trxScanner.fetchWalletBalance();
      console.log(`Wallet Balance: ${balance} TRX`);
    } catch (error) {
      console.log(`Wallet Balance Error: ${error.message}`);
    }

    // Test 5: Test Transactions
    console.log("\n5️⃣ Transactions:");
    try {
      const transactions = await trxScanner.fetchTransactions();
      console.log(`Found ${transactions.length} transactions`);
    } catch (error) {
      console.log(`Transactions Error: ${error.message}`);
    }

    console.log("\n✅ Test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testTRXSystem();
