# VidTube — 10-Phase Project Roadmap

VidTube is a production-oriented, full-stack video sharing and adaptive streaming platform modeled precisely after the modern YouTube user experience.

---

## 🗺️ Master Development Roadmap

| Phase | Milestone Name | Focus Area | Status |
|---|---|---|---|
| **Phase 1** | **Project Architecture & UI Shell** | Foundation, Monorepo, YouTube Exact Shell, MongoDB Setup, Health API | **COMPLETED** |
| **Phase 2** | **Authentication & Security Engine** | JWT, bcrypt, Refresh Tokens, Cookie Sessions, Cloudinary Auth, Profile | **COMPLETED** |
| **Phase 3** | **Channel Architecture & Studio Profile** | Channel Customization, Handles, Banners, Avatars, Links, Socials | *Scheduled* |
| **Phase 4** | **Video Management & Processing Engine** | Long-form Video Uploads, Transcoding, Metadata, Cloudinary Storage | *Scheduled* |
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

### Phase 3: Channel Architecture & Creator Profile (Next)
- Channel model linking with User accounts.
- Unique channel handles (`@handle`).
- Channel banner and avatar uploads via Cloudinary.
- Channel tabs: Home, Videos, Shorts, Playlists, About.
- Subscribe / Unsubscribe counter logic.

### Phase 4: Video Management & Processing
- Video upload endpoint using multer and Cloudinary SDK.
- Video metadata editing (title, description, category, tags, visibility: public/private/unlisted).
- Thumbnail generation and custom thumbnail uploads.
- Video detail watch page with custom HTML5/Video.js player, theatre mode, and fullscreen.

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

### Phase 7: Subscriptions, Playlists & Personal Library
- Channel subscription management with notification tiers (All, Personalized, None).
- Subscriptions feed aggregating newly published videos from subscribed creators.
- Custom playlists (Public, Private, Unlisted) and reordering.
- "Watch Later" and "Liked Videos" automated system playlists.

### Phase 8: Search Engine & Explore Feed
- Server-side full-text search indexing on video titles, descriptions, and tags.
- Search suggestion autocomplete and recent searches history.
- Search filters: upload date, duration (under 4m, 4-20m, over 20m), type (video, channel, playlist).
- Explore tabs: Trending, Music, Gaming, Sports, Podcasts.

### Phase 9: Watch History & Creator Analytics Studio
- Incremental watch progress recording and resume playback.
- Clear and pause watch history.
- Creator Studio Dashboard:
  - Total channel views, watch time hours, subscriber count.
  - Video performance graphs, click-through rates, top traffic sources.
  - Video manager table with sorting and filtering.

### Phase 10: Adaptive HLS Streaming & Production Optimization
- Adaptive Bitrate Streaming (HLS: 1080p, 720p, 480p, 360p).
- Redis caching for high-throughput endpoints (trending, homepage feeds).
- End-to-end load testing and accessibility auditing.
- Production deployment configuration (Vercel/Netlify for client, Render/Railway/AWS for backend, MongoDB Atlas cluster).
