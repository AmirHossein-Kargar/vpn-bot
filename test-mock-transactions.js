import trxScanner from "./services/trxWalletScanner.js";
import CryptoInvoice from "./models/CryptoInvoice.js";
import User from "./models/User.js";
import connectDB from "./config/db.js";

async function testMockTransactions() {
  try {
    console.log("🚀 Starting Mock Transaction Tests...");

    await connectDB();

    trxScanner.setBotInstance({
      sendMessage: async (userId, message, options) => {
        console.log(`📱 Mock bot message to ${userId}:`);
        console.log(message);
        console.log("Options:", options);
        return { message_id: Date.now() };
      },
      deleteMessage: async (userId, messageId) => {
        console.log(`🗑️ Mock delete message ${messageId} for user ${userId}`);
        return true;
      },
    });

    trxScanner.enableTestMode();

    const pendingInvoices = await CryptoInvoice.find({
      status: "unpaid",
      paymentType: "trx",
    });

    if (pendingInvoices.length === 0) {
      console.log("📭 No pending invoices found. Creating test invoices...");

      const testInvoices = [
        {
          invoiceId: "TEST001",
          userId: 123456789,
          amount: 50000,
          usdAmount: 10,
          cryptoAmount: 3.043114,
          currency: "TRX",
          paymentType: "trx",
          status: "unpaid",
        },
        {
          invoiceId: "TEST002",
          userId: 987654321,
          amount: 100000,
          usdAmount: 20,
          cryptoAmount: 6.086228,
          currency: "TRX",
          paymentType: "trx",
          status: "unpaid",
        },
      ];

      for (const invoiceData of testInvoices) {
        await CryptoInvoice.create(invoiceData);
        console.log(`✅ Created test invoice: ${invoiceData.invoiceId}`);
      }
    }

    console.log("\n🧪 Running Mock Tests...");
    console.log("==========================");

    console.log("\n1️⃣ Testing Transaction Confirmation:");
    const confirmResult = await trxScanner.mockConfirmTransaction(
      123456789,
      "TEST001"
    );
    console.log(`Result: ${confirmResult ? "✅ Success" : "❌ Failed"}`);

    console.log("\n2️⃣ Testing Transaction Rejection:");
    const rejectResult = await trxScanner.mockRejectTransaction(
      987654321,
      "TEST002"
    );
    console.log(`Result: ${rejectResult ? "✅ Success" : "❌ Failed"}`);

    console.log("\n3️⃣ Testing Auto Mock Test:");
    await trxScanner.runAutoMockTest();

    console.log("\n📊 Final Results:");
    console.log("==================");

    const allInvoices = await CryptoInvoice.find({ paymentType: "trx" });
    const paidInvoices = allInvoices.filter((inv) => inv.status === "paid");
    const rejectedInvoices = allInvoices.filter(
      (inv) => inv.status === "rejected"
    );
    const unpaidInvoices = allInvoices.filter((inv) => inv.status === "unpaid");

    console.log(`Total TRX invoices: ${allInvoices.length}`);
    console.log(`Paid: ${paidInvoices.length}`);
    console.log(`Rejected: ${rejectedInvoices.length}`);
    console.log(`Unpaid: ${unpaidInvoices.length}`);

    console.log("\n💰 User Wallet Status:");
    const users = await User.find({});
    users.forEach((user) => {
      console.log(
        `User ${user.telegramId}: ${user.balance} Toman, ${user.successfulPayments} payments`
      );
    });

    console.log("\n✅ Mock Transaction Tests Completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    trxScanner.disableTestMode();
  }
}

// اجرای تست
testMockTransactions()
  .then(() => {
    console.log("🏁 Test execution finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test execution failed:", error);
    process.exit(1);
  });
