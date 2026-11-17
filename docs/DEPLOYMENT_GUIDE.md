# VidTube Production Deployment Guide

This guide provides end-to-end instructions for deploying **VidTube** to production using industry-standard cloud infrastructure:
- **Frontend SPA**: [Vercel](https://vercel.com) (React 19 + Vite + Tailwind CSS)
- **Backend API & WebSockets**: [Render](https://render.com) (Node.js + Express + Socket.IO)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Managed Cloud Cluster)
- **Media Storage & CDN**: [Cloudinary](https://cloudinary.com) (Adaptive video streaming & image transformation)

---

## Architecture Topology

```
                  ┌─────────────────────────────────────────┐
                  │          End User / Browser             │
                  └──────────────┬──────────────────────────┘
                                 │
                 ┌───────────────┴────────────────┐
                 ▼                                ▼
       ┌───────────────────┐            ┌───────────────────┐
       │   Vercel Edge     │            │   Cloudinary CDN  │
       │  (Frontend SPA)   │            │ (Videos, HLS, Img)│
       └─────────┬─────────┘            └─────────▲─────────┘
                 │ (REST / WSS)                   │ Direct Upload
                 ▼                                │ & Stream
       ┌───────────────────┐                      │
       │    Render API     │──────────────────────┘
       │ (Node / Express)  │
       └─────────┬─────────┘
                 │
                 ▼
       ┌───────────────────┐
       │   MongoDB Atlas   │
       │ (Document Store)  │
       └───────────────────┘
```

---

## 1. MongoDB Atlas Setup

1. **Create an Account & Cluster**:
   - Log into [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a new project and provision a shared (M0 Free Tier) or dedicated cluster in your target region.

2. **Configure Database Access**:
   - Navigate to **Security** > **Database Access**.
   - Click **Add New Database User**.
   - Create a user with username/password authentication (e.g. `vidtube_prod_user`).
   - Grant `Read and write to any database` privilege.

3. **Configure Network Access**:
   - Navigate to **Security** > **Network Access**.
   - Click **Add IP Address**.
   - Add `0.0.0.0/0` (Allow Access from Anywhere) to permit connections from dynamic Render instances, or configure static IP outbound if using Render paid tiers.

4. **Obtain Connection String**:
   - Click **Connect** > **Drivers** (Node.js).
   - Copy the SRV connection URI:
     ```
     mongodb+srv://vidtube_prod_user:<password>@cluster0.abcde.mongodb.net/vidtube?retryWrites=true&w=majority
     ```

---

## 2. Cloudinary Media Cloud Setup

1. **Create an Account**:
   - Sign up at [Cloudinary](https://cloudinary.com).
2. **Retrieve API Credentials**:
   - On the **Dashboard**, locate:
     - `Cloud Name`
     - `API Key`
     - `API Secret`
3. **Upload Preset Settings (Optional for Direct Client Uploads)**:
   - Navigate to **Settings** > **Upload** > **Upload presets**.
   - Ensure unsigned and signed upload modes are enabled for the `vidtube/videos` and `vidtube/shorts` folders.

---

## 3. Backend Deployment (Render)

### Option A: Using the Included Blueprint (`render.yaml`)
1. In the Render Dashboard, select **New** > **Blueprint**.
2. Connect your GitHub repository: `https://github.com/kannanvenkatesan0255-wq/youtube.git`.
3. Render automatically reads `render.yaml` and provisions the `vidtube-api` Web Service.
4. Fill in the required environment variables prompted by Render:
   - `MONGODB_URI`: Your MongoDB Atlas URI.
   - `CLIENT_URL`: `https://your-app-name.vercel.app`.
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary Cloud Name.
   - `CLOUDINARY_API_KEY`: Your Cloudinary API Key.
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API Secret.

### Option B: Manual Web Service Creation
1. Select **New** > **Web Service**.
2. Connect the Git repository.
3. Configure settings:
   - **Name**: `vidtube-api`
   - **Language**: `Node`
   - **Root Directory**: Leave blank (monorepo root) or `server`
   - **Build Command**: `npm install --workspace=server`
   - **Start Command**: `npm run start --workspace=server`
   - **Health Check Path**: `/api/health`
4. Add the following Environment Variables:
   | Key | Value | Description |
   |-----|-------|-------------|
   | `NODE_ENV` | `production` | Enables production error redaction & compression |
   | `PORT` | `10000` | Port assigned by Render |
   | `MONGODB_URI` | `mongodb+srv://...` | MongoDB connection string |
   | `JWT_SECRET` | 32+ char random hex | Secret for signing access tokens |
   | `JWT_REFRESH_SECRET` | 32+ char random hex | Secret for signing refresh tokens |
   | `JWT_EXPIRES_IN` | `15m` | Access token lifespan |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifespan |
   | `CLIENT_URL` | `https://<your-vercel-domain>.vercel.app` | CORS allowed origin |
   | `CLOUDINARY_CLOUD_NAME` | `<cloud_name>` | Cloudinary account name |
   | `CLOUDINARY_API_KEY` | `<api_key>` | Cloudinary key |
   | `CLOUDINARY_API_SECRET` | `<api_secret>` | Cloudinary secret |

---

## 4. Frontend Deployment (Vercel)

1. Log into [Vercel](https://vercel.com) and click **Add New Project**.
2. Import the GitHub repository: `https://github.com/kannanvenkatesan0255-wq/youtube.git`.
3. Configure the Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client` (or set Build Command to `npm run build --workspace=client` if using root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Configure Environment Variables:
   | Key | Value | Description |
   |-----|-------|-------------|
   | `VITE_API_BASE_URL` | `https://vidtube-api.onrender.com/api` | Render backend API base |
   | `VITE_SOCKET_URL` | `https://vidtube-api.onrender.com` | Real-time WebSocket server |
5. Click **Deploy**. Vercel will build the optimized production bundle with manual code-splitting.

---

## 5. Post-Deployment Verification Checklist

Verify all services with the following test sequence:

- [ ] **Health Endpoint**: Visit `https://vidtube-api.onrender.com/api/health`. Should return `{ "status": "healthy", "database": { "status": "connected" } }`.
- [ ] **Frontend Loading**: Visit your Vercel URL. Should display the VidTube home page with zero console errors.
- [ ] **User Registration**: Create a new account. Channel should auto-provision instantly.
- [ ] **Video Upload**: Navigate to upload page, select a video file, submit metadata. Video should process and transition to `ready`.
- [ ] **Adaptive Playback**: Play the uploaded video. HLS stream or Cloudinary MP4 delivery should stream smoothly with custom controls.
- [ ] **Shorts Vertical Feed**: Open `/shorts`. Should scroll vertically through available shorts with interactive like/comment sidebars.
- [ ] **Real-Time Notification**: Open two browser tabs with different accounts. Have one account like or comment on the other's video. Notification badge should update in real-time via Socket.IO.
- [ ] **Creator Studio**: Open `/studio`. View real-time aggregated metrics, continuous timeseries charts, and CSV export.
- [ ] **Admin Control Center**: Log in as an administrator. Navigate to `/admin` to verify platform analytics, report resolution, and audit logs.

---

## 6. Maintenance & Performance Tuning

### Database Index Verification
Ensure all primary compound indexes are built by running:
```bash
npm run test:e2e --workspace=server
```

### Automated Database Backups
In MongoDB Atlas, enable Continuous Cloud Backups with point-in-time recovery (PITR) under **Backup** > **Policies**.

### Monitoring & Logs
- **Backend Logs**: Available live in the Render service dashboard or via the Render CLI (`render logs`).
- **Frontend Analytics**: Web Vitals are automatically tracked under Vercel **Speed Insights**.
- **Audit Logs**: Platform-level administrative events are recorded in the `auditlogs` MongoDB collection and visible at `/admin/audit-logs`.
