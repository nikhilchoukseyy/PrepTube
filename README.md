# PrepTube 🎓

A full-stack collaborative video playlist management platform that enables users to create, share, and manage YouTube video playlists with real-time collaboration features, user authentication, and live chat functionality.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Real-time Features](#real-time-features)
- [Authentication](#authentication)
- [Configuration](#configuration)
- [Contributing](#contributing)

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

## 💻 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- MongoDB (local or Atlas)
- Git

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** with the following variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/preptube
   JWT_SECRET=your_jwt_secret_key_here
   GOOGLE_API_KEY=your_google_api_key_here
   NODE_ENV=development
   ```

4. **Configure MongoDB**
   - Ensure MongoDB is running on your system or update `MONGODB_URI` with your MongoDB Atlas connection string

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** (if needed for API configuration):
   ```env
   VITE_API_URL=http://localhost:5000
   ```

---

## 🚀 Running the Application

### Start Backend Server

```bash
cd backend
npm start          # Production mode
# OR
npm run dev        # Development mode with nodemon
```

The backend will run on `http://localhost:5000`

### Start Frontend Development Server

In a new terminal:
```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

### Build Frontend for Production

```bash
cd frontend
npm run build
npm run preview
```

### Run Linter

```bash
cd frontend
npm run lint
```

---

## 🔌 API Endpoints

### Authentication Routes (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/register` | Register a new user | No |
| POST | `/login` | User login (returns JWT token) | No |
| GET | `/protected` | Protected route example | Yes |

### User Routes (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/` | Get all users | Yes |
| GET | `/:id` | Get user by ID | Yes |
| PUT | `/:id` | Update user profile | Yes |
| DELETE | `/:id` | Delete user account | Yes |

### Playlist Routes (`/api/playlists`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/` | Create new playlist | Yes |
| GET | `/` | Get all playlists | Yes |
| GET | `/:id` | Get playlist by ID | Yes |
| PUT | `/:id` | Update playlist | Yes |
| DELETE | `/:id` | Delete playlist | Yes |
| POST | `/:id/members` | Add member to playlist | Yes |
| DELETE | `/:id/members/:userId` | Remove member from playlist | Yes |
| POST | `/:id/invite` | Generate invite token | Yes |
| POST | `/:id/join` | Join playlist with invite token | Yes |
| POST | `/:id/videos` | Add video to playlist | Yes |
| DELETE | `/:id/videos/:videoId` | Remove video from playlist | Yes |
| PUT | `/:id/progress` | Update user progress | Yes |

---

## 🗄️ Database Schema

### User Schema
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (default: "user"),
  playlists: [ObjectId], // References to Playlist documents
  createdAt: Date,
  updatedAt: Date
}
```

### Playlist Schema
```javascript
{
  _id: ObjectId,
  playlistId: String (required), // YouTube playlist ID
  title: String (required),
  owner: ObjectId, // User reference
  members: [ObjectId], // User references
  videos: [
    {
      videoId: String,
      title: String,
      thumbnail: String,
      duration: String,
      durationSeconds: Number
    }
  ],
  progress: [
    {
      user: ObjectId,
      completedVideos: [String] // Array of video IDs
    }
  ],
  inviteTokens: [
    {
      token: String,
      createdAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### ChatMessage Schema
```javascript
{
  _id: ObjectId,
  playlistId: ObjectId, // Reference to Playlist
  userId: ObjectId, // Reference to User
  message: String,
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## ⚡ Real-time Features

### Socket.io Events

#### Emitted by Server
- **chat-message**: Broadcasts new chat messages to all connected users in a playlist
- **user-joined**: Notifies when a user joins the playlist room
- **user-left**: Notifies when a user leaves the playlist room
- **progress-updated**: Updates when user completes a video

#### Received by Server
- **send-message**: Client sends a new chat message
- **join-playlist**: Client joins a specific playlist's chat room
- **leave-playlist**: Client leaves a specific playlist's chat room
- **update-progress**: Client marks a video as completed

### Authentication Flow
- Socket.io connections require JWT token in the handshake
- Token is verified before allowing any socket operations
- User information is attached to the socket object for tracking

---

## 🔐 Authentication

### JWT Token Generation
- Generated upon user login
- Expires in 30 days
- Stored with secret key (`JWT_SECRET`) in environment variables
- Used for all protected API routes and socket connections

### Password Security
- Passwords are hashed using bcryptjs with salt rounds of 10
- Original passwords are never stored in the database
- Password comparison is done during login using `matchPassword` method

### Protected Routes
- Middleware (`authMiddleware.js`) verifies JWT tokens on protected endpoints
- Token must be sent in the `Authorization` header as `Bearer <token>`

---

## ⚙️ Configuration

### Environment Variables

**Backend (.env)**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/preptube
JWT_SECRET=your_secret_key
GOOGLE_API_KEY=your_google_api_key
NODE_ENV=development
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:5000
```

### CORS Configuration
- Frontend: `http://localhost:5173`
- Methods: GET, POST, PUT, DELETE
- Credentials: Enabled

### MongoDB Connection
- Uses Mongoose ODM for schema validation and data modeling
- Connection string from `.env` file
- Auto-connection with error handling

---

## 📝 Development Guidelines

### Code Structure
- **Controllers**: Contain business logic and database operations
- **Routes**: Define API endpoints and middleware
- **Models**: Define data schemas with validation
- **Middleware**: Handle cross-cutting concerns like authentication

### Naming Conventions
- Controllers: `{Entity}Controller.js` (e.g., `userController.js`)
- Routes: `{entity}Routes.js` (e.g., `authRoutes.js`)
- Models: `{Entity}.js` (e.g., `Playlist.js`)

### Error Handling
- All routes should have try-catch blocks
- Return appropriate HTTP status codes
- Send descriptive error messages to client

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 🆘 Troubleshooting

### Backend Won't Connect to MongoDB
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env` file
- Verify MongoDB is accessible on the specified port

### CORS Errors
- Ensure frontend URL matches the one in server CORS configuration
- Check that both frontend and backend are running on correct ports

### Socket.io Connection Issues
- Verify JWT token is being sent correctly
- Check browser console for WebSocket errors
- Ensure backend socket server is properly initialized

### Port Already in Use
- Change port in `.env` file or use: `kill -9 $(lsof -t -i :5000)`

---

## 📞 Support

For issues or questions, please open an issue on the repository or contact the development team.

---

**Happy Coding! 🚀**
