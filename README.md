# PrepTube 🎓

A full-stack collaborative video playlist management platform that enables users to create, share, and manage YouTube video playlists with real-time collaboration features, user authentication, and live chat functionality.

---
## 📖 Project Overview

**PrepTube** is a collaborative platform designed for users to:
- Create and manage video playlists from YouTube
- Share playlists with other users
- Track video progress within playlists
- Collaborate in real-time with chat functionality
- Manage user profiles and playlist permissions

The application is built with a modern tech stack featuring a React frontend and Node.js/Express backend with MongoDB as the database.

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│  (localhost:5173)                                           │
│  ├── Homepage                                               │
│  ├── Login/Register Pages                                   │
│  ├── Profile Page                                           │
│  └── Video Page                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (Axios) & WebSocket (Socket.io)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Backend (Express.js) (port: 5000)              │
│  ├── Routes (User, Auth, Playlist)                          │
│  ├── Controllers (Business Logic)                           │
│  ├── Models (Data Schema)                                   │
│  ├── Middleware (Auth, Error Handling)                      │
│  └── Socket.io Server (Real-time Chat)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ TCP/IP
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              MongoDB Database                               │
│  ├── Users Collection                                       │
│  ├── Playlists Collection                                   │
│  └── Chat Messages Collection                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

**Frontend Components:**
- **Navbar**: Navigation component visible across all pages
- **HomePage**: Main landing page with playlist browsing
- **LoginPage**: User authentication form
- **RegisterPage**: New user registration form
- **ProfilePage**: User profile and playlist management
- **VideoPage**: Playlist details and video player integration

**Backend Layers:**
- **Controllers**: Handle request logic
  - `userController.js`: User registration, login
  - `playlistController.js`: Playlist CRUD operations
  
- **Routes**: API endpoint definitions
  - `authRoutes.js`: Authentication endpoints
  - `userRoutes.js`: User management endpoints
  - `playlistRoutes.js`: Playlist management endpoints

- **Models**: MongoDB schemas
  - `User`: User data with hashed passwords
  - `Playlist`: Playlist with videos, members, and progress tracking
  - `ChatMessage`: Real-time chat messages

- **Middleware**: Cross-cutting concerns
  - `authMiddleware.js`: JWT token verification

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.1.1 | UI framework |
| Vite | Latest | Build tool & dev server |
| React Router DOM | 7.9.4 | Client-side routing |
| Tailwind CSS | 4.1.14 | Utility-first CSS framework |
| Axios | 1.6.0 | HTTP client |
| Socket.io Client | 4.8.1 | Real-time communication |
| ESLint | 9.36.0 | Code quality |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Express.js | 5.1.0 | Web framework |
| Node.js | Latest | Runtime environment |
| MongoDB | Latest | NoSQL database |
| Mongoose | 8.19.1 | MongoDB ODM |
| JWT | 9.0.2 | Authentication tokens |
| bcryptjs | 3.0.2 | Password hashing |
| Socket.io | 4.8.1 | Real-time bidirectional communication |
| Google APIs | 162.0.0 | YouTube integration |
| CORS | 2.8.5 | Cross-Origin Resource Sharing |
| dotenv | 17.2.3 | Environment variable management |
| Nodemon | 3.1.10 | Development auto-reload |

---

## 📁 Project Structure

```
PrepTube/
├── backend/                          # Node.js/Express backend
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── userController.js        # User auth logic
│   │   └── playlistController.js    # Playlist operations
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verification
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   ├── Playlist.js              # Playlist schema
│   │   └── ChatMessage.js           # Chat message schema
│   ├── routes/
│   │   ├── authRoutes.js            # Auth endpoints
│   │   ├── userRoutes.js            # User endpoints
│   │   └── playlistRoutes.js        # Playlist endpoints
│   ├── socket/
│   │   └── index.js                 # Socket.io setup
│   ├── package.json                 # Backend dependencies
│   └── server.js                    # Express app entry point
│
├── frontend/                         # React/Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx           # Navigation component
│   │   ├── pages/
│   │   │   ├── HomePage.jsx         # Home page
│   │   │   ├── LoginPage.jsx        # Login page
│   │   │   ├── RegisterPage.jsx     # Registration page
│   │   │   ├── ProfilePage.jsx      # User profile
│   │   │   └── VideoPage.jsx        # Playlist/video page
│   │   ├── App.jsx                  # Main app component
│   │   ├── main.jsx                 # React entry point
│   │   ├── App.css                  # App styles
│   │   ├── index.css                # Global styles
│   │   └── assets/                  # Static assets
│   ├── public/                       # Public assets
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── eslint.config.js             # ESLint configuration
│   └── index.html                   # HTML entry point
│
├── index.html                        # Root HTML file
├── demo.tldr                         # Tldraw diagram file
└── README.md                         # This file
```

---

## ✨ Features

### User Management
- **User Registration**: Create new user accounts with email and password
- **User Authentication**: Login with JWT token generation (30-day expiration)
- **Password Hashing**: Secure password storage using bcryptjs
- **User Profiles**: View and manage user information

### Playlist Management
- **Create Playlists**: Users can create custom playlists
- **Add Videos**: Integrate YouTube videos into playlists
- **Share Playlists**: Share playlists with other users via invite tokens
- **Playlist Members**: Track playlist owners and members
- **Video Metadata**: Store video titles, thumbnails, and durations

### Collaboration Features
- **Progress Tracking**: Track completed videos for each user in a playlist
- **Real-time Chat**: Live messaging within playlists using Socket.io
- **Invite System**: Use tokens to invite users to playlists

### Real-time Communication
- **WebSocket Connections**: Bi-directional real-time updates
- **Authenticated Socket.io**: JWT token verification for socket connections
- **Chat Messages**: Store and broadcast chat messages in real-time

---
