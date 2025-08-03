import User from "../models/User.js";
import { findService, deleteService } from "../api/wizardApi.js";

// Function to check and clean expired services
const cleanExpiredServices = async (bot) => {
  try {
    console.log("🕐 Starting daily expired service cleanup...");

    // Get all users with services
    const users = await User.find({
      services: { $exists: true, $ne: [] },
    });

    console.log(`📊 Found ${users.length} users with services to check`);

    for (const user of users) {
      try {
        // Check each service for the user
        for (const service of user.services) {
          const username = service.username;

          try {
            // Get service details from API
            const apiResponse = await findService(username);

            if (
              apiResponse &&
              apiResponse.result &&
              apiResponse.result.latest_info
            ) {
              const latest = apiResponse.result.latest_info;
              const expirationTime = latest.expiration_time;
              const currentTime = Math.floor(Date.now() / 1000); // Current timestamp in seconds

              // If service is expired (expiration_time < current_time)
              if (expirationTime && expirationTime < currentTime) {
                console.log(
                  `🗑️ Service ${username} for user ${
                    user.telegramId
                  } is expired (expired at: ${new Date(
                    expirationTime * 1000
                  ).toLocaleString("fa-IR")})`
                );

                // Delete from API
                const deleteResult = await deleteService(username);

                if (deleteResult && deleteResult.result) {
                  console.log(
                    `✅ Service ${username} deleted from API successfully`
                  );

                  // Remove from user's services array
                  user.services = user.services.filter(
                    (s) => s.username !== username
                  );

                  // Decrement totalServices but never go below 0
                  user.totalServices = Math.max(
                    0,
                    (user.totalServices || 0) - 1
                  );

                  await user.save();
                  console.log(
                    `✅ Service ${username} removed from database for user ${user.telegramId}`
                  );

                  // Send notification to user
                  try {
                    await bot.sendMessage(
                      user.telegramId,
                      `❌ سرویس شما منقضی شده و حذف شد!\n\n🔗 کد سرویس: <code>${username}</code>\n📅 تاریخ انقضا: ${
                        latest.expire_date || "نامشخص"
                      }\n\n💡 برای خرید سرویس جدید، از منوی اصلی استفاده کنید.`,
                      {
                        parse_mode: "HTML",
                        reply_markup: {
                          keyboard: [
                            ["🛒 خرید سرویس"],
                            ["💰 افزایش موجودی"],
                            ["👤 پروفایل من"],
                          ],
                          resize_keyboard: true,
                        },
                      }
                    );
                    console.log(
                      `📱 Notification sent to user ${user.telegramId} about expired service ${username}`
                    );
                  } catch (notificationError) {
                    console.error(
                      `❌ Failed to send notification to user ${user.telegramId}:`,
                      notificationError.message
                    );
                  }
                } else {
                  console.log(
                    `❌ Failed to delete service ${username} from API:`,
                    deleteResult
                  );
                }
              } else {
                // Log remaining time for debugging
                if (expirationTime) {
                  const remainingTime = expirationTime - currentTime;
                  const remainingDays = Math.ceil(
                    remainingTime / (24 * 60 * 60)
                  );
                  console.log(
                    `⏰ Service ${username} for user ${user.telegramId} has ${remainingDays} days remaining`
                  );
                }
              }
            } else {
              console.log(`⚠️ Could not get service info for ${username}`);
            }
          } catch (serviceError) {
            console.error(
              `❌ Error checking service ${username}:`,
              serviceError.message
            );
          }
        }
      } catch (userError) {
        console.error(
          `❌ Error processing user ${user.telegramId}:`,
          userError.message
        );
      }
    }

    console.log("✅ Daily expired service cleanup completed");
  } catch (error) {
    console.error("❌ Error in cleanExpiredServices:", error);
  }
};

// Function to start the cron job (run daily at 2 AM)
const startExpiredServiceCleaner = (bot) => {
  console.log("🕐 Starting expired service cleaner cron job...");

  // Run immediately on startup
  cleanExpiredServices(bot);

  // Then run daily at 2 AM
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      cleanExpiredServices(bot);
    }
  }, 60 * 1000); // Check every minute

  console.log("✅ Expired service cleaner cron job started");
};

export { cleanExpiredServices, startExpiredServiceCleaner };
