import requests
import sys
import json
import uuid
from datetime import datetime

class SuperNetworkAPITester:
    def __init__(self, base_url="https://intent-network-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []
        
    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
        
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.log_result(name, True)
                try:
                    return success, response.json()
                except:
                    return success, {"status": "success", "text": response.text}
            else:
                self.log_result(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            self.log_result(name, False, f"Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test if API is accessible"""
        try:
            response = requests.get(f"{self.base_url}/api/auth/me", timeout=10)
            # Even 401 is good - means API is responding
            if response.status_code in [401, 200]:
                self.log_result("API Health Check", True)
                return True
            else:
                self.log_result("API Health Check", False, f"Unexpected status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("API Health Check", False, f"API unreachable: {str(e)}")
            return False

    def test_ikigai_extraction(self):
        """Test Ikigai extraction without auth (should work)"""
        cv_text = """
        John Doe - Senior Software Engineer
        
        EXPERIENCE:
        - 5 years building web applications with React and Node.js
        - Led a team of 4 developers on e-commerce platform
        - Passionate about AI and machine learning applications
        
        SKILLS:
        JavaScript, Python, React, Node.js, MongoDB, AWS
        
        INTERESTS:
        Building products that solve real-world problems, especially in education technology.
        Available for full-time remote work.
        """
        
        success, response = self.run_test(
            "Ikigai Extraction",
            "POST",
            "profile/extract-ikigai",
            200,
            {"cv_text": cv_text}
        )
        
        if success:
            # Check if response has required fields
            required_fields = ['passion', 'skillset', 'mission', 'working_style_availability']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                self.log_result("Ikigai Response Structure", False, f"Missing fields: {missing_fields}")
                return False
            else:
                self.log_result("Ikigai Response Structure", True)
                return True
        return False

    def create_mock_session(self):
        """Create a mock session for testing (simulating Emergent Auth)"""
        # This would normally come from Emergent Auth, but we'll create a test user directly in DB
        # For testing purposes, we'll use a mock approach
        test_session_id = f"test_session_{uuid.uuid4().hex[:8]}"
        
        # Try to create session with mock data (this will likely fail without proper setup)
        success, response = self.run_test(
            "Mock Session Creation",
            "POST", 
            "auth/session",
            200,
            {},  # Empty body, session_id goes in header
        )
        
        if success and 'session_token' in response:
            self.session_token = response['session_token']
            return True
        
        # If session creation fails, we'll proceed with limited testing
        self.log_result("Session Setup", False, "Could not create test session - Auth-gated endpoints will fail")
        return False

def main():
    print("🚀 Starting SuperNetworkAI Backend Testing...")
    print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tester = SuperNetworkAPITester()
    
    # Test 1: Health Check
    if not tester.test_health_check():
        print("❌ API is not accessible. Stopping tests.")
        return 1
    
    # Test 2: Ikigai Extraction (No auth required)
    tester.test_ikigai_extraction()
    
    # Test 3: Mock Session (This will likely fail in real environment)
    session_created = tester.create_mock_session()
    
    # Test 4: Auth endpoints (if session exists)
    if session_created:
        tester.run_test("Get Current User", "GET", "auth/me", 200)
        tester.run_test("Get User Profile", "GET", "profile/me", 200)  # May return 404 if no profile
    
    # Test 5: Search endpoint (requires auth)
    if session_created:
        tester.run_test(
            "Search Profiles",
            "POST",
            "search",
            200,
            {"query": "I need a technical co-founder skilled in React"}
        )
    
    # Print summary
    print("\n" + "="*60)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run} passed")
    print(f"⏰ Test finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if tester.tests_passed == 0:
        print("🚨 CRITICAL: No tests passed - major issues detected")
        return 1
    elif tester.tests_passed / tester.tests_run < 0.5:
        print("⚠️  WARNING: Less than 50% tests passed")
        return 1
    else:
        print("✅ Testing completed with acceptable results")
        return 0

if __name__ == "__main__":
    sys.exit(main())