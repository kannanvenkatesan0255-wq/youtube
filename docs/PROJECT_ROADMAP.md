# VidTube — 10-Phase Project Roadmap

VidTube is a production-oriented, full-stack video sharing and adaptive streaming platform modeled precisely after the modern YouTube user experience.

---

## 🗺️ Master Development Roadmap

| Phase | Milestone Name | Focus Area | Status |
|---|---|---|---|
| **Phase 1** | **Project Architecture & UI Shell** | Foundation, Monorepo, YouTube Exact Shell, MongoDB Setup, Health API | **COMPLETED** |
| **Phase 2** | **Authentication & Security Engine** | JWT, bcrypt, Refresh Tokens, Cookie Sessions, Cloudinary Auth | *Scheduled* |
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

### Phase 1: Project Architecture & UI Shell (Current)
- Monorepo folder architecture (`client`, `server`, `docs`).
- React 19 + Tailwind CSS + Vite configuration.
- Express 4.x REST API with centralized error handling & request logging.
- MongoDB Atlas & Mongoose connection utility with graceful recovery.
- Exact YouTube UI Shell:
  - Header: VidTube logo, hamburger menu, centered search input, voice search icon, create, notification bell, user avatar, theme toggle.
  - Sidebar: Expanded (240px) with Home, Shorts, Subscriptions, You, Subscriptions list, Explore, Settings; Collapsed mini-sidebar (72px) for desktop; Mobile drawer overlay.
  - Video Grid & Cards: 16:9 thumbnails, duration badges, channel avatars, 2-line title clamps, verified badges, views/time formatting, three-dot menu.
  - Category Chips: Horizontal scrollable chips bar with scroll indicators.
  - Mobile responsiveness: Bottom navigation bar, touch-friendly header and drawer.
- Backend Health Check Endpoint (`GET /api/health`).

### Phase 2: Authentication & Security Engine
- User registration and login with bcrypt password hashing.
- JWT access tokens and HTTP-only refresh tokens.
- Protected route middleware for Express.
- React AuthContext and persistence in local storage/cookies.
- Session validation and logout handling.

### Phase 3: Channel Architecture & Creator Profile
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
