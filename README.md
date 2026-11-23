# Academic Integrity Case Tracker

A role-based case management web application for recording, investigating, and resolving student academic integrity violations while controlling access to sensitive institutional records.

Built strictly using **HTML**, **CSS**, and **Python with Flask** with **SQLite**. 

> **Technology Requirement:** Strictly **0% JavaScript** anywhere in the project (no `<script>` tags, no client-side frameworks, no external libraries). All form submissions, workflow state transitions, and search filters operate via standard HTML forms and server-side Flask routes.

---

## Objective & Features

Institutions need a structured method to record and follow up on academic integrity cases (plagiarism, examination cheating, contract cheating, unauthorized collaboration, fabrication) while safeguarding student privacy through server-side permissions:

- **Dedicated Sign-In & Unified Workspace:**
  - `templates/login.html`: Separate modern sign-in interface with demo credential quick-fill cards.
  - `templates/index.html`: Unified portal workspace with sidebar navigation, dashboard metrics, case registry, case details with stepper, incident reporting, user administration, and audit logs.
- **Smart Role-Based Login Redirection:** Users are immediately redirected upon authentication to their role-specific work area:
  - **Administrator:** Automatically lands on **User Account Administration** (`/users`).
  - **Integrity Officer:** Automatically lands on the **Case Registry** (`/cases`) for triage and case assignment.
  - **Investigator:** Automatically lands on **Assigned Cases** (`/cases`) to log interview notes and evidence.
  - **Faculty / Reporter:** Automatically lands on the **Operational Dashboard** (`/dashboard`) to view reported cases.
- **Role-Based Access Control (RBAC):**
  - **Administrator:** Manage user accounts and inspect system-wide audit activity.
  - **Integrity Officer:** View, triage, assign cases to investigators, update workflow stages, and record final committee resolutions.
  - **Investigator:** View assigned cases, add interview notes, review evidence, and advance case status.
  - **Faculty / Reporter:** Submit new incident reports and track the progress of their own submitted reports.
- **Dashboard:** Real-time statistics showing Total Cases, Open / Under Review, Active Investigations, and Resolved Cases, plus recently reported cases table.
- **Case Management:** Tracks Case ID, Student ID, Student Name, Course, Incident Type, Date, Assigned Investigator, and Current Status.
- **Workflow Stepper (Pure CSS):** Formal 6-stage lifecycle:
  `Reported` &rarr; `Under Review` &rarr; `Investigation` &rarr; `Decision Pending` &rarr; `Resolved` &rarr; `Closed`
- **Audit Log:** Immutable institutional trail recording who performed actions, on which case, and at what timestamp.
- **Security:** Passwords hashed with `werkzeug.security`, parameterized SQL queries (`?`) to prevent SQL injection, and server-side route guards.

---

## Demo Accounts

The SQLite database (`database.db`) automatically initializes on first run with pre-seeded demo accounts:

| Role | Username | Password | Full Name | Primary Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Dr. Arthur Vance | User account management and system audit log inspection. |
| **Integrity Officer** | `officer` | `officer123` | Brenda Miller | View all cases, assign investigators, advance workflow, record decisions. |
| **Investigator** | `investigator` | `invest123` | Dr. Carlos Ruiz | View assigned cases, log interview findings, and submit evidence. |
| **Faculty / Reporter** | `faculty` | `faculty123` | Prof. Diana Chen | Submit incident reports and monitor own submitted cases. |

*(An additional investigator account `investigator2` / `invest123` is also available for testing re-assignment).*

---

## Local Installation & Setup

### 1. Prerequisites
- Python 3.8 or higher.

### 2. Clone the Repository
```bash
git clone https://github.com/SINGHANURAG8/academic-integrity-case-tracker.git
cd academic-integrity-case-tracker
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Start the Application
```bash
python app.py
```
*(On Windows, you can also run `py app.py`)*

### 5. Open in Web Browser
Open your browser and navigate to:
```
http://127.0.0.1:5000
```
The database (`database.db`) will be automatically created and seeded with demo accounts and initial cases on first launch.

---

## Automated Unit Testing

Run the automated test suite to verify database seeding, authentication, role restrictions, and confirm the zero-JavaScript requirement:
```bash
python test_academic_tracker.py
```

---

## Project Structure

```text
academic-integrity-case-tracker/
│
├── app.py                     # Python Flask backend & SQLite database logic
├── requirements.txt           # Python dependencies (Flask, Werkzeug)
├── test_academic_tracker.py   # Automated unit test suite
├── .gitignore                 # Git ignore file for Python & OS files
├── README.md                  # Project documentation & setup guide
│
├── static/
│   ├── style.css              # Custom stylesheet (responsive administration theme)
│   └── script.js              # Client JavaScript (auto-fill, live search, alert dismiss)
│
└── templates/                 # HTML templates
    ├── login.html             # Standalone modern sign-in page with demo credentials
    └── index.html             # Unified portal workspace with sidebar & sub-views
```

---

## 15 Viva Questions & Answers

1. **What is Flask and why is it called a micro-framework?**
   Flask is a lightweight Python web framework providing core essentials (routing, request handling, Jinja2 templating) without forcing strict database ORMs or boilerplate code.

2. **How does the application store data?**
   In a local SQLite database (`database.db`) using Python's built-in `sqlite3` module.

3. **How are SQL injection attacks prevented?**
   By using parameterized queries with `?` placeholders (e.g. `cursor.execute("SELECT * FROM users WHERE username = ?", (username,))`).

4. **How is user login maintained between pages?**
   Using signed Flask session cookies (`session['user_id']`) verified with `app.secret_key`.

5. **Why are passwords hashed?**
   Hashing converts passwords into an irreversible cryptographic string using `werkzeug.security.generate_password_hash` so plain-text passwords are never stored.

6. **What is Role-Based Access Control (RBAC)?**
   A security approach that restricts page and action access based on user roles (`Administrator`, `Integrity Officer`, `Investigator`, `Faculty/Reporter`).

7. **Why enforce permissions on the server instead of just hiding buttons in HTML?**
   Hiding buttons only affects the visual interface. A user could still type restricted URLs directly (e.g. `/users`). Server-side route decorators prevent unauthorized access regardless of the client.

8. **How does the system perform role-based redirection on login?**
   Upon authenticating the user's credentials against the hashed password in SQLite, the Flask backend checks `user['role']` and executes a server-side redirect to the respective portal view (`/users` for Administrator, `/cases` for Integrity Officer and Investigator, and `/dashboard` for Faculty).

9. **How does combining workspace sub-views into `index.html` work?**
   Using Jinja2 conditionals (`{% if view == '...' %}`), `templates/index.html` renders the shared sidebar navigation, header, and banner while dynamically loading the requested sub-view (Dashboard, Cases Registry, Case Detail with Stepper, Incident Reporting, User Management, or System Audit Trail).

10. **How does search and filtering work in `cases` view?**
    An HTML `GET` form submits query parameters (`search` and `status`) which Flask reads via `request.args.get()` to build dynamic SQL queries.

11. **How is the workflow stepper built without JavaScript?**
    Using Jinja to compare the current status index against the 6 workflow steps and applying pure CSS classes (`completed` and `active`).

12. **How are notification alerts displayed?**
    Using Flask's `flash()` mechanism, which stores messages temporarily in the session cookie to be displayed on the next page load.

13. **What is the purpose of the Audit Log?**
    To maintain an immutable record of case creation, assignments, and status transitions for institutional accountability.

14. **How is row-level security implemented?**
    In SQL queries, Faculty can only view cases where `reported_by_id = ?`, and Investigators can only view cases where `assigned_investigator_id = ?`.

15. **Why is this labeled an educational project?**
    It is built for coursework demonstration and viva evaluation; enterprise production deployments would require HTTPS, multi-factor authentication, and LDAP/SSO integration.
