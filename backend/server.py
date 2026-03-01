from fastapi import FastAPI, APIRouter, HTTPException, Header, Response, Cookie, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import json
from openai import OpenAI
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI client for embeddings
openai_client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])

# Emergent LLM key for extraction and re-ranking
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
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

# Helper: Get user from session token
async def get_current_user(session_token: Optional[str] = Cookie(None), authorization: Optional[str] = Header(None)) -> User:
    token = session_token
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

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
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if user_doc:
        user_id = user_doc["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    
    # Create session
    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session)
    
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
    
    # Check if profile exists
    profile_doc = await db.profiles.find_one({"user_id": user_id}, {"_id": 0})
    has_profile = profile_doc is not None
    
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
        await db.user_sessions.delete_one({"session_token": session_token})
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

Return ONLY valid JSON with keys: passion, skillset, mission, working_style_availability. If a field cannot be determined, use \"Not specified.\"

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
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid format. Please try again or fill the form manually.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract Ikigai: {str(e)}")

@api_router.post("/profile/create")
async def create_profile(request: ProfileCreate, user: User = Depends(get_current_user)):
    """Create user profile with embedding"""
    
    # Check if profile already exists
    existing = await db.profiles.find_one({"user_id": user.user_id}, {"_id": 0})
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
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Save profile
    profile_doc = {
        "profile_id": profile_id,
        "user_id": user.user_id,
        "full_name": request.full_name,
        "role_intent": request.role_intent,
        "skills": request.skills,
        "portfolio_url": request.portfolio_url,
        "visibility_public": True,
        "profile_embedding": embedding,
        "created_at": now,
        "updated_at": now
    }
    await db.profiles.insert_one(profile_doc)
    
    # Save Ikigai
    ikigai_doc = {
        "ikigai_id": f"ikigai_{uuid.uuid4().hex[:12]}",
        "profile_id": profile_id,
        "passion": request.ikigai.passion,
        "skillset": request.ikigai.skillset,
        "mission": request.ikigai.mission,
        "working_style_availability": request.ikigai.working_style_availability
    }
    await db.ikigai.insert_one(ikigai_doc)
    
    return {"profile_id": profile_id, "message": "Profile created successfully"}

@api_router.get("/profile/me")
async def get_my_profile(user: User = Depends(get_current_user)):
    """Get current user's profile"""
    profile_doc = await db.profiles.find_one({"user_id": user.user_id}, {"_id": 0, "profile_embedding": 0})
    if not profile_doc:
        return None
    
    ikigai_doc = await db.ikigai.find_one({"profile_id": profile_doc["profile_id"]}, {"_id": 0})
    
    if ikigai_doc:
        profile_doc["ikigai"] = {
            "passion": ikigai_doc["passion"],
            "skillset": ikigai_doc["skillset"],
            "mission": ikigai_doc["mission"],
            "working_style_availability": ikigai_doc["working_style_availability"]
        }
    
    return profile_doc

@api_router.put("/profile/visibility")
async def update_visibility(visibility_public: bool, user: User = Depends(get_current_user)):
    """Toggle profile visibility"""
    result = await db.profiles.update_one(
        {"user_id": user.user_id},
        {"$set": {"visibility_public": visibility_public}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"message": "Visibility updated"}

# Search endpoint
@api_router.post("/search")
async def search_profiles(request: SearchRequest, user: User = Depends(get_current_user)):
    """Two-stage semantic search with LLM re-ranking"""
    
    # Generate query embedding
    embedding_response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=request.query
    )
    query_embedding = np.array(embedding_response.data[0].embedding).reshape(1, -1)
    
    # Retrieve all public profiles (excluding current user)
    query_filter = {"visibility_public": True, "user_id": {"$ne": user.user_id}}
    if request.role_filter:
        query_filter["role_intent"] = request.role_filter
    
    profiles = await db.profiles.find(query_filter, {"_id": 0}).to_list(None)
    
    if not profiles:
        return []
    
    # Compute cosine similarities
    profile_embeddings = np.array([p["profile_embedding"] for p in profiles])
    similarities = cosine_similarity(query_embedding, profile_embeddings)[0]
    
    # Get top 10-15 for LLM re-ranking
    top_indices = np.argsort(similarities)[::-1][:15]
    top_profiles = [profiles[i] for i in top_indices]
    
    # Fetch Ikigai data for top profiles
    for profile in top_profiles:
        ikigai_doc = await db.ikigai.find_one({"profile_id": profile["profile_id"]}, {"_id": 0})
        if ikigai_doc:
            profile["ikigai"] = ikigai_doc
    
    # LLM Re-ranking
    role_intent = request.role_filter or "any role"
    candidates_text = ""
    for i, p in enumerate(top_profiles):
        ikigai = p.get("ikigai", {})
        candidates_text += f"""
Candidate {i+1}:
- profile_id: {p['profile_id']}
- Name: {p['full_name']}
- Role: {p['role_intent']}
- Skills: {', '.join(p['skills'])}
- Passion: {ikigai.get('passion', 'N/A')}
- Mission: {ikigai.get('mission', 'N/A')}
- Working Style: {ikigai.get('working_style_availability', 'N/A')}
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
        
        ranked_matches = json.loads(response)
        
        # Build final results
        results = []
        for match in ranked_matches:
            profile = next((p for p in top_profiles if p["profile_id"] == match["profile_id"]), None)
            if profile:
                # Remove embedding from response
                profile.pop("profile_embedding", None)
                ikigai_data = profile.pop("ikigai", None)
                
                profile_obj = Profile(**profile, ikigai=IkigaiData(**ikigai_data) if ikigai_data else None)
                results.append({
                    "profile": profile_obj,
                    "match_score": match["rank"],
                    "ai_explanation": match["reason"]
                })
        
        return results
    except Exception as e:
        # Fallback: return top 3 by cosine similarity
        results = []
        for i in range(min(3, len(top_profiles))):
            profile = top_profiles[i]
            profile.pop("profile_embedding", None)
            ikigai_data = profile.pop("ikigai", None)
            
            profile_obj = Profile(**profile, ikigai=IkigaiData(**ikigai_data) if ikigai_data else None)
            results.append({
                "profile": profile_obj,
                "match_score": float(similarities[top_indices[i]]),
                "ai_explanation": "Strong semantic match based on profile similarity."
            })
        return results

# Connection endpoints
@api_router.post("/connections/request")
async def send_connection_request(request: ConnectionRequest, user: User = Depends(get_current_user)):
    """Send connection request"""
    sender_profile = await db.profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    
    if not sender_profile:
        raise HTTPException(status_code=404, detail="Sender profile not found")
    
    # Check if receiver exists
    receiver_profile = await db.profiles.find_one({"profile_id": request.receiver_profile_id}, {"_id": 0})
    if not receiver_profile:
        raise HTTPException(status_code=404, detail="Receiver profile not found")
    
    # Check if connection already exists
    existing = await db.connections.find_one({
        "$or": [
            {"sender_id": sender_profile["profile_id"], "receiver_id": request.receiver_profile_id},
            {"sender_id": request.receiver_profile_id, "receiver_id": sender_profile["profile_id"]}
        ]
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Connection already exists")
    
    connection_id = f"conn_{uuid.uuid4().hex[:12]}"
    connection = {
        "connection_id": connection_id,
        "sender_id": sender_profile["profile_id"],
        "receiver_id": request.receiver_profile_id,
        "status": "PENDING",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.connections.insert_one(connection)
    
    return {"connection_id": connection_id, "message": "Connection request sent"}

@api_router.get("/connections/my")
async def get_my_connections(user: User = Depends(get_current_user)):
    """Get user's connections"""
    profile = await db.profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    
    if not profile:
        return []
    
    connections = await db.connections.find({
        "$or": [
            {"sender_id": profile["profile_id"]},
            {"receiver_id": profile["profile_id"]}
        ]
    }, {"_id": 0}).to_list(None)
    
    # Fetch profile details for each connection
    for conn in connections:
        other_profile_id = conn["receiver_id"] if conn["sender_id"] == profile["profile_id"] else conn["sender_id"]
        other_profile = await db.profiles.find_one({"profile_id": other_profile_id}, {"_id": 0, "profile_embedding": 0})
        if other_profile:
            conn["other_profile"] = other_profile
            conn["is_sender"] = conn["sender_id"] == profile["profile_id"]
    
    return connections

@api_router.put("/connections/{connection_id}/respond")
async def respond_to_connection(connection_id: str, response_data: ConnectionResponse, user: User = Depends(get_current_user)):
    """Accept or reject connection request"""
    profile = await db.profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    
    connection = await db.connections.find_one({"connection_id": connection_id}, {"_id": 0})
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection["receiver_id"] != profile["profile_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.connections.update_one(
        {"connection_id": connection_id},
        {"$set": {"status": response_data.status}}
    )
    
    return {"message": f"Connection {response_data.status.lower()}"}

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()