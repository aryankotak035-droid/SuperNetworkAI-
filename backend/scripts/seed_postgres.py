#!/usr/bin/env python3
"""Seed PostgreSQL database with test profiles for SuperNetworkAI"""

import asyncio
import asyncpg
from pgvector.asyncpg import register_vector
import os
import sys
from pathlib import Path
from datetime import datetime, timezone
import uuid
import litellm
from emergentintegrations.llm.chat import get_integration_proxy_url

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / '.env')

DATABASE_URL = os.environ['DATABASE_URL']
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

# Set up litellm with Emergent proxy
litellm.api_base = get_integration_proxy_url()
litellm.api_key = EMERGENT_LLM_KEY

# Sample profiles for seeding
SAMPLE_PROFILES = [
    {
        "full_name": "Alex Chen",
        "role_intent": "COFOUNDER",
        "skills": ["Python", "Machine Learning", "Product Strategy", "FastAPI"],
        "portfolio_url": "https://alexchen.dev",
        "ikigai": {
            "passion": "Building AI products that democratize access to technology",
            "skillset": "Full-stack development, ML engineering, product management",
            "mission": "Create tools that help small businesses compete with enterprises",
            "working_style_availability": "Full-time, remote-first, async communication preferred"
        }
    },
    {
        "full_name": "Sarah Johnson",
        "role_intent": "TEAMMATE",
        "skills": ["React", "TypeScript", "UI/UX Design", "Figma"],
        "portfolio_url": "https://sarahjdesign.co",
        "ikigai": {
            "passion": "Crafting beautiful, intuitive user experiences",
            "skillset": "Frontend development, design systems, user research",
            "mission": "Make technology accessible and enjoyable for everyone",
            "working_style_availability": "Part-time, 20-30 hours/week, flexible schedule"
        }
    },
    {
        "full_name": "Marcus Williams",
        "role_intent": "CLIENT",
        "skills": ["Business Development", "Sales", "Marketing Strategy"],
        "portfolio_url": None,
        "ikigai": {
            "passion": "Connecting great products with the right customers",
            "skillset": "B2B sales, partnership development, market analysis",
            "mission": "Help startups find their product-market fit",
            "working_style_availability": "Looking to hire, project-based engagement"
        }
    },
    {
        "full_name": "Emily Rodriguez",
        "role_intent": "COFOUNDER",
        "skills": ["Node.js", "PostgreSQL", "AWS", "DevOps"],
        "portfolio_url": "https://github.com/emilyr",
        "ikigai": {
            "passion": "Building scalable backend systems that just work",
            "skillset": "Backend architecture, database design, cloud infrastructure",
            "mission": "Create the infrastructure layer for the next generation of apps",
            "working_style_availability": "Full-time commitment, prefer co-located team"
        }
    },
    {
        "full_name": "David Kim",
        "role_intent": "TEAMMATE",
        "skills": ["iOS", "Swift", "Mobile Development", "ARKit"],
        "portfolio_url": "https://davidkim.io",
        "ikigai": {
            "passion": "Creating delightful mobile experiences with cutting-edge technology",
            "skillset": "iOS development, AR/VR, mobile architecture",
            "mission": "Push the boundaries of what's possible on mobile devices",
            "working_style_availability": "Contract basis, available for 3-6 month projects"
        }
    },
    {
        "full_name": "Lisa Park",
        "role_intent": "CLIENT",
        "skills": ["Product Management", "Agile", "User Research"],
        "portfolio_url": "https://linkedin.com/in/lisapark",
        "ikigai": {
            "passion": "Understanding user needs and translating them into features",
            "skillset": "Product strategy, roadmap planning, stakeholder management",
            "mission": "Build products that truly solve customer problems",
            "working_style_availability": "Seeking development partners for MVP build"
        }
    },
    {
        "full_name": "James Wilson",
        "role_intent": "COFOUNDER",
        "skills": ["Blockchain", "Solidity", "Web3", "Smart Contracts"],
        "portfolio_url": "https://jameswilson.eth",
        "ikigai": {
            "passion": "Decentralizing finance and empowering individuals",
            "skillset": "Smart contract development, DeFi protocols, tokenomics",
            "mission": "Build the financial infrastructure of the decentralized future",
            "working_style_availability": "Full-time, globally distributed team, DAO experience"
        }
    },
    {
        "full_name": "Nina Patel",
        "role_intent": "TEAMMATE",
        "skills": ["Data Science", "Python", "SQL", "Tableau"],
        "portfolio_url": "https://ninapatel.data",
        "ikigai": {
            "passion": "Finding insights hidden in data that drive business decisions",
            "skillset": "Statistical analysis, data visualization, predictive modeling",
            "mission": "Help companies become truly data-driven",
            "working_style_availability": "Freelance, 15-20 hours/week, multiple clients"
        }
    },
    {
        "full_name": "Tom Anderson",
        "role_intent": "CLIENT",
        "skills": ["Venture Capital", "Startup Investing", "Due Diligence"],
        "portfolio_url": "https://andersonvc.com",
        "ikigai": {
            "passion": "Finding and backing exceptional founders",
            "skillset": "Investment analysis, portfolio management, startup mentoring",
            "mission": "Support the next wave of transformative companies",
            "working_style_availability": "Angel investor, looking for pre-seed opportunities"
        }
    },
    {
        "full_name": "Rachel Green",
        "role_intent": "COFOUNDER",
        "skills": ["Growth Marketing", "SEO", "Content Strategy", "Analytics"],
        "portfolio_url": "https://rachelgrowth.co",
        "ikigai": {
            "passion": "Scaling startups from zero to millions of users",
            "skillset": "Growth hacking, marketing automation, conversion optimization",
            "mission": "Help great products find their audience",
            "working_style_availability": "Full-time co-founder role, equity-focused"
        }
    }
]


def generate_embedding(ikigai: dict) -> list:
    """Generate embedding for ikigai profile"""
    ikigai_text = f"Passion: {ikigai['passion']}. Skills: {ikigai['skillset']}. Mission: {ikigai['mission']}. Working Style: {ikigai['working_style_availability']}."
    response = litellm.embedding(
        model="openai/text-embedding-3-small",
        input=[ikigai_text]
    )
    return response.data[0]["embedding"]


async def seed_database():
    """Seed the database with sample profiles"""
    conn = await asyncpg.connect(DATABASE_URL)
    await register_vector(conn)
    
    print("Connected to PostgreSQL database")
    
    # Clear existing data (optional - comment out if you want to append)
    await conn.execute("DELETE FROM messages")
    await conn.execute("DELETE FROM connections")
    await conn.execute("DELETE FROM ikigai")
    await conn.execute("DELETE FROM profiles")
    await conn.execute("DELETE FROM user_sessions")
    await conn.execute("DELETE FROM users")
    print("Cleared existing data")
    
    for i, profile_data in enumerate(SAMPLE_PROFILES):
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        profile_id = f"profile_{uuid.uuid4().hex[:12]}"
        ikigai_id = f"ikigai_{uuid.uuid4().hex[:12]}"
        
        # Create user
        email = f"{profile_data['full_name'].lower().replace(' ', '.')}@example.com"
        await conn.execute(
            """INSERT INTO users (user_id, email, name, picture, created_at)
               VALUES ($1, $2, $3, $4, $5)""",
            user_id, email, profile_data['full_name'], None, datetime.now(timezone.utc)
        )
        
        # Generate embedding
        print(f"Generating embedding for {profile_data['full_name']}...")
        embedding = generate_embedding(profile_data['ikigai'])
        
        now = datetime.now(timezone.utc)
        
        # Create profile
        await conn.execute(
            """INSERT INTO profiles (profile_id, user_id, full_name, role_intent, skills, portfolio_url, visibility_public, profile_embedding, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)""",
            profile_id, user_id, profile_data['full_name'], profile_data['role_intent'],
            profile_data['skills'], profile_data['portfolio_url'], True, embedding, now, now
        )
        
        # Create ikigai
        await conn.execute(
            """INSERT INTO ikigai (ikigai_id, profile_id, passion, skillset, mission, working_style_availability)
               VALUES ($1, $2, $3, $4, $5, $6)""",
            ikigai_id, profile_id, profile_data['ikigai']['passion'], profile_data['ikigai']['skillset'],
            profile_data['ikigai']['mission'], profile_data['ikigai']['working_style_availability']
        )
        
        print(f"✓ Created profile for {profile_data['full_name']} ({profile_data['role_intent']})")
    
    await conn.close()
    print(f"\n✅ Successfully seeded {len(SAMPLE_PROFILES)} profiles!")


if __name__ == "__main__":
    asyncio.run(seed_database())
