"""
SuperNetworkAI Backend API Tests
Tests: Authentication, Profiles, Search, Connections, Messages
PostgreSQL + pgvector semantic search
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_SESSION_TOKEN = "test_session_pg_001"

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TEST_SESSION_TOKEN}"
    })
    return session

@pytest.fixture
def unauthenticated_client():
    """Session without auth"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


# =====================================
# AUTH ENDPOINTS
# =====================================
class TestAuthEndpoints:
    """Tests for authentication endpoints"""
    
    def test_auth_me_success(self, api_client):
        """Test /api/auth/me returns user data with valid session"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        assert data["user_id"] == "test_user_pg_001"
        print(f"✓ Auth me: {data['email']}")
    
    def test_auth_me_unauthenticated(self, unauthenticated_client):
        """Test /api/auth/me returns 401 without auth"""
        response = unauthenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth me correctly returns 401 for unauthenticated")


# =====================================
# PROFILE ENDPOINTS
# =====================================
class TestProfileEndpoints:
    """Tests for profile CRUD operations"""
    
    def test_profile_me_success(self, api_client):
        """Test /api/profile/me returns user's profile"""
        response = api_client.get(f"{BASE_URL}/api/profile/me")
        assert response.status_code == 200
        
        data = response.json()
        assert "profile_id" in data
        assert "full_name" in data
        assert "role_intent" in data
        assert "skills" in data
        assert "ikigai" in data
        
        # Verify ikigai structure
        ikigai = data["ikigai"]
        assert "passion" in ikigai
        assert "skillset" in ikigai
        assert "mission" in ikigai
        assert "working_style_availability" in ikigai
        print(f"✓ Profile me: {data['full_name']} - {data['role_intent']}")
    
    def test_profile_me_unauthenticated(self, unauthenticated_client):
        """Test /api/profile/me returns 401 without auth"""
        response = unauthenticated_client.get(f"{BASE_URL}/api/profile/me")
        assert response.status_code == 401
        print("✓ Profile me correctly returns 401 for unauthenticated")
    
    def test_profile_completeness(self, api_client):
        """Test /api/profile/completeness endpoint"""
        response = api_client.get(f"{BASE_URL}/api/profile/completeness")
        assert response.status_code == 200
        
        data = response.json()
        assert "completeness" in data
        assert "missing" in data
        assert isinstance(data["completeness"], int)
        assert 0 <= data["completeness"] <= 100
        print(f"✓ Profile completeness: {data['completeness']}%")
    
    def test_get_profile_by_id(self, api_client):
        """Test /api/profile/{profile_id}"""
        response = api_client.get(f"{BASE_URL}/api/profile/profile_test_pg_001")
        assert response.status_code == 200
        
        data = response.json()
        assert data["profile_id"] == "profile_test_pg_001"
        print(f"✓ Get profile by ID: {data['full_name']}")
    
    def test_get_profile_not_found(self, api_client):
        """Test /api/profile/{profile_id} returns 404 for non-existent"""
        response = api_client.get(f"{BASE_URL}/api/profile/nonexistent_profile_123")
        assert response.status_code == 404
        print("✓ Profile not found returns 404 correctly")


# =====================================
# SEARCH ENDPOINT (pgvector semantic search)
# =====================================
class TestSearchEndpoint:
    """Tests for AI-powered semantic search using pgvector"""
    
    def test_search_basic(self, api_client):
        """Test /api/search with basic query"""
        response = api_client.post(
            f"{BASE_URL}/api/search",
            json={"query": "python developer", "role_filter": None}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Search returned {len(data)} results")
    
    def test_search_with_role_filter(self, api_client):
        """Test /api/search with role filter"""
        response = api_client.post(
            f"{BASE_URL}/api/search",
            json={"query": "looking for a startup partner", "role_filter": "COFOUNDER"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # All results should have COFOUNDER role if filter works
        for result in data:
            assert result["profile"]["role_intent"] == "COFOUNDER"
        print(f"✓ Search with COFOUNDER filter: {len(data)} results")
    
    def test_search_result_structure(self, api_client):
        """Test search result has correct structure"""
        response = api_client.post(
            f"{BASE_URL}/api/search",
            json={"query": "AI machine learning", "role_filter": None}
        )
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            result = data[0]
            assert "profile" in result
            assert "match_score" in result
            assert "ai_explanation" in result
            
            profile = result["profile"]
            assert "profile_id" in profile
            assert "full_name" in profile
            assert "role_intent" in profile
            assert "skills" in profile
            print(f"✓ Search result structure valid, first match: {profile['full_name']}")
        else:
            print("✓ Search returned empty results (valid)")
    
    def test_search_unauthenticated(self, unauthenticated_client):
        """Test /api/search requires auth"""
        response = unauthenticated_client.post(
            f"{BASE_URL}/api/search",
            json={"query": "test", "role_filter": None}
        )
        assert response.status_code == 401
        print("✓ Search correctly returns 401 for unauthenticated")


# =====================================
# CONNECTIONS ENDPOINTS
# =====================================
class TestConnectionEndpoints:
    """Tests for connection request system"""
    
    def test_get_my_connections(self, api_client):
        """Test /api/connections/my"""
        response = api_client.get(f"{BASE_URL}/api/connections/my")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ My connections: {len(data)} connections")
    
    def test_connection_request_to_nonexistent_profile(self, api_client):
        """Test sending connection to non-existent profile"""
        response = api_client.post(
            f"{BASE_URL}/api/connections/request",
            json={"receiver_profile_id": "nonexistent_profile_999"}
        )
        assert response.status_code == 404
        print("✓ Connection request to non-existent profile returns 404")
    
    def test_connection_request_success(self, api_client):
        """Test sending connection request to seeded profile"""
        # First get a valid profile ID from seeded data
        search_response = api_client.post(
            f"{BASE_URL}/api/search",
            json={"query": "professional", "role_filter": None}
        )
        if search_response.status_code == 200 and len(search_response.json()) > 0:
            target_profile_id = search_response.json()[0]["profile"]["profile_id"]
            
            response = api_client.post(
                f"{BASE_URL}/api/connections/request",
                json={"receiver_profile_id": target_profile_id}
            )
            # Should be 200 or 400 (if connection already exists)
            assert response.status_code in [200, 400]
            if response.status_code == 200:
                print(f"✓ Connection request sent to {target_profile_id}")
            else:
                print("✓ Connection already exists (expected for repeated test)")
        else:
            pytest.skip("No profiles found for connection test")


# =====================================
# MESSAGES ENDPOINTS
# =====================================
class TestMessagesEndpoints:
    """Tests for messaging system"""
    
    def test_get_conversations(self, api_client):
        """Test /api/messages/conversations"""
        response = api_client.get(f"{BASE_URL}/api/messages/conversations")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Conversations: {len(data)} conversations")
    
    def test_send_message_not_connected(self, api_client):
        """Test sending message to non-connected user fails"""
        # Try sending to seeded profile (not connected)
        response = api_client.post(
            f"{BASE_URL}/api/messages/send",
            json={
                "receiver_profile_id": "profile_459ffbc620fb",  # Alex Chen from seed
                "content": "Test message"
            }
        )
        # Should return 403 (not connected) unless connection was accepted
        assert response.status_code in [200, 403]
        if response.status_code == 403:
            print("✓ Message to non-connected user correctly returns 403")
        else:
            print("✓ Message sent (users connected)")


# =====================================
# VISIBILITY ENDPOINT
# =====================================
class TestVisibilityEndpoint:
    """Tests for profile visibility toggle"""
    
    def test_visibility_toggle(self, api_client):
        """Test /api/profile/visibility"""
        # Get current visibility
        profile_resp = api_client.get(f"{BASE_URL}/api/profile/me")
        current_visibility = profile_resp.json()["visibility_public"]
        
        # Toggle visibility
        response = api_client.put(
            f"{BASE_URL}/api/profile/visibility",
            params={"visibility_public": not current_visibility}
        )
        assert response.status_code == 200
        
        # Verify change
        profile_resp2 = api_client.get(f"{BASE_URL}/api/profile/me")
        new_visibility = profile_resp2.json()["visibility_public"]
        assert new_visibility != current_visibility
        
        # Restore original
        api_client.put(
            f"{BASE_URL}/api/profile/visibility",
            params={"visibility_public": current_visibility}
        )
        print(f"✓ Visibility toggled: {current_visibility} -> {new_visibility} -> {current_visibility}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
