# VidTube — Full-Stack Video Sharing & Streaming Platform

<div align="center">
  <img src="client/public/vidtube-logo.svg" alt="VidTube Logo" width="120" />
  <h3>A Production-Oriented YouTube Replica Built with Modern Full-Stack Technologies</h3>
  <p>Phase 2 Active: Robust Authentication, Security Engine, JWT HttpOnly Cookies, Password Recovery & YouTube UI</p>

  [![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
  [![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20bcrypt-000000?logo=json-web-tokens&logoColor=white)](https://jwt.io/)
</div>

---

## 📌 Project Overview

**VidTube** is a professional, full-scale video sharing and streaming web platform designed as an internship capstone project. The project meticulously reproduces the familiar user interface, design patterns, and engineering quality of **YouTube**.

### Phase Status:
- **Phase 1: Architecture & UI Shell** — ✅ COMPLETED
- **Phase 2: Authentication & Security Engine** — ✅ COMPLETED
- **Phases 3–10** — Scheduled per [PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md)

---

## 🔐 Phase 2 — Authentication & Security Architecture

Phase 2 introduces a production-ready authentication and account security engine:

### 1. Token Strategy & Session Management
- **Short-Lived Access Tokens (15 min):** Signed with HMAC SHA-256 (`JWT_SECRET`), contains `{ id, role, email, username }`.
- **Long-Lived Refresh Tokens (7 days):** Stored in MongoDB and signed with `JWT_REFRESH_SECRET`. Allows seamless token rotation without forcing user logouts.
- **HttpOnly Cookies:** Delivered with `HttpOnly`, `SameSite: 'lax'`, and `Secure: true` in production to mitigate Cross-Site Scripting (XSS) risks.
- **Authorization Header Support:** Also supports `Bearer <accessToken>` for external or programmatic API access.

### 2. Automatic Channel Provisioning
- Upon user registration, a default creator **Channel** is automatically provisioned and linked to the account:
  - Channel name: user's display name
  - Channel handle: unique `@username`
  - Channel owner: user's ObjectId
  - Avatar: synchronized with the user profile picture

### 3. Password Recovery Engine
- **Cryptographically Secure Tokens:** 32-byte crypto random tokens, hashed with SHA-256 for database storage.
- **Single-Use Enforcement:** Tokens expire after 15 minutes and are automatically invalidated upon successful password change.
- **Anti-Enumeration Security:** The forgot-password endpoint always returns a generic success message, preventing malicious attackers from guessing registered user email addresses.
- **SMTP & Development Fallback:** Full SMTP delivery support via Nodemailer, with an automatic development mode that outputs reset links to server logs when SMTP credentials are not yet configured.

### 4. Security Hardening
- **Rate Limiting (`express-rate-limit`):**
  - Registration: 10 accounts / hour per IP
  - Login: 10 attempts / 15 minutes per IP
  - Password Reset: 5 requests / hour per IP
  - Auth General: 100 requests / 15 minutes per IP
- **Helmet Headers:** Secure HTTP headers configured.
- **CORS Credentials:** Whitelist verification with `credentials: true`.
- **Mass Assignment Protection:** Regular profile updates cannot alter `role`, `accountStatus`, or `isVerified`.
- **Safe Serialization:** Sensitive fields (`passwordHash`, `refreshToken`, `passwordResetToken`, `passwordResetExpires`) are automatically stripped from JSON responses via Mongoose `toJSON` transforms.

---

## 📡 API Specification — Authentication & Users

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required | Rate Limit |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register user & auto-create default channel | No | 10 / hour |
| `POST` | `/api/auth/login` | Authenticate with email/username + password | No | 10 / 15 min |
| `POST` | `/api/auth/logout` | Invalidate session & clear cookies | No / Yes | Standard |
| `GET` | `/api/auth/me` | Fetch currently authenticated user session | **Yes** | Standard |
| `POST` | `/api/auth/refresh` | Rotate access token via refresh token | No (Cookie) | 100 / 15 min |
| `POST` | `/api/auth/forgot-password` | Request password reset email | No | 5 / hour |
| `POST` | `/api/auth/reset-password` | Set new password with valid token | No | 5 / hour |

### User Account Endpoints (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/profile` | Get current user profile and linked channel | **Yes** |
| `PATCH` | `/api/users/profile` | Update permitted profile fields (`name`, `username`) | **Yes** |
| `POST` | `/api/users/change-password` | Change password (verifies current password) | **Yes** |
| `PATCH` | `/api/users/avatar` | Update user and channel avatar URL | **Yes** |

---

## 🎨 Frontend Authentication Pages & Architecture

All authentication flows are styled strictly to reproduce the YouTube/Google account visual identity:

- **Sign In (`/login`):** Centered card, email/username input, show/hide password toggle, remember me checkbox, forgot password link, inline validation, and redirect after sign-in.
- **Sign Up (`/register`):** Full name, username, email, password, confirm password, interactive `PasswordStrength` checklist meter, terms acceptance, auto-channel preview.
- **Forgot Password (`/forgot-password`):** Email input with clear anti-enumeration feedback and instructions.
- **Reset Password (`/reset-password/:token`):** Token validation from URL, password strength meter, confirm password, auto-redirect on completion.
- **Account Settings & Profile (`/profile`):** User avatar preview and quick preset avatars, editable display name and handle, password change form, and sign-out button.
- **Header Auth Integration:** Displays user's actual profile avatar when logged in with a YouTube dropdown menu (Your Channel, Settings, Sign Out). When logged out, displays YouTube's blue outlined "Sign In" pill.
- **Route Guards:**
  - `<ProtectedRoute>`: Restricts `/profile` and `/settings` to authenticated users.
  - `<GuestRoute>`: Redirects already logged-in users away from `/login`, `/register`, and `/forgot-password`.

---

## 🛠️ Environment Configuration

### Backend (`server/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vidtube
JWT_SECRET=your_secure_access_token_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_secure_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional: Cloudinary Storage (Phase 4)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: SMTP Email Service for Real Password Reset Delivery
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
SMTP_FROM=VidTube Security <noreply@vidtube.com>
```

> **Note on Password Reset without SMTP:** If SMTP credentials are not configured, the password reset endpoint safely outputs the generated reset URL directly to the backend development console.

### Frontend (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## ⚡ Running the Application

### Start Both Services Concurrently:
```bash
npm run dev
```
- **Backend API:** `http://localhost:5000`
- **Frontend App:** `http://localhost:5173`

### Run Services Individually:
```bash
# Start backend only
npm run dev:server

# Start frontend only
npm run dev:client
```

### Production Build:
```bash
npm run build
```

---

## 🧪 Testing & Verification

VidTube Phase 2 includes an automated test suite verifying all 18 requirements:

```bash
# Start backend
npm run dev:server

# In another terminal, run test suite
node server/src/tests/auth.test.js
```

### Verified Test Cases:
1. ✅ User registration with strong password & auto-channel creation
2. ✅ Duplicate email rejection (HTTP 409)
3. ✅ Duplicate username rejection (HTTP 409)
4. ✅ Successful login with username/email & bcrypt comparison
5. ✅ Invalid password rejection (HTTP 401)
6. ✅ Invalid JWT signature rejection (HTTP 401)
7. ✅ Expired JWT token handling (HTTP 401)
8. ✅ Authenticated profile retrieval (`GET /api/auth/me`)
9. ✅ Unauthorized route protection (`GET /api/users/profile`)
10. ✅ Profile updates with channel handle synchronization
11. ✅ Password change with current password verification
12. ✅ Token invalidation on logout
13. ✅ Forgot password request with token generation
14. ✅ Password reset token single-use & reuse prevention (HTTP 400)
15. ✅ Session token refresh (`POST /api/auth/refresh`)
16. ✅ Forged refresh token rejection (HTTP 401)
17. ✅ Database connectivity & Mongoose schema integrity
18. ✅ Health check endpoint (`GET /api/health`)

---

## 🔗 Official Repository
[https://github.com/kannanvenkatesan0255-wq/youtube.git](https://github.com/kannanvenkatesan0255-wq/youtube.git)
