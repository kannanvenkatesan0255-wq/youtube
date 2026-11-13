# VidTube — 10-Phase Project Roadmap

VidTube is a production-oriented, full-stack video sharing and adaptive streaming platform modeled precisely after the modern YouTube user experience.

---

## 🗺️ Master Development Roadmap

| Phase | Milestone Name | Focus Area | Status |
|---|---|---|---|
| **Phase 1** | **Project Architecture & UI Shell** | Foundation, Monorepo, YouTube Exact Shell, MongoDB Setup, Health API | **COMPLETED** (`d342b80`) |
| **Phase 2** | **Authentication & Security Engine** | JWT, bcrypt, Refresh Tokens, Cookie Sessions, Cloudinary Auth, Profile | **COMPLETED** (`05c768f`) |
| **Phase 3** | **Video Upload, Storage & Management** | Direct Signed Cloudinary Uploads, Metadata, Privacy, Creator Studio | **COMPLETED** |
| **Phase 4** | **Video Streaming & Custom Video Player** | HTML5 Custom Video Player, Quality Selector, Theater Mode, Fullscreen | *Scheduled* |
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

### Phase 4: Video Streaming & Custom Video Player (Next)
- Custom HTML5 Video Player with YouTube controls.
- Play, pause, seek, volume, speed control (0.25x to 2x).
- Theater mode, mini-player, and fullscreen modes.
- Keyboard shortcuts (Space/K for play/pause, J/L for 10s skip, M for mute, F for fullscreen).
- Video details view, channel subscribe card, and description expand/collapse.

### Phase 5: VidTube Shorts
- Vertical video upload pipeline (max 60 seconds).
- TikTok/YouTube Shorts-style full-screen vertical swipeable player.
- Keyboard navigation (Up/Down arrow keys) and mobile swipe gestures.
- Short engagement controls (Like, Dislike, Comments drawer, Share, Sound attribution).

### Phase 6: Engagement & Social System
- Real-time comment system with nested threaded replies.
- Pinning comments by channel owners.
- Polymorphic Like/Dislike system for videos, shorts, and comments.
- Sentiment counting and optimistic UI updates.
