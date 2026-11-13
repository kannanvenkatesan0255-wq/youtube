# VidTube — Full-Stack Video Sharing & Streaming Platform

<div align="center">
  <img src="client/public/vidtube-logo.svg" alt="VidTube Logo" width="120" />
  <h3>A Production-Oriented YouTube Replica Built with Modern Full-Stack Technologies</h3>
  <p>Phase 3 Active: Video Upload, Storage, Creator Studio Management & YouTube UI</p>

  [![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
  [![Cloudinary](https://img.shields.io/badge/Cloudinary-Signed%20Direct%20Storage-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
  [![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20bcrypt-000000?logo=json-web-tokens&logoColor=white)](https://jwt.io/)
</div>

---

## 📌 Project Overview

**VidTube** is a professional, full-scale video sharing and streaming web platform designed as an internship capstone project. The project meticulously reproduces the familiar user interface, design patterns, and engineering quality of **YouTube**.

### Phase Status:
- **Phase 1: Architecture & UI Shell** — ✅ COMPLETED (`d342b80`)
- **Phase 2: Authentication & Security Engine** — ✅ COMPLETED (`05c768f`)
- **Phase 3: Video Upload, Storage & Management Engine** — ✅ COMPLETED
- **Phases 4–10** — Scheduled per [PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md)

---

## 📹 Phase 3 — Video Upload, Storage & Management Engine

Phase 3 implements a complete, end-to-end video ingestion and studio management pipeline:

### 1. Direct-to-Cloud Signed Upload Architecture
- **Zero-Bottleneck Architecture:** Instead of routing multi-hundred megabyte video files through the Node.js API server (which exhausts server memory and blocks event loops), clients request a secure, cryptographically signed upload signature from `POST /api/videos/upload-signature` using Cloudinary API Secret.
- **Client Direct Streaming:** The browser uploads the binary payload directly to Cloudinary's high-speed CDN ingestion nodes with real-time percentage progress and Axios `AbortController` cancellation support.
- **Metadata Registration & Completion Confirmation:**
  1. `POST /api/videos`: Creates initial video draft in database (`processingStatus: 'uploading'`).
  2. Browser streams file to Cloudinary.
  3. `POST /api/videos/:id/complete`: Confirms upload, stores asset URL, dimensions, duration, format, publicId, and advances status to `ready`.
  4. Automatically increments the creator's Channel `videosCount`.

### 2. Visibility & Privacy Access Control
- **Public:** Fully searchable, appears in `/api/videos` feeds, homepage grid, and accessible to everyone.
- **Unlisted:** Excluded from public search feeds and discovery, but accessible directly via URL (`/watch/:id` / `GET /api/videos/:id`) to anyone with the link.
- **Private:** Strictly restricted. Returns `HTTP 403 Forbidden` if accessed by unauthenticated guests or any user other than the owner / admin.

### 3. Creator Studio & Video Management
- **Creator Dashboard (`/studio/videos` & `/my-videos`):** View all uploaded videos (public, unlisted, private), complete with status badges, view counters, duration, timestamps, and search/filter.
- **Inline Video Edit Modal:** Update title, description, category, tags, and visibility in real time.
- **Thumbnail Management:** Update video thumbnail with custom image URLs or direct uploads.
- **Safe Video Deletion (`DELETE /api/videos/:id`):** Enforces ownership check, automatically purges the video asset from Cloudinary storage, removes the MongoDB document, and decrements the creator's channel `videosCount`.

---

## 📡 API Specification — Video Management (`/api/videos`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/videos/upload-signature` | Generate signed params for direct Cloudinary upload | **Yes** |
| `POST` | `/api/videos` | Create new video draft metadata record | **Yes** |
| `POST` | `/api/videos/:id/complete` | Confirm successful Cloudinary upload & finalize metadata | **Yes (Owner)** |
| `GET` | `/api/videos` | Query public videos with search, category filter, and pagination | No |
| `GET` | `/api/videos/my-videos` | Fetch authenticated creator's videos (all visibilities) | **Yes** |
| `GET` | `/api/videos/:id` | Fetch single video details (enforces private authorization) | Optional |
| `PATCH` | `/api/videos/:id` | Update video details (title, description, category, tags) | **Yes (Owner)** |
| `PATCH` | `/api/videos/:id/thumbnail` | Update custom video thumbnail | **Yes (Owner)** |
| `PATCH` | `/api/videos/:id/visibility` | Update video visibility (public / unlisted / private) | **Yes (Owner)** |
| `DELETE` | `/api/videos/:id` | Delete video and purge Cloudinary assets | **Yes (Owner)** |

---

## 🎨 Frontend Video Pages & Components

- **Video Upload Page (`/upload`):**
  - Drag-and-drop file dropzone with native file browser fallback.
  - Client-side video preview via `URL.createObjectURL` where supported.
  - Thumbnail URL input / preview.
  - Video title (with char count), description, category dropdown, tags input chips.
  - Radio selector for visibility (`Public`, `Unlisted`, `Private`).
  - Real-time animated progress bar with percentage readout.
  - Cancel upload button (`AbortController`).
  - Upload success celebration card with instant link to Creator Studio.
- **Creator Studio Videos Dashboard (`/studio/videos` / `/my-videos`):**
  - Video management table with thumbnail, title, description, date, visibility badges, and view counts.
  - Live search filter and visibility dropdown filter.
  - Edit details dialog modal.
  - Delete confirmation dialog.
- **Homepage (`/`):**
  - Fetches real public videos from backend `GET /api/videos`.
  - Gracefully falls back to sample showcase videos if database has zero videos, maintaining rich visual shell at all times.
- **Header "+ Create" Button:**
  - Authenticated creators navigate straight to `/upload`.
  - Unauthenticated guests navigate to `/login`.
  - Dropdown menu features direct link to "VidTube Studio" (`/studio/videos`).

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

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Upload Limits
MAX_VIDEO_SIZE_MB=500
MAX_THUMBNAIL_SIZE_MB=10

# Optional: SMTP Email Service for Real Password Reset Delivery
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
SMTP_FROM=VidTube Security <noreply@vidtube.com>
```

> **Cloudinary Development Graceful Fallback:** If Cloudinary credentials are not yet populated in `server/.env`, backend endpoints return an informative response and video metadata operations continue without unhandled exceptions.

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

VidTube maintains automated test suites covering authentication, security, and video management:

```bash
# Run Phase 3 Video Upload & Management test suite (22 tests)
npm run test:video --workspace=server

# Run Phase 2 Authentication & Security test suite (18 tests)
npm run test:auth --workspace=server
```

### Verified Phase 3 Test Cases (22/22 Passing):
1. ✅ Health check endpoint returns healthy and connected database
2. ✅ Unauthenticated request to `POST /api/videos` rejected with HTTP 401
3. ✅ Unauthenticated request to upload signature rejected with HTTP 401
4. ✅ Unauthenticated request to `GET /api/videos/my-videos` rejected with HTTP 401
5. ✅ User A (Alice) registered with auto-created channel
6. ✅ User B (Bob) registered for authorization isolation tests
7. ✅ Authenticated user can request Cloudinary upload signature
8. ✅ Validation: Missing video title rejected with HTTP 400
9. ✅ Validation: Invalid visibility setting rejected with HTTP 400
10. ✅ Validation: Malformed MongoDB ID param rejected with HTTP 400
11. ✅ Alice creates Public Video metadata (`POST /api/videos`)
12. ✅ Alice completes video upload: status set to ready & channel `videosCount` incremented
13. ✅ Alice creates and completes Private Video (visibility: private)
14. ✅ Alice creates and completes Unlisted Video (visibility: unlisted)
15. ✅ Public listing includes public video but strictly excludes private and unlisted videos
16. ✅ Unlisted video accessible directly via link without authentication
17. ✅ Private video rejected with HTTP 403 for other users/guests, allowed for owner
18. ✅ Creator dashboard returns all owner videos (public+unlisted+private) and isolates other users
19. ✅ Non-owner is rejected with HTTP 403 when attempting to update video
20. ✅ Owner can update video metadata details and custom thumbnail
21. ✅ Owner can toggle video visibility (private -> public)
22. ✅ Video deletion enforced: non-owner rejected (403), owner deletes, channel count decrements

---

## 🔗 Official Repository
[https://github.com/kannanvenkatesan0255-wq/youtube.git](https://github.com/kannanvenkatesan0255-wq/youtube.git)
