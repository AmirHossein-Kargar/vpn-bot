# 🔍 TRX Wallet Scanner - ویژگی‌های جدید

## 📋 خلاصه ویژگی‌ها

اسکنر ولت TRX بهینه‌سازی شده و حالا شامل قابلیت‌های زیر است:

### 1. 💰 نمایش موجودی ولت

- نمایش موجودی TRX فعلی
- محاسبه ارزش دلاری موجودی
- محاسبه ارزش تومانی موجودی
- نمایش قیمت‌های فعلی TRX و USD

### 2. 🕒 نمایش تراکنش‌های اخیر

- نمایش 10 تراکنش آخر
- نمایش وضعیت هر تراکنش (تایید شده، در انتظار، رد شده)
- محاسبه ارزش دلاری و تومانی هر تراکنش
- نمایش جزئیات کامل تراکنش‌ها

### 3. 🔍 اسکن تایید تراکنش‌ها

- اسکن خودکار تراکنش‌های ورودی
- تطبیق با فاکتورهای pending
- تایید یا رد خودکار فاکتورها
- شارژ خودکار کیف پول کاربران

### 4. 📊 آمار کامل و وضعیت

- آمار کلی فاکتورها
- آمار ماهانه (3 ماه اخیر)
- وضعیت سیستم و اتصالات
- نرخ موفقیت و میانگین مبالغ

## 🚀 نحوه استفاده

### دکمه‌های اصلی

1. **🔄 اسکن مجدد** - اجرای اسکن کامل
2. **💰 موجودی** - نمایش موجودی ولت
3. **📊 آمار کامل** - نمایش آمار تفصیلی
4. **🕒 تراکنش‌های اخیر** - نمایش تراکنش‌های اخیر
5. **🔍 وضعیت اسکن** - نمایش وضعیت سیستم

### کنترل‌های اضافی

- **🟢 شروع خودکار** - فعال‌سازی اسکن خودکار
- **⏹️ توقف خودکار** - غیرفعال‌سازی اسکن خودکار
- **🧪 تغییر حالت تست** - تغییر بین حالت تست و واقعی

## 📁 فایل‌های جدید

### Handlers

- `handlers/admin/handleTrxWalletScan.js` - اسکنر اصلی (بهینه‌سازی شده)
- `handlers/admin/showTrxBalance.js` - نمایش موجودی
- `handlers/admin/showTrxStats.js` - نمایش آمار
- `handlers/admin/showTrxRecent.js` - نمایش تراکنش‌های اخیر
- `handlers/admin/showTrxScanStatus.js` - نمایش وضعیت سیستم

### Services

- `services/trxWalletScanner.js` - سرویس اسکنر (بهینه‌سازی شده)

## 🔧 ویژگی‌های فنی

### API Integration

- **TronScan API** - دریافت تراکنش‌ها و موجودی
- **CoinMarketCap API** - دریافت قیمت TRX
- **Tetherland API** - دریافت نرخ USD

### Database Operations

- شمارش فاکتورها بر اساس وضعیت
- محاسبه آمار ماهانه
- ردیابی تراکنش‌های تایید شده
- محاسبه نرخ موفقیت

### Real-time Monitoring

- وضعیت اتصال دیتابیس
- وضعیت اسکن خودکار
- تعداد اسکن‌های انجام شده
- زمان آخرین اسکن

## 📊 ساختار داده

### Summary Object

```javascript
{
  totalTransactions: number,
  processedTransactions: number,
  matchedInvoices: number,
  confirmedInvoices: number,
  rejectedInvoices: number,
  pendingMatches: number,
  matchedInvoiceDetails: Array,
  recentTransactions: Array,
  totalBalance: number
}
```

### Database Stats

```javascript
{
  totalInvoices: number,
  paidInvoices: number,
  pendingInvoices: number,
  rejectedInvoices: number,
  totalPaidAmount: number,
  totalPaidTrx: number,
  monthlyStats: Array,
  recentInvoices: Array,
  activeUsers: number,
  averageInvoiceAmount: number,
  successRate: number
}
```

## 🎯 مزایای جدید

1. **نظارت کامل** - امکان مشاهده تمام جنبه‌های سیستم
2. **کنترل بهتر** - مدیریت اسکن خودکار و حالت تست
3. **آمار دقیق** - گزارش‌گیری کامل از عملکرد سیستم
4. **رابط کاربری بهتر** - دکمه‌های متعدد برای دسترسی آسان
5. **مانیتورینگ واقعی** - نمایش وضعیت لحظه‌ای سیستم

## 🔄 نحوه به‌روزرسانی

برای استفاده از ویژگی‌های جدید، کافی است callback handler های جدید را به سیستم اضافه کنید:

```javascript
// در فایل اصلی callback handler
case "admin_trx_balance":
  await showTrxBalance(bot, query, session);
  break;
case "admin_trx_stats":
  await showTrxStats(bot, query, session);
  break;
case "admin_trx_recent":
  await showTrxRecent(bot, query, session);
  break;
case "admin_trx_scan_status":
  await showTrxScanStatus(bot, query, session);
  break;
```

## ⚠️ نکات مهم

1. **API Keys** - اطمینان از تنظیم `CMC_API_KEY` برای دریافت قیمت TRX
2. **Database Connection** - بررسی اتصال دیتابیس قبل از اجرای عملیات
3. **Rate Limiting** - رعایت محدودیت‌های API های خارجی
4. **Error Handling** - مدیریت خطاها و نمایش پیام‌های مناسب

## 🎉 نتیجه

با این بهینه‌سازی، اسکنر ولت TRX حالا یک ابزار کامل و حرفه‌ای برای مدیریت و نظارت بر سیستم پرداخت است که امکان کنترل کامل بر تمام جنبه‌های عملیات را فراهم می‌کند.
