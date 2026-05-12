# Plan: Smart Renewal System for VNPay (One-Click Renew)

VNPay không hỗ trợ recurring payments, nên sẽ làm **client-side detection + one-click renew**.

## Tổng quan

Khi plan sắp hết hạn hoặc đã hết hạn → hiện banner nhắc nhở + nút "Gia hạn ngay" → bấm 1 click → tạo VNPay order với cùng plan + billing cycle → redirect thanh toán.

## Chi tiết thay đổi

### 1. Backend: Thêm renewal info vào auth/me response

**File: `app/api/auth/me/route.js`** (sửa GET + PUT)
- Thêm fields vào response:
  - `planExpiresAt` (đã có)
  - `daysUntilExpiry`: số ngày còn lại (-1 nếu free, null nếu không có expiry)
  - `renewalInfo`: object chứa `{ plan, billingCycle, amount }` lấy từ payment gần nhất (completed) để pre-fill renew

**File: `app/api/auth/me/route.js`** - logic:
```
// Tìm payment gần nhất đã completed cho user
const lastPayment = await db.collection('payments')
  .findOne({ user: user._id, status: 'completed' }, { sort: { createdAt: -1 } });

// Tính daysUntilExpiry
let daysUntilExpiry = null;
if (user.planExpiresAt) {
  daysUntilExpiry = Math.ceil((new Date(user.planExpiresAt) - new Date()) / (1000*60*60*24));
}

// Thêm vào response
renewalInfo: lastPayment ? {
  plan: lastPayment.plan,
  billingCycle: lastPayment.billingPeriod,
  amount: lastPayment.amount,
} : null
```

### 2. Backend: VNPay IPN cộng dồn expiry cho renewal

**File: `app/api/payments/vnpay/ipn/route.js`** (sửa phần tính expiresAt)
- Hiện tại luôn tính từ `new Date()` → nếu user gia hạn trước khi hết hạn thì mất ngày còn lại
- Fix: nếu user đang có plan active và planExpiresAt > now → cộng thêm từ planExpiresAt thay vì từ now

```
const user = await User.findById(payment.user);
const now = new Date();
// Nếu plan chưa hết hạn, cộng dồn từ ngày hết hạn cũ
const baseDate = (user.planExpiresAt && user.planExpiresAt > now)
  ? new Date(user.planExpiresAt)
  : now;
```

### 3. Frontend: RenewalBanner component

**File mới: `components/renewal/RenewalBanner.jsx`**
- Hiện khi `daysUntilExpiry` <= 7 (sắp hết) hoặc <= 0 (đã hết)
- 3 trạng thái:
  - **Sắp hết** (1-7 ngày): banner vàng "Gói [Plan] sẽ hết hạn trong X ngày"
  - **Hết hạn hôm nay** (0 ngày): banner cam "Gói [Plan] hết hạn hôm nay!"
  - **Đã hết** (<0 ngày): banner đỏ "Gói [Plan] đã hết hạn. Bạn đang dùng gói Miễn phí."
- Nút "Gia hạn ngay" → redirect `/payment?plan={plan}&cycle={cycle}` (pre-fill từ renewalInfo)
- Nút "X" để đóng tạm (lưu vào sessionStorage, chỉ ẩn trong session hiện tại)
- Dùng lucide icons (Clock, AlertTriangle, CreditCard)

### 4. Frontend: Hiển thị RenewalBanner

**File: `components/layout/Sidebar.jsx`** (sửa)
- Import và render `RenewalBanner` phía trên credits display
- Chỉ hiện khi user có paid plan (không hiện cho free)

### 5. Frontend: useAuthStore thêm renewal helpers

**File: `store/useAuthStore.js`** (sửa)
- Thêm helper getters:
  - `getDaysUntilExpiry()`: trả về daysUntilExpiry từ user data
  - `getRenewalInfo()`: trả về renewalInfo cho one-click renew
  - `isExpiringSoon()`: true nếu <= 7 ngày
  - `isExpired()`: true nếu <= 0 ngày

### 6. Sidebar: Hiện expiry date cho paid users

**File: `components/layout/Sidebar.jsx`** (sửa credits section)
- Thêm dòng "Hết hạn: DD/MM/YYYY" dưới credits bar cho paid users

## Files cần thay đổi

| File | Thay đổi |
|------|----------|
| `app/api/auth/me/route.js` | Thêm daysUntilExpiry, renewalInfo vào response |
| `app/api/payments/vnpay/ipn/route.js` | Cộng dồn expiry cho early renewal |
| `store/useAuthStore.js` | Thêm renewal helper getters |
| `components/layout/Sidebar.jsx` | Render RenewalBanner + expiry date |
| **`components/renewal/RenewalBanner.jsx`** | **File mới** - renewal notification banner |

## Không cần thay đổi
- Payment page: đã hỗ trợ `?plan=&cycle=` params → one-click renew tự hoạt động
- VNPay create route: không đổi
- api.js: `createVNPayOrder` đã có sẵn
- Pricing page: không đổi
- Không cần email/cron - tất cả client-side detection
