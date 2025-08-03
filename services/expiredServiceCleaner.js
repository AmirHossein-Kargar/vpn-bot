import User from "../models/User.js";
import { findService } from "../api/wizardApi.js";

// Function to check and notify about expired/limited services
const checkExpiredServices = async (bot) => {
  try {
    console.log("🕐 Starting expired/limited service check...");

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
              const online = apiResponse.result.online_info || {};
              const expirationTime = latest.expiration_time;
              const currentTime = Math.floor(Date.now() / 1000); // Current timestamp in seconds

              // Check if service is expired by time OR limited by data usage
              const isExpiredByTime =
                expirationTime && expirationTime < currentTime;
              const isLimitedByData = online.status === "limited";

              if (isExpiredByTime || isLimitedByData) {
                console.log(
                  `⚠️ Service ${username} for user ${user.telegramId} is ${
                    isExpiredByTime
                      ? "expired by time"
                      : "limited by data usage"
                  }`
                );

                // Check if we already sent notification for this service
                const expiredNotificationKey = `expiredNotification_${username}`;
                const today = new Date().toDateString();

                if (
                  !user[expiredNotificationKey] ||
                  user[expiredNotificationKey] !== today
                ) {
                  // Determine the reason and message
                  let reason = "";
                  if (isExpiredByTime && isLimitedByData) {
                    reason = "منقضی شده و حجم آن تمام شده است";
                  } else if (isExpiredByTime) {
                    reason = "منقضی شده است";
                  } else if (isLimitedByData) {
                    reason = "حجم آن تمام شده است";
                  }

                  // Send notification to user about expired/limited service
                  try {
                    await bot.sendMessage(
                      user.telegramId,
                      `⚠️ سرویس شما ${reason}!\n\n🔗 کد سرویس: <code>${username}</code>\n📅 تاریخ انقضا: ${
                        latest.expire_date || "نامشخص"
                      }\n📦 حجم سرویس: <code>${
                        latest.gig || "نامشخص"
                      } گیگابایت</code>\n📥 حجم مصرفی: <code>${
                        online.usage_converted || 0
                      }</code>\n\n💡 برای تمدید سرویس، از منوی مدیریت سرویس‌ها استفاده کنید.`,
                      {
                        parse_mode: "HTML",
                        reply_markup: {
                          keyboard: [
                            ["🛒 خرید سرویس"],
                            ["📱 مدیریت سرویس‌ها"],
                            ["💰 افزایش موجودی"],
                            ["👤 پروفایل من"],
                          ],
                          resize_keyboard: true,
                        },
                      }
                    );

                    // Mark that we sent notification today for this service
                    user[expiredNotificationKey] = today;
                    await user.save();

                    console.log(
                      `📱 Notification sent to user ${user.telegramId} about ${reason} service ${username}`
                    );
                  } catch (notificationError) {
                    console.error(
                      `❌ Failed to send notification to user ${user.telegramId}:`,
                      notificationError.message
                    );
                  }
                } else {
                  console.log(
                    `📱 Already sent notification today for expired/limited service ${username} to user ${user.telegramId}`
                  );
                }
              } else {
                // Log remaining time and data for debugging
                if (expirationTime) {
                  const remainingTime = expirationTime - currentTime;
                  const remainingDays = Math.ceil(
                    remainingTime / (24 * 60 * 60)
                  );

                  console.log(
                    `⏰ Service ${username} for user ${
                      user.telegramId
                    } has ${remainingDays} days remaining, usage: ${
                      online.usage_converted || 0
                    }`
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

    console.log("✅ Expired/limited service check completed");
  } catch (error) {
    console.error("❌ Error in checkExpiredServices:", error);
  }
};

// Function to start the cron job (run daily at 2 AM)
const startExpiredServiceChecker = (bot) => {
  console.log("🕐 Starting expired/limited service checker cron job...");

  // Don't run immediately on startup, only at scheduled times
  // checkExpiredServices(bot);

  // Run daily at 2 AM
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 2 && now.getMinutes() === 0) {
      console.log("🕐 2 AM - Running scheduled expired service check...");
      checkExpiredServices(bot);
    }
  }, 60 * 1000); // Check every minute

  console.log(
    "✅ Expired/limited service checker cron job started (runs daily at 2 AM)"
  );
};

export { checkExpiredServices, startExpiredServiceChecker };
