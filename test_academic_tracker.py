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

    def test_zero_javascript(self):
        """Verify that absolutely no JavaScript or <script> tags exist in templates or static CSS."""
        template_files = glob.glob(os.path.join(os.path.dirname(__file__), "templates", "*.html"))
        static_files = glob.glob(os.path.join(os.path.dirname(__file__), "static", "style.css"))
        
        all_files = template_files + static_files
        self.assertTrue(len(all_files) > 0, "Template and CSS files must exist")
        
        for file_path in all_files:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read().lower()
                self.assertNotIn("<script", content, f"<script> tag found in {file_path}")
                self.assertNotIn("javascript:", content, f"javascript: found in {file_path}")
                self.assertNotIn("onclick=", content, f"onclick found in {file_path}")
                self.assertNotIn("onload=", content, f"onload found in {file_path}")
                self.assertNotIn("onsubmit=", content, f"onsubmit found in {file_path}")

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

        # Create new user
        create_resp = self.client.post("/users", data={
            "username": "prof_test",
            "password": "testpassword123",
            "full_name": "Prof. Test Account",
            "role": "Faculty/Reporter",
            "email": "test@college.edu"
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
