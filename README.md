# Smart Water Delivery Backend

A robust, enterprise-grade backend service for managing residential and commercial water delivery operations. Built with TypeScript and Express, it provides high-performance APIs for slot booking, customer management, and automated delivery tracking.

## 🚀 Tech Stack

- **Core:** Node.js, Express.js (v5), TypeScript
- **Database:** MongoDB, Mongoose (ODM)
- **Security:** JWT (Authentication), BcryptJS (Hashing), Helmet (Security Headers), HPP, Express-Rate-Limit
- **Validation:** Zod (Schema-based validation)
- **Documentation:** Swagger UI (OpenAPI 3.0)
- **Email:** Nodemailer (SMTP/SMTPS support)
- **Deployment:** Vercel-ready (Serverless optimized)

## ✨ Features

- **Auth System:** OTP-based login/registration for Users and Admins.
- **Slot Management:** Area-wise scheduling with capacity tracking and booking cutoff timers.
- **Subscription Engine:** Real-time water booking, extra quantity requests, and cancellation logic.
- **Dashboard Stats:** Monthly consumption tracking, average intake, and missed delivery counts.
- **Geography Services:** Integrated Indian pincode and area management.

## ✅ Pros & ❌ Cons

### Pros
- **High Type Safety:** Full TypeScript implementation minimizes runtime errors.
- **Scalability:** Faceted aggregation pipelines for high-performance data retrieval.
- **Modular Design:** Clear separation of Controllers, Services, and Models.
- **Serverless Ready:** Optimized for platforms like Vercel with singleton DB connection patterns.

### Cons
- **Limited Real-time:** Currently relies on polling/REST rather than WebSockets for updates.
- **Regional Focus:** Some features (like pincodes) are currently tailored for the Indian market.

## 🔮 Future Enhancements

- **Real-time Notifications:** WebSocket integration for delivery status updates.
- **Subscription Plans:** Recurring weekly/monthly subscription models.
- **Analytics Pro:** Advanced reporting for admins on area-wise demand forecasting.
- **Mobile App Integration:** Native push notification support (Firebase/Azure).

## 🛠️ Getting Started

1. **Clone the repo:**
   ```bash
   git clone <repo-url>
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment:**
   Update the `.env` file with your `MONGODB_URI` and `JWT_SECRET`.
4. **Run Live:**
   ```bash
   npm run build:live
   ```
5. **Swagger Docs:**
   Visit `http://localhost:<PORT>/public/swagger/` to explore the APIs.

---
*Developed for efficient water resource management.*
