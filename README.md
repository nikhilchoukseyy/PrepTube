# PrepTube

PrepTube is a collaborative learning platform built around YouTube playlists. Users can import playlists, track watch progress, study together in shared rooms, and chat in real time instead of learning alone in separate tabs.

> Product stage: pre-launch MVP

## Overview

PrepTube currently supports:

- Google OAuth and optional email/password auth
- playlist import from the YouTube Data API
- a marketing landing page at `/`
- a dedicated course dashboard at `/courses`
- a public explore feed at `/explore`
- a pricing page at `/pricing`
- invite-link joining through `/join/:token`
- shared playlist workspaces at `/video/:id`
- per-user progress tracking
- per-playlist streak tracking
- persistent invite tokens
- public/private playlist visibility
- member leave/remove flows
- text, image, and voice chat
- freemium member-limit enforcement

## Business Model

PrepTube uses a freemium collaboration model:

- Free plan: up to 5 collaborators per playlist room
- Premium plan: unlimited collaborators per playlist room

The backend enforces this limit when a user joins a playlist. If a free playlist has already reached the member cap, the API returns a `403` with `MEMBER_LIMIT_REACHED`, and the frontend redirects the user to `/pricing` with an upgrade prompt.

## Current Routes

### Frontend

| Route | Purpose |
|---|---|
| `/` | Marketing landing page |
| `/courses` | Authenticated user's playlist dashboard |
| `/explore` | Public playlist feed |
| `/pricing` | Freemium pricing page |
| `/join/:token` | Invite-link join flow |
| `/login` | Login page |
| `/register` | Register page |
| `/auth/callback` | OAuth callback handler |
| `/video/:id` | Shared playlist workspace |
| `/profile` | Profile settings |

### Backend API

#### Auth: `/api/auth`

- `GET /google`
- `GET /google/callback`
- `GET /protected`

#### Users: `/api/users`

- `POST /register`
- `POST /login`
- `GET /me`
- `PATCH /profile`

#### Playlists: `/api/playlists`

- `POST /create`
- `GET /my-playlists`
- `GET /explore`
- `GET /:playlistId/details`
- `POST /mark`
- `POST /unmark`
- `POST /join`
- `GET /:playlistId/chats`
- `POST /:playlistId/invite`
- `POST /:playlistId/leave`
- `DELETE /:playlistId/members/:userId`
- `PATCH /:playlistId/visibility`
- `POST /:playlistId/time`
- `POST /:playlistId/chat/upload`
- `DELETE /:playlistId`

## Implemented Features

### Authentication and Identity

- Google OAuth is supported through Passport
- email/password register and login are also mounted
- every user has:
  - `username`
  - `avatar`
  - `plan` (`free` or `premium`)
- missing usernames and avatars are backfilled automatically during auth
- profile updates are supported from the UI and API

### Courses and Collaboration

- users can import a YouTube playlist into PrepTube
- each playlist becomes a collaborative room
- owners can generate a persistent invite token
- owners can regenerate the token at any time
- users can join through pasted token, invite link, or `/join/:token`
- members can leave a playlist
- owners can remove members
- owners can toggle playlists between public and private
- public playlists appear in Explore and can be joined directly

### Progress and Streaks

- users can mark and unmark completed videos
- playlist detail responses include personalized completion state
- per-user playlist streaks are tracked in `Asia/Kolkata`
- workspace time is logged periodically and on unload
- a day counts toward the streak once the user reaches 30 minutes in that playlist on that day

### Chat

- chat history is stored in MongoDB
- live updates are delivered via Socket.io
- sender payloads now include username and avatar
- supported message types:
  - `text`
  - `image`
  - `voice`
- the frontend supports:
  - image upload
  - browser voice recording with `MediaRecorder`
  - inline image rendering
  - inline audio playback

## Architecture

### High-Level System

```text
+-----------------------------------------------------------+
| Frontend: React + Vite                                    |
| - Landing page                                            |
| - Courses dashboard                                       |
| - Explore feed                                            |
| - Pricing page                                            |
| - Profile page                                            |
| - Join page                                               |
| - Video workspace                                         |
+-------------------+---------------------------+-----------+
                    |                           |
                    | HTTP/JSON via Axios       | WebSocket via Socket.io
                    |                           |
+-------------------v---------------------------v-----------+
| Backend: Express + Node HTTP server                       |
| - OAuth routes                                            |
| - User profile/auth APIs                                  |
| - Playlist APIs                                           |
| - Freemium enforcement                                    |
| - Streak logging                                          |
| - Chat persistence and socket delivery                    |
| - Media upload endpoint                                   |
+-------------------+---------------------------------------+
                    |
                    | Mongoose ODM
                    |
+-------------------v---------------------------------------+
| MongoDB                                                   |
| - users                                                   |
| - playlists                                               |
| - chatmessages                                            |
+-----------------------------------------------------------+

External services:
- Google OAuth 2.0
- YouTube Data API v3
- Cloudinary (for media uploads when configured)
```

### Frontend Structure

- [App.jsx](C:/Users/welcome/projects/PrepTube/frontend/src/App.jsx)
- [Navbar.jsx](C:/Users/welcome/projects/PrepTube/frontend/src/components/Navbar.jsx)
- [LandingPage.jsx](C:/Users/welcome/projects/PrepTube/frontend/src/pages/LandingPage.jsx)
- [CoursesPage.jsx](C:/Users/welcome/projects/PrepTube/frontend/src/pages/CoursesPage.jsx)
- [ExplorePage.jsx](C:/Users/welcome/projects/PrepTube/frontend/src/pages/ExplorePage.jsx)
- [PricingPage.jsx](C:/Users/welcome/projects/PrepTube/frontend/src/pages/PricingPage.jsx)
- [JoinPage.jsx](C:/Users/welcome/projects/PrepTube/frontend/src/pages/JoinPage.jsx)
- [VideoPage.jsx](C:/Users/welcome/projects/PrepTube/frontend/src/pages/VideoPage.jsx)
- [ProfilePage.jsx](C:/Users/welcome/projects/PrepTube/frontend/src/pages/ProfilePage.jsx)
- [ChatMessage.jsx](C:/Users/welcome/projects/PrepTube/frontend/src/components/ChatMessage.jsx)
- [StreakBadge.jsx](C:/Users/welcome/projects/PrepTube/frontend/src/components/StreakBadge.jsx)
- [auth.js](C:/Users/welcome/projects/PrepTube/frontend/src/utils/auth.js)
- [meta.js](C:/Users/welcome/projects/PrepTube/frontend/src/utils/meta.js)

### Backend Structure

- [server.js](C:/Users/welcome/projects/PrepTube/backend/server.js)
- [passport.js](C:/Users/welcome/projects/PrepTube/backend/config/passport.js)
- [authMiddleware.js](C:/Users/welcome/projects/PrepTube/backend/middleware/authMiddleware.js)
- [userController.js](C:/Users/welcome/projects/PrepTube/backend/controllers/userController.js)
- [playlistController.js](C:/Users/welcome/projects/PrepTube/backend/controllers/playlistController.js)
- [authRoutes.js](C:/Users/welcome/projects/PrepTube/backend/routes/authRoutes.js)
- [userRoutes.js](C:/Users/welcome/projects/PrepTube/backend/routes/userRoutes.js)
- [playlistRoutes.js](C:/Users/welcome/projects/PrepTube/backend/routes/playlistRoutes.js)
- [User.js](C:/Users/welcome/projects/PrepTube/backend/models/User.js)
- [Playlist.js](C:/Users/welcome/projects/PrepTube/backend/models/Playlist.js)
- [ChatMessage.js](C:/Users/welcome/projects/PrepTube/backend/models/ChatMessage.js)
- [socket/index.js](C:/Users/welcome/projects/PrepTube/backend/socket/index.js)
- [userIdentity.js](C:/Users/welcome/projects/PrepTube/backend/utils/userIdentity.js)
- [playlistAccess.js](C:/Users/welcome/projects/PrepTube/backend/utils/playlistAccess.js)

## Data Model

### User

Stored in [User.js](C:/Users/welcome/projects/PrepTube/backend/models/User.js).

Key fields:

- `name`
- `email`
- `username`
- `avatar`
- `password`
- `googleId`
- `role`
- `plan`
- `playlists`

### Playlist

Stored in [Playlist.js](C:/Users/welcome/projects/PrepTube/backend/models/Playlist.js).

Key fields:

- `playlistId`
- `title`
- `owner`
- `members`
- `isPublic`
- `inviteToken`
- `videos[]`
- `progress[]`

Progress stores:

- `completedVideos[]`
- `currentStreak`
- `longestStreak`
- `lastStreakDate`
- `dailyMinutes[]`

### ChatMessage

Stored in [ChatMessage.js](C:/Users/welcome/projects/PrepTube/backend/models/ChatMessage.js).

Key fields:

- `playlist`
- `sender`
- `message`
- `messageType`
- `mediaUrl`
- timestamps

## Data Flow

### OAuth Login Flow

```text
User clicks Google sign-in
-> frontend sends browser to /api/auth/google?redirect=...
-> backend starts OAuth
-> backend creates or updates user
-> backend signs JWT
-> backend redirects to /auth/callback with token + user payload
-> frontend stores auth state in localStorage
-> frontend redirects to requested route
```

### Playlist Import Flow

```text
User pastes YouTube playlist URL on /courses
-> frontend POST /api/playlists/create
-> backend extracts playlistId from YouTube URL
-> backend fetches playlist metadata and items from YouTube API
-> backend fetches durations for each video
-> backend stores normalized playlist document in MongoDB
-> frontend refreshes dashboard
```

### Join Flow

```text
User opens /join/:token or clicks Join on Explore
-> frontend POST /api/playlists/join
-> backend resolves token or public playlistId
-> backend checks free-tier member limit
-> backend adds user to members[] if allowed
-> frontend redirects to /video/:id
```

### Streak Flow

```text
User opens playlist workspace
-> frontend starts session timer
-> frontend POSTs time in intervals and on unload
-> backend adds minutes to today's entry in progress.dailyMinutes
-> backend recalculates current and longest streak
-> frontend updates streak badge
```

### Chat Flow

```text
User opens playlist workspace
-> frontend loads chat history via GET /:playlistId/chats
-> frontend opens Socket.io connection with JWT
-> socket joins playlist room
-> user sends text/image/voice message
-> backend validates access and stores ChatMessage
-> backend emits newMessage with sender username/avatar and payload
-> clients append message in real time
```

## Environment Variables

### Backend: `backend/.env`

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

YOUTUBE_API_KEY=your_youtube_data_api_key

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Notes:

- `FRONTEND_URL` may be comma-separated for multiple allowed origins
- Cloudinary vars are required if you want image and voice uploads to work
- invite links are generated from the first URL in `FRONTEND_URL`

### Frontend: `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Local Development

### Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Start backend

```bash
cd backend
npm run dev
```

### Start frontend

```bash
cd frontend
npm run dev
```

### Open locally

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

## Deployment Notes

- frontend is ready for Vercel and includes [vercel.json](C:/Users/welcome/projects/PrepTube/frontend/vercel.json)
- backend is structured for a single Express + Socket.io deployment on Railway or Render
- production OAuth callback URLs must exactly match your deployed backend origin
- Socket.io CORS depends on `FRONTEND_URL`
- if Cloudinary is not configured, text chat still works but image/voice uploads will fail with a configuration error

## Current Limitations

- premium billing is not implemented yet; only the data model and enforcement logic exist
- media upload currently assumes Cloudinary rather than supporting multiple storage providers
- explore is public-feed only and does not include SSR/prerendering yet
- streaks are tracked per playlist, not globally across all study rooms

## Repo Notes

- [index.html](C:/Users/welcome/projects/PrepTube/index.html) at the repository root is a separate standalone static file and is not part of the React app
- the frontend app entry HTML is [frontend/index.html](C:/Users/welcome/projects/PrepTube/frontend/index.html)

## Suggested Next Steps

1. configure Cloudinary in production and manually test image/voice chat
2. add payment integration for upgrading from free to premium
3. add sitemap/prerender support for stronger SEO on landing and explore
4. add automated tests around join limits, streak logging, and socket chat
