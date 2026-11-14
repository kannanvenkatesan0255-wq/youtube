# VidTube — 10-Phase Project Roadmap

VidTube is a production-oriented, full-stack video sharing and adaptive streaming platform modeled precisely after the modern YouTube user experience.

---

## 🗺️ Master Development Roadmap

| Phase | Milestone Name | Focus Area | Status |
|---|---|---|---|
| **Phase 1** | **Project Architecture & UI Shell** | Foundation, Monorepo, YouTube Exact Shell, MongoDB Setup, Health API | **COMPLETED** (`d342b80`) |
| **Phase 2** | **Authentication & Security Engine** | JWT, bcrypt, Refresh Tokens, Cookie Sessions, Cloudinary Auth, Profile | **COMPLETED** (`05c768f`) |
| **Phase 3** | **Video Upload, Storage & Management** | Direct Signed Cloudinary Uploads, Metadata, Privacy, Creator Studio | **COMPLETED** (`ed4929a`) |
| **Phase 4** | **Video Player, Watch Page & Streaming** | Custom Video Player, Hls.js Adaptive Streaming, Watch Page, Views | **COMPLETED** |
| **Phase 5** | **VidTube Shorts & Vertical Player** | 9:16 Vertical Video Engine, Infinite Scroll, Sound Overlay, Gestures | *Scheduled* |
| **Phase 6** | **Engagement & Community System** | Nested Comment Threads, Like/Dislike, Mentions, Real-Time Badges | *Scheduled* |
| **Phase 7** | **Subscriptions, Playlists & Library** | Channel Subscriptions, Bell Notifications, Custom Playlists, Watch Later | *Scheduled* |
| **Phase 8** | **Search Engine, Filters & Explore Feed** | Full-Text Regex & Atlas Search, Category Exploration, Trending Algorithm | *Scheduled* |
| **Phase 9** | **Watch History & Creator Analytics** | Resumable Watch Progress, Creator Analytics Studio, Viewership Metrics | *Scheduled* |
| **Phase 10** | **Adaptive HLS Streaming & Production Deploy** | Adaptive Bitrate HLS, Redis Caching, CI/CD Pipeline, Final Polish | *Scheduled* |

---

## Phase Details

### Phase 1: Project Architecture & UI Shell (Completed)
- Monorepo folder architecture (`client`, `server`, `docs`).
- React 19 + Tailwind CSS + Vite configuration.
- Express 4.x REST API with centralized error handling & request logging.
- MongoDB Atlas & Mongoose connection utility with graceful recovery.
- Exact YouTube UI Shell:
  - Header, Expandable 240px sidebar, 72px desktop collapsed mini-sidebar, mobile drawer.
  - Video Grid (16:9 aspect ratio, badges, verified ticks, metadata).
  - Sticky category filter chips with smooth scrolling and directional fade overlays.
- Backend Health Check Endpoint (`GET /api/health`).

### Phase 2: Authentication & Security Engine (Completed)
- **User Registration & Channel Provisioning:** Validated registration with automatic default Channel creation (unique handle `@username`).
- **User Authentication:** Login with username/email, bcrypt password comparison, JWT Access (15m) and Refresh Tokens (7d).
- **Session Security:** HttpOnly, SameSite, Secure cookie delivery, and Bearer Authorization header support.
- **Token Lifecycle:** Rotation via `POST /api/auth/refresh`, session verification via `GET /api/auth/me`.
- **Password Recovery:** Cryptographically secure, single-use 15-minute hashed tokens, reuse prevention, anti-enumeration responses, and SMTP / development email service.
- **Account & Profile Management:** Profile retrieval, name/handle updates, avatar updates, and password changes requiring current password verification.
- **Frontend Authentication Architecture:** Centralized `AuthContext`, Axios interceptors, `ProtectedRoute`, `GuestRoute`, YouTube-style Sign-In (`/login`), Sign-Up (`/register`), Forgot Password (`/forgot-password`), Reset Password (`/reset-password/:token`), and Profile & Settings (`/profile`) pages.
- **Security Hardening:** Rate limiting (`express-rate-limit`), Helmet security headers, CORS with credentials, mass-assignment guards.

### Phase 3: Video Upload, Storage & Management Engine (Completed)
- **Direct Cloudinary Signed Upload:** Server generates secure timestamped signatures (`POST /api/videos/upload-signature`); browser streams directly to Cloudinary without Node process bottleneck.
- **Video Metadata Registration & Finalization:** `POST /api/videos` creates draft; `POST /api/videos/:id/complete` stores final media URL, format, duration, dimensions, public ID, and auto-increments creator channel `videosCount`.
- **Visibility & Privacy Engine:**
  - `public`: Accessible to everyone and queried in public listings.
  - `unlisted`: Excluded from public search/listing feeds, accessible via direct URL link.
  - `private`: Strictly restricted to video owner and administrators (HTTP 403 for unauthorized users).
- **Video Modification & Deletion:**
  - `PATCH /api/videos/:id`: Updates title, description, category, tags.
  - `PATCH /api/videos/:id/thumbnail`: Updates custom thumbnail.
  - `PATCH /api/videos/:id/visibility`: Toggles public / unlisted / private visibility.
  - `DELETE /api/videos/:id`: Purges asset from Cloudinary storage, removes MongoDB document, decrements channel `videosCount`.
- **Frontend Creator Studio:**
  - Multi-step Upload Page (`/upload`) with drag-and-drop, preview, custom thumbnail, category chips, tags, visibility options, real-time progress, and cancellation.
  - Creator Videos Dashboard (`/studio/videos` / `/my-videos`) with search, filter by visibility, sort, edit details modal, and delete confirmation dialog.
  - Header "+ Create" button dynamically routes to `/upload` (or `/login`).
  - Homepage (`/`) integrates public videos with seamless fallback to sample showcase videos.

### Phase 4: Video Player, Watch Page & Adaptive Streaming Engine (Completed)
- **Adaptive Video Player (`VideoPlayer.jsx`):**
  - Powered by Hls.js for multi-bitrate HLS (`.m3u8`) playback with automatic resolution detection.
  - Native HLS support on Apple WebKit (Safari / iOS).
  - Graceful automatic fallback to standard HTML5 MP4 playback if HLS manifest is unavailable or encounters network errors.
  - YouTube custom player controls: interactive timeline scrubber with buffered ranges, ghost hover preview, volume slider with mute toggle (`m`), time display, speed menu (0.25x to 2x), quality selector menu (`Auto` + renditions), theater mode (`t`), fullscreen (`f`), Picture-in-Picture (`i`).
  - Keyboard shortcuts with input-element protection.
- **YouTube Watch Page (`/watch/:videoId`):**
  - Responsive two-column layout on desktop, top player in theater mode, touch-friendly on mobile.
  - Channel info card with subscriber count and toggleable Subscribe button.
  - Action pills: Like / Dislike with live counts, Share button with clipboard copy toast, Save.
  - Expandable description card with views, timestamp, category badge, and `#tag` pills.
  - Related video recommendations feed excluding current video and private videos.
- **View Tracking & Anti-Spam Policy (`POST /api/videos/:id/view`):**
  - Requires minimum 5s watch time qualification.
  - 30-second cooldown per IP / user to avoid duplicate view inflation.
  - Atomic counter increments for both video `views` and channel `totalViews`.
- **Playback Progress & Resume Engine (`WatchHistory` model):**
  - Records watched seconds, duration, and completion status (>= 90%).
  - Automatically resumes playback from saved position for authenticated viewers with notification toast.

### Phase 5: VidTube Shorts & Vertical Player (Next)
- Vertical video upload pipeline (max 60 seconds).
- TikTok/YouTube Shorts-style full-screen vertical swipeable player.
- Keyboard navigation (Up/Down arrow keys) and mobile swipe gestures.
- Short engagement controls (Like, Dislike, Comments drawer, Share, Sound attribution).

### Phase 6: Engagement & Social System
- Real-time comment system with nested threaded replies.
- Pinning comments by channel owners.
- Polymorphic Like/Dislike system for videos, shorts, and comments.
- Sentiment counting and optimistic UI updates.
