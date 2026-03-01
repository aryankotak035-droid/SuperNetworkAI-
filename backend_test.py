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
    
    # Test 2: Ikigai Extraction (No auth required) - MOST IMPORTANT
    tester.test_ikigai_extraction()
    
    # Test 3: Auth endpoints expect 401 (correct behavior)
    success, _ = tester.run_test("Auth Endpoint Protection", "GET", "auth/me", 401)
    
    # Test 4: Profile endpoints expect 401 (correct behavior) 
    success, _ = tester.run_test("Profile Endpoint Protection", "GET", "profile/me", 401)
    
    # Test 5: Search endpoint expect 401 (correct behavior)
    success, _ = tester.run_test(
        "Search Endpoint Protection",
        "POST",
        "search", 
        401,
        {"query": "test query"}
    )
    
    # Test 6: Connection endpoints expect 401 (correct behavior)
    success, _ = tester.run_test("Connections Endpoint Protection", "GET", "connections/my", 401)
    
    # Test 7: Multiple Ikigai extractions to test reliability
    cv_samples = [
        "Software engineer with 3 years React experience, passionate about fintech",
        "Product manager seeking co-founder for SaaS startup, loves remote work",
        "Designer with UX background, wants to build educational tools"
    ]
    
    for i, cv in enumerate(cv_samples):
        success, response = tester.run_test(
            f"Ikigai Sample {i+1}",
            "POST", 
            "profile/extract-ikigai",
            200,
            {"cv_text": cv}
        )
        if not success:
            break
    
    # Print summary
    print("\n" + "="*60)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run} passed")
    print(f"⏰ Test finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Special analysis for this app
    ikigai_tests = [r for r in tester.results if 'Ikigai' in r['test']]
    ikigai_success = sum(1 for t in ikigai_tests if t['success'])
    
    print(f"\n🧠 Ikigai Extraction: {ikigai_success}/{len(ikigai_tests)} successful")
    
    if ikigai_success == 0:
        print("🚨 CRITICAL: Ikigai extraction (core feature) is broken")
        return 1
    elif tester.tests_passed / tester.tests_run < 0.7:
        print("⚠️  WARNING: Less than 70% tests passed")
        return 1
    else:
        print("✅ Backend core functionality working correctly")
        print("📝 NOTE: Auth endpoints correctly protected - frontend testing needed for full flow")
        return 0

if __name__ == "__main__":
    sys.exit(main())