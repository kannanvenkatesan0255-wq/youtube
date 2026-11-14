# VidTube — Full-Stack Video Sharing & Streaming Platform

<div align="center">
  <img src="client/public/vidtube-logo.svg" alt="VidTube Logo" width="120" />
  <h3>A Production-Oriented YouTube Replica Built with Modern Full-Stack Technologies</h3>
  <p>Phase 4 Active: Custom Video Player, Watch Page, HLS Adaptive Streaming & Progress Engine</p>

  [![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
  [![Cloudinary](https://img.shields.io/badge/Cloudinary-Signed%20Direct%20Storage-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
  [![HLS.js](https://img.shields.io/badge/HLS.js-Adaptive%20Bitrate-FF9900)](https://github.com/video-dev/hls.js)
  [![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20bcrypt-000000?logo=json-web-tokens&logoColor=white)](https://jwt.io/)
</div>

---

## 📌 Project Overview

**VidTube** is a professional, full-scale video sharing and streaming web platform designed as an internship capstone project. The project meticulously reproduces the familiar user interface, design patterns, and engineering quality of **YouTube**.

### Phase Status:
- **Phase 1: Architecture & UI Shell** — ✅ COMPLETED (`d342b80`)
- **Phase 2: Authentication & Security Engine** — ✅ COMPLETED (`05c768f`)
- **Phase 3: Video Upload, Storage & Management Engine** — ✅ COMPLETED (`ed4929a`)
- **Phase 4: Video Player, Watch Page & Adaptive Streaming Engine** — ✅ COMPLETED
- **Phases 5–10** — Scheduled per [PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md)

---

## 🎬 Phase 4 — Video Player, Watch Page & Adaptive Streaming Engine

Phase 4 implements a complete, end-to-end video watching experience modeled precisely on YouTube's watch interface:

### 1. Advanced Custom Video Player (`client/src/components/player/VideoPlayer.jsx`)
- **Adaptive Bitrate Streaming:** Supports HLS (`.m3u8`) manifests dynamically using `Hls.js` on modern browsers and native HLS on Safari / iOS. Automatically detects available quality renditions (1080p, 720p, 480p, 360p).
- **Graceful Multi-Format Fallback:** If an HLS manifest is unavailable or encounters a network error, the player automatically falls back to direct HTML5 MP4 playback without interrupting the viewer.
- **YouTube Custom Control Bar:**
  - Center splash toggle & loading/buffering spinners.
  - Interactive scrub bar with buffered range indicators, ghost hover preview, and smooth draggable seek knob.
  - Play, Pause, Replay, Next Video (Shift+N).
  - Volume control with mute toggle (`m`) and expandable hover slider.
  - Current time and total duration display (`00:00 / 00:00`).
  - Playback Speed Menu (`0.25x`, `0.5x`, `0.75x`, `1x (Normal)`, `1.25x`, `1.5x`, `1.75x`, `2x`).
  - Quality Selector Menu (`Auto` + all detected stream renditions).
  - Picture-in-Picture (`i`) using native HTML5 Video PiP API.
  - Theater Mode (`t`) and Fullscreen Mode (`f`).
  - Auto-hiding control overlay (fades out after 3 seconds of inactivity while playing).
- **Keyboard Shortcuts:**
  - `Space` / `k`: Toggle Play/Pause
  - `ArrowLeft` / `j`: Seek backward 5s / 10s
  - `ArrowRight` / `l`: Seek forward 5s / 10s
  - `ArrowUp` / `ArrowDown`: Volume up/down 10%
  - `m`: Toggle mute
  - `f`: Toggle full screen
  - `t`: Toggle theater mode
  - `0`–`9`: Seek to 0% through 90% of duration
  - Fully input-safe: Shortcuts are automatically suppressed when typing in input/textarea elements.

### 2. Complete Watch Page Layout (`/watch/:videoId`)
- **Responsive YouTube Two-Column Architecture:**
  - Desktop Default: Main video player on the left, related recommendations list on the right.
  - Theater Mode: Top-spanning wide player with video details and recommendations placed beneath.
  - Mobile: Full-width player, details underneath, followed by related videos with touch controls.
- **Channel Header & Action Bar:**
  - Creator avatar, display name, handle, verified badge, and subscriber counter.
  - YouTube-style black/white "Subscribe" button with toggling subscription state.
  - Interactive Like & Dislike pill group with live counts.
  - "Share" button with automatic clipboard link copying and toast feedback.
  - "Save" and More Options menu buttons.
- **Expandable Description Box:**
  - Gray card displaying view count, published timestamp, category chip, and tags.
  - Multi-line description truncated with YouTube-style "Show more" / "Show less" toggle.
- **Related Video Recommendations:**
  - Queries public, ready videos matching the current video's category or tags.
  - Excludes the currently watched video and all private/uploading videos.
  - Displays thumbnail with duration badge, title, channel name, views, and timestamp.

### 3. Server-Side View Tracking & Cooldown Policy
- **Endpoint:** `POST /api/videos/:id/view`
- **Legitimate Qualification:** Requires a minimum of 5 seconds of cumulative watch time (`watchTime >= 5`).
- **30-Second Debounce Cooldown:** Prevents infinite view inflation caused by component re-renders or page refreshes. Tracked via an in-memory cache keyed by `${videoId}:${userId || ip}` with automatic 15-minute cleanup.
- **Atomic Counter Updates:** Atomically increments `video.views` and creator's `channel.totalViews`.

### 4. Playback Progress & Continue Watching Foundation
- **Endpoints:** `POST /api/videos/:id/progress` and `GET /api/videos/:id/progress`
- **Persistence (`WatchHistory` model):** Automatically records `watchedSeconds`, `duration`, `completed` flag (set to true when progress >= 90%), and `lastWatchedAt`.
- **Auto-Resume Integration:** When an authenticated viewer opens a previously watched video, the player automatically resumes from their saved position and displays a subtle notification pill ("Resumed from 02:45").
- **Security Check:** Saving or retrieving progress for another user's private video returns `HTTP 403 Forbidden`.

---

## 📡 API Specification — Video & Playback (`/api/videos`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/videos/:id/playback` | Authorized playback stream info, HLS manifest, and media metadata | Optional (Private checks owner) |
| `POST` | `/api/videos/:id/view` | Record legitimate video view with 30s cooldown debounce | Optional |
| `POST` | `/api/videos/:id/progress` | Save playback watch progress for resume / continue watching | **Yes** |
| `GET` | `/api/videos/:id/progress` | Retrieve saved playback watch progress | **Yes** |
| `GET` | `/api/videos/:id/related` | Related video recommendations (excludes current & private) | No |
| `GET` | `/api/videos` | Query public videos with search, category filter, and pagination | No |
| `GET` | `/api/videos/:id` | Fetch single video details (enforces private authorization) | Optional |
| `POST` | `/api/videos/upload-signature` | Generate signed params for direct Cloudinary upload | **Yes** |
| `POST` | `/api/videos` | Create new video draft metadata record | **Yes** |
| `POST` | `/api/videos/:id/complete` | Confirm successful Cloudinary upload & finalize metadata | **Yes (Owner)** |
| `PATCH` | `/api/videos/:id` | Update video details (title, description, category, tags) | **Yes (Owner)** |
| `PATCH` | `/api/videos/:id/thumbnail` | Update custom video thumbnail | **Yes (Owner)** |
| `PATCH` | `/api/videos/:id/visibility` | Update video visibility (public / unlisted / private) | **Yes (Owner)** |
| `DELETE` | `/api/videos/:id` | Delete video and purge Cloudinary assets | **Yes (Owner)** |

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
```

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

VidTube maintains automated test suites covering all completed phases (64/64 passing tests):

```bash
# Run Phase 4 Video Playback & Streaming test suite (24 tests)
npm run test:playback --workspace=server

# Run Phase 3 Video Upload & Management test suite (22 tests)
npm run test:video --workspace=server

# Run Phase 2 Authentication & Security test suite (18 tests)
npm run test:auth --workspace=server
```

### Verified Phase 4 Test Cases (24/24 Passing):
1. ✅ Health check endpoint returns healthy system and connected database
2. ✅ Public video details retrieved successfully with channel information
3. ✅ Playback endpoint returns authorized streaming details for public video
4. ✅ Playback endpoint includes primary videoUrl and media format
5. ✅ Playback endpoint generates/returns adaptive HLS manifest URL (`.m3u8`)
6. ✅ Playback response includes channel subscribersCount, name, handle, avatar
7. ✅ Malformed video ID parameter rejected with HTTP 400
8. ✅ Non-existent video ID returns HTTP 404 Not Found
9. ✅ Private video playback rejected for unauthenticated guest with HTTP 403
10. ✅ Private video playback rejected for unauthorized user (Bob) with HTTP 403
11. ✅ Private video playback authorized for owner (Alice) with HTTP 200
12. ✅ Unlisted video playback accessible directly via link without authentication
13. ✅ View tracking endpoint increments view count and channel totalViews on qualified view
14. ✅ View tracking debounce: repeated view within cooldown window is not counted
15. ✅ View tracking rejects views with watch-time under 5s threshold
16. ✅ View tracking on private video rejected for unauthorized user with HTTP 403
17. ✅ Unauthenticated request to save playback progress rejected with HTTP 401
18. ✅ Authenticated user saves playback progress (`WatchHistory` upserted with progress seconds)
19. ✅ Playback progress >= 90% automatically sets `completed: true` in `WatchHistory`
20. ✅ Playback progress retrieval returns user saved position and completion status
21. ✅ Saving playback progress on private video rejected with HTTP 403 for unauthorized viewer
22. ✅ Related videos recommendation endpoint strictly excludes the currently watched video
23. ✅ Related videos strictly excludes private videos and incomplete/uploading videos
24. ✅ Related videos recommendations successfully return matching category public video

---

## 🔗 Official Repository
[https://github.com/kannanvenkatesan0255-wq/youtube.git](https://github.com/kannanvenkatesan0255-wq/youtube.git)
