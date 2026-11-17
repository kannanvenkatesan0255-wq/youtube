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

---

## 8. Phase 6 Engagement, Comments, Subscriptions & Notification Engine

### Unified Reaction Engine & Mutual Exclusivity

VidTube enforces strict mutual exclusivity between Likes and Dislikes across all content types (`Video`, `Short`, `Comment`):

```
                   ┌──────────────────────────────────────────────┐
                   │ User Action: Click "Like" or "Dislike"       │
                   └──────────────────────┬───────────────────────┘
                                          │
                                          ▼
                   ┌──────────────────────────────────────────────┐
                   │ Query existing reaction in Like collection   │
                   └──────────────────────┬───────────────────────┘
                                          │
               ┌──────────────────────────┼──────────────────────────┐
               │                          │                          │
        [No Reaction]              [Same Reaction]           [Opposite Reaction]
               │                          │                          │
               ▼                          ▼                          ▼
     Insert new reaction        Remove reaction (toggle)    Update reaction record
     $inc: { likes: +1 }        $inc: { likes: -1 }         $inc: { likes: +1, dislikes: -1 }
```

- **Atomic DB Counters**: Total counts for likes and dislikes are stored directly on the target document (`Video`, `Short`, `Comment`) and toggled via atomic `$inc` operations, eliminating count drift.
- **Optimistic UI with Rollback**: `LikeDislikeButtons.jsx` renders state changes immediately and reverts with a toast notification if the API call fails.

### Threaded Comment System (1-Level Maximum Nesting)

VidTube implements YouTube's flat threaded comment hierarchy:
- **Top-Level Comments**: `parentComment: null`, mapped directly to `Video` or `Short`.
- **Replies**: `parentComment: <rootCommentId>`. If a user attempts to reply to a reply, the backend automatically sets `parentComment` to the root comment's ID, preventing infinite indentation cascades.
- **Cascade Deletion**: When an author or content owner deletes a top-level comment, all associated replies are purged in a single atomic transaction/operation (`Comment.deleteMany({ parentComment: id })`), and the parent video's `commentsCount` is decremented by `1 + repliesCount`.

### Channel Subscriptions & Subscriptions Feed

- **Anti-Self Subscription**: Prevents creators from subscribing to their own channel (`channel.owner.equals(userId)` returns `HTTP 400`).
- **Live Counter Sync**: Subscribing or unsubscribing atomically updates `channel.subscribersCount` (`$inc: { subscribersCount: 1 / -1 }`).
- **Subscriptions Feed**: Queries `Subscription` to find subscribed `channelIds`, then performs a fast indexed query on `Video.find({ channel: { $in: channelIds }, visibility: 'public', processingStatus: { $ne: 'failed' } }).sort({ createdAt: -1 })`.

### Persistent & Real-Time Notification Pipeline

```
[Trigger Action] (Subscribe / Comment / Reply / Like)
       │
       ├── 1. Exclude Self-Action (actor !== recipient)
       │
       ├── 2. Persist Notification Document:
       │      Recipient, sender/actor, type, contentId, contentType, message, link, isRead: false
       │
       └── 3. Real-Time Socket.IO Dispatch:
              - Target user room: `user:${recipientId}`
              - Event: `notification:new`
              - Header NotificationDropdown receives event, increments badge, and prepends to list
```

---

## 9. Search, Playlists, Watch History & Recommendation Engine Architecture (Phase 7)

### Multi-Type Full-Text & Prefix Search Engine

VidTube integrates a hybrid full-text and regex search engine supporting videos, shorts, and channels:

```
[User Search Query `q`]
        │
        ├── 1. Suggestion Pre-fetch & Autocomplete (`GET /api/search/suggestions`):
        │      - Queries user's personal `SearchHistory` (prefix match, clock icon)
        │      - Queries `Channel` name & `@handle` (avatar, handle badge)
        │      - Queries ready `Video` & `Short` titles (deduplicated top 10)
        │
        ├── 2. Multi-Type Execution (`GET /api/search`):
        │      - Videos: Title, description, tags with duration & uploadDate filters
        │      - Shorts: Dedicated vertical shelf injection (`shorts_shelf`)
        │      - Channels: Dedicated channel header cards with instant Subscribe button
        │
        └── 3. User Search History Persistence (`SearchHistory` collection):
               - Authenticated queries automatically upserted (`lastSearchedAt: Date.now()`)
               - Self-isolation: Users can delete single entries or clear history entirely
```

### Playlist & Watch Later System

- **Unified Schema Design**: The `Playlist` model handles both custom user playlists and system playlists (`isSystem: Boolean`, `systemType: 'custom' | 'watch_later' | 'liked_videos'`).
- **Protection Rules**: System playlists cannot be deleted (`DELETE /api/playlists/:id` rejects with `HTTP 400`).
- **Video Deduplication**: Adding an existing video to a playlist is safely deduplicated without creating duplicate array items.
- **Ordered Playback Queue**: Playlists store ordered references `{ video, addedAt }` with reordering support (`PATCH /api/playlists/:id/reorder`).
- **Queue Player Integration**: The Watch Page supports `?list=:playlistId&index=:idx` with previous/next video navigation and auto-advancing upon playback completion.

### Watch History & Continue Watching Engine

```
[Video / Short Playback]
        │
        ├── Cumulative Progress Tracking (`POST /api/history/track`):
        │      - `watchedSeconds`, `duration`, `completed`
        │      - Auto-completion threshold: `watchedSeconds / duration >= 0.9` -> `completed: true`
        │
        ├── Continue Watching Row (`GET /api/history/continue-watching`):
        │      - Partially watched long-form videos (`completed: false`, `watchedSeconds > 5s`)
        │      - Displayed as a horizontal carousel on the homepage with red progress bars
        │      - Clicking resumes directly from the saved second (`/watch/:id?t=...`)
        │
        └── History Dashboard (`GET /api/history`):
               - Search within personal history (`?q=...`)
               - Individual item removal and bulk history purge
```

### Weighted Recommendation Algorithm

Recommendations are generated dynamically via multi-signal ranking:

$$\text{Score} = \text{Base} + 40 \times \mathbb{I}_{\text{Subscribed}} + 25 \times \mathbb{I}_{\text{PreferredCategory}} + 10 \times (\text{TagMatches}) + \text{RecencyBonus} + \min(\text{Views}, 50) - 30 \times \mathbb{I}_{\text{Completed}}$$

- **Cold Start / Guest Users**: Falls back to global trending videos ranked by view velocity in the last 72 hours.
- **Context-Aware Related Videos**: Watch Page sidebar queries `GET /api/recommendations/related/:videoId`, matching category and tags while strictly excluding the currently active video and all private/unlisted content.

---

## 10. Creator Studio & Channel Analytics Architecture (Phase 8)

### Architectural Overview

VidTube Creator Studio (`/studio`) is a dedicated application shell providing creators with comprehensive content management and real database-driven channel performance analytics.

```
[Creator Workspace: /studio]
         │
         ├── 1. Studio Dashboard (/studio):
         │      - Channel overview cards (views, watch time, subscribers, active uploads)
         │      - Latest published content card with real-time stats
         │      - Top videos and top shorts performance widgets
         │      - Recent comments & subscriber feeds
         │
         ├── 2. Unified Content Manager (/studio/content):
         │      - Unified table for long-form Videos & vertical Shorts
         │      - Search & filter by content type (video, short) and visibility (public, unlisted, private)
         │      - In-place metadata editing modal (Title, Description, Visibility, Tags)
         │      - Cloudinary and MongoDB asset deletion
         │
         ├── 3. Channel Analytics (/studio/analytics):
         │      - Pure React + SVG interactive timeseries with zero-fill continuity
         │      - Metric switcher: Views, Watch Time, Subscribers, Likes, Comments
         │      - Period selector: 7d, 28d, 90d, 365d with delta comparisons vs previous period
         │      - Audience Demographics: Videos vs Shorts views ratio & Subscriber loyalty split
         │      - Individual content deep-dive (/studio/content/:id/analytics)
         │
         ├── 4. Engagement & Organization:
         │      - Comments Aggregator (/studio/comments): Reply & delete moderation
         │      - Studio Playlists (/studio/playlists): Playlist management
         │      - Channel Customization (/studio/customization): Name, unique handle (@handle), description, featured video
         │      - Studio Settings (/studio/settings): Channel ID, permissions, verification
         │
         └── 5. High-Security RFC 4180 CSV Export:
                - Overview, timeseries, and content CSV exports
                - Formula Injection Defense: Cells starting with `=, +, -, @, \t, \r` are escaped with `'`
```

### Event Collection & Analytics Pipeline (`AnalyticsEvent` Model)

```javascript
const analyticsEventSchema = new mongoose.Schema({
  channel: { type: ObjectId, ref: 'Channel', required: true, index: true },
  contentType: { type: String, enum: ['Video', 'Short', 'Channel'], default: 'Video' },
  contentId: { type: ObjectId },
  eventType: {
    type: String,
    enum: ['view', 'watch_time', 'completion', 'like', 'dislike', 'comment', 'subscribe', 'unsubscribe', 'share'],
    required: true
  },
  value: { type: Number, default: 1 },
  viewer: { type: ObjectId, ref: 'User' },
  ipHash: { type: String },
  createdAt: { type: Date, default: Date.now, index: true }
});
```

- **Compound Indexing**: Compound indexes `{ channel: 1, eventType: 1, createdAt: -1 }` and `{ contentId: 1, eventType: 1, createdAt: -1 }` enable lightning-fast aggregation pipelines across millions of records without full collection scans.
- **Zero-Fill Continuity Algorithm**: Timeseries queries bucket daily counts and backfill every single calendar day in the requested period. Days with zero events render as honest zeroes (flat line at 0), strictly preventing fake synthetic trends or missing data gaps.
- **Security & Authorization**: All Studio routes enforce JWT authentication and creator channel verification. Modifying or deleting another creator's content is strictly rejected with `HTTP 404/403`.

---

## 11. Phase 9 — Admin Control Center, Content Moderation & Platform Security Architecture

### Architectural Overview

```
[Administrator Control Plane: /admin]
          │
          ├── 1. Governance & Access Control:
          │      - Multi-Tier RBAC: user, creator, admin, super_admin
          │      - Endpoint Guards: requireAuth + authorize('admin', 'super_admin')
          │      - Frontend Route Guard: AdminRoute protecting /admin/*
          │      - Account Status Invalidation: Suspended / Banned users blocked on all APIs
          │      - Super Admin privilege isolation: Only Super Admins may alter user roles
          │
          ├── 2. Content Moderation Pipeline:
          │      - Video Moderation: Warnings, Restrictions, Removals (auto-unpublishing)
          │      - Shorts Moderation: Vertical feed compliance & audio review
          │      - Comments Moderation: Toxic thread suppression & target tracing
          │      - Channel Management: Suspending/restricting non-compliant creators
          │
          ├── 3. Community Safety & Reports Queue:
          │      - User Report Submission Modal: 8 standard violation categories
          │      - Anti-Spam Compound Unique Index: { reporter, contentId, status }
          │      - Priority Triage Queue: Fast resolution & automated enforcement
          │
          ├── 4. Immutable Forensic Audit Trail (AuditLog Model):
          │      - Append-only collection recording all administrative operations
          │      - Captured: admin, action, targetType, targetId, reason, IP, userAgent, metadata
          │      - Forensic metadata inspector drawer in frontend
          │
          └── 5. Platform Announcements & Global Settings:
                 - Real-time announcement banners with priority and expiration
                 - Live platform settings: upload capacities, format whitelist, maintenance mode
```

### Models & Schema Architecture

#### 1. Report Model (`Report.js`)
```javascript
const reportSchema = new mongoose.Schema({
  reporter: { type: ObjectId, ref: 'User', required: true, index: true },
  contentType: { type: String, enum: ['video', 'short', 'comment', 'channel', 'user'], required: true },
  contentId: { type: ObjectId, required: true, index: true },
  video: { type: ObjectId, ref: 'Video' },
  short: { type: ObjectId, ref: 'Short' },
  comment: { type: ObjectId, ref: 'Comment' },
  channel: { type: ObjectId, ref: 'Channel' },
  reportedUser: { type: ObjectId, ref: 'User' },
  reason: {
    type: String,
    enum: ['spam', 'harassment', 'hate_speech', 'misinformation', 'violence', 'copyright', 'sexual_content', 'other'],
    required: true
  },
  description: { type: String, maxlength: 500 },
  status: { type: String, enum: ['pending', 'under_review', 'resolved', 'dismissed'], default: 'pending', index: true },
  moderator: { type: ObjectId, ref: 'User' },
  resolutionNotes: { type: String },
  resolutionAction: {
    type: String,
    enum: ['content_removed', 'content_restricted', 'user_suspended', 'warning_issued', 'no_action']
  },
  resolvedAt: { type: Date }
}, { timestamps: true });

// Anti-spam compound unique index
reportSchema.index({ reporter: 1, contentId: 1, status: 1 });
```

#### 2. AuditLog Model (`AuditLog.js`)
```javascript
const auditLogSchema = new mongoose.Schema({
  admin: { type: ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, index: true },
  targetType: {
    type: String,
    enum: ['User', 'Channel', 'Video', 'Short', 'Comment', 'Report', 'PlatformSetting', 'Announcement'],
    required: true
  },
  targetId: { type: mongoose.Schema.Types.Mixed },
  reason: { type: String, maxlength: 1000 },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });
```

#### 3. PlatformSetting Model (`PlatformSetting.js`)
```javascript
const platformSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global' },
  allowNewRegistrations: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'VidTube is currently undergoing maintenance.' },
  maxVideoUploadSizeMb: { type: Number, default: 500 },
  maxShortUploadDurationSec: { type: Number, default: 60 },
  allowedVideoFormats: [{ type: String, default: ['mp4', 'mov', 'avi', 'mkv', 'webm'] }],
  autoFlagThresholdReports: { type: Number, default: 5 }
}, { timestamps: true });
```

#### 4. Announcement Model (`Announcement.js`)
```javascript
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  type: {
    type: String,
    enum: ['info', 'warning', 'critical', 'feature', 'maintenance', 'update'],
    default: 'info'
  },
  priority: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true, index: true },
  dismissible: { type: Boolean, default: true },
  expiresAt: { type: Date },
  createdBy: { type: ObjectId, ref: 'User' }
}, { timestamps: true });
```

---

## 12. Production Optimization & Deployment Topology

### Production Runtime Architecture
```
[ Client Browser (React 19 SPA) ]
               │
               ▼ HTTPS (Vercel CDN Edge)
[ Static Assets: Cache-Control immutable 1yr ]
[ Route Fallback: /index.html SPA Rewrites ]
               │
               ▼ REST / WSS (CORS Secured)
[ Render Node.js Express API Instance ]
   ├── Express Compression Middleware (Gzip, threshold: 1KB)
   ├── Helmet HTTP Security Headers
   ├── Rate Limiting (General & Sensitive endpoints)
   ├── Real-Time Socket.IO Cluster Engine
   └── Mongoose Connection Pool (MongoDB Atlas Replica Set)
               │
               ▼ Media Offloading
[ Cloudinary CDN: Adaptive Bitrate HLS & Transformed Media ]
```

### Frontend Performance & Code Splitting
- **Vite Dynamic Imports (`React.lazy` + `Suspense`)**: 30+ pages lazily loaded upon route transition with animated fallback skeletons.
- **Rollup Manual Chunk Isolation**:
  - `vendor-react`: `react`, `react-dom`, `react-router-dom` (~170 kB)
  - `vendor-player`: `hls.js` (~130 kB loaded strictly on video watch pages)
  - `vendor-icons`: `lucide-react` (~35 kB)
  - `vendor-utils`: `axios`, `date-fns`, `socket.io-client` (~40 kB)
- **Initial Bundle Reduction**: Compressed initial JavaScript load from 1.50 MB to 336.63 kB (**77.6% reduction**).

### Backend Performance & Compression
- **Gzip Stream Compression**: All JSON responses over 1,024 bytes compressed dynamically using `compression` middleware with level 6 gzip.
- **Compound Database Indexing**: All high-throughput query fields indexed with compound keys for sub-10ms response times.
- **Production Error Sanitization**: Internal database errors, stack traces, and system details scrubbed before returning generic RFC 7807 compliant error bodies.








