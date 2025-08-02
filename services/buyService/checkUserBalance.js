import User from "../../models/User.js";

export const checkUserBalance = async ( userId, price) => {
  const user = await User.findOne({ telegramId: userId });
  if (!user) {
    return false;
  }
  if (user.balance < price) return false;
  return true;
};
