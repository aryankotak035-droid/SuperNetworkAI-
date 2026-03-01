from fastapi import FastAPI, APIRouter, HTTPException, Header, Response, Cookie, Depends, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import asyncpg
from pgvector.asyncpg import register_vector
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal, Dict
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import json
from openai import OpenAI
import numpy as np
from emergentintegrations.llm.chat import LlmChat, UserMessage
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# PostgreSQL connection pool
pg_pool: Optional[asyncpg.Pool] = None

# OpenAI client for embeddings
openai_client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])

# Emergent LLM key for extraction and re-ranking
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

# PostgreSQL connection string
DATABASE_URL = os.environ['DATABASE_URL']

# Upload directory for profile images
UPLOAD_DIR = ROOT_DIR / 'uploads' / 'profiles'
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

app = FastAPI()
api_router = APIRouter(prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_message(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

# Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class IkigaiExtractRequest(BaseModel):
    cv_text: str

class IkigaiData(BaseModel):
    passion: str
    skillset: str
    mission: str
    working_style_availability: str

class ProfileCreate(BaseModel):
    full_name: str
    role_intent: Literal["COFOUNDER", "TEAMMATE", "CLIENT"]
    skills: List[str]
    portfolio_url: Optional[str] = None
    ikigai: IkigaiData

class Profile(BaseModel):
    profile_id: str
    user_id: str
    full_name: str
    role_intent: str
    skills: List[str]
    portfolio_url: Optional[str] = None
    visibility_public: bool = True
    created_at: datetime
    updated_at: datetime
    ikigai: Optional[IkigaiData] = None

class SearchRequest(BaseModel):
    query: str
    role_filter: Optional[Literal["COFOUNDER", "TEAMMATE", "CLIENT"]] = None

class MatchResult(BaseModel):
    profile: Profile
    match_score: float
    ai_explanation: str

class ConnectionRequest(BaseModel):
    receiver_profile_id: str

class Connection(BaseModel):
    connection_id: str
    sender_id: str
    receiver_id: str
    status: Literal["PENDING", "ACCEPTED", "REJECTED", "BLOCKED"]
    created_at: datetime

class ConnectionResponse(BaseModel):
    status: Literal["ACCEPTED", "REJECTED"]

class MessageSend(BaseModel):
    receiver_profile_id: str
    content: str


async def get_db_pool():
    global pg_pool
    if pg_pool is None:
        pg_pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=2,
            max_size=10,
            init=register_vector
        )
    return pg_pool


# Helper: Get user from session token
async def get_current_user(session_token: Optional[str] = Cookie(None), authorization: Optional[str] = Header(None)) -> User:
    token = session_token
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        session_row = await conn.fetchrow(
            "SELECT user_id, expires_at FROM user_sessions WHERE session_token = $1",
            token
        )
        
        if not session_row:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        expires_at = session_row['expires_at']
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user_row = await conn.fetchrow(
            "SELECT user_id, email, name, picture, created_at FROM users WHERE user_id = $1",
            session_row['user_id']
        )
        
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        
        return User(**dict(user_row))


# Auth endpoints
@api_router.post("/auth/session")
async def create_session(response: Response, x_session_id: str = Header(..., alias="X-Session-ID")):
    """Exchange session_id for user data and create session"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": x_session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid session_id")
        
        data = resp.json()
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Check if user exists
        user_row = await conn.fetchrow(
            "SELECT user_id FROM users WHERE email = $1",
            data["email"]
        )
        
        if user_row:
            user_id = user_row['user_id']
        else:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await conn.execute(
                """INSERT INTO users (user_id, email, name, picture, created_at)
                   VALUES ($1, $2, $3, $4, $5)""",
                user_id, data["email"], data["name"], data.get("picture"),
                datetime.now(timezone.utc)
            )
        
        # Create session
        session_token = data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await conn.execute(
            """INSERT INTO user_sessions (user_id, session_token, expires_at, created_at)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (session_token) DO UPDATE SET expires_at = $3""",
            user_id, session_token, expires_at, datetime.now(timezone.utc)
        )
        
        # Check if profile exists
        profile_row = await conn.fetchrow(
            "SELECT profile_id FROM profiles WHERE user_id = $1",
            user_id
        )
        has_profile = profile_row is not None
    
    # Set HTTP-only cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/"
    )
    
    return {
        "session_token": session_token,
        "user": {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture")
        },
        "has_profile": has_profile
    }


@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current user from session token"""
    return user


@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user"""
    if session_token:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM user_sessions WHERE session_token = $1",
                session_token
            )
    response.delete_cookie("session_token")
    return {"message": "Logged out"}


# Profile endpoints
@api_router.post("/profile/extract-ikigai")
async def extract_ikigai(request: IkigaiExtractRequest, current_user: User = Depends(get_current_user)):
    """Extract Ikigai from CV text using LLM"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"ikigai_{uuid.uuid4().hex[:8]}",
            system_message="""You are an AI assistant that extracts a user's Ikigai profile from their CV or portfolio text. Extract the following fields:
- Passion: What they are clearly enthusiastic about
- Skillset: Their technical and professional skills
- Mission: What they want to achieve or build
- Working Style & Availability: Any indicators of how they work (remote, full-time, freelance, etc.)

Return ONLY valid JSON with keys: passion, skillset, mission, working_style_availability. If a field cannot be determined, use "Not specified."

IMPORTANT: Your response must be ONLY a valid JSON object, nothing else. Do not include any markdown formatting, code blocks, or explanatory text."""
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=f"Extract the Ikigai profile from this CV/portfolio text:\n\n{request.cv_text}")
        response = await chat.send_message(user_message)
        
        # Clean response - remove markdown code blocks if present
        clean_response = response.strip()
        if clean_response.startswith('```'):
            clean_response = clean_response.split('```')[1]
            if clean_response.startswith('json'):
                clean_response = clean_response[4:]
            clean_response = clean_response.strip()
        
        # Parse JSON response
        ikigai_data = json.loads(clean_response)
        
        # Validate required fields
        required_fields = ['passion', 'skillset', 'mission', 'working_style_availability']
        if not all(field in ikigai_data for field in required_fields):
            raise ValueError("Missing required fields in AI response")
        
        return ikigai_data
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid format. Please try again or fill the form manually.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract Ikigai: {str(e)}")


@api_router.post("/profile/create")
async def create_profile(request: ProfileCreate, user: User = Depends(get_current_user)):
    """Create user profile with embedding"""
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Check if profile already exists
        existing = await conn.fetchrow(
            "SELECT profile_id FROM profiles WHERE user_id = $1",
            user.user_id
        )
        if existing:
            raise HTTPException(status_code=400, detail="Profile already exists")
        
        profile_id = f"profile_{uuid.uuid4().hex[:12]}"
        
        # Generate embedding
        ikigai_text = f"Passion: {request.ikigai.passion}. Skills: {request.ikigai.skillset}. Mission: {request.ikigai.mission}. Working Style: {request.ikigai.working_style_availability}."
        embedding_response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=ikigai_text
        )
        embedding = embedding_response.data[0].embedding
        
        now = datetime.now(timezone.utc)
        
        # Save profile with embedding
        await conn.execute(
            """INSERT INTO profiles (profile_id, user_id, full_name, role_intent, skills, portfolio_url, visibility_public, profile_embedding, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)""",
            profile_id, user.user_id, request.full_name, request.role_intent,
            request.skills, request.portfolio_url, True, embedding, now, now
        )
        
        # Save Ikigai
        ikigai_id = f"ikigai_{uuid.uuid4().hex[:12]}"
        await conn.execute(
            """INSERT INTO ikigai (ikigai_id, profile_id, passion, skillset, mission, working_style_availability)
               VALUES ($1, $2, $3, $4, $5, $6)""",
            ikigai_id, profile_id, request.ikigai.passion, request.ikigai.skillset,
            request.ikigai.mission, request.ikigai.working_style_availability
        )
    
    return {"profile_id": profile_id, "message": "Profile created successfully"}


@api_router.put("/profile/me")
async def update_profile(request: ProfileCreate, user: User = Depends(get_current_user)):
    """Update user profile"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        profile_row = await conn.fetchrow(
            "SELECT profile_id FROM profiles WHERE user_id = $1",
            user.user_id
        )
        
        if not profile_row:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile_id = profile_row['profile_id']
        
        # Generate new embedding
        ikigai_text = f"Passion: {request.ikigai.passion}. Skills: {request.ikigai.skillset}. Mission: {request.ikigai.mission}. Working Style: {request.ikigai.working_style_availability}."
        embedding_response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=ikigai_text
        )
        embedding = embedding_response.data[0].embedding
        
        # Update profile
        await conn.execute(
            """UPDATE profiles SET full_name = $1, role_intent = $2, skills = $3, portfolio_url = $4, profile_embedding = $5, updated_at = $6 WHERE user_id = $7""",
            request.full_name, request.role_intent, request.skills,
            request.portfolio_url, embedding, datetime.now(timezone.utc), user.user_id
        )
        
        # Update Ikigai
        await conn.execute(
            """UPDATE ikigai SET passion = $1, skillset = $2, mission = $3, working_style_availability = $4 WHERE profile_id = $5""",
            request.ikigai.passion, request.ikigai.skillset,
            request.ikigai.mission, request.ikigai.working_style_availability, profile_id
        )
    
    return {"message": "Profile updated successfully"}


@api_router.get("/profile/me")
async def get_my_profile(user: User = Depends(get_current_user)):
    """Get current user's profile"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        profile_row = await conn.fetchrow(
            """SELECT profile_id, user_id, full_name, role_intent, skills, portfolio_url, visibility_public, created_at, updated_at
               FROM profiles WHERE user_id = $1""",
            user.user_id
        )
        
        if not profile_row:
            return None
        
        profile_dict = dict(profile_row)
        
        ikigai_row = await conn.fetchrow(
            "SELECT passion, skillset, mission, working_style_availability FROM ikigai WHERE profile_id = $1",
            profile_dict['profile_id']
        )
        
        if ikigai_row:
            profile_dict["ikigai"] = dict(ikigai_row)
        
        return profile_dict


# Profile completeness endpoint - MUST be before /profile/{profile_id}
@api_router.get("/profile/completeness")
async def get_profile_completeness(user: User = Depends(get_current_user)):
    """Get profile completeness score"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        profile = await conn.fetchrow(
            """SELECT p.full_name, p.role_intent, p.skills, p.portfolio_url,
                      i.passion, i.skillset, i.mission, i.working_style_availability
               FROM profiles p
               LEFT JOIN ikigai i ON p.profile_id = i.profile_id
               WHERE p.user_id = $1""",
            user.user_id
        )
        
        if not profile:
            return {"completeness": 0, "missing": ["profile"]}
        
        score = 0
        missing = []
        total_fields = 8
        
        if profile['full_name']:
            score += 1
        else:
            missing.append("full_name")
        
        if profile['role_intent']:
            score += 1
        else:
            missing.append("role_intent")
        
        if profile['skills'] and len(profile['skills']) > 0:
            score += 1
        else:
            missing.append("skills")
        
        if profile['portfolio_url']:
            score += 1
        else:
            missing.append("portfolio_url")
        
        if profile['passion']:
            score += 1
        else:
            missing.append("passion")
        
        if profile['skillset']:
            score += 1
        else:
            missing.append("skillset")
        
        if profile['mission']:
            score += 1
        else:
            missing.append("mission")
        
        if profile['working_style_availability']:
            score += 1
        else:
            missing.append("working_style_availability")
        
        completeness = int((score / total_fields) * 100)
        
        return {"completeness": completeness, "missing": missing}


@api_router.get("/profile/{profile_id}")
async def get_profile_by_id(profile_id: str, user: User = Depends(get_current_user)):
    """Get profile by ID"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        profile_row = await conn.fetchrow(
            """SELECT profile_id, user_id, full_name, role_intent, skills, portfolio_url, visibility_public, created_at, updated_at
               FROM profiles WHERE profile_id = $1""",
            profile_id
        )
        
        if not profile_row:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile_dict = dict(profile_row)
        
        ikigai_row = await conn.fetchrow(
            "SELECT passion, skillset, mission, working_style_availability FROM ikigai WHERE profile_id = $1",
            profile_id
        )
        
        if ikigai_row:
            profile_dict["ikigai"] = dict(ikigai_row)
        
        return profile_dict


@api_router.put("/profile/visibility")
async def update_visibility(visibility_public: bool, user: User = Depends(get_current_user)):
    """Toggle profile visibility"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE profiles SET visibility_public = $1 WHERE user_id = $2",
            visibility_public, user.user_id
        )
        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Profile not found")
    return {"message": "Visibility updated"}


# Profile Image Upload endpoint
@api_router.post("/profile/image")
async def upload_profile_image(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    """Upload profile image"""
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPEG, PNG, WebP, GIF")
    
    # Read file content to check size
    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {MAX_IMAGE_SIZE // (1024*1024)}MB")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{user.user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    # Save file
    with open(filepath, 'wb') as f:
        f.write(content)
    
    # Update profile with image path
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Delete old image if exists
        old_image = await conn.fetchval(
            "SELECT profile_image FROM profiles WHERE user_id = $1",
            user.user_id
        )
        if old_image:
            old_path = UPLOAD_DIR / old_image.split('/')[-1]
            if old_path.exists():
                old_path.unlink()
        
        # Update profile with new image
        image_url = f"/api/uploads/profiles/{filename}"
        await conn.execute(
            "UPDATE profiles SET profile_image = $1 WHERE user_id = $2",
            image_url, user.user_id
        )
    
    return {"image_url": image_url, "message": "Profile image uploaded successfully"}


@api_router.delete("/profile/image")
async def delete_profile_image(user: User = Depends(get_current_user)):
    """Delete profile image"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        image_url = await conn.fetchval(
            "SELECT profile_image FROM profiles WHERE user_id = $1",
            user.user_id
        )
        
        if image_url:
            # Delete file
            filename = image_url.split('/')[-1]
            filepath = UPLOAD_DIR / filename
            if filepath.exists():
                filepath.unlink()
            
            # Update profile
            await conn.execute(
                "UPDATE profiles SET profile_image = NULL WHERE user_id = $1",
                user.user_id
            )
    
    return {"message": "Profile image deleted"}


# Search History endpoints
@api_router.get("/search/history")
async def get_search_history(user: User = Depends(get_current_user)):
    """Get user's search history (last 10)"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        history = await conn.fetch(
            """SELECT id, query, role_filter, created_at
               FROM search_history
               WHERE user_id = $1
               ORDER BY created_at DESC
               LIMIT 10""",
            user.user_id
        )
        return [dict(h) for h in history]


@api_router.delete("/search/history/{history_id}")
async def delete_search_history_item(history_id: int, user: User = Depends(get_current_user)):
    """Delete a specific search history item"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM search_history WHERE id = $1 AND user_id = $2",
            history_id, user.user_id
        )
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="History item not found")
    return {"message": "Search history item deleted"}


@api_router.delete("/search/history")
async def clear_search_history(user: User = Depends(get_current_user)):
    """Clear all search history for user"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM search_history WHERE user_id = $1",
            user.user_id
        )
    return {"message": "Search history cleared"}


# Search endpoint using pgvector for semantic search
@api_router.post("/search")
async def search_profiles(request: SearchRequest, user: User = Depends(get_current_user)):
    """Two-stage semantic search with pgvector + LLM re-ranking"""
    
    # Generate query embedding
    embedding_response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=request.query
    )
    query_embedding = embedding_response.data[0].embedding
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Get current user's profile to exclude from results
        user_profile = await conn.fetchrow(
            "SELECT profile_id FROM profiles WHERE user_id = $1",
            user.user_id
        )
        user_profile_id = user_profile['profile_id'] if user_profile else None
        
        # Stage 1: pgvector cosine similarity search (top 15)
        if request.role_filter:
            profiles = await conn.fetch(
                """SELECT p.profile_id, p.user_id, p.full_name, p.role_intent, p.skills, p.portfolio_url, p.visibility_public, p.created_at, p.updated_at,
                          i.passion, i.skillset, i.mission, i.working_style_availability,
                          1 - (p.profile_embedding <=> $1) AS similarity
                   FROM profiles p
                   LEFT JOIN ikigai i ON p.profile_id = i.profile_id
                   WHERE p.visibility_public = TRUE AND p.profile_id != $2 AND p.role_intent = $3
                   ORDER BY p.profile_embedding <=> $1
                   LIMIT 15""",
                query_embedding, user_profile_id, request.role_filter
            )
        else:
            profiles = await conn.fetch(
                """SELECT p.profile_id, p.user_id, p.full_name, p.role_intent, p.skills, p.portfolio_url, p.visibility_public, p.created_at, p.updated_at,
                          i.passion, i.skillset, i.mission, i.working_style_availability,
                          1 - (p.profile_embedding <=> $1) AS similarity
                   FROM profiles p
                   LEFT JOIN ikigai i ON p.profile_id = i.profile_id
                   WHERE p.visibility_public = TRUE AND p.profile_id != $2
                   ORDER BY p.profile_embedding <=> $1
                   LIMIT 15""",
                query_embedding, user_profile_id
            )
        
        if not profiles:
            return []
        
        # Stage 2: LLM Re-ranking
        role_intent = request.role_filter or "any role"
        candidates_text = ""
        for i, p in enumerate(profiles):
            candidates_text += f"""
Candidate {i+1}:
- profile_id: {p['profile_id']}
- Name: {p['full_name']}
- Role: {p['role_intent']}
- Skills: {', '.join(p['skills']) if p['skills'] else 'N/A'}
- Passion: {p['passion'] or 'N/A'}
- Mission: {p['mission'] or 'N/A'}
- Working Style: {p['working_style_availability'] or 'N/A'}
"""
        
        system_prompt = f"""You are an AI matchmaking engine. A user is searching for a {role_intent}.

Here are potential candidates with their Ikigai profiles.

Your job is to select and rank the top 3 best matches based on these rules:
- If the intent is COFOUNDER: Heavily weight alignment in 'Mission' and 'Passion'. Skills are secondary.
- If the intent is TEAMMATE: Balance 'Skills' and 'Working Style' equally.
- If the intent is CLIENT: Heavily weight 'Skills' and 'Portfolio'. Passion is a bonus.

Return ONLY valid JSON as an array of objects with keys:
- profile_id: the candidate's UUID
- rank: 1, 2, or 3
- reason: A single sentence explaining why this person is a strong match for the stated intent."""
        
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"search_{uuid.uuid4().hex[:8]}",
                system_message=system_prompt
            ).with_model("openai", "gpt-4o-mini")
            
            user_message = UserMessage(text=f"Query: {request.query}\n\nCandidates:\n{candidates_text}")
            response = await chat.send_message(user_message)
            
            # Clean response
            clean_response = response.strip()
            if clean_response.startswith('```'):
                clean_response = clean_response.split('```')[1]
                if clean_response.startswith('json'):
                    clean_response = clean_response[4:]
                clean_response = clean_response.strip()
            
            ranked_matches = json.loads(clean_response)
            
            # Build final results
            results = []
            for match in ranked_matches:
                profile = next((dict(p) for p in profiles if p['profile_id'] == match["profile_id"]), None)
                if profile:
                    ikigai_data = None
                    if profile.get('passion'):
                        ikigai_data = {
                            "passion": profile['passion'],
                            "skillset": profile['skillset'],
                            "mission": profile['mission'],
                            "working_style_availability": profile['working_style_availability']
                        }
                    
                    profile_obj = {
                        "profile_id": profile['profile_id'],
                        "user_id": profile['user_id'],
                        "full_name": profile['full_name'],
                        "role_intent": profile['role_intent'],
                        "skills": profile['skills'] or [],
                        "portfolio_url": profile['portfolio_url'],
                        "visibility_public": profile['visibility_public'],
                        "created_at": profile['created_at'].isoformat() if profile['created_at'] else None,
                        "updated_at": profile['updated_at'].isoformat() if profile['updated_at'] else None,
                        "ikigai": ikigai_data
                    }
                    
                    results.append({
                        "profile": profile_obj,
                        "match_score": match["rank"],
                        "ai_explanation": match["reason"]
                    })
            
            return results
        except Exception as e:
            # Fallback: return top 3 by pgvector similarity
            results = []
            for i, p in enumerate(profiles[:3]):
                profile = dict(p)
                ikigai_data = None
                if profile.get('passion'):
                    ikigai_data = {
                        "passion": profile['passion'],
                        "skillset": profile['skillset'],
                        "mission": profile['mission'],
                        "working_style_availability": profile['working_style_availability']
                    }
                
                profile_obj = {
                    "profile_id": profile['profile_id'],
                    "user_id": profile['user_id'],
                    "full_name": profile['full_name'],
                    "role_intent": profile['role_intent'],
                    "skills": profile['skills'] or [],
                    "portfolio_url": profile['portfolio_url'],
                    "visibility_public": profile['visibility_public'],
                    "created_at": profile['created_at'].isoformat() if profile['created_at'] else None,
                    "updated_at": profile['updated_at'].isoformat() if profile['updated_at'] else None,
                    "ikigai": ikigai_data
                }
                
                results.append({
                    "profile": profile_obj,
                    "match_score": float(profile['similarity']),
                    "ai_explanation": "Strong semantic match based on profile similarity."
                })
            return results


# Connection endpoints
@api_router.post("/connections/request")
async def send_connection_request(request: ConnectionRequest, user: User = Depends(get_current_user)):
    """Send connection request"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        sender_profile = await conn.fetchrow(
            "SELECT profile_id FROM profiles WHERE user_id = $1",
            user.user_id
        )
        
        if not sender_profile:
            raise HTTPException(status_code=404, detail="Sender profile not found")
        
        sender_id = sender_profile['profile_id']
        
        # Check if receiver exists
        receiver_profile = await conn.fetchrow(
            "SELECT profile_id FROM profiles WHERE profile_id = $1",
            request.receiver_profile_id
        )
        if not receiver_profile:
            raise HTTPException(status_code=404, detail="Receiver profile not found")
        
        # Check if connection already exists
        existing = await conn.fetchrow(
            """SELECT connection_id FROM connections 
               WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)""",
            sender_id, request.receiver_profile_id
        )
        
        if existing:
            raise HTTPException(status_code=400, detail="Connection already exists")
        
        connection_id = f"conn_{uuid.uuid4().hex[:12]}"
        await conn.execute(
            """INSERT INTO connections (connection_id, sender_id, receiver_id, status, created_at)
               VALUES ($1, $2, $3, $4, $5)""",
            connection_id, sender_id, request.receiver_profile_id, "PENDING",
            datetime.now(timezone.utc)
        )
    
    return {"connection_id": connection_id, "message": "Connection request sent"}


@api_router.get("/connections/my")
async def get_my_connections(user: User = Depends(get_current_user)):
    """Get user's connections"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        profile_row = await conn.fetchrow(
            "SELECT profile_id FROM profiles WHERE user_id = $1",
            user.user_id
        )
        
        if not profile_row:
            return []
        
        profile_id = profile_row['profile_id']
        
        connections = await conn.fetch(
            """SELECT c.connection_id, c.sender_id, c.receiver_id, c.status, c.created_at,
                      p.profile_id, p.full_name, p.role_intent, p.skills, p.portfolio_url
               FROM connections c
               JOIN profiles p ON (
                   CASE WHEN c.sender_id = $1 THEN c.receiver_id ELSE c.sender_id END = p.profile_id
               )
               WHERE c.sender_id = $1 OR c.receiver_id = $1""",
            profile_id
        )
        
        result = []
        for c in connections:
            conn_dict = {
                "connection_id": c['connection_id'],
                "sender_id": c['sender_id'],
                "receiver_id": c['receiver_id'],
                "status": c['status'],
                "created_at": c['created_at'].isoformat() if c['created_at'] else None,
                "other_profile": {
                    "profile_id": c['profile_id'],
                    "full_name": c['full_name'],
                    "role_intent": c['role_intent'],
                    "skills": c['skills'] or [],
                    "portfolio_url": c['portfolio_url']
                },
                "is_sender": c['sender_id'] == profile_id
            }
            result.append(conn_dict)
        
        return result


@api_router.put("/connections/{connection_id}/respond")
async def respond_to_connection(connection_id: str, response_data: ConnectionResponse, user: User = Depends(get_current_user)):
    """Accept or reject connection request"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        profile_row = await conn.fetchrow(
            "SELECT profile_id FROM profiles WHERE user_id = $1",
            user.user_id
        )
        
        if not profile_row:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile_id = profile_row['profile_id']
        
        connection = await conn.fetchrow(
            "SELECT receiver_id FROM connections WHERE connection_id = $1",
            connection_id
        )
        if not connection:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        if connection['receiver_id'] != profile_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        await conn.execute(
            "UPDATE connections SET status = $1 WHERE connection_id = $2",
            response_data.status, connection_id
        )
    
    return {"message": f"Connection {response_data.status.lower()}"}


# Messages endpoints
@api_router.post("/messages/send")
async def send_message(request: MessageSend, user: User = Depends(get_current_user)):
    """Send a message to a connected user"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        sender_profile = await conn.fetchrow(
            "SELECT profile_id FROM profiles WHERE user_id = $1",
            user.user_id
        )
        
        if not sender_profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        sender_id = sender_profile['profile_id']
        
        # Check if users are connected
        connection = await conn.fetchrow(
            """SELECT connection_id FROM connections
               WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
               AND status = 'ACCEPTED'""",
            sender_id, request.receiver_profile_id
        )
        
        if not connection:
            raise HTTPException(status_code=403, detail="You can only message connected users")
        
        message_id = f"msg_{uuid.uuid4().hex[:12]}"
        created_at = datetime.now(timezone.utc)
        
        await conn.execute(
            """INSERT INTO messages (message_id, sender_id, receiver_id, content, read, created_at)
               VALUES ($1, $2, $3, $4, $5, $6)""",
            message_id, sender_id, request.receiver_profile_id, request.content, False, created_at
        )
        
        # Send real-time notification via WebSocket
        receiver_user = await conn.fetchrow(
            "SELECT user_id FROM profiles WHERE profile_id = $1",
            request.receiver_profile_id
        )
        if receiver_user:
            await manager.send_message(receiver_user['user_id'], {
                "type": "new_message",
                "message_id": message_id,
                "sender_id": sender_id,
                "content": request.content,
                "created_at": created_at.isoformat()
            })
    
    return {"message_id": message_id, "message": "Message sent"}


@api_router.get("/messages/conversations")
async def get_conversations(user: User = Depends(get_current_user)):
    """Get list of conversations"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        profile_row = await conn.fetchrow(
            "SELECT profile_id FROM profiles WHERE user_id = $1",
            user.user_id
        )
        
        if not profile_row:
            return []
        
        profile_id = profile_row['profile_id']
        
        # Get all accepted connections
        connections = await conn.fetch(
            """SELECT c.connection_id, c.sender_id, c.receiver_id,
                      p.profile_id, p.full_name, p.role_intent, p.skills
               FROM connections c
               JOIN profiles p ON (
                   CASE WHEN c.sender_id = $1 THEN c.receiver_id ELSE c.sender_id END = p.profile_id
               )
               WHERE (c.sender_id = $1 OR c.receiver_id = $1) AND c.status = 'ACCEPTED'""",
            profile_id
        )
        
        conversations = []
        for c in connections:
            other_profile_id = c['profile_id']
            
            # Get last message
            last_message = await conn.fetchrow(
                """SELECT message_id, sender_id, receiver_id, content, read, created_at
                   FROM messages
                   WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
                   ORDER BY created_at DESC LIMIT 1""",
                profile_id, other_profile_id
            )
            
            # Count unread messages
            unread_count = await conn.fetchval(
                """SELECT COUNT(*) FROM messages
                   WHERE sender_id = $1 AND receiver_id = $2 AND read = FALSE""",
                other_profile_id, profile_id
            )
            
            conversations.append({
                "profile": {
                    "profile_id": c['profile_id'],
                    "full_name": c['full_name'],
                    "role_intent": c['role_intent'],
                    "skills": c['skills'] or []
                },
                "last_message": dict(last_message) if last_message else None,
                "unread_count": unread_count
            })
        
        return conversations


@api_router.get("/messages/{profile_id}")
async def get_messages(profile_id: str, user: User = Depends(get_current_user)):
    """Get messages with a specific user"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        user_profile = await conn.fetchrow(
            "SELECT profile_id FROM profiles WHERE user_id = $1",
            user.user_id
        )
        
        if not user_profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        my_profile_id = user_profile['profile_id']
        
        # Check connection
        connection = await conn.fetchrow(
            """SELECT connection_id FROM connections
               WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
               AND status = 'ACCEPTED'""",
            my_profile_id, profile_id
        )
        
        if not connection:
            raise HTTPException(status_code=403, detail="Not connected with this user")
        
        # Get messages
        messages = await conn.fetch(
            """SELECT message_id, sender_id, receiver_id, content, read, created_at
               FROM messages
               WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
               ORDER BY created_at ASC""",
            my_profile_id, profile_id
        )
        
        # Mark messages as read
        await conn.execute(
            "UPDATE messages SET read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND read = FALSE",
            profile_id, my_profile_id
        )
        
        return [dict(m) for m in messages]


# WebSocket endpoint for real-time messaging
@api_router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming WebSocket messages if needed
    except WebSocketDisconnect:
        manager.disconnect(user_id)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    """Initialize database pool on startup"""
    await get_db_pool()
    logger.info("PostgreSQL connection pool initialized")


@app.on_event("shutdown")
async def shutdown():
    """Close database pool on shutdown"""
    global pg_pool
    if pg_pool:
        await pg_pool.close()
        logger.info("PostgreSQL connection pool closed")
