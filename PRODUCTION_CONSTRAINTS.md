# PrepTube Production Constraints

Last reviewed: April 1, 2026

This document focuses on production constraints in the current PrepTube codebase. It is based on the implementation in this repository today, not on a future target architecture.

It covers:

- hard limits enforced by the app
- scalability constraints in the current design
- reliability and failure-mode risks
- third-party and free-tier dependencies
- what is likely to happen as usage grows
- what to improve next

## 1. Current Production Shape

Today PrepTube is effectively a monolithic web app with a single backend runtime:

- one Node.js process serves REST APIs and Socket.IO
- MongoDB stores users, playlists, and chat messages
- playlist progress and notes are embedded inside the playlist document
- media uploads go through the backend and then to Cloudinary
- YouTube playlist imports happen synchronously inside the request cycle
- payment order state is stored in server memory
- emails are sent directly from the request path through Gmail/Nodemailer

That shape is good for an MVP, but it has clear production ceilings.

## 2. Highest-Risk Production Constraints

These are the most important constraints to understand before public launch:

1. Payment verification is not durable.
   `backend/controllers/paymentController.js` keeps order state in an in-memory `Map`. A restart loses order state, and multiple backend instances will not share it.

2. Premium upgrades are vulnerable to repeated verification.
   The current `verifyPayment` flow does not stop a previously verified order from extending premium again if the endpoint is replayed with valid data.

3. Horizontal scaling is not ready.
   Socket.IO uses in-process rooms only. If you run more than one backend instance, chat delivery will be inconsistent unless you add a shared adapter such as Redis and ensure compatible session routing.

4. Playlist documents will grow with usage.
   Members, per-user progress, daily streak minutes, and per-video notes all live inside a single playlist document. Large rooms and long-lived rooms will create write contention and document growth pressure.

5. Media uploads are inefficient for scale.
   The client sends base64 file data to the backend as JSON, and the backend forwards it to Cloudinary. This increases payload size, memory pressure, and backend bandwidth.

6. Abuse protection is missing.
   There is no request rate limiting, no brute-force protection on login/reset, no chat throttling, and no upload throttling.

7. Observability is thin.
   There is no structured logging, no metrics pipeline, no health check strategy, no queue visibility, and no automated tests. PostHog is optional and silently disabled if keys are missing.

8. Several external dependencies are in the hot path.
   YouTube, Cloudinary, Gmail, Razorpay, Google OAuth, and MongoDB outages can directly impact user actions.

## 3. Hard Limits Enforced By The Current Code

These come directly from the codebase today.

| Area | Current limit / behavior | Source in repo |
| --- | --- | --- |
| Free room size | `6` total people including owner | `backend/middleware/planMiddleware.js` |
| Premium room size | No app-enforced join cap while premium is active | `backend/middleware/planMiddleware.js` |
| One room per YouTube playlist | Global uniqueness on `playlistId` | `backend/models/Playlist.js` |
| JSON request body size | `25mb` max | `backend/server.js` |
| Password reset token expiry | `15` minutes | `backend/controllers/userController.js` |
| JWT lifetime | `30d` | `backend/controllers/userController.js`, `backend/routes/authRoutes.js` |
| Notes per video | `5000` characters max | `backend/controllers/playlistController.js` |
| Public playlist topics | `12` topics max, `40` chars each | `backend/utils/playlistTopics.js` |
| Explore feed | No search, no pagination, sorted by `updatedAt` | `backend/controllers/playlistController.js` |
| Chat history fetch | Latest `50` messages only | `backend/controllers/playlistController.js` |
| Avatar payload | max length `1_500_000` chars for URL/data URI | `backend/utils/userIdentity.js` |
| Question form | `2000` characters max | `backend/controllers/userController.js` |
| Manual email signup | Gmail / Google Mail addresses only | `backend/controllers/userController.js` |
| Voice upload from browser | client rejects audio files above `5MB` | `frontend/src/pages/VideoPage.jsx` |
| Image upload from browser | compressed client-side to about `0.5MB` target | `frontend/src/pages/VideoPage.jsx` |
| Study-time sync cadence | every `5` minutes and on visibility/unload | `frontend/src/pages/VideoPage.jsx` |
| Streak timezone | `Asia/Kolkata` only | `backend/utils/userIdentity.js` |

## 4. Data Model Constraints

### Playlist document growth

The current playlist document stores:

- all videos in the playlist
- all members
- all progress rows
- all completed video ids per user
- all streak daily minute entries per user
- all private notes for all users

This design is simple, but it creates several production limits:

- the document grows in many dimensions at once
- many user actions update the same document
- large rooms increase lock contention and write amplification
- long-lived rooms accumulate `dailyMinutes` indefinitely
- notes and progress reads become more expensive as membership grows

MongoDB documents have a maximum BSON size of 16 MB. That means a single popular playlist can eventually hit a hard storage ceiling if you keep embedding more progress, notes, and streak history in the same document.

Official reference:
- https://www.mongodb.com/docs/manual/core/document/

### Chat storage

Chat messages are stored separately, which is good, but there are still constraints:

- no pagination API yet
- only the latest 50 messages are fetchable over REST
- no retention policy
- no stored Cloudinary `public_id`, so media cleanup is hard later

### User storage

User avatars can be stored as large data URLs or third-party URLs:

- data URLs inflate document size
- remote URLs can break later
- there is no dedicated avatar storage pipeline or cleanup path

## 5. Scalability Constraints By Subsystem

### 5.1 Backend runtime

Current state:

- single HTTP server
- single Socket.IO server
- no worker queue
- no shared cache
- no distributed lock

What happens under load:

- playlist imports tie up request workers while calling YouTube repeatedly
- media uploads consume backend memory and outbound bandwidth
- bursty chat traffic competes with normal API traffic on the same process
- a slow external dependency can degrade the whole app

What to improve:

- separate API/websocket concerns from long-running jobs
- move playlist import to a background job queue
- add Redis for Socket.IO adapter and lightweight caching
- add health checks, readiness checks, graceful shutdown, and structured logs

### 5.2 Real-time chat

Current state:

- room membership is in process memory inside Socket.IO
- each message does a DB write before broadcast
- no flood control
- no per-message max length on the server

Scale effects:

- one noisy room can impact everyone
- multiple backend instances will split rooms unless a shared adapter is added
- very large text payloads can bloat memory and storage

What to improve:

- add Redis adapter for Socket.IO
- add server-side max message length
- add per-user and per-room rate limits
- consider persistence batching or async fanout if chat volume grows

### 5.3 Playlist import

Current state:

- import is synchronous
- YouTube API calls are sequential and pagination-based
- there is no caching, deduped fetch layer, or retry queue

Quota inference from current code:

- `playlists.list` costs 1 unit
- each `playlistItems.list` page costs 1 unit
- each `videos.list` page costs 1 unit
- the current import path is roughly:
  `1 + ceil(videoCount / 50) + ceil(videoCount / 50)` quota units

Examples:

| Playlist size | Approx. YouTube quota used per import |
| --- | --- |
| 50 videos | `3` units |
| 100 videos | `5` units |
| 250 videos | `11` units |
| 500 videos | `21` units |

This is efficient, but high import volume can still exhaust quota quickly if many users import many playlists in the same day.

### 5.4 Payments

Current state:

- order creation goes to Razorpay
- verification depends on in-memory order state
- no webhook reconciliation
- no persistent payment collection
- no idempotency protection on successful verification

Production impact:

- server restart can strand legitimate payments
- horizontally scaled backends will disagree about order state
- disputes, refunds, and audit trails are hard to manage
- replayed verify requests can extend premium more than once

What to improve:

- persist orders and payment events in MongoDB
- add idempotency rules keyed by order id and payment id
- add Razorpay webhook verification
- add billing history and admin reconciliation tools

### 5.5 Email

Current state:

- emails are sent directly through Gmail transport
- welcome and reset emails are sent from request paths
- failures are only logged

Production impact:

- request latency depends on Gmail responsiveness
- Gmail rate limits can block password resets and onboarding
- app passwords add operational fragility

What to improve:

- move mail sending to a queue
- switch to a transactional email provider for production
- add retry policy, bounce handling, and alerting

### 5.6 Explore feed

Current state:

- full public feed query
- no pagination
- no search
- no ranking beyond latest update

Production impact:

- feed payload size keeps growing
- response times degrade as public rooms increase
- mobile users pay the cost first

What to improve:

- add pagination
- add text search or Atlas Search / Elasticsearch equivalent
- precompute ranking fields if discovery matters

## 6. Reliability And Failure Modes

| Failure | Current behavior | Production risk |
| --- | --- | --- |
| Backend restart during payment flow | order state lost from memory | user can pay but fail verification |
| Backend restart during active chat | sockets disconnect, rooms disappear | temporary message disruption |
| Multi-instance deployment | socket rooms and payment state diverge | broken chat + broken billing |
| Cloudinary outage | chat media upload fails | image/voice chat degraded |
| Gmail issue or limit reached | reset/welcome email fails | password recovery blocked |
| YouTube quota exhausted or API error | import fails synchronously | poor onboarding/import experience |
| Mongo latency spike | all major features slow down | broad app degradation |
| Partial delete failure | no transaction around multi-step cleanup | orphaned records possible |
| Browser closes before time flush | some study minutes may be lost | streak accuracy drift |

Additional reliability gaps:

- no retry queue for imports, emails, or uploads
- no circuit breaker or timeout strategy around third-party services
- no dead-letter handling
- no disaster-recovery procedure documented
- no automated backup strategy documented in the app

## 7. Security And Abuse Constraints

Current security posture is MVP-level, not hardened production.

Main constraints:

- JWT is stored in `localStorage`, so XSS has high blast radius
- Google OAuth callback forwards JWT in the URL query string to the frontend callback page
- no refresh-token rotation or token revocation list
- no rate limits on login, signup, password reset, join, note save, or uploads
- no anti-spam controls for chat
- no explicit file scanning or malware checks on uploaded media
- no `helmet` or similar hardening middleware in `server.js`
- no CSP policy is documented here
- no CSRF layer for cookie auth, although current auth uses bearer tokens
- no role-based moderation tools outside basic admin role checks
- invite links are persistent until manually regenerated

Recommended minimum hardening before broad public launch:

1. add request rate limiting
2. add input validation schemas
3. add CSP and standard security headers
4. move auth away from URL token handoff
5. consider httpOnly cookie auth if that fits the frontend
6. add chat and upload abuse controls

## 8. Third-Party And Free-Tier Dependency Limits

These values were checked on April 1, 2026 using official vendor docs. Re-verify before launch because vendors change pricing and limits.

| Service | Relevant current free-tier / default limit | Why it matters to PrepTube | Official source |
| --- | --- | --- | --- |
| YouTube Data API | default `10,000` quota units per day, resets at midnight Pacific Time; invalid requests still cost quota | playlist import depends on this quota | https://developers.google.com/youtube/v3/determine_quota_cost |
| MongoDB Atlas `M0` if you use it | `0.5 GB` storage, `500` max connections, `100` ops/sec, `10 GB` in and `10 GB` out over rolling 7 days, auto-pauses after `30` days inactivity | embedded playlist docs and chat growth can hit this fast | https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/ |
| Cloudinary free | `25` monthly credits; compare-plans page also lists max image file size `10 MB` and max video file size `100 MB` on Free | image and voice chat depend on this | https://cloudinary.com/pricing and https://cloudinary.com/pricing/compare-plans |
| PostHog free | `1 million` product analytics events per month; `5,000` recordings per month; `1 million` feature-flag requests per month | analytics is optional today, but volume grows quickly | https://posthog.com/pricing |
| Vercel Hobby for frontend | intended for personal, non-commercial use; includes `100 GB` fast data transfer on plan docs | okay for MVP frontend, not ideal for commercial launch | https://vercel.com/docs/plans/hobby and https://vercel.com/docs/plans |
| Personal Gmail | roughly `500` emails per day / recipients per day for standard Gmail accounts | password reset and welcome emails can hit this sooner than expected | https://support.google.com/mail/answer/22839 |
| Google Workspace Gmail | up to `2,000` messages/day per user for standard Workspace sending limits | relevant if you move mail to Workspace but keep Gmail-based sending | https://support.google.com/a/answer/166852 |
| Google App Passwords | require 2-Step Verification and are not Google's preferred auth path | this is how Nodemailer Gmail setups are often kept running | https://support.google.com/accounts/answer/185833 |

Notes:

- Razorpay is not really a "free tier" dependency in the same way, but payment reliability depends on webhook support and your operational handling more than plan limits.
- Google OAuth itself is not the main quota risk here; YouTube Data API quota is the bigger operational limit.
- DiceBear avatar generation is another external dependency, but the bigger production issue is availability and latency, not a clearly documented free-tier ceiling in this code path.

## 9. What Happens As User Count Increases

These are directional estimates based on the current code paths. They are not load-test results.

| Usage stage | What will likely break first | What users will feel | What you should do |
| --- | --- | --- | --- |
| `0-100` DAU | mostly okay if usage is light | occasional import or email failures | launch with monitoring, backups, and payment persistence first |
| `100-500` DAU | YouTube quota, Gmail sending, and larger playlist docs start to matter | slower imports, occasional failed reset emails, slower room loads | move email to provider, persist payments, add rate limits, add monitoring |
| `500-2,000` DAU | single backend process becomes hot; Socket.IO and media uploads compete with APIs | chat lag, slower pages, intermittent upload pain | add Redis, direct uploads, queue imports, split concerns |
| `2,000-10,000` DAU | embedded playlist model and public-feed queries become the main structural limits | room details slow down, popular rooms feel worse than normal rooms | break out progress/notes into separate collections, add pagination/search |
| `10,000+` DAU | current architecture stops being comfortable to operate | reliability becomes inconsistent without strong ops | move to durable job system, real observability, multi-instance infra, better data model |

## 10. Priority Improvement Roadmap

### Before opening to real users

1. persist payment orders and verification results in MongoDB
2. make payment verification idempotent
3. add rate limiting to auth, joins, chat, and uploads
4. add error monitoring and structured logs
5. document backup and restore

### Before marketing or paid traffic

1. move email sending to a transactional provider
2. add direct-to-Cloudinary signed uploads
3. add pagination to chat and Explore
4. add webhook-based payment reconciliation
5. add automated tests for joins, premium limits, streaks, notes, and chat

### Before multi-instance scaling

1. add Redis adapter for Socket.IO
2. move long-running imports into background jobs
3. add health checks and graceful shutdown
4. add a persistent cache where it helps
5. separate hot write paths from large playlist documents

### Before large shared rooms or high retention

1. split `playlist progress`, `video notes`, and maybe `streak history` into separate collections
2. add archival or retention rules for old chat media and old chat messages
3. store Cloudinary `public_id` so media can be deleted
4. add search and ranking for Explore
5. add moderation and spam controls

## 11. Suggested Target Architecture

If PrepTube starts gaining real usage, a more durable next-step architecture would look like this:

- frontend stays on Vercel or equivalent static host
- backend API runs on dedicated Node instances
- Socket.IO uses Redis adapter
- background jobs handle playlist import, email, and payment reconciliation
- MongoDB stores durable payment, progress, notes, and chat metadata separately
- Cloudinary uploads happen directly from client using signed uploads
- PostHog or another stack is backed by real monitoring and alerting

## 12. Practical Bottom Line

PrepTube can support an MVP launch in its current shape, but it is not yet production-hardened for commercial scale.

The three biggest upgrades to make first are:

1. durable payments
2. abuse protection plus observability
3. a data model that does not keep all room activity inside one playlist document

If you only fix those three areas, the product becomes much safer to launch and much easier to scale.
