# SuperNetworkAI - Product Requirements Document

## Original Problem Statement
SuperNetworkAI is an AI-powered, intent-based matchmaking web app for founders, builders, and clients. Instead of rigid keyword searches, it uses natural language queries and a Two-Stage RAG pipeline (pgvector retrieval → LLM re-ranking) to semantically match users based on their Ikigai — their passions, skills, mission, and working style.

## Core Requirements (MVP)
- **Auth:** Google OAuth via Emergent-managed authentication ✅
- **Onboarding:** AI Ikigai extraction from pasted text. User can edit before saving. ✅
- **Profile:** Generate embedding on save and store in PostgreSQL with pgvector. Public/Private visibility toggle. ✅
- **Discovery:** Natural Language search triggers a two-stage matching process (pgvector retrieval -> gpt-4o-mini re-ranking). ✅
- **Results:** Display ranked results with a 1-sentence AI match summary. ✅
- **Filtering:** Filter results by Cofounder, Teammate, or Client role. ✅
- **Networking:** Send connection requests and messaging. ✅

## Tech Stack
- **Frontend:** React, Tailwind CSS, Framer Motion, Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL with pgvector extension
- **AI:** OpenAI API (gpt-4o-mini for generation via Emergent LLM key)
- **Embeddings:** Deterministic hash-based embeddings (Emergent proxy doesn't support OpenAI embeddings API)
- **Authentication:** Emergent-managed Google OAuth

## What's Been Implemented

### All Features Complete ✅

1. **PostgreSQL + pgvector Database**
   - Full schema with vector similarity index (HNSW)
   - 10 seeded sample profiles

2. **Google OAuth Authentication**
   - Login/logout via Emergent-managed Google OAuth
   - Session management with cookies and Bearer tokens

3. **AI-Powered Ikigai Extraction**
   - Interactive chatbot for profile creation
   - Uses gpt-4o-mini via Emergent LLM key

4. **Two-Stage Semantic Search**
   - Stage 1: pgvector cosine similarity search (top 15)
   - Stage 2: LLM re-ranking with intent-aware weighting
   - Returns top 3 matches with AI explanation

5. **Profile Management**
   - View and edit profile
   - Profile completeness indicator
   - Public/private visibility toggle
   - **Profile image upload** (local storage, 5MB max)

6. **Networking Features**
   - Send/accept/reject connection requests
   - View sent/received/accepted connections

7. **Messaging System**
   - Conversation list with unread counts
   - Real-time messaging with WebSocket support
   - Polling fallback

8. **Dashboard with Filters**
   - Role-based filtering
   - Skills-based filtering
   - **Search history** (10 recent searches)

9. **UI/UX Enhancements**
   - **Theme persistence** with system preference detection
   - **Interactive animations** (hover effects, staggered lists)

## Known Limitations
- **Embeddings:** Using deterministic hash-based embeddings instead of OpenAI text-embedding-3-small because Emergent proxy doesn't support the embeddings API endpoint. This means semantic similarity is based on text hash rather than true semantic understanding.

## API Endpoints
All endpoints prefixed with `/api`

### Authentication
- `POST /auth/session` - Google OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Profile
- `POST /profile/extract-ikigai` - AI Ikigai extraction
- `POST /profile/create` - Create profile with embedding
- `PUT /profile/me` - Update profile
- `GET /profile/me` - Get own profile
- `GET /profile/completeness` - Get profile completeness score
- `GET /profile/{profile_id}` - Get profile by ID
- `PUT /profile/visibility` - Toggle visibility
- `POST /profile/image` - Upload profile image
- `DELETE /profile/image` - Delete profile image

### Search
- `POST /search` - Semantic search with filters
- `GET /search/history` - Get search history
- `DELETE /search/history/{id}` - Delete single history item
- `DELETE /search/history` - Clear all history

### Connections
- `POST /connections/request` - Send connection request
- `GET /connections/my` - Get user's connections
- `PUT /connections/{id}/respond` - Accept/reject connection

### Messages
- `POST /messages/send` - Send message
- `GET /messages/conversations` - Get conversations
- `GET /messages/{profile_id}` - Get messages with user
- `WS /ws/{user_id}` - WebSocket for real-time messaging

## File Structure
```
/app
├── backend/
│   ├── .env
│   ├── requirements.txt
│   ├── server.py
│   ├── uploads/profiles/
│   └── scripts/seed_postgres.py
└── frontend/
    └── src/
        ├── components/
        │   ├── ProfileCompleteness.js
        │   ├── ProfileImageUpload.js
        │   ├── SearchHistory.js
        │   ├── SkeletonLoaders.js
        │   └── ThemeToggle.js
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

## Remaining Tasks (Backlog)

### P2 - Medium Priority
- [ ] Block user functionality
- [ ] Profile analytics (views, match rate)
- [ ] Real OpenAI embeddings (requires direct API key)

### P3 - Nice to Have
- [ ] Mobile-responsive refinements
- [ ] Email notifications for connections
- [ ] Export profile data
