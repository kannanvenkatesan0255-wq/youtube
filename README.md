# VidTube — Full-Stack Video Sharing & Streaming Platform

<div align="center">
  <img src="client/public/vidtube-logo.svg" alt="VidTube Logo" width="120" />
  <h3>A Production-Oriented YouTube Replica Built with Modern Full-Stack Technologies</h3>
  <p>Phase 9 Active: Admin Control Center, Content Moderation & Platform Security</p>

  [![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
  [![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socket.io&logoColor=white)](https://socket.io/)
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
- **Phase 4: Video Player, Watch Page & Adaptive Streaming Engine** — ✅ COMPLETED (`5811142`)
- **Phase 5: Shorts Upload, Vertical Video Feed & Interaction Engine** — ✅ COMPLETED (`4fbf67c`)
- **Phase 6: Engagement, Comments, Subscriptions & Notification Engine** — ✅ COMPLETED (`00bdb86`)
- **Phase 7: Search, Playlists, Watch History & Recommendation Engine** — ✅ COMPLETED (`7c0ce32`)
- **Phase 8: Creator Studio, Channel Analytics & Content Management Dashboard** — ✅ COMPLETED (`93876d2`)
- **Phase 9: Admin Control Center, Content Moderation & Platform Security** — ✅ COMPLETED
- **Phase 10: Performance Optimization, Production Hardening & Deployment** — 🔜 Scheduled per [PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md)

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

## ⚡ Phase 5 — Shorts Upload, Vertical Video Feed & Interaction Engine

Phase 5 introduces a fully-featured, short-form vertical video experience modeled directly on **YouTube Shorts**:

### 1. Vertical Player & Feed Page (`/shorts`, `/shorts/:shortId`)
- **Centered 9:16 Responsive Container:** Built to desktop YouTube Shorts standards (`aspect-[9/16] w-full max-w-[360px] sm:max-w-[400px] h-[85vh]`) and spanning full-screen on mobile devices.
- **Single Active Video Focus:** Only the currently active, visible Short plays and loops. Previous and next Shorts in the feed are paused and reset to frame 0, preventing audio crosstalk.
- **Autoplay & Browser Policy Fallback:** Automatically plays when scrolled into focus; if unmuted autoplay is rejected by browser policy, seamlessly retries muted without freezing the UI.
- **Multi-Modal Navigation:**
  - `ArrowUp` / `ArrowDown` keyboard navigation with smooth easing.
  - Mouse wheel scrolling with directional debounce.
  - Mobile touch swipe gestures (Swipe Up for next Short, Swipe Down for previous Short).
  - Floating vertical navigation arrows on desktop.
- **URL Synchronization:** Navigating through the feed dynamically updates the browser URL to `/shorts/:shortId` using HTML5 history API without triggering full page reloads.

### 2. Interaction Layer & Creator Overlay
- **Right Action Bar:**
  - Like button with optimistic toggle and formatted counter.
  - Dislike button with toggle state.
  - Comment button opening the slide-in comments drawer.
  - Share button with clipboard URL copy and toast alert.
  - Spinning audio vinyl disc attribution icon.
- **Bottom Creator Overlay:**
  - Channel avatar, name, handle (`@username`), and YouTube-style Subscribe button.
  - Video title with clickable `#tags` highlighted in blue.
  - Sound attribution banner with scrolling music icon.
- **Slide-In Comments Drawer (`ShortsCommentsDrawer.jsx`):**
  - Slide-over sheet from bottom/right allowing viewers to read and submit comments without navigating away from the Short.

### 3. Homepage Shelf & Creator Studio Integration
- **Homepage Shorts Shelf (`ShortsShelf.jsx`):** Horizontal scrollable carousel of vertical 9:16 Shorts cards with red Shorts icon badge, views count, and channel attribution.
- **Shorts Upload Mode (`VideoUploadPage.jsx`):** Integrated "Long-form Video" vs "VidTube Short" tab selector. Enforces vertical 9:16 preview, max 60-second duration validation, sound attribution field, and direct upload signature targeting `vidtube/shorts`.
- **Creator Studio Shorts Management (`MyVideosPage.jsx`):** "Videos" vs "Shorts" tab view displaying 9:16 vertical thumbnails, visibility badges, sound attribution, edit metadata modal, and permanent deletion.

### 4. View Tracking & Cooldown Policy
- **Endpoint:** `POST /api/shorts/:id/view`
- **Legitimate Qualification:** Requires minimum 2s watch time threshold.
- **30-Second Debounce Cooldown:** In-memory view deduplication cache prevents refresh abuse from the same IP/user.

---

## 📡 API Specification — Shorts (`/api/shorts`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/shorts/upload-signature` | Generate secure upload signature for Cloudinary `vidtube/shorts` | **Yes** |
| `POST` | `/api/shorts` | Create Short draft metadata record (validated duration <= 60s) | **Yes** |
| `POST` | `/api/shorts/:id/complete` | Confirm completed Short upload with dimensions & duration | **Yes (Owner)** |
| `GET` | `/api/shorts` | Paginated public Shorts feed (excludes unlisted & private) | No |
| `GET` | `/api/shorts/my-shorts` | Creator Studio Shorts list with visibility & status filters | **Yes** |
| `GET` | `/api/shorts/:id` | Fetch single Short by ID (enforces private authorization) | Optional |
| `POST` | `/api/shorts/:id/view` | Record legitimate Short view with 30s cooldown debounce | Optional |
| `PATCH` | `/api/shorts/:id` | Update Short metadata (title, description, soundTitle, tags) | **Yes (Owner)** |
| `PATCH` | `/api/shorts/:id/visibility` | Update Short visibility (public / unlisted / private) | **Yes (Owner)** |
| `DELETE` | `/api/shorts/:id` | Delete Short and purge Cloudinary media asset | **Yes (Owner)** |

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

## 💬 Phase 6 — Complete Engagement, Comments, Subscriptions & Notification Engine

Phase 6 implements a production-grade, interactive social engine backed by MongoDB atomic operations and real-time Socket.IO broadcasts:

### 1. Unified Mutual Reaction Engine (`/api/engagement`)
- **Mutually Exclusive Likes & Dislikes**: Reacting to a Video, Short, or Comment enforces mutual exclusivity: liking automatically cancels dislike; disliking automatically cancels like; clicking the same reaction removes it.
- **Zero-Drift Atomic Counting**: Database counts are modified via atomic MongoDB `$inc` operations, ensuring total counts remain consistent under high concurrency without background synchronization jobs.
- **Optimistic UI Component (`LikeDislikeButtons.jsx`)**: Immediately updates button states and counts upon user interaction, rolling back gracefully if the API request fails.

### 2. Threaded Comment System (`/api/comments`)
- **Flat 1-Level Nested Replies**: Full discussion thread capabilities while strictly capping reply nesting depth at 1 level, avoiding infinite UI indentation cascades.
- **Author Editing & Cascading Deletion**: Comment authors can edit their comments (marked with an `(edited)` indicator). When an author or content owner deletes a top-level comment, all associated replies are cascade-deleted, and parent counters are updated atomically.
- **Sorting & Real-Time Sync**: Supports sorting by "Newest first" and "Top comments" (ranked by likes). Integrates directly with Socket.IO content rooms (`content:Video:<id>`, `content:Short:<id>`) for real-time live comment prepending.

### 3. Channel Subscriptions & Subscriptions Feed (`/api/channels`, `/api/subscriptions`)
- **Anti-Self Subscription**: Prevents creators from subscribing to their own channel (`HTTP 400`).
- **Live Counter Sync**: Subscribing or unsubscribing atomically updates `channel.subscribersCount` and synchronizes UI status.
- **Subscriptions Feed (`/subscriptions`, `/feed/subscriptions`)**: Delivers a chronological feed of latest uploads from subscribed channels, complete with an interactive top channel avatar carousel.

### 4. Persistent & Real-Time Notification Pipeline (`/api/notifications`)
- **Socket.IO Integration**: Handshake authentication using JWT, binding authenticated clients to private user rooms (`user:<userId>`).
- **Automated Trigger Events**: Generates persistent database notifications when users subscribe, comment on content, reply to comments, or like content (strictly excluding self-actions).
- **Header Notification Dropdown (`NotificationDropdown.jsx`)**: Displays live unread count badge, recent notifications list, "Mark all as read", and single notification dismissal.
- **Dedicated Notifications Dashboard (`/notifications`)**: Full-page notifications center with "All" vs "Unread" filters, navigation links, and deletion support.

---

## 📡 API Specification — Engagement & Social (`/api/engagement`, `/api/comments`, `/api/notifications`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/engagement/:contentType/:contentId/reaction` | Toggle or switch Like/Dislike on Video, Short, or Comment | **Yes** |
| `DELETE` | `/api/engagement/:contentType/:contentId/reaction` | Remove active reaction on Video, Short, or Comment | **Yes** |
| `GET` | `/api/engagement/:contentType/:contentId/reaction` | Query current user's reaction on target content | Optional |
| `GET` | `/api/engagement/:contentType/:contentId/summary` | Query reaction counts summary and user reaction | Optional |
| `GET` | `/api/comments/:contentType/:contentId` | Get top-level comments (paginated, sorted by top/newest) | Optional |
| `POST` | `/api/comments/:contentType/:contentId` | Create new top-level comment on Video or Short | **Yes** |
| `POST` | `/api/comments/:commentId/replies` | Reply to comment (enforces 1-level thread ceiling) | **Yes** |
| `GET` | `/api/comments/:commentId/replies` | Get child replies for a specific comment | Optional |
| `PATCH` | `/api/comments/:commentId` | Edit comment text (Author only, sets `isEdited: true`) | **Yes (Author)** |
| `DELETE` | `/api/comments/:commentId` | Delete comment (Author or content owner, cascades replies) | **Yes (Author/Owner)** |
| `POST` | `/api/channels/:channelId/subscribe` | Subscribe to channel (rejects self-subscription) | **Yes** |
| `DELETE` | `/api/channels/:channelId/subscribe` | Unsubscribe from channel | **Yes** |
| `GET` | `/api/channels/:channelId/subscription-status` | Query subscription state of current user | Optional |
| `GET` | `/api/subscriptions/feed` | Chronological uploads feed from subscribed channels | **Yes** |
| `GET` | `/api/notifications` | Paginated notifications list (supports `unreadOnly` filter) | **Yes** |
| `GET` | `/api/notifications/unread-count` | Query unread notification badge count | **Yes** |
| `PATCH` | `/api/notifications/:id/read` | Mark single notification as read | **Yes** |
| `PATCH` | `/api/notifications/read-all` | Mark all user notifications as read | **Yes** |
| `DELETE` | `/api/notifications/:id` | Delete notification | **Yes** |

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

VidTube maintains automated test suites covering all completed phases (125/125 passing tests):

```bash
# Run Phase 6 Engagement & Notifications test suite (37 tests)
npm run test:engagement --workspace=server

# Run Phase 5 Shorts Upload & Vertical Feed test suite (24 tests)
npm run test:shorts --workspace=server

# Run Phase 4 Video Playback & Streaming test suite (24 tests)
npm run test:playback --workspace=server

# Run Phase 3 Video Upload & Management test suite (22 tests)
npm run test:video --workspace=server

# Run Phase 2 Authentication & Security test suite (18 tests)
npm run test:auth --workspace=server
```

### Verified Phase 6 Test Cases (37/37 Passing):
1. ✅ User B likes Video A (likesCount increments to 1, userReaction is "like")
2. ✅ Switch reaction like -> dislike (likesCount decrements to 0, dislikesCount increments to 1)
3. ✅ Switch reaction dislike -> like (likesCount increments to 1, dislikesCount decrements to 0)
4. ✅ Remove reaction (clears userReaction, decrements likesCount to 0)
5. ✅ Duplicate like handling is consistent and safe (idempotent)
6. ✅ Unauthenticated reaction attempt rejected with 401 Unauthorized
7. ✅ Invalid reaction type rejected with 400 Bad Request
8. ✅ User B likes Short A (likesCount increments to 1)
9. ✅ Switch Short like -> dislike (likesCount decrements to 0, dislikesCount increments to 1)
10. ✅ Remove Short reaction (clears userReaction, resets counters to 0)
11. ✅ User B posts top-level comment on Video A (201 Created, video commentsCount increments)
12. ✅ Empty comment text rejected with 400 Bad Request
13. ✅ User B posts comment on Short A (201 Created)
14. ✅ Author edits own comment (200 OK, isEdited === true)
15. ✅ Unauthorized comment modification rejected with 403 Forbidden
16. ✅ User A replies to User B comment (201 Created, parent repliesCount increments)
17. ✅ Replying to a reply enforces 1-level thread depth ceiling
18. ✅ Fetch comment replies (returns both threaded replies)
19. ✅ User B likes a comment (Comment likesCount increments to 1)
20. ✅ Non-owner cannot delete comment (403 Forbidden)
21. ✅ Author deletes top-level comment (cascades deletion of all child replies)
22. ✅ User B subscribes to Channel A (channel subscribersCount increments, isSubscribed === true)
23. ✅ Self-subscription rejected with 400 Bad Request
24. ✅ Duplicate subscription call is idempotent and safe (subscribersCount remains 1)
25. ✅ Subscription status returns isSubscribed: true
26. ✅ Subscriptions feed includes uploads from subscribed Channel A
27. ✅ User B unsubscribes from Channel A (subscribersCount decrements to 0, isSubscribed === false)
28. ✅ Subscription status after unsubscribe returns isSubscribed: false
29. ✅ Subscription notification delivered to channel creator
30. ✅ Comment notification delivered to video creator
31. ✅ Reply notification delivered to parent comment author
32. ✅ Self-action exclusion: creator commenting on own video does NOT generate self-notification
33. ✅ Get unread notification count returns valid integer
34. ✅ Mark single notification as read (200 OK, isRead === true)
35. ✅ Mark all notifications as read resets unreadCount to 0
36. ✅ Delete notification succeeds (200 OK)
37. ✅ Unauthorized user cannot delete another user notification (404/403 rejected)

### Verified Phase 5 Test Cases (24/24 Passing):
1. ✅ Health check endpoint returns healthy system and connected database
2. ✅ Unauthenticated requests to protected Shorts endpoints return 401
3. ✅ Creator Alice and Viewer Bob registered successfully with channels
4. ✅ Shorts upload signature endpoint returns valid signing data with folder `vidtube/shorts`
5. ✅ Short creation without title returns 400 Bad Request
6. ✅ Short creation with duration exceeding 60s returns 400 Bad Request
7. ✅ Short creation with title exceeding 100 chars returns 400 Bad Request
8. ✅ Public Short created with 9:16 aspect ratio, sound attribution, and ready status
9. ✅ Short upload completion sets status to ready with width, height, and duration
10. ✅ Unlisted Short created successfully
11. ✅ Private Short created successfully
12. ✅ Public Shorts feed includes public ready short and excludes unlisted and private shorts
13. ✅ Shorts feed populates channel details (name, handle, avatarUrl, subscriberCount)
14. ✅ Unlisted Short is accessible via direct ID lookup
15. ✅ Viewer Bob attempting to access Alice private Short is rejected with 403 Forbidden
16. ✅ Owner Alice can access her own private Short
17. ✅ Creator Alice retrieves all her shorts (public, unlisted, private) while Bob has 0 shorts
18. ✅ Creator Studio filter by `visibility=private` returns only private shorts
19. ✅ First view tracking call increments short views count and returns `counted: true`
20. ✅ Immediate repeated view from same IP within 30s is debounced with cooldown notice
21. ✅ Viewer Bob attempting to update Alice short returns 403 Forbidden
22. ✅ Owner Alice updates Short title, description, and soundTitle successfully
23. ✅ Owner toggles Short visibility to private, instantly removing it from public feed
24. ✅ Owner Alice permanently deletes Short; subsequent queries return 404

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

### Verified Phase 7 Test Cases (45/45 Passing):
1. ✅ Search query returns matching public video
2. ✅ Search query returns matching short in unified items or shorts shelf
3. ✅ Search by channel handle with `type=channel` returns creator channel
4. ✅ Private video is strictly excluded from public search results
5. ✅ Search duration filter "under4m" returns only videos under 4 minutes
6. ✅ Search duration filter "over20m" returns only videos over 20 minutes
7. ✅ Search upload date filter "today" includes recently created videos
8. ✅ Search suggestions returns matching query terms
9. ✅ Authenticated search query is recorded in user search history
10. ✅ Search history is isolated: User C sees 0 queries recorded by User B
11. ✅ User can delete individual search history entry
12. ✅ User can clear all search history
13. ✅ User B creates a custom playlist with initial video (201 Created)
14. ✅ Add second video to playlist succeeds and increments count
15. ✅ Adding duplicate video to playlist is safely deduplicated
16. ✅ Get user playlists returns owner playlists including custom and system
17. ✅ Reorder playlist by array of videoIds updates sequence correctly
18. ✅ Remove video from playlist successfully deletes the item
19. ✅ Get playlist by ID returns populated video details and owner information
20. ✅ Owner can update playlist title and description
21. ✅ Non-owner update attempt rejected with 403 Forbidden
22. ✅ Private playlist cannot be viewed by other users (403 Forbidden)
23. ✅ Owner can view their own private playlist
24. ✅ Owner can delete their custom playlist (200 OK)
25. ✅ Add video to Watch Later returns `isInWatchLater: true`
26. ✅ Check Watch Later status returns `isInWatchLater: true`
27. ✅ Check Watch Later status for unsaved video returns `isInWatchLater: false`
28. ✅ Get Watch Later playlist returns system playlist populated with videos
29. ✅ System playlist cannot be deleted via playlist DELETE route (400 Bad Request)
30. ✅ Remove video from Watch Later returns `isInWatchLater: false`
31. ✅ Check Watch Later after removal returns `isInWatchLater: false`
32. ✅ Track partial progress on video (watchedSeconds: 120, completed: false)
33. ✅ Track progress on Short records correctly with `contentType="Short"`
34. ✅ Continue watching list includes partially watched video (progress < 90%)
35. ✅ Completing video (>= 90% watched) automatically removes it from continue watching
36. ✅ User history feed contains both long-form videos and shorts with metadata
37. ✅ Query filter inside user watch history filters results accurately
38. ✅ Delete single watch history entry succeeds (200 OK)
39. ✅ Clear all watch history removes all entries for user
40. ✅ Public recommendations endpoint returns popular public videos
41. ✅ Recommendations filtered by category returns matching category videos
42. ✅ Trending endpoint returns high-view/recent videos
43. ✅ Related videos returns similar videos and strictly excludes current videoId
44. ✅ Personalized recommendations prioritizes content from subscribed channels
45. ✅ Private video is strictly excluded from general and trending recommendations

---

## 📊 Phase 8 — Creator Studio, Channel Analytics & Content Management Dashboard

Phase 8 implements a complete, professional Creator Studio and analytics engine providing creators with full control over their channel, unified content management for long-form videos and shorts, interactive SVG timeseries charts, and RFC 4180 CSV reports:

### 1. Dedicated Creator Studio Application Shell (`/studio`)
- **Studio Layout (`StudioLayout.jsx`):** Dedicated topbar with quick "+ Create" dropdown (Upload Video / Create Short), search in channel, theme toggle, channel switcher, and Studio sidebar navigation.
- **Studio Dashboard (`/studio`):** Channel card, 28-day performance summary (views, watch time hours, subscribers gained, active uploads), latest published video widget, top videos & shorts lists, recent comments, and recent subscribers.
- **Unified Content Management (`/studio/content`):** Single unified table managing both Videos and Shorts with live search, filters (All, Videos, Shorts, Public, Unlisted, Private), metadata editing modal (Title, Description, Visibility, Tags), and asset deletion.
- **Channel Analytics (`/studio/analytics`):**
  - Interactive SVG Timeseries with tooltip, hover dots, and metric switcher (`views`, `watchTime`, `subscribers`, `likes`, `comments`).
  - Period selector: Last 7 days, 28 days, 90 days, 365 days with delta vs previous period.
  - Audience Demographics: Videos vs Shorts views/upload distribution + Subscriber vs Non-subscriber view ratio.
- **Single Content Deep-Dive (`/studio/content/:contentId/analytics`):** Individual performance metrics and 28-day continuous view trend.
- **Channel Comments Aggregator (`/studio/comments`):** Moderate, reply to, and delete comments across all channel videos and shorts.
- **Channel Playlists (`/studio/playlists`):** Curate and organize playlists from inside Creator Studio.
- **Channel Customization (`/studio/customization`):** Channel Name, Handle uniqueness validation (`@handle`), Description, Default Upload Visibility, and Featured Video selector.
- **Studio Settings (`/studio/settings`):** Identity, permissions, channel ID, and verification status.

### 2. High-Performance Event Tracking & Storage (`AnalyticsEvent`)
- **Compound Indexes:** Fast aggregation via `{ channel: 1, eventType: 1, createdAt: -1 }`, `{ contentId: 1, eventType: 1, createdAt: -1 }`.
- **Zero-Fill Continuity:** Every day in requested periods is represented; missing historical events are rendered as real zeroes (flat line at 0), never synthetic or random curves.
- **RFC 4180 CSV Export with Formula Injection Sanitization:** Cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` are prepended with `'` to prevent malicious macro execution in spreadsheet software.

### Verified Phase 8 Test Cases (83/83 Passing):
1. ✅ Unauthenticated request to `/studio/dashboard` returns 401
2. ✅ Unauthenticated request to `/analytics/overview` returns 401
3. ✅ Creator registered successfully with channel
4. ✅ Viewer registered successfully with channel
5. ✅ Creator channel resolved in database
6. ✅ GET `/studio/dashboard` returns 200
7. ✅ Dashboard returns correct channel name
8. ✅ Initial 28d views are 0 (no synthetic data)
9. ✅ Initial topVideos is empty
10. ✅ Initial topShorts is empty
11. ✅ GET `/studio/dashboard` returns 200 with content
12. ✅ Dashboard shows recorded views in 28d
13. ✅ Dashboard shows accurate watch time
14. ✅ Dashboard calculates watch time in hours
15. ✅ Dashboard returns top videos
16. ✅ Dashboard returns top shorts
17. ✅ Dashboard returns recent comments
18. ✅ Dashboard returns recent subscribers
19. ✅ GET `/studio/analytics/overview?period=28d` returns 200
20. ✅ Overview shows views in current 28d period
21. ✅ Overview shows watch seconds
22. ✅ Overview shows subscribers gained
23. ✅ Overview shows likes
24. ✅ Overview shows comments
25. ✅ Overview computes correct delta vs previous period
26. ✅ GET `/studio/analytics/overview?period=7d` returns 200
27. ✅ Period parameter sets correct date boundaries
28. ✅ GET `/studio/analytics/timeseries` returns 200
29. ✅ Timeseries has continuous daily points matching period length
30. ✅ Timeseries total matches total views
31. ✅ Timeseries metric matches requested metric
32. ✅ WatchTime timeseries returns 200
33. ✅ WatchTime timeseries total matches recorded duration
34. ✅ GET `/studio/analytics/top-content` returns 200
35. ✅ Top content returns both video and shorts
36. ✅ Top content is ranked descending by views
37. ✅ GET `/studio/analytics/top-content?type=short` returns 200
38. ✅ Shorts filter returns only Shorts
39. ✅ GET `/studio/analytics/audience` returns 200
40. ✅ Content distribution reports videos count
41. ✅ Content distribution reports shorts count
42. ✅ Tracks subscriber views
43. ✅ Tracks non-subscriber views
44. ✅ GET `/studio/analytics/subscribers` returns 200
45. ✅ Subscribers gained is tracked
46. ✅ Subscribers net is computed accurately
47. ✅ Returns recent subscribers list
48. ✅ GET `/studio/analytics/content/:id` returns 200
49. ✅ Content deep-dive returns matching content title
50. ✅ Content deep-dive returns 28-day continuous view trend
51. ✅ Returns 404 for content not belonging to channel
52. ✅ GET `/studio/content` returns 200
53. ✅ Unified list contains all channel videos and shorts
54. ✅ Pagination metadata is populated
55. ✅ Filter `type=video` returns only videos
56. ✅ Filter `type=short` returns only shorts
57. ✅ Filter `visibility=unlisted` returns only unlisted content
58. ✅ Search query `q=` returns matching content
59. ✅ PATCH `/studio/content/:id` updates title and metadata
60. ✅ Non-owner cannot edit another creator's content (404/403 isolated)
61. ✅ DELETE `/studio/content/:id` deletes content
62. ✅ Video is removed from database and Cloudinary
63. ✅ GET `/studio/comments` returns 200
64. ✅ Returns comments across owned content
65. ✅ Comment text is correct
66. ✅ Includes content title reference
67. ✅ GET `/studio/channel` returns 200
68. ✅ Returns channel name and profile
69. ✅ PATCH `/studio/channel` updates customization
70. ✅ Channel name updated
71. ✅ Featured video set successfully
72. ✅ GET `/studio/analytics/export?type=overview` returns 200
73. ✅ Export Content-Type is text/csv
74. ✅ Overview CSV contains standard header rows
75. ✅ GET `/studio/analytics/export?type=timeseries` returns 200
76. ✅ Timeseries CSV contains date and views
77. ✅ GET `/studio/analytics/export?type=content` returns 200
78. ✅ Formula injection prefix "=" escaped with leading single quote
79. ✅ Formula injection prefix "+" escaped with leading single quote
80. ✅ Formula injection prefix "-" escaped with leading single quote
81. ✅ Formula injection prefix "@" escaped with leading single quote
82. ✅ GET `/analytics/overview` aliased route returns 200
83. ✅ GET `/analytics/timeseries` aliased route returns 200

---

## 🛡️ Phase 9 — Admin Control Center, Content Moderation & Platform Security

Phase 9 establishes a centralized administrative control system, content moderation pipeline, forensic audit logging, and platform security management.

### 1. Role-Based Access Control (RBAC) & Privilege Separation
- **Four-Tier Architecture:** `user` (viewer/consumer), `creator` (video publishing), `admin` (moderation and safety operations), `super_admin` (system root, role escalation, critical platform settings).
- **Backend Guard:** `authorize('admin', 'super_admin')` middleware applied across `/api/admin/*`.
- **Frontend Guard:** `AdminRoute` wrapper strictly preventing unauthorized navigation to `/admin/*`.
- **Privilege Isolation:** Only `super_admin` users may promote or demote user roles; administrative self-suspension and self-demotion are blocked by validation rules.
- **Immediate Session Enforcement:** As soon as an account is marked `suspended` or `banned`, all subsequent authenticated requests with existing JWTs are rejected with `HTTP 403 Forbidden`.

### 2. Full Platform Content Moderation
- **Videos Moderation (`/api/admin/videos`):** Audit long-form videos with status filters (`clean`, `flagged`, `restricted`, `removed`). Removing a video unpublishes it immediately from feeds while preserving it in the database for appeals. Restoring sets status back to `clean` and unhides it.
- **Shorts Moderation (`/api/admin/shorts`):** Audit vertical short-form video feed, filter audio copyright claims, and enforce age restrictions.
- **Comments Moderation (`/api/admin/comments`):** Moderate abusive comments and replies with direct parent/target reference links.
- **Channels Moderation (`/api/admin/channels`):** Restrict or suspend non-compliant creator channels.

### 3. Community Safety Reporting System
- **User-Facing Reporting Modal (`ReportModal.jsx`):** Enables viewers on watch pages, shorts feeds, and comments to report violations across 8 categorized reasons (`spam`, `harassment`, `hate_speech`, `misinformation`, `violence`, `copyright`, `sexual_content`, `other`).
- **Duplicate Prevention Index:** Compound unique index `{ reporter: 1, contentId: 1, status: 1 }` prevents ticket spam.
- **Priority Moderation Queue (`/admin/moderation` & `/admin/reports`):** Fast-triage interface with instant dismissal or enforcement action (`content_removed`, `content_restricted`, `user_suspended`, `warning_issued`).

### 4. Forensic Immutable Audit Trail (`AuditLog`)
- Every administrative action is automatically logged in an append-only collection with administrator ID, action name, target type and ID, justification, IP address, user agent, and metadata snapshot.
- Full UI inspector modal with JSON payload viewer on `/admin/audit-logs`.

### 5. System Announcements & Global Platform Settings
- **Announcements Engine (`Announcement`):** Banner system supporting priorities, categories (`info`, `warning`, `critical`, `feature`, `maintenance`), user dismissal flags, and public broadcast (`/api/announcements/active`).
- **Global Platform Settings (`PlatformSetting`):** Live configuration of upload size limits (MB), short video duration thresholds, registration toggles, and maintenance mode.

### 6. Phase 9 Verified Automated Tests (66/66 Passing)
1. ✅ Unauthenticated request to `/admin/dashboard` returns 401
2. ✅ Ordinary Viewer registered successfully
3. ✅ Creator registered successfully
4. ✅ Ordinary user calling `/admin/dashboard` rejected with 403 Forbidden
5. ✅ Creator calling `/admin/dashboard` rejected with 403 Forbidden
6. ✅ User cannot promote themselves to admin via profile update
7. ✅ Admin login returns 200
8. ✅ Super Admin login returns 200
9. ✅ GET `/admin/dashboard` returns 200 for Administrator
10. ✅ Reports real total registered users
11. ✅ Reports real total channels
12. ✅ Reports pending reports count
13. ✅ Returns recent users list
14. ✅ Returns recent videos list
15. ✅ GET `/admin/users` with query returns 200
16. ✅ Search finds target user
17. ✅ Target email matches
18. ✅ Password hash is strictly excluded from response
19. ✅ GET `/admin/users/:id` returns user details and stats
20. ✅ PATCH `/admin/users/:id/status` successfully suspends account
21. ✅ User accountStatus is now suspended
22. ✅ Suspended user blocked from performing authenticated operations (403)
23. ✅ User account restored to active
24. ✅ Restored user can access authenticated endpoints normally
25. ✅ Administrator self-suspension is rejected with 400 Bad Request
26. ✅ Super Admin can elevate user role to Admin
27. ✅ Creator role updated to admin
28. ✅ Ordinary Admin cannot promote users (Super Admin only)
29. ✅ GET `/admin/channels` returns 200
30. ✅ Returns channel directory
31. ✅ PATCH `/admin/channels/:id/status` updates channel status
32. ✅ Channel status is suspended
33. ✅ PATCH `/admin/videos/:id/moderation` applies action
34. ✅ Video moderationStatus set to "removed"
35. ✅ Removed video is automatically unpublished
36. ✅ Video moderationStatus restored to clean
37. ✅ Restored video republished to public
38. ✅ PATCH `/admin/shorts/:id/moderation` restricts short
39. ✅ Short moderationStatus set to restricted
40. ✅ PATCH `/admin/comments/:id/moderation` removes comment
41. ✅ Comment moderationStatus is removed
42. ✅ POST `/reports` creates a pending report (201 Created)
43. ✅ Report status is pending
44. ✅ Duplicate pending report rejected with 409 Conflict
45. ✅ Report for non-existent content returns 404 Not Found
46. ✅ GET `/admin/reports` returns reports list
47. ✅ Contains submitted report
48. ✅ GET `/admin/reports/:id` returns full report details
49. ✅ Report reason matches
50. ✅ PATCH `/admin/reports/:id` resolves report
51. ✅ Report status is resolved
52. ✅ GET `/admin/audit-logs` returns 200
53. ✅ Audit logs recorded administrative actions
54. ✅ User administrative actions are audited
55. ✅ Content moderation actions are audited
56. ✅ Ordinary users cannot access audit logs (403)
57. ✅ GET `/admin/analytics?period=28d` returns 200
58. ✅ Returns timeline array with daily growth trends
59. ✅ GET `/admin/settings` returns 200
60. ✅ Default settings populated
61. ✅ PATCH `/admin/settings` updates configuration
62. ✅ maxVideoUploadSizeMb updated to 750
63. ✅ POST `/admin/announcements` creates announcement (201)
64. ✅ GET `/announcements/active` returns 200
65. ✅ Active announcement visible publicly
66. ✅ DELETE `/admin/announcements/:id` removes announcement

---

## 🔗 Official Repository
[https://github.com/kannanvenkatesan0255-wq/youtube.git](https://github.com/kannanvenkatesan0255-wq/youtube.git)
