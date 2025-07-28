const confirmOrder = (plan) => {
  const message = `
🛍 <b>آیا خرید سرویس با این مشخصات را تایید میکنید !؟</b>

📅 <b>زمان: </b> <code>${plan.days} روز</code>
<b>حجم سرویس :</b> <code>${plan.gig} گیگ</code>
🌐 <b>حداکثر اتصال :</b> <code>نامحدود ♾</code>

💸 <b>قیمت نهایی: </b> <code>${plan.price.toLocaleString("en-US")} تومان</code>

‼️ <a href="https://b2n.ir/x100000">خرید شما به معنای تایید قوانین و مقررات ماست.</a>
  `.trim();

  const replyMarkup = {
    inline_keyboard: [
      [{ text: "✅ تایید سفارش", callback_data: `confirm_order_${plan.id}` }],
      [{ text: "🔙 بازگشت", callback_data: "buy_service_back" }],
    ],
  };
  return { message, replyMarkup };
};

export default confirmOrder;
