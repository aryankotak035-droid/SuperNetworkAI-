import asyncio
import os
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from openai import OpenAI
from datetime import datetime, timezone
import uuid

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / 'backend' / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
OPENAI_API_KEY = os.environ['OPENAI_API_KEY']

openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Synthetic profiles data
SYNTHETIC_PROFILES = [
    {
        "full_name": "Alex Chen",
        "role_intent": "COFOUNDER",
        "skills": ["Next.js", "Python", "GenAI", "Product Design"],
        "ikigai": {
            "passion": "Democratizing AI tools for small businesses",
            "skillset": "4 years of full-stack development with expertise in Next.js, Python, and LLM integration. Strong product design skills.",
            "mission": "Build an AI-first company that makes advanced technology accessible to non-technical users",
            "working_style_availability": "Full-time, remote-friendly, experienced in early-stage startups"
        }
    },
    {
        "full_name": "Sarah Johnson",
        "role_intent": "TEAMMATE",
        "skills": ["React", "Node.js", "PostgreSQL", "DevOps"],
        "ikigai": {
            "passion": "Building scalable web applications with great UX",
            "skillset": "Senior full-stack engineer with 6 years experience. Expert in React, Node.js, and database design.",
            "mission": "Join a mission-driven team building developer tools",
            "working_style_availability": "Part-time (20h/week), remote only, available evenings and weekends"
        }
    },
    {
        "full_name": "Michael Rodriguez",
        "role_intent": "CLIENT",
        "skills": ["UI/UX Design", "Figma", "Branding", "Animation"],
        "ikigai": {
            "passion": "Creating delightful user experiences that surprise and engage",
            "skillset": "10 years of product design experience. Specializing in SaaS products and brand identity.",
            "mission": "Help startups build beautiful, conversion-optimized products",
            "working_style_availability": "Freelance, 2-3 projects at a time, quick turnaround"
        }
    },
    {
        "full_name": "Emily Zhang",
        "role_intent": "COFOUNDER",
        "skills": ["Machine Learning", "PyTorch", "Data Science", "Research"],
        "ikigai": {
            "passion": "Making AI models more interpretable and trustworthy",
            "skillset": "PhD in ML with 5 years industry experience at top AI labs. Published researcher.",
            "mission": "Build responsible AI products that prioritize transparency and user control",
            "working_style_availability": "Full-time, open to relocation, strong academic network"
        }
    },
    {
        "full_name": "James Williams",
        "role_intent": "TEAMMATE",
        "skills": ["Go", "Kubernetes", "AWS", "Microservices"],
        "ikigai": {
            "passion": "Building robust, high-performance backend systems",
            "skillset": "8 years of backend engineering. Expert in distributed systems and cloud infrastructure.",
            "mission": "Join a team building infrastructure for the next generation of web apps",
            "working_style_availability": "Full-time, hybrid (San Francisco Bay Area), strong mentorship focus"
        }
    },
    {
        "full_name": "Priya Patel",
        "role_intent": "COFOUNDER",
        "skills": ["Product Management", "Fundraising", "Growth", "Strategy"],
        "ikigai": {
            "passion": "Bringing innovative products from 0 to 1",
            "skillset": "Former PM at Google, raised $5M seed round. Strong GTM and growth strategy.",
            "mission": "Build a consumer AI product that reaches 100M users",
            "working_style_availability": "Full-time, based in NYC, extensive investor network"
        }
    },
    {
        "full_name": "David Kim",
        "role_intent": "CLIENT",
        "skills": ["iOS Development", "Swift", "SwiftUI", "App Store Optimization"],
        "ikigai": {
            "passion": "Crafting native mobile experiences that feel magical",
            "skillset": "12 years iOS development. Built apps with 1M+ downloads. App Store Featured multiple times.",
            "mission": "Help startups launch successful mobile products",
            "working_style_availability": "Freelance, 1-2 projects at a time, 3-6 month engagements"
        }
    },
    {
        "full_name": "Lisa Thompson",
        "role_intent": "TEAMMATE",
        "skills": ["Content Writing", "SEO", "Marketing", "Community Building"],
        "ikigai": {
            "passion": "Telling compelling stories that drive growth",
            "skillset": "6 years content marketing. Grew blog from 0 to 100K monthly visitors. SEO expert.",
            "mission": "Join a content-driven company building in public",
            "working_style_availability": "Full-time, remote, strong social media presence"
        }
    },
    {
        "full_name": "Robert Lee",
        "role_intent": "COFOUNDER",
        "skills": ["Sales", "Enterprise", "B2B", "Negotiation"],
        "ikigai": {
            "passion": "Building long-term enterprise relationships",
            "skillset": "15 years enterprise sales. Closed $50M+ in deals. Strong Fortune 500 network.",
            "mission": "Build a B2B SaaS company with a focus on customer success",
            "working_style_availability": "Full-time, travel-friendly, extensive industry connections"
        }
    },
    {
        "full_name": "Ana Garcia",
        "role_intent": "TEAMMATE",
        "skills": ["Rust", "WebAssembly", "Performance", "Systems Programming"],
        "ikigai": {
            "passion": "Pushing the boundaries of web performance",
            "skillset": "7 years systems programming. Rust expert. Contributed to major open-source projects.",
            "mission": "Work on cutting-edge web technologies and developer tools",
            "working_style_availability": "Full-time, remote, strong open-source contributor"
        }
    },
    {
        "full_name": "Tom Anderson",
        "role_intent": "CLIENT",
        "skills": ["Video Production", "Motion Graphics", "3D Animation", "Storytelling"],
        "ikigai": {
            "passion": "Creating cinematic brand videos that captivate audiences",
            "skillset": "10 years video production. Worked with major brands. Emmy-nominated.",
            "mission": "Help startups tell their stories through compelling video content",
            "working_style_availability": "Freelance, project-based, 2-4 week turnarounds"
        }
    },
    {
        "full_name": "Nina Kowalski",
        "role_intent": "COFOUNDER",
        "skills": ["Healthcare", "Regulatory", "Operations", "Compliance"],
        "ikigai": {
            "passion": "Improving healthcare access through technology",
            "skillset": "8 years healthcare operations. Expert in FDA regulations and HIPAA compliance.",
            "mission": "Build a digital health company that makes care more affordable and accessible",
            "working_style_availability": "Full-time, based in Boston, deep healthcare network"
        }
    },
    {
        "full_name": "Chris Martinez",
        "role_intent": "TEAMMATE",
        "skills": ["Blockchain", "Solidity", "Web3", "Smart Contracts"],
        "ikigai": {
            "passion": "Building decentralized systems that empower users",
            "skillset": "5 years Web3 development. Audited $100M+ in smart contracts. DeFi expert.",
            "mission": "Work on crypto projects with real-world utility",
            "working_style_availability": "Full-time, remote, active in crypto communities"
        }
    },
    {
        "full_name": "Jessica Brown",
        "role_intent": "CLIENT",
        "skills": ["Data Analysis", "SQL", "Tableau", "Business Intelligence"],
        "ikigai": {
            "passion": "Turning data into actionable insights",
            "skillset": "9 years data analytics. Expert in building dashboards and predictive models.",
            "mission": "Help companies make data-driven decisions",
            "working_style_availability": "Freelance, part-time, quick 2-week sprints"
        }
    },
    {
        "full_name": "Daniel Ng",
        "role_intent": "COFOUNDER",
        "skills": ["Finance", "FinTech", "Payments", "Trading"],
        "ikigai": {
            "passion": "Making financial services more accessible and transparent",
            "skillset": "12 years investment banking + 4 years FinTech startup. Payment systems expert.",
            "mission": "Build a neobank for the underserved",
            "working_style_availability": "Full-time, NYC or London, strong regulatory knowledge"
        }
    },
    {
        "full_name": "Sophie Dubois",
        "role_intent": "TEAMMATE",
        "skills": ["QA Testing", "Automation", "Cypress", "Test Strategy"],
        "ikigai": {
            "passion": "Ensuring flawless user experiences through rigorous testing",
            "skillset": "6 years QA engineering. Built automated testing frameworks from scratch.",
            "mission": "Join a quality-focused team building mission-critical software",
            "working_style_availability": "Full-time, remote, strong process documentation skills"
        }
    },
    {
        "full_name": "Mark Thompson",
        "role_intent": "CLIENT",
        "skills": ["Legal", "IP Law", "Contracts", "Corporate"],
        "ikigai": {
            "passion": "Protecting startups from legal pitfalls",
            "skillset": "15 years startup law. Helped 100+ companies with incorporation, fundraising, and IP.",
            "mission": "Make legal services affordable for early-stage founders",
            "working_style_availability": "Consulting, retainer-based, quick responses"
        }
    },
    {
        "full_name": "Aisha Khan",
        "role_intent": "COFOUNDER",
        "skills": ["Education", "Curriculum Design", "EdTech", "Learning Science"],
        "ikigai": {
            "passion": "Reimagining education for the 21st century",
            "skillset": "10 years teaching + 5 years EdTech product. PhD in Learning Sciences.",
            "mission": "Build an AI-powered learning platform that adapts to each student",
            "working_style_availability": "Full-time, remote, strong education network"
        }
    },
    {
        "full_name": "Jake Wilson",
        "role_intent": "TEAMMATE",
        "skills": ["Unity", "Game Development", "C#", "3D Graphics"],
        "ikigai": {
            "passion": "Creating immersive gaming experiences",
            "skillset": "8 years game development. Shipped 5+ games with 1M+ downloads.",
            "mission": "Work on innovative gaming or VR projects",
            "working_style_availability": "Full-time, hybrid, strong game design sense"
        }
    },
    {
        "full_name": "Carmen Silva",
        "role_intent": "CLIENT",
        "skills": ["Translation", "Localization", "Multilingual", "Copywriting"],
        "ikigai": {
            "passion": "Helping brands communicate across cultures",
            "skillset": "Fluent in 5 languages. 12 years localization for global brands.",
            "mission": "Make international expansion seamless for startups",
            "working_style_availability": "Freelance, flexible hours, quick turnarounds"
        }
    },
    {
        "full_name": "Ryan Foster",
        "role_intent": "COFOUNDER",
        "skills": ["E-commerce", "Shopify", "DTC", "Supply Chain"],
        "ikigai": {
            "passion": "Building direct-to-consumer brands that resonate",
            "skillset": "7 years e-commerce. Built a DTC brand to $10M ARR. Supply chain expert.",
            "mission": "Launch a sustainable consumer brand",
            "working_style_availability": "Full-time, LA-based, strong influencer network"
        }
    },
    {
        "full_name": "Olivia Martin",
        "role_intent": "TEAMMATE",
        "skills": ["Customer Success", "Support", "Onboarding", "Retention"],
        "ikigai": {
            "passion": "Turning users into passionate advocates",
            "skillset": "5 years customer success at B2B SaaS. Reduced churn by 40% through proactive engagement.",
            "mission": "Join a customer-centric company with strong product-market fit",
            "working_style_availability": "Full-time, remote, empathy-driven approach"
        }
    },
    {
        "full_name": "Ben Carter",
        "role_intent": "CLIENT",
        "skills": ["Security", "Penetration Testing", "Compliance", "Privacy"],
        "ikigai": {
            "passion": "Protecting companies from cyber threats",
            "skillset": "10 years cybersecurity. CISSP certified. Performed 200+ security audits.",
            "mission": "Help startups build secure products from day one",
            "working_style_availability": "Consulting, project-based, SOC 2 expertise"
        }
    },
    {
        "full_name": "Maya Patel",
        "role_intent": "COFOUNDER",
        "skills": ["Climate Tech", "Sustainability", "Renewable Energy", "Policy"],
        "ikigai": {
            "passion": "Solving climate change through technology and policy",
            "skillset": "8 years climate tech. Former policy advisor. Strong grant-writing skills.",
            "mission": "Build a carbon-negative company with real environmental impact",
            "working_style_availability": "Full-time, open to relocation, mission-driven"
        }
    },
    {
        "full_name": "Tyler Brooks",
        "role_intent": "TEAMMATE",
        "skills": ["Android", "Kotlin", "Jetpack Compose", "Mobile"],
        "ikigai": {
            "passion": "Building beautiful Android experiences",
            "skillset": "6 years Android development. Google-certified. Strong Material Design expertise.",
            "mission": "Work on consumer mobile apps with millions of users",
            "working_style_availability": "Full-time, remote, active on Android Twitter"
        }
    },
    {
        "full_name": "Isabella Rossi",
        "role_intent": "CLIENT",
        "skills": ["Photography", "Branding", "Social Media", "Visual Identity"],
        "ikigai": {
            "passion": "Capturing brand essence through visual storytelling",
            "skillset": "15 years commercial photography. Worked with Fortune 500 brands.",
            "mission": "Help startups build stunning visual brands",
            "working_style_availability": "Freelance, project-based, 1-2 week shoots"
        }
    },
    {
        "full_name": "Kevin O'Brien",
        "role_intent": "COFOUNDER",
        "skills": ["Real Estate", "PropTech", "Investment", "Development"],
        "ikigai": {
            "passion": "Modernizing the real estate industry with technology",
            "skillset": "10 years real estate investment + 3 years PropTech. Strong investor relationships.",
            "mission": "Build a PropTech platform that simplifies home buying",
            "working_style_availability": "Full-time, NYC-based, strong capital access"
        }
    },
    {
        "full_name": "Yuki Tanaka",
        "role_intent": "TEAMMATE",
        "skills": ["NLP", "Transformers", "LLMs", "Research"],
        "ikigai": {
            "passion": "Advancing natural language understanding",
            "skillset": "PhD candidate in NLP. Published at top ML conferences. Hugging Face contributor.",
            "mission": "Work on cutting-edge LLM research and applications",
            "working_style_availability": "Full-time, remote, graduating in 3 months"
        }
    },
    {
        "full_name": "Grace Miller",
        "role_intent": "CLIENT",
        "skills": ["HR", "Recruiting", "Talent", "Culture"],
        "ikigai": {
            "passion": "Building exceptional teams and cultures",
            "skillset": "12 years recruiting. Placed 500+ candidates. Strong tech talent network.",
            "mission": "Help startups build world-class teams",
            "working_style_availability": "Consulting, success-based fees, quick placements"
        }
    },
    {
        "full_name": "Lucas Schmidt",
        "role_intent": "COFOUNDER",
        "skills": ["Robotics", "Automation", "Computer Vision", "Hardware"],
        "ikigai": {
            "passion": "Building robots that improve daily life",
            "skillset": "9 years robotics engineering. Built autonomous systems. Strong hardware + software.",
            "mission": "Build a robotics company focused on eldercare",
            "working_style_availability": "Full-time, Bay Area, strong manufacturing connections"
        }
    }
]

async def generate_embedding(text):
    """Generate embedding for text"""
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

async def seed_database():
    """Seed database with synthetic profiles"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("Starting database seeding...")
    
    for i, profile_data in enumerate(SYNTHETIC_PROFILES):
        try:
            # Create user
            user_id = f"synthetic_user_{uuid.uuid4().hex[:12]}"
            user_email = f"{profile_data['full_name'].lower().replace(' ', '.')}@example.com"
            
            user_doc = {
                "user_id": user_id,
                "email": user_email,
                "name": profile_data["full_name"],
                "picture": f"https://api.dicebear.com/7.x/avataaars/svg?seed={profile_data['full_name']}",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(user_doc)
            
            # Create profile
            profile_id = f"profile_{uuid.uuid4().hex[:12]}"
            
            # Generate embedding
            ikigai_text = f"Passion: {profile_data['ikigai']['passion']}. Skills: {profile_data['ikigai']['skillset']}. Mission: {profile_data['ikigai']['mission']}. Working Style: {profile_data['ikigai']['working_style_availability']}."
            embedding = await generate_embedding(ikigai_text)
            
            profile_doc = {
                "profile_id": profile_id,
                "user_id": user_id,
                "full_name": profile_data["full_name"],
                "role_intent": profile_data["role_intent"],
                "skills": profile_data["skills"],
                "portfolio_url": None,
                "visibility_public": True,
                "profile_embedding": embedding,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.profiles.insert_one(profile_doc)
            
            # Create Ikigai
            ikigai_doc = {
                "ikigai_id": f"ikigai_{uuid.uuid4().hex[:12]}",
                "profile_id": profile_id,
                "passion": profile_data['ikigai']['passion'],
                "skillset": profile_data['ikigai']['skillset'],
                "mission": profile_data['ikigai']['mission'],
                "working_style_availability": profile_data['ikigai']['working_style_availability']
            }
            
            await db.ikigai.insert_one(ikigai_doc)
            
            print(f"✓ Seeded profile {i+1}/{len(SYNTHETIC_PROFILES)}: {profile_data['full_name']}")
            
        except Exception as e:
            print(f"✗ Error seeding {profile_data['full_name']}: {e}")
    
    client.close()
    print(f"\n✅ Successfully seeded {len(SYNTHETIC_PROFILES)} profiles!")

if __name__ == "__main__":
    asyncio.run(seed_database())
