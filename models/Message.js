import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chatId: String,
  userId: Number,
  userName: String,
  messages: [
    {
      text: String,
    },
  ],
  date: { type: Date, default: Date.now },
});

messageSchema.index({ date: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model("Message", messageSchema);
