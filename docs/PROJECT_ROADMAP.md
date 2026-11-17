# VidTube — 10-Phase Project Roadmap

VidTube is a production-oriented, full-stack video sharing and adaptive streaming platform modeled precisely after the modern YouTube user experience.

---

## 🗺️ Master Development Roadmap

| Phase | Milestone Name | Focus Area | Status |
|---|---|---|---|
| **Phase 1** | **Project Architecture & UI Shell** | Foundation, Monorepo, YouTube Exact Shell, MongoDB Setup, Health API | **COMPLETED** (`d342b80`) |
| **Phase 2** | **Authentication & Security Engine** | JWT, bcrypt, Refresh Tokens, Cookie Sessions, Cloudinary Auth, Profile | **COMPLETED** (`05c768f`) |
| **Phase 3** | **Video Upload, Storage & Management** | Direct Signed Cloudinary Uploads, Metadata, Privacy, Creator Studio | **COMPLETED** (`ed4929a`) |
| **Phase 4** | **Video Player, Watch Page & Streaming** | Custom Video Player, Hls.js Adaptive Streaming, Watch Page, Views | **COMPLETED** (`5811142`) |
| **Phase 5** | **VidTube Shorts & Vertical Player** | 9:16 Vertical Video Engine, Infinite Scroll, Sound Overlay, Gestures | **COMPLETED** (`4fbf67c`) |
| **Phase 6** | **Engagement & Community System** | Nested Comment Threads, Like/Dislike, Subscriptions, Real-Time Notifications | **COMPLETED** (`00bdb86`) |
| **Phase 7** | **Search, Playlists, History & Recommendations** | Multi-Type Search, Custom Playlists, Watch Later, History Resume, Recommendation Engine | **COMPLETED** (`7c0ce32`) |
| **Phase 8** | **Creator Studio, Channel Analytics & Content Management** | Dashboard, Zero-Fill Timeseries, Unified Content Management, Audience Demographics, CSV Export | **COMPLETED** |
| **Phase 9** | **Admin Moderation & Platform Governance** | Content Moderation, Flagged Videos, User Roles & Ban Controls | *Next* |
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

### Phase 5: Shorts Upload, Vertical Video Feed & Interaction Engine (Completed)
- **Shorts Database Model & Schema:**
  - Extended `Short` schema supporting `publicId`, `thumbnailPublicId`, `duration` (max 60s), `width`, `height`, `aspectRatio: '9:16'`, `format`, `fileSize`, `tags`, `visibility` (public, unlisted, private), `processingStatus` (uploading, processing, ready, failed), `soundTitle`, `views`, `likesCount`, `dislikesCount`, `isPublished`, `publishedAt`.
  - Compound indexing on `{ visibility: 1, processingStatus: 1, createdAt: -1 }`, `{ owner: 1, createdAt: -1 }`, and `{ views: -1 }`.
- **Backend Shorts REST API (`/api/shorts`):**
  - `POST /api/shorts/upload-signature`: Direct client-side Cloudinary signed upload targeting folder `vidtube/shorts`.
  - `POST /api/shorts`: Create Short draft with duration, aspect ratio, sound attribution, and title validation.
  - `POST /api/shorts/:id/complete`: Confirm upload completion and set status to ready with media dimensions.
  - `GET /api/shorts`: Paginated public feed returning ready public shorts with channel details populated.
  - `GET /api/shorts/my-shorts`: Creator Studio shorts endpoint filtering by visibility, processing status, and search keywords.
  - `GET /api/shorts/:id`: Retrieve single Short with private authorization checks and unlisted direct link support.
  - `POST /api/shorts/:id/view`: Qualified view tracking with 2s watch time threshold and 30-second deduplication cooldown.
  - `PATCH /api/shorts/:id`: Owner metadata update (title, description, soundTitle, tags).
  - `PATCH /api/shorts/:id/visibility`: Owner visibility toggling (public, unlisted, private).
  - `DELETE /api/shorts/:id`: Permanent Short deletion and Cloudinary media purge.
- **Frontend Vertical Shorts Feed (`/shorts`, `/shorts/:shortId`):**
  - Desktop centered vertical 9:16 container with right-side interaction panel and bottom creator overlay.
  - Single active video focus: only the currently centered Short plays, previous and next items pause and reset.
  - Autoplay & loop with browser audio policy fallback (re-triggers muted if unmuted autoplay is blocked).
  - Navigation controls: keyboard `ArrowUp` / `ArrowDown`, mouse wheel, touch swipe up / swipe down, and on-screen navigation buttons.
  - URL synchronization: browsing updates the browser address bar to `/shorts/:shortId` without full page reload.
  - Bottom Creator Overlay: Channel avatar, name, handle, Subscribe button, title with `#tags`, sound attribution with spinning vinyl icon.
  - Right Action Bar: Like & Dislike buttons with optimistic counters, Comments toggle, Share button with clipboard copy toast, Sound disc.
  - Slide-in Comments Drawer with comments count and comment submission input.
- **Homepage Integration & Creator Studio:**
  - `ShortsShelf.jsx`: Horizontal scrollable grid of 9:16 vertical cards embedded in the homepage above long-form videos.
  - `VideoUploadPage.jsx`: Tab switcher for "Long-form Video" vs "VidTube Short (Vertical 9:16, max 60s)", 60-second duration validation, sound attribution input, and vertical preview container.
  - `MyVideosPage.jsx`: Studio tabs for "Videos" vs "Shorts" with 9:16 thumbnail preview, visibility filters, edit modal, and delete confirmation.
- **Automated Test Suite:**
  - `server/src/tests/shorts.test.js` covers 24 verification points with 100% pass rate.

### Phase 6: Complete Engagement, Comments, Subscriptions & Notification Engine (Completed)
- **Polymorphic Reaction Engine (`Like` model & `/api/engagement`):**
  - Mutually exclusive Like / Dislike reactions on Videos, Shorts, and Comments with atomic counters (`$inc: { likesCount: 1, dislikesCount: -1 }`).
  - Idempotent toggling and removal endpoints (`POST /api/engagement/:contentType/:contentId/reaction`, `DELETE /api/engagement/:contentType/:contentId/reaction`).
  - Optimistic frontend UI (`LikeDislikeButtons.jsx`) with instant visual feedback and error rollback.
- **Threaded Comment Engine (`Comment` model & `/api/comments`):**
  - Full CRUD for top-level comments on long-form Videos and Shorts with pagination and sorting ("Top comments" vs "Newest first").
  - 1-level maximum nested replies (`POST /api/comments/:commentId/replies`, `GET /api/comments/:commentId/replies`) ensuring flat, clean discussion threads.
  - Granular permissions: authors can edit their comment text (`PATCH /api/comments/:id`, marks `isEdited: true`); author or content owner can delete comments (`DELETE /api/comments/:id`, cascades deletion of all child replies and atomically updates parent comments count).
  - Integrated into `WatchPage.jsx` via `<CommentSection />` and `ShortsPage.jsx` via `<ShortsCommentsDrawer />`.
- **Channel Subscription Engine (`Subscription` model & `/api/channels`):**
  - Subscribe/unsubscribe actions (`POST /api/channels/:id/subscribe`, `DELETE /api/channels/:id/subscribe`) with atomic `subscribersCount` tracking.
  - Strict self-subscription prevention (HTTP 400).
  - Optimistic frontend `<SubscribeButton />` with authenticated state sync and live subscriber counts.
  - Subscriptions feed (`GET /api/subscriptions/feed`, `/subscriptions`, `/feed/subscriptions`) returning newest public uploads from subscribed creators with channel avatar carousel.
- **Persistent & Real-Time Notification Engine (`Notification` model & Socket.IO):**
  - Socket.IO server initialized on HTTP server with JWT authentication handshake and isolated user/content rooms.
  - Automated database-backed notifications created on new subscriber, video comment, short comment, comment reply, and likes (with self-action exclusion).
  - Header bell dropdown (`NotificationDropdown.jsx`) with unread badge count, mark-as-read, and mark-all-as-read actions.
  - Dedicated Notifications page (`/notifications`) with "All" vs "Unread" filters and deletion support.
- **Automated Test Suite:**
  - `server/src/tests/engagement.test.js` covers 37 verification points with 100% pass rate.

### Phase 7: Search, Playlists, Watch History & Recommendations (Completed)
- **Multi-Type Search Engine (`/api/search`):**
  - Full-text & regex search across Videos, Shorts, and Channels with live autocomplete suggestions (`/api/search/suggestions`).
  - Search filters: Type (All, Video, Short, Channel), Upload Date (Hour, Today, Week, Month, Year), Duration (Under 4m, 4-20m, Over 20m), Sort By (Relevance, Date, Views, Rating).
  - Search History persistence per authenticated user (`SearchHistory` model) with individual entry deletion and full purge.
- **Playlist System (`Playlist` model & `/api/playlists`):**
  - Full CRUD for custom playlists (title, description, visibility, dynamic thumbnail).
  - Add video, remove video, and reorder videos (`PATCH /api/playlists/:id/reorder`).
  - Dedicated Playlist page (`/playlist/:playlistId`) with "Play All" playback support.
  - Interactive "Save to playlist" modal (`SaveToPlaylistModal.jsx`) on watch page and video cards.
- **Watch Later Engine (`/api/watch-later`):**
  - Dedicated system playlist for each user (`systemType: 'watch_later'`), protected from deletion.
  - Dedicated Watch Later view (`/playlist/watch-later`), status checking, and one-click quick action hover button on video cards.
- **Watch History & Continue Watching (`WatchHistory` model & `/api/history`):**
  - Tracking viewing activity for both long-form videos AND Shorts.
  - Continue Watching carousel (`ContinueWatchingRow.jsx`) on the homepage for partially watched videos with progress bar and resume from saved timestamp.
  - Automatic completion threshold: >= 90% watched marks `completed: true` and clears from continue watching.
  - Dedicated Watch History dashboard (`/history`) with in-history search and entry removal.
- **Weighted Recommendation Engine (`/api/recommendations`):**
  - Multi-signal ranking algorithm prioritizing subscribed channels (+40), preferred watch history categories (+25), matching tags (+10), and view popularity.
  - Trending videos endpoint (`/api/recommendations/trending`) for high-velocity recent content.
  - Context-aware related videos endpoint (`/api/recommendations/related/:videoId`) for the Watch Page.
- **Automated Test Suite:**
  - `server/src/tests/search_playlists_history.test.js` covers 45 verification points with 100% pass rate.

### Phase 8: Creator Studio, Channel Analytics & Content Management (Completed)
- **Dedicated Creator Studio Application Shell (`/studio`):**
  - Dedicated `StudioLayout` with Studio topbar, "+ Create" dropdown (video/short), channel search, switcher, and theme toggle.
  - Studio Sidebar: Dashboard, Content, Analytics, Comments, Playlists, Customization, Settings.
- **Creator Studio Dashboard (`/studio`):**
  - Aggregated 28-day channel overview (real views, watch time hours, net subscribers, uploads count).
  - Latest published content card with view/like/comment counters and direct analytics shortcut.
  - Top performing videos & top shorts widgets (all-time views).
  - Recent comments and recent subscribers feeds.
- **Unified Content Management (`/studio/content`):**
  - Unified table for both long-form Videos and vertical Shorts.
  - Filter by type (All, Videos, Shorts), visibility (Public, Unlisted, Private), and title search.
  - In-place metadata editing modal (Title, Description, Visibility, Tags).
  - Single content deletion with associated comments/likes purge and Cloudinary cleanup.
- **Channel Analytics Engine (`/studio/analytics`):**
  - Pure React + SVG responsive timeseries chart with zero-fill continuity, hover dot tooltips, and metric switcher (`views`, `watchTime`, `subscribers`, `likes`, `comments`).
  - Period selector: 7d, 28d, 90d, 365d with delta comparisons vs previous period.
  - Top content performance table with deep-dive direct links.
  - Audience Demographics: Videos vs Shorts views ratio and Subscribed vs Non-subscribed viewer split.
- **Single Content Deep-Dive (`/studio/content/:contentId/analytics`):**
  - Granular metrics and 28-day daily view trend for individual video/short.
- **Studio Comments Management (`/studio/comments`):**
  - Channel comments aggregator with reply support and creator moderation deletion.
- **Studio Playlists (`/studio/playlists`):**
  - Playlist manager inside Studio to create, edit, and organize channel playlists.
- **Channel Customization (`/studio/customization`):**
  - Name, Unique Handle (`@handle`), Description, Default Upload Visibility, and Featured Video trailer.
- **RFC 4180 CSV Export with Formula Injection Sanitization:**
  - Overview, timeseries, and content CSV exports.
  - Sanitizes cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` by prepending `'` (single quote) to protect against spreadsheet formula execution.
- **Automated Test Suite:**
  - `server/src/tests/studio_analytics.test.js` covers 83 verification points with 100% pass rate.

### Phase 9: Admin Moderation & Platform Governance (Next)
- Content moderation dashboard, reported/flagged content review, and administrative action logs.
- User management, suspension, strikes, and role management.


