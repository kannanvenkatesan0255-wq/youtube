# VidTube — Full-Stack Technical Architecture

## 1. Architectural Overview

VidTube is built on a decoupled, scalable full-stack architecture adhering to the separation of concerns:

- **Presentation Layer (Client)**: Single Page Application (SPA) powered by React 19, Vite, Tailwind CSS, and React Router. It implements an exact YouTube UI shell with reactive state management, dark/light theme switching, and responsive navigation paradigms (desktop expanded, desktop mini, mobile drawer, mobile bottom bar).
- **Application Layer (Server)**: Modular Express.js REST API providing secure routing, request validation, centralized error handling, and structured JSON responses via an `ApiResponse` standard.
- **Persistence Layer (Database)**: MongoDB Atlas managed through Mongoose Object Data Modeling (ODM). Built with indexes for high-throughput reads (video views, user lookups, subscriptions, comments).
- **Storage & CDN Layer**: Cloudinary cloud media storage for video assets, thumbnails, avatars, and channel banners, with architectural provisions for HLS adaptive streaming in Phase 10.

---

## 2. Monorepo Directory Layout

```
VidTube/
├── client/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── vidtube-logo.svg
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/         # Button, Input, Avatar, Badge, Spinner, Skeleton, ErrorBoundary, Logo
│   │   │   ├── layout/         # Header, Sidebar, MiniSidebar, MobileNav
│   │   │   ├── navigation/     # SidebarItem
│   │   │   └── video/          # CategoryChips, VideoCard, VideoGrid
│   │   ├── context/            # ThemeContext, SidebarContext
│   │   ├── hooks/              # useTheme, useSidebar, useHealthCheck
│   │   ├── layouts/            # MainLayout
│   │   ├── pages/              # HomePage, PlaceholderPage, NotFoundPage
│   │   ├── routes/             # AppRoutes
│   │   ├── services/           # Axios instance, healthService
│   │   ├── styles/             # index.css (custom scrollbars, Tailwind directives)
│   │   ├── utils/              # formatters, constants, sampleData
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/             # env.js, db.js, cloudinary.js
│   │   ├── constants/          # statusCodes.js, appConstants.js
│   │   ├── controllers/        # health.controller.js
│   │   ├── middleware/         # errorHandler.js, notFound.js, requestLogger.js
│   │   ├── models/             # 10 Mongoose schemas (User, Channel, Video, Short, Comment, Like, Subscription, Playlist, Notification, WatchHistory)
│   │   ├── routes/             # api.routes.js, health.routes.js
│   │   ├── services/           # health.service.js
│   │   ├── utils/              # apiResponse.js, apiError.js, logger.js
│   │   ├── validators/         # common.validator.js
│   │   ├── app.js              # Express app setup & middleware
│   │   └── server.js           # Process bootstrap & graceful shutdown
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── PROJECT_ROADMAP.md      # Detailed 10-phase roadmap
│   └── ARCHITECTURE.md         # System architecture document
│
├── .gitignore
├── README.md
└── package.json                # Monorepo root scripts & workspaces
```

---

## 3. Database Schema Models (Mongoose)

Phase 1 establishes the complete schema architecture for all 10 core entities:

1. **User**: Credentials (passwordHash hidden by default), email, username, avatar, role, verification status.
2. **Channel**: Owner reference, handle (`@handle`), subscriber counts, view counters, custom links, branding.
3. **Video**: Stream URL, publicId, duration, resolution, visibility (`public`, `private`, `unlisted`), view counts, channel link.
4. **Short**: 9:16 vertical video metadata, duration capped at 60s, sound track info.
5. **Comment**: Threaded comment structure with self-referencing `parentComment` for nested replies.
6. **Like**: Polymorphic like/dislike model with unique compound indexes to prevent duplicates.
7. **Subscription**: Subscriber-to-channel relational model with notification preferences (`all`, `personalized`, `none`).
8. **Playlist**: Array of video references with ordering and visibility controls.
9. **Notification**: Recipient, actor, event type (`new_video`, `comment`, `subscription`), read state.
10. **WatchHistory**: Upsert-tracked watch progress per user per video with completion indicators.

---

## 4. YouTube Exact UI Guidelines & Design Tokens

VidTube strictly enforces YouTube's design tokens:

### Light Theme
- Background: `#FFFFFF`
- Text (Primary): `#0F0F0F`
- Text (Secondary): `#606060`
- Hover state: `#F2F2F2`
- Border: `#E5E5E5`
- Accent Red: `#FF0033`

### Dark Theme
- Background: `#0F0F0F`
- Text (Primary): `#F1F1F1`
- Text (Secondary): `#AAAAAA`
- Surface elements: `#212121`
- Hover state: `#272727`
- Border: `#303030`
- Accent Red: `#FF0033`

---

## 5. Phase 3 Video Upload & Cloud Storage Architecture

### Direct Cloudinary Signed Ingestion Flow

```
[Browser Client]                                  [VidTube API Server]                    [Cloudinary CDN]
       │                                                   │                                     │
       │ 1. POST /api/videos/upload-signature ────────────>│                                     │
       │    (Authenticated JWT)                            │ (Signs timestamp & folder           │
       │                                                   │  using CLOUDINARY_API_SECRET)       │
       │<──────────────────────────────────────────────────│                                     │
       │    Returns { signature, timestamp, apiKey }       │                                     │
       │                                                   │                                     │
       │ 2. POST /api/videos (Create draft record) ───────>│                                     │
       │<──────────────────────────────────────────────────│                                     │
       │    Returns { _id, processingStatus: 'uploading' } │                                     │
       │                                                   │                                     │
       │ 3. Direct Binary Multipart POST ───────────────────────────────────────────────────────>│
       │    (Real-time upload progress, cancellable via AbortController)                         │
       │<────────────────────────────────────────────────────────────────────────────────────────│
       │    Returns { secure_url, public_id, duration, format, width, height }                   │
       │                                                   │                                     │
       │ 4. POST /api/videos/:id/complete ────────────────>│                                     │
       │    (Owner verification, status -> 'ready',        │                                     │
       │     Channel.videosCount incremented)              │                                     │
       │<──────────────────────────────────────────────────│                                     │
       │    Returns finalized video document               │                                     │
```

### Access Control Rules
- **Public**: Included in `GET /api/videos` query where `{ visibility: 'public', processingStatus: 'ready' }`.
- **Unlisted**: Excluded from public query; accessible via `GET /api/videos/:id` to any caller without authentication.
- **Private**: Excluded from public query; accessible via `GET /api/videos/:id` only if the authenticated user is the video owner or has an admin role. Returns HTTP 403 Forbidden to all other users.
- **Modifications & Deletions**: Enforce strict ownership checks (`video.owner.equals(req.user._id)`). Unauthorized attempts return HTTP 403. Deletion triggers `cloudinary.uploader.destroy(publicId)` and decrements channel `videosCount`.

---

## 6. Phase 4 Video Playback, HLS Streaming & View Tracking Architecture

### Adaptive Streaming Pipeline

```
[Client / WatchPage]
       │
       ├── 1. GET /api/videos/:id/playback
       │      Returns: { videoUrl, hlsUrl, duration, resolution, channel, isOwner }
       │
       ├── 2. Playback Resolution Decision Engine:
       │      ┌────────────────────────────────────────────────────────┐
       │      │ If hlsUrl provided & Native HLS supported (Safari/iOS) │ ──> Native WebKit HLS
       │      ├────────────────────────────────────────────────────────┤
       │      │ Else if hlsUrl provided & Hls.isSupported() (Chrome/FF)│ ──> Hls.js Multi-Bitrate
       │      │ (Auto level switching + manual 1080p/720p/480p/360p)   │
       │      ├────────────────────────────────────────────────────────┤
       │      │ Else / If HLS fatal load failure                       │ ──> Direct HTML5 MP4 Stream
       │      └────────────────────────────────────────────────────────┘
       │
       ├── 3. View Qualification (Client watches >= 5s cumulative):
       │      POST /api/videos/:id/view { watchTime: 5 }
       │      Backend checks in-memory cooldown cache (${videoId}:${user|ip}, 30s TTL).
       │      Atomically increments Video.views and Channel.totalViews.
       │
       └── 4. Playback Progress Sync (Authenticated):
              POST /api/videos/:id/progress (every 15s & on pause/unmount)
              Upserts WatchHistory document. Automatically sets completed: true if progress >= 90%.
```

### View Tracking & Cooldown Policy
- **Cooldown Cache**: Keyed by `${videoId}:${userId || ip}` with a 30-second debounce window.
- **Qualification Threshold**: Requires `watchTime >= 5` seconds to prevent crawler or accidental hit counting.
- **Atomic MongoDB Counter**: Uses `$inc: { views: 1 }` on `Video` and `$inc: { totalViews: 1 }` on `Channel`.

---

## 7. Phase 5 Shorts Architecture, Vertical Video Feed & Gesture Engine

### Vertical Feed Architecture & Player Isolation

```
[Client / ShortsPage]
       │
       ├── 1. GET /api/shorts (Paginated public feed of ready, vertical 9:16 shorts)
       │
       ├── 2. Active Index Focus Engine:
       │      ┌────────────────────────────────────────────────────────┐
       │      │ Only index === activeIndex video is playing & looping  │
       │      ├────────────────────────────────────────────────────────┤
       │      │ Previous (activeIndex - 1) & Next (activeIndex + 1)    │
       │      │ videos are strictly paused & reset (currentTime = 0)   │
       │      ├────────────────────────────────────────────────────────┤
       │      │ Unmuted autoplay blocked by browser policy             │ ──> Seamlessly retries muted
       │      └────────────────────────────────────────────────────────┘
       │
       ├── 3. Gesture & Input Dispatcher:
       │      - Keyboard: ArrowDown / PageDown (next), ArrowUp / PageUp (previous)
       │      - Mouse Wheel: DeltaY threshold (> 40 / < -40) with 600ms debounce
       │      - Touch Swipe: touchstart -> touchend (deltaY > 60: prev, < -60: next)
       │      - Desktop Navigation Arrows: Floating Prev / Next action buttons
       │
       ├── 4. Seamless URL Synchronization:
       │      - Updating active Short syncs window.history to /shorts/:shortId
       │      - Direct /shorts/:shortId route initializes feed directly focused on that Short
       │
       ├── 5. Qualified Short View Counter:
       │      POST /api/shorts/:id/view { watchDuration: 20 }
       │      - Requires watchTime >= 2 seconds
       │      - 30-second in-memory cooldown cache per `${shortId}:${user|ip}`
       │      - Atomically updates Short.views and Channel.totalViews
       │
       └── 6. Interaction & Creator Studio:
              - Right action bar: Optimistic Likes / Dislikes, Comments drawer, Share URL
              - Studio: Dual Video / Short upload and management tabs with 9:16 aspect ratio preview
```



