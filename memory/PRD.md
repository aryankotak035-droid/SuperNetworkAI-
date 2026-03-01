# SuperNetworkAI - Product Requirements Document

## Original Problem Statement
SuperNetworkAI is an AI-powered, intent-based matchmaking web app for founders, builders, and clients. Instead of rigid keyword searches, it uses natural language queries and a Two-Stage RAG pipeline (pgvector retrieval → LLM re-ranking) to semantically match users based on their Ikigai — their passions, skills, mission, and working style.

## Core Requirements (MVP)
- **Auth:** Google OAuth via Emergent-managed authentication
- **Onboarding:** AI Ikigai extraction from pasted text. User can edit before saving.
- **Profile:** Generate embedding on save and store in PostgreSQL with pgvector. Public/Private visibility toggle.
- **Discovery:** Natural Language search triggers a two-stage matching process (pgvector retrieval -> gpt-4o-mini re-ranking).
- **Results:** Display ranked results with a 1-sentence AI match summary.
- **Filtering:** Filter results by Cofounder, Teammate, or Client role.
- **Networking:** Send connection requests and messaging.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Framer Motion, Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL with pgvector extension
- **AI:** OpenAI API (gpt-4o-mini for generation, text-embedding-3-small for embeddings)
- **Authentication:** Emergent-managed Google OAuth

## What's Been Implemented

### Completed Features ✅

#### Core Features (Dec 2025)
1. **PostgreSQL + pgvector Migration**
   - Migrated from MongoDB to PostgreSQL with pgvector extension
   - Created proper schema with vector similarity index (HNSW)
   - Seeded 10 sample profiles with embeddings

2. **Google OAuth Authentication**
   - Login/logout via Emergent-managed Google OAuth
   - Session management with cookies and Bearer tokens

3. **AI-Powered Ikigai Extraction**
   - Interactive chatbot for profile creation
   - Uses gpt-4o-mini to extract passion, skills, mission, working style

4. **Two-Stage Semantic Search**
   - Stage 1: pgvector cosine similarity search (top 15)
   - Stage 2: LLM re-ranking with intent-aware weighting
   - Returns top 3 matches with AI explanation

5. **Profile Management**
   - View and edit profile
   - Profile completeness indicator (percentage + missing fields)
   - Public/private visibility toggle

6. **Networking Features**
   - Send/accept/reject connection requests
   - View sent/received/accepted connections

7. **Messaging System**
   - Conversation list with unread counts
   - Real-time messaging with WebSocket support
   - Polling fallback when WebSocket unavailable

8. **Dashboard with Filters**
   - Role-based filtering (Cofounder/Teammate/Client)
   - Skills-based filtering
   - Profile completeness indicator in header

#### New Features (Dec 2025 - Latest)
9. **Profile Image Upload**
   - Local file storage at /app/backend/uploads/profiles/
   - Max file size: 5MB
   - Supported types: JPEG, PNG, WebP, GIF
   - Image displayed in profile, dashboard cards, and search results

10. **Search History**
    - Saves last 10 searches per user
    - Quick access via history toggle button in search bar
    - Delete individual items or clear all history
    - Clicking a history item re-runs the search with filters

11. **Theme Persistence**
    - Enhanced localStorage-based theme storage
    - System preference detection (prefers-color-scheme)
    - Smooth animated transition between themes

12. **Interactive Animations**
    - Added hover-lift and hover-glow effects for cards
    - Staggered list animations for profile cards
    - Button bounce feedback on click
    - Shimmer loading effects
    - Floating animation for decorative elements

## API Endpoints

### Authentication
- `POST /api/auth/session` - Google OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Profile
- `POST /api/profile/extract-ikigai` - AI Ikigai extraction
- `POST /api/profile/create` - Create profile with embedding
- `PUT /api/profile/me` - Update profile
- `GET /api/profile/me` - Get own profile
- `GET /api/profile/completeness` - Get profile completeness score
- `GET /api/profile/{profile_id}` - Get profile by ID
- `PUT /api/profile/visibility` - Toggle visibility
- `POST /api/profile/image` - Upload profile image (NEW)
- `DELETE /api/profile/image` - Delete profile image (NEW)

### Search
- `POST /api/search` - Semantic search with filters
- `GET /api/search/history` - Get search history (NEW)
- `DELETE /api/search/history/{id}` - Delete single history item (NEW)
- `DELETE /api/search/history` - Clear all history (NEW)

### Connections
- `POST /api/connections/request` - Send connection request
- `GET /api/connections/my` - Get user's connections
- `PUT /api/connections/{id}/respond` - Accept/reject connection

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/{profile_id}` - Get messages with user
- `WS /api/ws/{user_id}` - WebSocket for real-time messaging

### Static Files
- `GET /api/uploads/profiles/{filename}` - Serve profile images (NEW)

## Database Schema

```sql
-- Users table
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table with pgvector embedding
CREATE TABLE profiles (
    profile_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE REFERENCES users(user_id),
    full_name VARCHAR(255) NOT NULL,
    role_intent VARCHAR(20) CHECK (role_intent IN ('COFOUNDER', 'TEAMMATE', 'CLIENT')),
    skills TEXT[],
    portfolio_url TEXT,
    profile_image TEXT, -- NEW
    visibility_public BOOLEAN DEFAULT TRUE,
    profile_embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ikigai table
CREATE TABLE ikigai (
    ikigai_id VARCHAR(50) PRIMARY KEY,
    profile_id VARCHAR(50) UNIQUE REFERENCES profiles(profile_id),
    passion TEXT NOT NULL,
    skillset TEXT NOT NULL,
    mission TEXT NOT NULL,
    working_style_availability TEXT NOT NULL
);

-- Search History table (NEW)
CREATE TABLE search_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(user_id),
    query TEXT NOT NULL,
    role_filter VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connections table
CREATE TABLE connections (
    connection_id VARCHAR(50) PRIMARY KEY,
    sender_id VARCHAR(50) REFERENCES profiles(profile_id),
    receiver_id VARCHAR(50) REFERENCES profiles(profile_id),
    status VARCHAR(20) CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    message_id VARCHAR(50) PRIMARY KEY,
    sender_id VARCHAR(50) REFERENCES profiles(profile_id),
    receiver_id VARCHAR(50) REFERENCES profiles(profile_id),
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Remaining Tasks (Backlog)

### P2 - Medium Priority
- [ ] Block user functionality
- [ ] Profile analytics (views, match rate)

### P3 - Nice to Have
- [ ] Mobile-responsive refinements
- [ ] Email notifications for connections
- [ ] Export profile data

## File Structure
```
/app
├── backend/
│   ├── .env
│   ├── requirements.txt
│   ├── server.py
│   ├── uploads/
│   │   └── profiles/  (profile images)
│   ├── scripts/
│   │   └── seed_postgres.py
│   └── tests/
│       ├── test_supernetwork_api.py
│       └── test_new_features.py
└── frontend/
    ├── .env
    ├── package.json
    └── src/
        ├── App.js
        ├── index.css (enhanced animations)
        ├── components/
        │   ├── ProfileCompleteness.js
        │   ├── ProfileImageUpload.js (NEW)
        │   ├── SearchHistory.js (NEW)
        │   ├── SkeletonLoaders.js
        │   ├── ThemeToggle.js (ENHANCED)
        │   └── ui/
        └── pages/
            ├── Landing.js
            ├── AuthCallback.js
            ├── Dashboard.js
            ├── Profile.js
            ├── IkigaiChat.js
            ├── SearchResults.js
            ├── Connections.js
            └── Messages.js
```

## Testing Status
- Backend: 31/31 tests passing (100%)
- Frontend: All components verified working
- Test reports: /app/test_reports/iteration_4.json
