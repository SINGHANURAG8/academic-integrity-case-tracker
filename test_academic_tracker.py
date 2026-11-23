import unittest
import os
import glob
from app import app, init_db, seed_data, get_db_connection

class TestAcademicIntegrityTracker(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        init_db()
        seed_data()
        self.client = app.test_client()

    def test_css_and_js_connected(self):
        """Verify that style.css and script.js exist and are connected in index.html."""
        template_path = os.path.join(os.path.dirname(__file__), "templates", "index.html")
        css_path = os.path.join(os.path.dirname(__file__), "static", "style.css")
        js_path = os.path.join(os.path.dirname(__file__), "static", "script.js")
        
        self.assertTrue(os.path.exists(template_path), "index.html template must exist")
        self.assertTrue(os.path.exists(css_path), "static/style.css must exist")
        self.assertTrue(os.path.exists(js_path), "static/script.js must exist")
        
        with open(template_path, "r", encoding="utf-8") as f:
            content = f.read()
            self.assertIn("style.css", content, "style.css must be connected in index.html")
            self.assertIn("script.js", content, "script.js must be connected in index.html")

    def test_database_seeded(self):
        """Verify that demo users and cases are correctly seeded."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        self.assertGreaterEqual(user_count, 5, "Should have at least 5 demo users")

        cursor.execute("SELECT COUNT(*) FROM cases")
        case_count = cursor.fetchone()[0]
        self.assertGreaterEqual(case_count, 5, "Should have at least 5 initial cases")
        conn.close()

    def test_login_success_and_logout(self):
        """Test authentication flow for officer."""
        response = self.client.post("/login", data={
            "username": "officer",
            "password": "officer123",
            "role": "Integrity Officer"
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Welcome back", response.data)
        self.assertIn(b"Integrity Officer", response.data)

        # Logout
        logout_resp = self.client.get("/logout", follow_redirects=True)
        self.assertEqual(logout_resp.status_code, 200)
        self.assertIn(b"successfully logged out", logout_resp.data)

    def test_role_based_login_redirects(self):
        """Verify that login redirects each role to their dedicated portal view."""
        # 1. Admin redirects to /users
        resp_admin = self.client.post("/login", data={
            "username": "admin",
            "password": "admin123",
            "role": "Administrator"
        }, follow_redirects=False)
        self.assertEqual(resp_admin.status_code, 302)
        self.assertTrue(resp_admin.location.endswith("/users"))
        self.client.get("/logout")

        # 2. Officer redirects to /cases
        resp_officer = self.client.post("/login", data={
            "username": "officer",
            "password": "officer123",
            "role": "Integrity Officer"
        }, follow_redirects=False)
        self.assertEqual(resp_officer.status_code, 302)
        self.assertTrue(resp_officer.location.endswith("/cases"))
        self.client.get("/logout")

        # 3. Investigator redirects to /cases
        resp_invest = self.client.post("/login", data={
            "username": "investigator",
            "password": "invest123",
            "role": "Investigator"
        }, follow_redirects=False)
        self.assertEqual(resp_invest.status_code, 302)
        self.assertTrue(resp_invest.location.endswith("/cases"))
        self.client.get("/logout")

        # 4. Faculty redirects to /dashboard
        resp_faculty = self.client.post("/login", data={
            "username": "faculty",
            "password": "faculty123",
            "role": "Faculty/Reporter"
        }, follow_redirects=False)
        self.assertEqual(resp_faculty.status_code, 302)
        self.assertTrue(resp_faculty.location.endswith("/dashboard"))
        self.client.get("/logout")

    def test_login_invalid_password(self):
        """Test rejection of invalid credentials."""
        response = self.client.post("/login", data={
            "username": "officer",
            "password": "wrongpassword",
            "role": ""
        }, follow_redirects=True)
        self.assertIn(b"Invalid username or password", response.data)

    def test_role_enforcement_faculty_restrictions(self):
        """Verify Faculty cannot access admin user management or audit logs."""
        # Login as faculty
        self.client.post("/login", data={
            "username": "faculty",
            "password": "faculty123",
            "role": "Faculty/Reporter"
        }, follow_redirects=True)

        # Try accessing /users
        resp_users = self.client.get("/users", follow_redirects=True)
        self.assertIn(b"Access denied", resp_users.data)

        # Try accessing /audit-logs
        resp_audit = self.client.get("/audit-logs", follow_redirects=True)
        self.assertIn(b"Access denied", resp_audit.data)

    def test_role_enforcement_admin_access(self):
        """Verify Admin can access user management and create a user."""
        self.client.post("/login", data={
            "username": "admin",
            "password": "admin123",
            "role": "Administrator"
        }, follow_redirects=True)

        resp_users = self.client.get("/users")
        self.assertEqual(resp_users.status_code, 200)
        self.assertIn(b"User Account Administration", resp_users.data)

        # Create new user with unique username
        import time
        unique_username = f"prof_test_{int(time.time())}"
        create_resp = self.client.post("/users", data={
            "username": unique_username,
            "password": "testpassword123",
            "full_name": "Prof. Test Account",
            "role": "Faculty/Reporter",
            "email": f"{unique_username}@college.edu"
        }, follow_redirects=True)
        self.assertIn(b"created successfully", create_resp.data)

    def test_case_creation_and_workflow_status_update(self):
        """Test filing a new incident and progressing it through workflow."""
        # Login as faculty
        self.client.post("/login", data={
            "username": "faculty",
            "password": "faculty123",
            "role": "Faculty/Reporter"
        }, follow_redirects=True)

        # File new case
        new_case_resp = self.client.post("/cases/new", data={
            "student_id": "STU-9901",
            "student_name": "Sam Student",
            "course_name": "CS105 Discrete Math",
            "incident_type": "Exam Cheating",
            "incident_date": "2026-10-21",
            "description": "Unauthorized formula notes on scratch paper."
        }, follow_redirects=True)
        self.assertEqual(new_case_resp.status_code, 200)
        self.assertIn(b"submitted successfully", new_case_resp.data)

        # Login as officer to change status
        self.client.get("/logout")
        self.client.post("/login", data={
            "username": "officer",
            "password": "officer123",
            "role": "Integrity Officer"
        }, follow_redirects=True)

        # Fetch case from db
        conn = get_db_connection()
        c = conn.cursor().execute("SELECT id FROM cases WHERE student_id = 'STU-9901'").fetchone()
        case_id = c["id"]
        conn.close()

        # Update status to Under Review
        status_resp = self.client.post(f"/cases/{case_id}/status", data={
            "status": "Under Review",
            "status_note": "Initial documents verified by officer.",
            "resolution": ""
        }, follow_redirects=True)
        self.assertIn(b"status successfully changed to", status_resp.data)

        # Assign investigator
        conn = get_db_connection()
        inv = conn.cursor().execute("SELECT id FROM users WHERE username = 'investigator'").fetchone()
        inv_id = inv["id"]
        conn.close()

        assign_resp = self.client.post(f"/cases/{case_id}/assign", data={
            "investigator_id": str(inv_id)
        }, follow_redirects=True)
        self.assertIn(b"Investigator successfully updated", assign_resp.data)

    def test_search_and_filter(self):
        """Test searching cases and status filtering."""
        self.client.post("/login", data={
            "username": "officer",
            "password": "officer123",
            "role": "Integrity Officer"
        }, follow_redirects=True)

        # Search for Plagiarism
        resp = self.client.get("/cases?search=Plagiarism&status=All")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"AIC-2026-001", resp.data)

        # Filter by status
        resp2 = self.client.get("/cases?search=&status=Resolved")
        self.assertEqual(resp2.status_code, 200)
        self.assertIn(b"AIC-2026-004", resp2.data)

if __name__ == "__main__":
    unittest.main()
