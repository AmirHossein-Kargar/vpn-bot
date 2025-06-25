module.exports = function validateWithCommas(text, min = 50000, max = 500000) {
  const commaPattern = /^\d{1,3}(,\d{3})$/;

  if (!commaPattern.test(text)) {
    return {
      valid: false,
      message: "❌ لطفاً مبلغ را با کاما وارد کنید. مثال: 50,000 یا 120,000",
    };
  }

  const amount = parseInt(text.replace(/,/g, ""));

  if (isNaN(amount) || amount < min || amount > max) {
    return {
      valid: false,
      message: `❌ مبلغ باید بین ${min.toLocaleString()} تا ${max.toLocaleString()} تومان باشد.`,
    };
  }

  return { valid: true, amount };
};
