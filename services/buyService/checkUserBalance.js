import User from "../../models/User.js";

export const checkUserBalance = async (userId, price) => {
    const user = await User.findOne({ telegramId: userId });
    if(!user) throw new Error("User not found");
    if(user.balance < price) return false
    return true
}