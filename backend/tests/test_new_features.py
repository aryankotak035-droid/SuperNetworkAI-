"""
SuperNetworkAI New Features Tests (Iteration 4)
Tests: Profile Image Upload/Delete, Search History CRUD, Static File Serving
"""
import pytest
import requests
import os
import tempfile

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_SESSION_TOKEN = "test_session_pg_001"

@pytest.fixture
def api_client():
    """Shared requests session with auth"""
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {TEST_SESSION_TOKEN}"
    })
    return session

@pytest.fixture
def unauthenticated_client():
    """Session without auth"""
    return requests.Session()


# =====================================
# PROFILE IMAGE ENDPOINTS
# =====================================
class TestProfileImageEndpoints:
    """Tests for profile image upload/delete"""
    
    def test_upload_profile_image_success(self, api_client):
        """Test POST /api/profile/image with valid image"""
        # Create a small test GIF file
        gif_header = b'GIF89a\x01\x00\x01\x00\x00\x00\x00!'  # Minimal valid GIF
        with tempfile.NamedTemporaryFile(suffix='.gif', delete=False) as f:
            f.write(gif_header)
            f.flush()
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                files = {'file': ('test.gif', f, 'image/gif')}
                response = api_client.post(f"{BASE_URL}/api/profile/image", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert "image_url" in data
            assert data["image_url"].startswith("/api/uploads/profiles/")
            assert "message" in data
            print(f"✓ Profile image uploaded: {data['image_url']}")
        finally:
            os.unlink(temp_path)
    
    def test_upload_profile_image_invalid_type(self, api_client):
        """Test POST /api/profile/image with invalid file type"""
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as f:
            f.write(b'This is not an image')
            f.flush()
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                files = {'file': ('test.txt', f, 'text/plain')}
                response = api_client.post(f"{BASE_URL}/api/profile/image", files=files)
            
            assert response.status_code == 400
            assert "Invalid file type" in response.json()["detail"]
            print("✓ Invalid file type correctly rejected")
        finally:
            os.unlink(temp_path)
    
    def test_upload_profile_image_unauthenticated(self, unauthenticated_client):
        """Test POST /api/profile/image requires auth"""
        with tempfile.NamedTemporaryFile(suffix='.gif', delete=False) as f:
            f.write(b'GIF89a')
            f.flush()
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                files = {'file': ('test.gif', f, 'image/gif')}
                response = unauthenticated_client.post(f"{BASE_URL}/api/profile/image", files=files)
            
            assert response.status_code == 401
            print("✓ Unauthenticated image upload correctly returns 401")
        finally:
            os.unlink(temp_path)
    
    def test_delete_profile_image(self, api_client):
        """Test DELETE /api/profile/image"""
        # First upload an image
        gif_header = b'GIF89a\x01\x00\x01\x00\x00\x00\x00!'
        with tempfile.NamedTemporaryFile(suffix='.gif', delete=False) as f:
            f.write(gif_header)
            f.flush()
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                files = {'file': ('test.gif', f, 'image/gif')}
                upload_resp = api_client.post(f"{BASE_URL}/api/profile/image", files=files)
            assert upload_resp.status_code == 200
            
            # Now delete it
            response = api_client.delete(f"{BASE_URL}/api/profile/image")
            assert response.status_code == 200
            assert "deleted" in response.json()["message"].lower()
            
            # Verify it's gone from profile
            profile_resp = api_client.get(f"{BASE_URL}/api/profile/me")
            assert profile_resp.json().get("profile_image") is None
            print("✓ Profile image deleted successfully")
        finally:
            os.unlink(temp_path)
    
    def test_profile_returns_image_field(self, api_client):
        """Test that /api/profile/me returns profile_image field"""
        response = api_client.get(f"{BASE_URL}/api/profile/me")
        assert response.status_code == 200
        data = response.json()
        assert "profile_image" in data
        print(f"✓ Profile contains profile_image field: {data['profile_image']}")


# =====================================
# SEARCH HISTORY ENDPOINTS
# =====================================
class TestSearchHistoryEndpoints:
    """Tests for search history CRUD"""
    
    def test_get_search_history_empty(self, api_client):
        """Test GET /api/search/history returns empty list initially"""
        # Clear any existing history first
        api_client.delete(f"{BASE_URL}/api/search/history")
        
        response = api_client.get(f"{BASE_URL}/api/search/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
        print("✓ Empty search history returns empty list")
    
    def test_search_creates_history(self, api_client):
        """Test that POST /api/search creates history entry"""
        # Clear history first
        api_client.delete(f"{BASE_URL}/api/search/history")
        
        # Perform a search
        search_response = api_client.post(
            f"{BASE_URL}/api/search",
            json={"query": "Test history creation", "role_filter": "COFOUNDER"}
        )
        assert search_response.status_code == 200
        
        # Check history was created
        history_response = api_client.get(f"{BASE_URL}/api/search/history")
        assert history_response.status_code == 200
        history = history_response.json()
        
        assert len(history) == 1
        assert history[0]["query"] == "Test history creation"
        assert history[0]["role_filter"] == "COFOUNDER"
        assert "id" in history[0]
        assert "created_at" in history[0]
        print("✓ Search creates history entry with correct data")
    
    def test_search_history_limit_10(self, api_client):
        """Test that search history is limited to last 10 entries"""
        # Clear history first
        api_client.delete(f"{BASE_URL}/api/search/history")
        
        # Create 12 searches
        for i in range(12):
            api_client.post(
                f"{BASE_URL}/api/search",
                json={"query": f"Search query {i+1}", "role_filter": None}
            )
        
        # Check history is limited to 10
        history_response = api_client.get(f"{BASE_URL}/api/search/history")
        assert history_response.status_code == 200
        history = history_response.json()
        
        assert len(history) <= 10
        # Most recent should be first
        assert "Search query 12" in history[0]["query"]
        print(f"✓ Search history limited to {len(history)} entries (max 10)")
    
    def test_delete_single_history_item(self, api_client):
        """Test DELETE /api/search/history/{id}"""
        # Clear and create new entry
        api_client.delete(f"{BASE_URL}/api/search/history")
        api_client.post(
            f"{BASE_URL}/api/search",
            json={"query": "To be deleted", "role_filter": None}
        )
        
        # Get the ID
        history = api_client.get(f"{BASE_URL}/api/search/history").json()
        item_id = history[0]["id"]
        
        # Delete it
        response = api_client.delete(f"{BASE_URL}/api/search/history/{item_id}")
        assert response.status_code == 200
        
        # Verify deletion
        history_after = api_client.get(f"{BASE_URL}/api/search/history").json()
        assert len(history_after) == 0
        print("✓ Single search history item deleted successfully")
    
    def test_delete_nonexistent_history_item(self, api_client):
        """Test DELETE /api/search/history/{id} returns 404 for non-existent"""
        response = api_client.delete(f"{BASE_URL}/api/search/history/99999")
        assert response.status_code == 404
        print("✓ Delete non-existent history item returns 404")
    
    def test_clear_all_history(self, api_client):
        """Test DELETE /api/search/history clears all"""
        # Create some history
        for i in range(3):
            api_client.post(
                f"{BASE_URL}/api/search",
                json={"query": f"Clear test {i}", "role_filter": None}
            )
        
        # Clear all
        response = api_client.delete(f"{BASE_URL}/api/search/history")
        assert response.status_code == 200
        
        # Verify all cleared
        history = api_client.get(f"{BASE_URL}/api/search/history").json()
        assert len(history) == 0
        print("✓ All search history cleared successfully")
    
    def test_search_history_unauthenticated(self, unauthenticated_client):
        """Test GET /api/search/history requires auth"""
        response = unauthenticated_client.get(f"{BASE_URL}/api/search/history")
        assert response.status_code == 401
        print("✓ Unauthenticated search history access returns 401")


# =====================================
# STATIC FILE SERVING
# =====================================
class TestStaticFileServing:
    """Tests for profile image static file serving"""
    
    def test_uploads_directory_accessible(self, api_client):
        """Test that uploaded files are accessible via /api/uploads/profiles/"""
        # First upload an image
        gif_header = b'GIF89a\x01\x00\x01\x00\x00\x00\x00!'
        with tempfile.NamedTemporaryFile(suffix='.gif', delete=False) as f:
            f.write(gif_header)
            f.flush()
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                files = {'file': ('test.gif', f, 'image/gif')}
                upload_resp = api_client.post(f"{BASE_URL}/api/profile/image", files=files)
            
            assert upload_resp.status_code == 200
            image_url = upload_resp.json()["image_url"]
            
            # Try to access the file
            file_response = requests.get(f"{BASE_URL}{image_url}")
            assert file_response.status_code == 200
            assert file_response.headers["content-type"] == "image/gif"
            print(f"✓ Static file accessible at {image_url}")
            
            # Cleanup
            api_client.delete(f"{BASE_URL}/api/profile/image")
        finally:
            os.unlink(temp_path)


# =====================================
# SEARCH RESULTS WITH PROFILE IMAGE
# =====================================
class TestSearchResultsProfileImage:
    """Tests for profile_image in search results"""
    
    def test_search_results_include_profile_image(self, api_client):
        """Test that search results include profile_image field"""
        response = api_client.post(
            f"{BASE_URL}/api/search",
            json={"query": "developer", "role_filter": None}
        )
        assert response.status_code == 200
        results = response.json()
        
        if len(results) > 0:
            profile = results[0]["profile"]
            assert "profile_image" in profile
            print(f"✓ Search results include profile_image field")
        else:
            print("✓ No search results, skipping profile_image check")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
