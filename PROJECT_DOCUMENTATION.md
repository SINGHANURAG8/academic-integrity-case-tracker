# Academic Integrity Case Tracker &mdash; College Project Documentation

A simple, role-based academic integrity case management web application built strictly with **HTML**, **CSS**, and **Python (Flask)** with **SQLite**, and **zero JavaScript**.

---

## 1. How to Run the Project Locally

### Prerequisites
- Python 3.8 or higher installed on your computer.

### Step 1: Install Flask
Open your terminal / command prompt and install Flask:
```bash
pip install flask
```

### Step 2: Navigate to Project Directory
```bash
cd "c:\Users\DELL\Downloads\prd"
```

### Step 3: Start the Application
Run the Flask server:
```bash
python app.py
```
*(On Windows, you can also use `py app.py`)*

### Step 4: Open in Web Browser
Open your browser and navigate to:
```
http://127.0.0.1:5000
```
The database (`database.db`) will be automatically created and populated with demo accounts and initial cases on the first run.

---

## 2. Demo Login Credentials

The system provides 4 distinct roles for testing and viva demonstration. Each account is pre-configured with secure hashed passwords:

| Role | Username | Password | Full Name | Primary Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Dr. Arthur Vance | Manage user accounts, view system activity audit trail, overall system administration. |
| **Integrity Officer** | `officer` | `officer123` | Brenda Miller | View all cases, assign investigators, change workflow status, record official resolutions, view audit logs. |
| **Investigator** | `investigator` | `invest123` | Dr. Carlos Ruiz | View assigned cases, add interview & investigation notes, update case status to decision pending. |
| **Faculty / Reporter** | `faculty` | `faculty123` | Prof. Diana Chen | Submit new academic integrity incident reports, track progress of own reported cases. |

*(An additional investigator account `investigator2` / `invest123` is also available for testing re-assignment).*

---

## 3. Explanation of Project Files

| File / Folder | Purpose & Description |
| :--- | :--- |
| **`app.py`** | The main Python Flask application. Contains backend routing, SQLite database connection logic, table initialization, seed data generation, authentication handlers, session management, parameterized queries, and role-based access control (RBAC) route decorators (`@login_required`, `@roles_required`). |
| **`database.db`** | The SQLite database file created automatically when `app.py` starts. Contains three relational tables: `users`, `cases`, and `audit_logs`. |
| **`static/style.css`** | The stylesheet providing a professional college administration theme with Navy Blue, Light Grey, and White. Contains layout styles for sidebar, top header, responsive tables, cards, form inputs, status badge pills, and a pure CSS workflow progress stepper. **Contains 0% JavaScript.** |
| **`templates/base.html`** | The master Jinja2 layout template. Defines the overall page structure (HTML doctype, responsive sidebar, top navbar, flash alert notifications, and footer) inherited by all other pages. Contains no `<script>` tags. |
| **`templates/login.html`** | The login page template featuring a clean authentication form and a demo credentials reference card. Submits via standard HTML `POST`. |
| **`templates/dashboard.html`** | The central operational dashboard. Displays statistical metric cards (Total Cases, Open / Under Review, Active Investigations, Resolved Cases), quick action buttons, and a table of recently reported cases. |
| **`templates/cases.html`** | The case registry template. Includes a search bar (search by Case ID, Student ID, Course, or Incident Type) and status filter dropdown using a standard HTML `GET` form with full server-side filtering. |
| **`templates/case_detail.html`** | Detailed view for an individual case. Features a pure CSS 6-step workflow progress indicator, case metadata, student info, investigation notes, status transition form, investigator assignment form, and case-specific activity audit logs. |
| **`templates/new_case.html`** | Incident reporting form allowing Faculty, Officers, and Admins to report a student violation with validation and auto-generated Case ID. |
| **`templates/users.html`** | Administrator-only page to view all registered staff members and create new demo user accounts. Enforced on the backend against unauthorized access. |
| **`templates/audit_logs.html`** | System activity trail view for Administrators and Integrity Officers. Displays timestamped events for case creation, status changes, user creations, and investigator assignments. |
| **`test_academic_tracker.py`** | Automated unit test suite verifying database seeding, login authentication, RBAC restrictions, form submissions, and certifying zero JavaScript across all project files. |

---

## 4. Case Workflow Lifecycle

The system enforces a standardized 6-step lifecycle:
```
[1. Reported] ➔ [2. Under Review] ➔ [3. Investigation] ➔ [4. Decision Pending] ➔ [5. Resolved] ➔ [6. Closed]
```
1. **Reported**: Case filed by a faculty member or reporter.
2. **Under Review**: Integrity Officer reviews the report for initial merit and assigns an investigator.
3. **Investigation**: Investigator interviews student, collects evidence, and logs findings.
4. **Decision Pending**: Investigation completed; referred to the Student Conduct Committee for formal hearing.
5. **Resolved**: Committee sanctions/reprimand recorded (e.g. course failure, module retake).
6. **Closed**: All penalties completed; record officially archived.

---

## 5. Security & Architectural Measures

- **No JavaScript**: The application avoids cross-site scripting (XSS) client-side risks and operates entirely on standard HTTP requests (GET/POST) and server-side Jinja rendering.
- **Password Hashing**: Uses Werkzeug's `generate_password_hash` (pbkdf2:sha256 / scrypt). Plain-text passwords are never stored in the database.
- **SQL Injection Prevention**: All SQL statements use parameterized queries with `?` placeholders (e.g. `cursor.execute("SELECT * FROM users WHERE username = ?", (username,))`).
- **Server-Side Access Control**: Authorization is verified on every single Flask route via decorators (`@roles_required`) and row-level ownership checks (e.g., Faculty can only see cases where `reported_by_id == session['user_id']`). Direct URL tampering is prevented.
- **Audit Logging**: All critical events (case creation, status change, investigator assignment, user addition) are logged to the `audit_logs` table with username, role, and timestamp.

---

## 6. 15 Simple Viva Questions & Answers

### Q1: What is Flask and why is it called a "micro-framework"?
**Answer:** Flask is a lightweight Python web framework. It is called a "micro-framework" because it provides core essentials like routing, request handling, and templating (via Jinja2) without forcing specific database tools or libraries, keeping the codebase simple and easy to understand.

### Q2: How does the application store and query data?
**Answer:** The application uses **SQLite**, a file-based relational database (`database.db`). We interact with it using Python's built-in `sqlite3` module by executing standard SQL queries (`SELECT`, `INSERT`, `UPDATE`).

### Q3: How do parameterized SQL queries prevent SQL injection?
**Answer:** Instead of concatenating user input directly into SQL strings (which allows attackers to inject malicious SQL commands), parameterized queries use placeholders (`?`). The database engine treats the input strictly as data values, neutralizing any embedded SQL syntax.

### Q4: How is user login maintained between different web pages?
**Answer:** Login status is maintained using **Flask Sessions** (`session['user_id']`). Flask signs session data with a secret key (`app.secret_key`) and stores it in an HTTP cookie on the user's browser, allowing the server to identify logged-in users on subsequent requests.

### Q5: Why are passwords hashed rather than stored in plain text?
**Answer:** Hashing converts passwords into a one-way irreversible cryptographic string using `werkzeug.security.generate_password_hash`. Even if the database is accessed by an unauthorized party, original user passwords cannot be read or reversed.

### Q6: What is Role-Based Access Control (RBAC) and how is it implemented here?
**Answer:** RBAC restricts system features based on the logged-in user's role. In this project, RBAC is enforced in Python using custom decorator functions like `@roles_required(ROLE_ADMIN)`. If an unauthorized user attempts to visit a restricted URL directly, the backend checks `session['role']` and rejects access.

### Q7: Why is it important to check permissions on the backend rather than just hiding buttons in HTML?
**Answer:** If permissions are only enforced by hiding buttons, a user could simply type the destination URL into their browser (e.g., `/users` or `/cases/1/status`) to bypass the interface. Checking permissions on the server guarantees security regardless of client behavior.

### Q8: How does this project operate with zero JavaScript?
**Answer:** All user interactions rely on native HTML features:
- Links (`<a href="...">`) for navigation and filtering.
- HTML Forms (`<form method="POST">`) for submitting data like login, new cases, status updates, and notes.
- Normal HTTP page reloads handled entirely by Flask routing and Jinja template rendering.

### Q9: What is Jinja2 and how is template inheritance (`extends` and `block`) used?
**Answer:** Jinja2 is Flask's templating engine. Template inheritance allows us to define a common layout in `base.html` (sidebar, header, CSS links) using `{% block content %}`. Child templates (`dashboard.html`, `cases.html`, etc.) use `{% extends "base.html" %}` to insert their unique content without duplicating HTML code.

### Q10: How does the search and filter mechanism work in `cases.html`?
**Answer:** The filter form uses the HTTP `GET` method to send the search text and status as query parameters (e.g., `/cases?search=Plagiarism&status=Resolved`). The Flask route reads these via `request.args.get()`, builds a dynamic SQL `WHERE` clause with parameters, and queries the database.

### Q11: What is the purpose of the pure CSS workflow indicator on the case details page?
**Answer:** It visually communicates the 6 lifecycle stages of an academic integrity case (`Reported` to `Closed`). By using Jinja to compare the current case status index with the stage list, CSS classes (`completed` and `active`) style the circles and connecting lines purely with CSS, without any JavaScript.

### Q12: How are temporary notification messages displayed after actions like case creation or login?
**Answer:** Through Flask's built-in `flash()` messaging mechanism. A message and category (such as `success` or `danger`) are stored temporarily in the session cookie and retrieved on the next page render using Jinja's `get_flashed_messages()`.

### Q13: What is the purpose of the Audit Log in this application?
**Answer:** Academic integrity investigations involve sensitive disciplinary decisions. The audit log maintains an immutable trail of actions—such as who reported a case, who changed its status, and who was assigned—ensuring transparency, accountability, and institutional compliance.

### Q14: How does row-level data scoping work for Faculty and Investigators?
**Answer:** In the Flask route handlers (`dashboard` and `cases_list`), the database query checks the user's role:
- For Faculty: `WHERE reported_by_id = ?` (they only see cases they reported).
- For Investigators: `WHERE assigned_investigator_id = ?` (they only see cases assigned to them).
- Officers and Admins see all cases.

### Q15: Why is this project described as an educational prototype rather than production-ready?
**Answer:** It is designed for learning and academic demonstration. Production systems would require multi-factor authentication (MFA), HTTPS enforcement, database connection pooling, file attachment uploads with antivirus scanning, enterprise Active Directory / LDAP integration, and automated email notifications.
