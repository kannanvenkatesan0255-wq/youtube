# VidTube — Full-Stack Video Sharing & Streaming Platform

<div align="center">
  <img src="client/public/vidtube-logo.svg" alt="VidTube Logo" width="120" />
  <h3>A Production-Oriented YouTube Replica Built with Modern Full-Stack Technologies</h3>
  <p>Phase 1 Foundation: Architecture, Monorepo Setup, Express REST API, MongoDB Mongoose Schemas & YouTube Exact UI Shell</p>

  [![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
</div>

---

## 📌 Project Introduction

**VidTube** is a full-scale video sharing and streaming web platform developed as an engineering internship capstone project. The project is designed to meticulously replicate the familiar user interface and design patterns of **YouTube**, utilizing clean architecture, component reusability, and modern full-stack practices.

Phase 1 establishes the bedrock of the application: a production-grade monorepo, robust Express REST backend, Mongoose schema modeling for all future features, and a high-fidelity YouTube UI shell matching YouTube's exact proportions, typography, and color tokens.

---

## 🎯 Project Objectives

Across 10 structured development phases, VidTube will implement:
- **Long-Form Video Streaming**: Video uploads, transcoding, thumbnail management, and player controls.
- **VidTube Shorts**: 9:16 vertical video player with mobile swipe gestures and audio attribution.
- **Engagement Engine**: Threaded nested comments, polymorphic like/dislike interactions, and channel subscriptions.
- **Channel & Creator Studio**: Customizable channel pages, banner/avatar management, handles (`@handle`), and real-time viewership analytics.
- **Adaptive Streaming**: HLS adaptive bitrate streaming with Cloudinary integration.
- **Discoverability**: Full-text search with filters, autocomplete suggestions, and category feeds.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (Hooks, Suspense, Concurrent rendering)
- **Bundler & Tooling**: Vite 6
- **Styling**: Tailwind CSS 3.4 with custom YouTube design tokens
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios with configured baseURL and request/response interceptors
- **Icons**: Lucide React
- **Typography**: Roboto font family

### Backend
- **Runtime**: Node.js (v24+)
- **Server Framework**: Express.js 4.21
- **Architecture**: Modular RESTful API with layered controllers, services, and routes
- **Database ODM**: Mongoose 8.9 connecting to MongoDB Atlas
- **Security & Headers**: Helmet, CORS, centralized error handling
- **Logging**: Morgan HTTP logger and structured console logger
- **Media Architecture**: Cloudinary SDK configured for video and asset storage

### Root & Monorepo
- **Workspaces**: npm Workspaces (`client`, `server`)
- **Process Orchestration**: Concurrently

---

## 📐 Architecture & Folder Structure

```
VidTube/
├── client/                     # Frontend Application (React 19 + Vite)
│   ├── public/                 # Static assets & SVG icons
│   ├── src/
│   │   ├── assets/             # Images & design assets
│   │   ├── components/
│   │   │   ├── common/         # Button, Input, Avatar, Badge, Spinner, Skeleton, ErrorBoundary, Logo
│   │   │   ├── layout/         # Header, Sidebar, MiniSidebar, MobileNav
│   │   │   ├── navigation/     # SidebarItem
│   │   │   └── video/          # CategoryChips, VideoCard, VideoGrid
│   │   ├── context/            # ThemeContext, SidebarContext
│   │   ├── hooks/              # useTheme, useSidebar, useHealthCheck
│   │   ├── layouts/            # MainLayout
│   │   ├── pages/              # HomePage, PlaceholderPage, NotFoundPage
│   │   ├── routes/             # AppRoutes (declarative routing)
│   │   ├── services/           # Axios instance & healthService
│   │   ├── styles/             # index.css (custom scrollbars & directives)
│   │   ├── utils/              # formatters, constants, sampleData
│   │   ├── App.jsx             # Root React tree & providers
│   │   └── main.jsx            # React 19 DOM mount
│   ├── .env.example
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Backend REST API (Node.js + Express)
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
│   │   └── server.js           # Server listen & graceful shutdown
│   ├── .env.example
│   └── package.json
│
├── docs/                       # Project Documentation & Roadmaps
│   ├── PROJECT_ROADMAP.md      # Detailed 10-phase master roadmap
│   └── ARCHITECTURE.md         # Technical architecture documentation
│
├── .gitignore
├── README.md
└── package.json                # Monorepo scripts
```

---

## 🎨 YouTube Exact UI Design System

| Design Element | Light Theme | Dark Theme |
|---|---|---|
| **Background** | `#FFFFFF` | `#0F0F0F` |
| **Primary Text** | `#0F0F0F` | `#F1F1F1` |
| **Secondary Text** | `#606060` | `#AAAAAA` |
| **Hover Surfaces** | `#F2F2F2` | `#272727` |
| **Borders** | `#E5E5E5` | `#303030` |
| **Accent Red** | `#FF0033` | `#FF0033` |

### Responsive Layout States
- **Desktop (>= 1024px)**: Fixed 56px header, sticky category chips, collapsible 240px sidebar or 72px mini sidebar, 3 to 4 column video grid.
- **Tablet (640px - 1023px)**: 2 column video grid, collapsed mini sidebar, compact header.
- **Mobile (< 640px)**: Single column full-width video cards, mobile search overlay, hamburger drawer navigation, bottom navigation bar (`Home`, `Shorts`, `Create`, `Subscriptions`, `You`).

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18.x or v20.x or v24.x recommended)
- npm (v9+ or v11+)
- Git
- Optional: Local MongoDB instance or free MongoDB Atlas account

### 1. Clone the Repository
```bash
git clone https://github.com/kannanvenkatesan0255-wq/youtube.git
cd youtube
```

### 2. Install All Dependencies
From the repository root, install workspace dependencies:
```bash
npm install
```

### 3. Environment Configuration

#### Backend Configuration:
Copy `server/.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```
Default values inside `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vidtube
JWT_SECRET=your_secure_secret_key_2026
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Frontend Configuration:
Copy `client/.env.example` to `client/.env`:
```bash
cp client/.env.example client/.env
```
Default value inside `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## ⚡ Running the Application

### Option A: Run Both Services Concurrently (Recommended)
From the repository root:
```bash
npm run dev
```
This launches:
- **Backend**: `http://localhost:5000` (Nodemon auto-reload)
- **Frontend**: `http://localhost:5173` (Vite HMR)

### Option B: Run Services Individually

#### Start Backend Only:
```bash
npm run dev:server
# or
cd server && npm run dev
```

#### Start Frontend Only:
```bash
npm run dev:client
# or
cd client && npm run dev
```

### Option C: Production Build
```bash
npm run build
```
Build output is generated inside `client/dist/`.

---

## 📡 API Information & Endpoints

### Health Check Endpoint
```http
GET /api/health
```

**Response Format:**
```json
{
  "success": true,
  "message": "VidTube API is running",
  "status": "healthy",
  "timestamp": "2026-11-13T05:27:24.611Z",
  "environment": "development",
  "uptimeSeconds": 42,
  "database": {
    "status": "connected",
    "connected": true
  },
  "version": "1.0.0"
}
```

### Architectural REST Route Boundaries (Prepared for Phases 2–10)
- `/api/auth` — User Authentication & JWT session endpoints (Phase 2)
- `/api/users` — User profiles & account settings (Phase 2)
- `/api/channels` — Channel metadata, customization, and handles (Phase 3)
- `/api/videos` — Video uploads, details, and streaming endpoints (Phase 4)
- `/api/shorts` — Vertical Shorts streaming and interactions (Phase 5)
- `/api/comments` — Threaded video discussions (Phase 6)
- `/api/likes` — Like/dislike reactions (Phase 6)
- `/api/subscriptions` — Channel subscriptions & notifications (Phase 7)
- `/api/playlists` — Custom playlists & library (Phase 7)
- `/api/search` — Full-text search and query suggestions (Phase 8)
- `/api/notifications` — Real-time event notifications (Phase 8)
- `/api/history` — Watch history tracking & resume playback (Phase 9)
- `/api/analytics` — Creator Studio metrics (Phase 9)

---

## 🔗 Official Repository
**GitHub**: [https://github.com/kannanvenkatesan0255-wq/youtube.git](https://github.com/kannanvenkatesan0255-wq/youtube.git)

---

## 📄 License & Attribution
Developed for educational internship purposes. VidTube features an original visual brand identity inspired by the familiar user experience of modern video platforms.
