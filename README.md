# 🧠 SuperNetworkAI

**AI-powered, intent-based matchmaking for founders, builders, and clients.**

SuperNetworkAI goes beyond rigid keyword searches. It uses natural language queries and a **Two-Stage RAG pipeline** (pgvector retrieval → LLM re-ranking) to semantically match users based on their **Ikigai** — their passions, skills, mission, and working style.

> 🏆 Built as an MVP for a 24-hour hackathon.

---

## 🎯 What It Does

Instead of traditional filters, you describe *what you're looking for* in plain English:

> *"I need a technical cofounder who's passionate about climate tech and has experience scaling SaaS products."*

SuperNetworkAI then:

1. **Extracts your Ikigai profile** from your CV/portfolio using an LLM
2. **Generates semantic embeddings** of your profile and query
3. **Retrieves candidates** via pgvector cosine similarity search
4. **Re-ranks results** using GPT-4o-mini with intent-aware weighting
5. **Explains each match** with a one-sentence AI-generated summary

---

## ✨ Features

- **Google OAuth** — One-click sign-in via Supabase authentication
- **AI Ikigai Extraction** — Interactive chatbot that builds your professional identity from pasted text (CV, portfolio, bio)
- **Editable Profiles** — Review and refine your AI-generated Ikigai before saving
- **Semantic Search** — Natural language discovery powered by a Two-Stage RAG pipeline
- **Smart Match Explanations** — Each result comes with an AI-generated reason for why you're a good match
- **Role Filtering** — Filter results by Cofounder, Teammate, or Client
- **Connection Requests** — Send and manage networking requests
- **Real-Time Messaging** — Chat with your connections via WebSockets
- **Light/Dark Mode** — Clean, blue-themed UI with theme toggle
- **Public/Private Profiles** — Control your visibility in search results

---

## 🏗️ Architecture

```
SuperNetworkAI/
├── backend/
│   ├── server.py              # FastAPI app — all API endpoints
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Backend environment variables
│   └── scripts/
│       └── seed.py            # Database seeding with synthetic profiles
├── frontend/
│   ├── src/
│   │   ├── App.js             # Main router
│   │   ├── index.css          # Global styles
│   │   ├── components/
│   │   │   ├── layout/        # Header, Footer
│   │   │   ├── theme/         # ThemeProvider, Toggle
│   │   │   └── ui/            # Reusable UI components (Button, Card, etc.)
│   │   └── pages/
│   │       ├── Landing.js     # Landing / marketing page
│   │       ├── AuthCallback.js# OAuth callback handler
│   │       ├── Dashboard.js   # User discovery & search
│   │       ├── Profile.js     # View profile
│   │       ├── ProfileEdit.js # Edit profile & Ikigai
│   │       ├── IkigaiChat.js  # Interactive AI onboarding chatbot
│   │       ├── Connections.js # Manage connection requests
│   │       └── Messages.js    # Real-time messaging UI
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env                   # Frontend environment variables
├── memory/
│   └── prd.md                 # Product Requirements Document
├── scripts/                   # Utility & automation scripts
├── tests/                     # Test suites
├── test_reports/              # Test execution results (JSON)
├── .emergent/                 # Emergent behavior configuration
├── design_guidelines.json     # UI/UX design system tokens
├── auth_testing.md            # Authentication test documentation
└── backend_test.py            # Backend test runner
```

---

## 🛠️ Tech Stack

| Layer          | Technology                                      |
|----------------|--------------------------------------------------|
| **Frontend**   | React, Tailwind CSS, Shadcn/UI                   |
| **Backend**    | FastAPI (Python)                                  |
| **Database**   | Supabase PostgreSQL + pgvector extension          |
| **AI / LLM**   | OpenAI GPT-4o-mini (generation & re-ranking)     |
| **Embeddings** | OpenAI text-embedding-3-small                     |
| **Auth**       | Google OAuth via Supabase                         |
| **Deployment** | Vercel (frontend), FastAPI server (backend)       |
| **Realtime**   | WebSockets for messaging                          |

---

## 🔍 How Matching Works — Two-Stage RAG Pipeline

```
User Query (natural language)
        │
        ▼
┌─────────────────────────┐
│  Stage 1: Retrieval      │
│  ─────────────────────── │
│  Query → Embedding       │
│  pgvector cosine search  │
│  Top-K candidate profiles│
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Stage 2: Re-Ranking     │
│  ─────────────────────── │
│  GPT-4o-mini evaluates   │
│  each candidate against  │
│  the user's intent       │
│  Intent-aware weighting  │
│  1-sentence explanation  │
└──────────┬──────────────┘
           │
           ▼
    Ranked Results with
    AI Match Summaries
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16+
- **Python** 3.8+
- **Supabase** account (with pgvector extension enabled)
- **OpenAI API Key**

### 1. Clone the Repository

```bash
git clone https://github.com/aryankotak035-droid/SuperNetworkAI-.git
cd SuperNetworkAI-
```

### 2. Set Up the Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_postgresql_connection_string
```

### 3. Set Up the Database

Enable the pgvector extension in your Supabase project:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Then seed the database with test profiles:

```bash
python scripts/seed.py
```

### 4. Set Up the Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the Application

```bash
# Terminal 1 — Backend
cd backend
uvicorn server:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm start
```

The app will be available at `http://localhost:3000`.

---

## 📡 API Endpoints

| Method | Endpoint                          | Description                              |
|--------|-----------------------------------|------------------------------------------|
| POST   | `/api/auth/session`               | Handle Google OAuth callback             |
| GET    | `/api/users/me`                   | Fetch current user's profile             |
| PUT    | `/api/users/me`                   | Update user profile                      |
| POST   | `/api/ikigai`                     | Extract Ikigai from text via AI          |
| POST   | `/api/search`                     | Semantic search with Two-Stage RAG       |
| POST   | `/api/connections/request`        | Send a connection request                |
| PUT    | `/api/connections/{connection_id}` | Accept or reject a connection            |
| WS     | `/api/ws/{user_id}`               | WebSocket for real-time messaging        |

---

## 🧪 Testing

Run backend tests:

```bash
python backend_test.py
```

Test reports are saved to `test_reports/` as JSON files. Authentication testing procedures are documented in `auth_testing.md`.

---

## 🗺️ Roadmap

- [x] Google OAuth authentication
- [x] AI-powered Ikigai chatbot onboarding
- [x] Profile creation, viewing, and editing
- [x] Connection request system
- [x] Real-time messaging (WebSockets)
- [x] Light/Dark mode with blue theme
- [ ] Full PostgreSQL + pgvector migration
- [ ] Two-Stage RAG semantic search pipeline
- [ ] Profile completeness indicator
- [ ] Advanced domain/role filters on dashboard
- [ ] Block user functionality
- [ ] Interactive micro-animations & UX polish

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is currently unlicensed. Contact the repository owner for usage terms.

---

## 👤 Author

**Aryan Kotak** — [@aryankotak035-droid](https://github.com/aryankotak035-droid)

---

> *Find your people, not just profiles.* ✨
