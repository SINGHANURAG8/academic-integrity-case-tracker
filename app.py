import os
import sqlite3
from datetime import datetime
from functools import wraps
from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
    abort
)
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
# Secret key for signing session cookies
app.secret_key = "academic_integrity_secure_demo_key_2026"

DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")

# Standard case workflow statuses
STATUS_WORKFLOW = [
    "Reported",
    "Under Review",
    "Investigation",
    "Decision Pending",
    "Resolved",
    "Closed"
]

INCIDENT_TYPES = [
    "Plagiarism",
    "Exam Cheating",
    "Unauthorized Collaboration",
    "Contract Cheating",
    "Fabrication / Falsification",
    "Other"
]

ROLE_ADMIN = "Administrator"
ROLE_OFFICER = "Integrity Officer"
ROLE_INVESTIGATOR = "Investigator"
ROLE_FACULTY = "Faculty/Reporter"

ALL_ROLES = [ROLE_ADMIN, ROLE_OFFICER, ROLE_INVESTIGATOR, ROLE_FACULTY]


# ---------------------------------------------------------------------------
# Database Utilities
# ---------------------------------------------------------------------------
def get_db_connection():
    """Create and return a database connection with dict-like row access."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            email TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    # Cases Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_number TEXT UNIQUE NOT NULL,
            student_id TEXT NOT NULL,
            student_name TEXT NOT NULL,
            course_name TEXT NOT NULL,
            incident_type TEXT NOT NULL,
            incident_date TEXT NOT NULL,
            date_reported TEXT NOT NULL,
            reported_by_id INTEGER NOT NULL,
            assigned_investigator_id INTEGER,
            status TEXT NOT NULL DEFAULT 'Reported',
            description TEXT NOT NULL,
            investigation_notes TEXT DEFAULT '',
            resolution TEXT DEFAULT '',
            FOREIGN KEY (reported_by_id) REFERENCES users (id),
            FOREIGN KEY (assigned_investigator_id) REFERENCES users (id)
        )
    """)

    # Audit Logs Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER,
            case_number TEXT,
            user_id INTEGER,
            username TEXT NOT NULL,
            role TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (case_id) REFERENCES cases (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)

    conn.commit()
    conn.close()


def seed_data():
    """Populate initial demo users, sample cases, and initial audit logs if users table is empty."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]

    if user_count == 0:
        # Initial Demo Users
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        demo_users = [
            ("admin", generate_password_hash("admin123"), "Dr. Arthur Vance", ROLE_ADMIN, "vance@college.edu", now_str),
            ("officer", generate_password_hash("officer123"), "Brenda Miller", ROLE_OFFICER, "miller@college.edu", now_str),
            ("investigator", generate_password_hash("invest123"), "Dr. Carlos Ruiz", ROLE_INVESTIGATOR, "ruiz@college.edu", now_str),
            ("investigator2", generate_password_hash("invest123"), "Dr. Elena Ramos", ROLE_INVESTIGATOR, "ramos@college.edu", now_str),
            ("faculty", generate_password_hash("faculty123"), "Prof. Diana Chen", ROLE_FACULTY, "chen@college.edu", now_str),
        ]

        cursor.executemany("""
            INSERT INTO users (username, password_hash, full_name, role, email, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, demo_users)
        conn.commit()

        # Fetch IDs for relationships
        cursor.execute("SELECT id, username FROM users")
        user_ids = {row["username"]: row["id"] for row in cursor.fetchall()}

        # Demo Cases
        demo_cases = [
            (
                "AIC-2026-001",
                "STU-1042",
                "Samir Patel",
                "CS201 Data Structures",
                "Plagiarism",
                "2026-10-10",
                "2026-10-11 09:30:00",
                user_ids["faculty"],
                user_ids["investigator"],
                "Investigation",
                "Submitted programming assignment 3 code with identical unique variable names and structure matching an external repository.",
                "Interviewed student on 2026-10-15. Reviewing Git commit history and version timestamps.",
                ""
            ),
            (
                "AIC-2026-002",
                "STU-2189",
                "Taylor Reed",
                "ENG102 College Writing",
                "Contract Cheating",
                "2026-10-08",
                "2026-10-09 14:15:00",
                user_ids["faculty"],
                user_ids["investigator"],
                "Decision Pending",
                "Submitted 3000-word term paper with document author metadata pointing to a commercial online essay writing agency.",
                "Hearing held with Student Conduct Committee on 2026-10-18. Awaiting formal committee verdict.",
                ""
            ),
            (
                "AIC-2026-003",
                "STU-3091",
                "Jordan Kim",
                "MATH150 Calculus I",
                "Exam Cheating",
                "2026-10-16",
                "2026-10-17 11:00:00",
                user_ids["faculty"],
                None,
                "Under Review",
                "Student was observed consulting notes stored in graphing calculator memory during Midterm exam.",
                "Calculator was retained by proctor. Integrity office initial review in progress.",
                ""
            ),
            (
                "AIC-2026-004",
                "STU-4412",
                "Morgan Bailey",
                "BIO110 General Biology",
                "Fabrication / Falsification",
                "2026-09-28",
                "2026-09-29 16:45:00",
                user_ids["faculty"],
                user_ids["investigator"],
                "Resolved",
                "Student fabricated experimental spectrometer readings for laboratory report 4 without attending lab section.",
                "Investigation completed. Student acknowledged infraction, agreed to disciplinary probation and module.",
                "Disciplinary reprimand issued; student must retake laboratory module and receive a zero on the report."
            ),
            (
                "AIC-2026-005",
                "STU-5520",
                "Chris Hayes",
                "CHEM201 Organic Chemistry",
                "Unauthorized Collaboration",
                "2026-10-19",
                "2026-10-20 08:20:00",
                user_ids["faculty"],
                None,
                "Reported",
                "Two students submitted identical synthesis reaction mechanism worksheets for an individual assignment.",
                "",
                ""
            )
        ]

        cursor.executemany("""
            INSERT INTO cases (
                case_number, student_id, student_name, course_name,
                incident_type, incident_date, date_reported, reported_by_id,
                assigned_investigator_id, status, description,
                investigation_notes, resolution
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_cases)
        conn.commit()

        # Seed initial audit records
        initial_logs = [
            (1, "AIC-2026-001", user_ids["faculty"], "faculty", ROLE_FACULTY, "Case Created", "Faculty submitted initial incident report for student STU-1042.", "2026-10-11 09:30:00"),
            (1, "AIC-2026-001", user_ids["officer"], "officer", ROLE_OFFICER, "Investigator Assigned", "Assigned case to Dr. Carlos Ruiz.", "2026-10-12 10:00:00"),
            (1, "AIC-2026-001", user_ids["officer"], "officer", ROLE_OFFICER, "Status Changed to Investigation", "Moved case to active investigation.", "2026-10-12 10:05:00"),
            (2, "AIC-2026-002", user_ids["faculty"], "faculty", ROLE_FACULTY, "Case Created", "Faculty submitted initial incident report for student STU-2189.", "2026-10-09 14:15:00"),
            (2, "AIC-2026-002", user_ids["officer"], "officer", ROLE_OFFICER, "Status Changed to Decision Pending", "Committee hearing concluded, awaiting final order.", "2026-10-18 16:00:00"),
            (4, "AIC-2026-004", user_ids["faculty"], "faculty", ROLE_FACULTY, "Case Created", "Reported lab data fabrication for STU-4412.", "2026-09-29 16:45:00"),
            (4, "AIC-2026-004", user_ids["officer"], "officer", ROLE_OFFICER, "Status Changed to Resolved", "Case closed with formal grade penalty and counseling.", "2026-10-05 14:00:00"),
            (5, "AIC-2026-005", user_ids["faculty"], "faculty", ROLE_FACULTY, "Case Created", "Initial report filed for unauthorized collaboration.", "2026-10-20 08:20:00"),
        ]

        cursor.executemany("""
            INSERT INTO audit_logs (case_id, case_number, user_id, username, role, action, details, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_logs)
        conn.commit()

    conn.close()


def log_audit(case_id, case_number, action, details):
    """Record an action into the audit trail using parameterized query."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        user_id = session.get("user_id")
        username = session.get("username", "system")
        role = session.get("role", "system")

        cursor.execute("""
            INSERT INTO audit_logs (case_id, case_number, user_id, username, role, action, details, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (case_id, case_number, user_id, username, role, action, details, now_str))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error logging audit: {e}")


# ---------------------------------------------------------------------------
# Authentication & Authorization Helpers
# ---------------------------------------------------------------------------
def login_required(f):
    """Decorator to require user authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Please log in to access this page.", "warning")
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function


def roles_required(*allowed_roles):
    """Decorator to enforce role-based access control."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if "user_id" not in session:
                flash("Please log in to access this page.", "warning")
                return redirect(url_for("login"))
            user_role = session.get("role")
            if user_role not in allowed_roles:
                flash(f"Access denied: Your role ({user_role}) does not have permission to view that page.", "danger")
                return redirect(url_for("dashboard"))
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    """Default landing route."""
    if "user_id" in session:
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    """Login route with demo credentials helper."""
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()
        selected_role = request.form.get("role", "").strip()

        if not username or not password:
            flash("Please enter both username and password.", "danger")
            return render_template("login.html", roles=ALL_ROLES)

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        conn.close()

        if user and check_password_hash(user["password_hash"], password):
            # If the user also selected a role from the dropdown, verify it matches
            if selected_role and selected_role != user["role"]:
                flash(f"Account '{username}' does not have the role '{selected_role}'. It is registered as '{user['role']}'.", "danger")
                return render_template("login.html", roles=ALL_ROLES)

            # Establish Session
            session["user_id"] = user["id"]
            session["username"] = user["username"]
            session["full_name"] = user["full_name"]
            session["role"] = user["role"]
            session["email"] = user["email"]

            flash(f"Welcome back, {user['full_name']}! Logged in as {user['role']}.", "success")
            return redirect(url_for("dashboard"))
        else:
            flash("Invalid username or password. Please try again.", "danger")

    return render_template("login.html", roles=ALL_ROLES)


@app.route("/logout")
def logout():
    """Clear session data and redirect to login."""
    user_name = session.get("full_name", "User")
    session.clear()
    flash(f"You have been successfully logged out, {user_name}.", "info")
    return redirect(url_for("login"))


@app.route("/dashboard")
@login_required
def dashboard():
    """Main dashboard displaying key metrics and recent cases."""
    conn = get_db_connection()
    cursor = conn.cursor()

    user_role = session.get("role")
    user_id = session.get("user_id")

    # Scope cases query based on role
    # Faculty only sees their reported cases; Investigator sees assigned cases
    if user_role == ROLE_FACULTY:
        base_filter = "WHERE reported_by_id = ?"
        filter_params = (user_id,)
    elif user_role == ROLE_INVESTIGATOR:
        base_filter = "WHERE assigned_investigator_id = ?"
        filter_params = (user_id,)
    else:
        # Admin and Integrity Officer see all cases
        base_filter = ""
        filter_params = ()

    # Summary Counts
    cursor.execute(f"SELECT COUNT(*) FROM cases {base_filter}", filter_params)
    total_cases = cursor.fetchone()[0]

    # Open cases (Reported, Under Review)
    open_clause = "status IN ('Reported', 'Under Review')"
    if base_filter:
        cursor.execute(f"SELECT COUNT(*) FROM cases {base_filter} AND {open_clause}", filter_params)
    else:
        cursor.execute(f"SELECT COUNT(*) FROM cases WHERE {open_clause}")
    open_cases = cursor.fetchone()[0]

    # Investigation cases (Investigation, Decision Pending)
    investigation_clause = "status IN ('Investigation', 'Decision Pending')"
    if base_filter:
        cursor.execute(f"SELECT COUNT(*) FROM cases {base_filter} AND {investigation_clause}", filter_params)
    else:
        cursor.execute(f"SELECT COUNT(*) FROM cases WHERE {investigation_clause}")
    investigation_cases = cursor.fetchone()[0]

    # Resolved cases (Resolved, Closed)
    resolved_clause = "status IN ('Resolved', 'Closed')"
    if base_filter:
        cursor.execute(f"SELECT COUNT(*) FROM cases {base_filter} AND {resolved_clause}", filter_params)
    else:
        cursor.execute(f"SELECT COUNT(*) FROM cases WHERE {resolved_clause}")
    resolved_cases = cursor.fetchone()[0]

    # Recent 5 Cases
    query = f"""
        SELECT c.*, u1.full_name AS reporter_name, u2.full_name AS investigator_name
        FROM cases c
        LEFT JOIN users u1 ON c.reported_by_id = u1.id
        LEFT JOIN users u2 ON c.assigned_investigator_id = u2.id
        {base_filter}
        ORDER BY c.id DESC
        LIMIT 5
    """
    cursor.execute(query, filter_params)
    recent_cases = cursor.fetchall()

    conn.close()

    return render_template(
        "dashboard.html",
        total_cases=total_cases,
        open_cases=open_cases,
        investigation_cases=investigation_cases,
        resolved_cases=resolved_cases,
        recent_cases=recent_cases
    )


@app.route("/cases")
@login_required
def cases_list():
    """Case listing page with search and status filtering."""
    search_query = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "").strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    user_role = session.get("role")
    user_id = session.get("user_id")

    conditions = []
    params = []

    # Role-based visibility scoping
    if user_role == ROLE_FACULTY:
        conditions.append("c.reported_by_id = ?")
        params.append(user_id)
    elif user_role == ROLE_INVESTIGATOR:
        conditions.append("c.assigned_investigator_id = ?")
        params.append(user_id)

    # Search filter
    if search_query:
        search_param = f"%{search_query}%"
        conditions.append("(c.case_number LIKE ? OR c.student_id LIKE ? OR c.student_name LIKE ? OR c.course_name LIKE ? OR c.incident_type LIKE ?)")
        params.extend([search_param, search_param, search_param, search_param, search_param])

    # Status filter
    if status_filter and status_filter != "All":
        conditions.append("c.status = ?")
        params.append(status_filter)

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    sql = f"""
        SELECT c.*, u1.full_name AS reporter_name, u2.full_name AS investigator_name
        FROM cases c
        LEFT JOIN users u1 ON c.reported_by_id = u1.id
        LEFT JOIN users u2 ON c.assigned_investigator_id = u2.id
        {where_clause}
        ORDER BY c.id DESC
    """
    cursor.execute(sql, params)
    cases = cursor.fetchall()

    conn.close()

    return render_template(
        "cases.html",
        cases=cases,
        search_query=search_query,
        status_filter=status_filter,
        statuses=["All"] + STATUS_WORKFLOW
    )


@app.route("/cases/new", methods=["GET", "POST"])
@login_required
def new_case():
    """Report a new academic integrity incident."""
    user_role = session.get("role")
    # Only Faculty, Integrity Officer, and Admin can file reports
    if user_role == ROLE_INVESTIGATOR:
        flash("Investigators cannot submit initial case reports. Only Faculty and Integrity Officers can file cases.", "danger")
        return redirect(url_for("cases_list"))

    if request.method == "POST":
        student_id = request.form.get("student_id", "").strip().upper()
        student_name = request.form.get("student_name", "").strip()
        course_name = request.form.get("course_name", "").strip()
        incident_type = request.form.get("incident_type", "").strip()
        incident_date = request.form.get("incident_date", "").strip()
        description = request.form.get("description", "").strip()

        if not student_id or not student_name or not course_name or not incident_type or not description:
            flash("Please fill in all required fields.", "danger")
            return render_template("new_case.html", incident_types=INCIDENT_TYPES)

        conn = get_db_connection()
        cursor = conn.cursor()

        # Generate unique case number
        cursor.execute("SELECT COUNT(*) FROM cases")
        count = cursor.fetchone()[0] + 1
        case_number = f"AIC-2026-{count:03d}"

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if not incident_date:
            incident_date = datetime.now().strftime("%Y-%m-%d")

        cursor.execute("""
            INSERT INTO cases (
                case_number, student_id, student_name, course_name,
                incident_type, incident_date, date_reported, reported_by_id,
                status, description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Reported', ?)
        """, (
            case_number, student_id, student_name, course_name,
            incident_type, incident_date, now_str, session["user_id"],
            description
        ))
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()

        # Audit log
        log_audit(new_id, case_number, "Case Created", f"Case {case_number} reported for student {student_id} ({student_name}) in {course_name}.")

        flash(f"Academic integrity case {case_number} submitted successfully!", "success")
        return redirect(url_for("case_detail", case_id=new_id))

    return render_template("new_case.html", incident_types=INCIDENT_TYPES)


@app.route("/cases/<int:case_id>")
@login_required
def case_detail(case_id):
    """View complete case details, notes, and timeline."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT c.*, u1.full_name AS reporter_name, u1.role AS reporter_role,
               u2.full_name AS investigator_name, u2.email AS investigator_email
        FROM cases c
        LEFT JOIN users u1 ON c.reported_by_id = u1.id
        LEFT JOIN users u2 ON c.assigned_investigator_id = u2.id
        WHERE c.id = ?
    """, (case_id,))
    case = cursor.fetchone()

    if not case:
        conn.close()
        flash("Case not found.", "danger")
        return redirect(url_for("cases_list"))

    # Permission check:
    user_role = session.get("role")
    user_id = session.get("user_id")

    if user_role == ROLE_FACULTY and case["reported_by_id"] != user_id:
        conn.close()
        flash("Access denied: Faculty members can only view their own reported cases.", "danger")
        return redirect(url_for("cases_list"))

    if user_role == ROLE_INVESTIGATOR and case["assigned_investigator_id"] != user_id:
        conn.close()
        flash("Access denied: Investigators can only view cases assigned to them.", "danger")
        return redirect(url_for("cases_list"))

    # Fetch available investigators for assignment dropdown (Officer & Admin only)
    investigators = []
    if user_role in (ROLE_OFFICER, ROLE_ADMIN):
        cursor.execute("SELECT id, full_name, email FROM users WHERE role = ? ORDER BY full_name", (ROLE_INVESTIGATOR,))
        investigators = cursor.fetchall()

    # Fetch case audit logs
    cursor.execute("""
        SELECT * FROM audit_logs
        WHERE case_id = ?
        ORDER BY id DESC
    """, (case_id,))
    case_logs = cursor.fetchall()

    conn.close()

    return render_template(
        "case_detail.html",
        case=case,
        statuses=STATUS_WORKFLOW,
        investigators=investigators,
        case_logs=case_logs,
        ROLE_ADMIN=ROLE_ADMIN,
        ROLE_OFFICER=ROLE_OFFICER,
        ROLE_INVESTIGATOR=ROLE_INVESTIGATOR,
        ROLE_FACULTY=ROLE_FACULTY
    )


@app.route("/cases/<int:case_id>/status", methods=["POST"])
@login_required
def update_case_status(case_id):
    """Update case workflow status."""
    new_status = request.form.get("status", "").strip()
    status_note = request.form.get("status_note", "").strip()

    if new_status not in STATUS_WORKFLOW:
        flash("Invalid status selected.", "danger")
        return redirect(url_for("case_detail", case_id=case_id))

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cases WHERE id = ?", (case_id,))
    case = cursor.fetchone()

    if not case:
        conn.close()
        flash("Case not found.", "danger")
        return redirect(url_for("cases_list"))

    user_role = session.get("role")
    user_id = session.get("user_id")

    # Only Officer, Admin, and assigned Investigator can update status
    can_update = False
    if user_role in (ROLE_OFFICER, ROLE_ADMIN):
        can_update = True
    elif user_role == ROLE_INVESTIGATOR and case["assigned_investigator_id"] == user_id:
        can_update = True

    if not can_update:
        conn.close()
        flash("You do not have permission to update the status of this case.", "danger")
        return redirect(url_for("case_detail", case_id=case_id))

    old_status = case["status"]

    # Optional resolution notes if resolved or closed
    resolution_update = case["resolution"]
    if new_status in ("Resolved", "Closed"):
        resolution_input = request.form.get("resolution", "").strip()
        if resolution_input:
            resolution_update = resolution_input

    cursor.execute("""
        UPDATE cases
        SET status = ?, resolution = ?
        WHERE id = ?
    """, (new_status, resolution_update, case_id))
    conn.commit()
    conn.close()

    details = f"Status changed from '{old_status}' to '{new_status}'."
    if status_note:
        details += f" Reason/Note: {status_note}"

    log_audit(case_id, case["case_number"], f"Status Updated: {new_status}", details)

    flash(f"Case {case['case_number']} status successfully changed to '{new_status}'.", "success")
    return redirect(url_for("case_detail", case_id=case_id))


@app.route("/cases/<int:case_id>/assign", methods=["POST"])
@roles_required(ROLE_OFFICER, ROLE_ADMIN)
def assign_investigator(case_id):
    """Assign or re-assign an investigator to a case."""
    investigator_id = request.form.get("investigator_id", "").strip()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cases WHERE id = ?", (case_id,))
    case = cursor.fetchone()

    if not case:
        conn.close()
        flash("Case not found.", "danger")
        return redirect(url_for("cases_list"))

    inv_id_val = None
    investigator_name = "Unassigned"

    if investigator_id:
        cursor.execute("SELECT id, full_name FROM users WHERE id = ? AND role = ?", (investigator_id, ROLE_INVESTIGATOR))
        inv_user = cursor.fetchone()
        if inv_user:
            inv_id_val = inv_user["id"]
            investigator_name = inv_user["full_name"]
        else:
            conn.close()
            flash("Selected investigator is invalid.", "danger")
            return redirect(url_for("case_detail", case_id=case_id))

    cursor.execute("""
        UPDATE cases
        SET assigned_investigator_id = ?
        WHERE id = ?
    """, (inv_id_val, case_id))
    conn.commit()
    conn.close()

    log_audit(case_id, case["case_number"], "Investigator Assigned", f"Case assigned to {investigator_name}.")

    flash(f"Investigator successfully updated to {investigator_name}.", "success")
    return redirect(url_for("case_detail", case_id=case_id))


@app.route("/cases/<int:case_id>/notes", methods=["POST"])
@login_required
def add_case_notes(case_id):
    """Add or append notes/findings to an ongoing investigation."""
    notes = request.form.get("notes", "").strip()

    if not notes:
        flash("Note text cannot be empty.", "warning")
        return redirect(url_for("case_detail", case_id=case_id))

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cases WHERE id = ?", (case_id,))
    case = cursor.fetchone()

    if not case:
        conn.close()
        flash("Case not found.", "danger")
        return redirect(url_for("cases_list"))

    user_role = session.get("role")
    user_id = session.get("user_id")

    can_add = False
    if user_role in (ROLE_OFFICER, ROLE_ADMIN):
        can_add = True
    elif user_role == ROLE_INVESTIGATOR and case["assigned_investigator_id"] == user_id:
        can_add = True

    if not can_add:
        conn.close()
        flash("You do not have permission to add investigation notes to this case.", "danger")
        return redirect(url_for("case_detail", case_id=case_id))

    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    author_header = f"\n--- [{timestamp_str}] Added by {session.get('full_name')} ({user_role}) ---\n"
    updated_notes = (case["investigation_notes"] or "") + author_header + notes + "\n"

    cursor.execute("""
        UPDATE cases
        SET investigation_notes = ?
        WHERE id = ?
    """, (updated_notes, case_id))
    conn.commit()
    conn.close()

    log_audit(case_id, case["case_number"], "Investigation Note Added", f"Note added by {session.get('full_name')}.")

    flash("Investigation note recorded.", "success")
    return redirect(url_for("case_detail", case_id=case_id))


@app.route("/users", methods=["GET", "POST"])
@roles_required(ROLE_ADMIN)
def manage_users():
    """Administrator panel to view and register demo accounts."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "POST":
        username = request.form.get("username", "").strip().lower()
        password = request.form.get("password", "").strip()
        full_name = request.form.get("full_name", "").strip()
        role = request.form.get("role", "").strip()
        email = request.form.get("email", "").strip()

        if not username or not password or not full_name or not role:
            flash("All fields are required to create a new user.", "danger")
        elif role not in ALL_ROLES:
            flash("Invalid role specified.", "danger")
        else:
            try:
                now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                pwd_hash = generate_password_hash(password)
                cursor.execute("""
                    INSERT INTO users (username, password_hash, full_name, role, email, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (username, pwd_hash, full_name, role, email, now_str))
                conn.commit()

                log_audit(None, None, "User Created", f"Admin created new account '{username}' with role '{role}'.")
                flash(f"User '{username}' ({role}) created successfully!", "success")
                return redirect(url_for("manage_users"))
            except sqlite3.IntegrityError:
                flash(f"Username '{username}' already exists. Please choose a different username.", "danger")

    cursor.execute("SELECT id, username, full_name, role, email, created_at FROM users ORDER BY id ASC")
    users = cursor.fetchall()
    conn.close()

    return render_template("users.html", users=users, roles=ALL_ROLES)


@app.route("/audit-logs")
@roles_required(ROLE_ADMIN, ROLE_OFFICER)
def audit_logs():
    """System-wide audit trail view."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM audit_logs
        ORDER BY id DESC
        LIMIT 100
    """)
    logs = cursor.fetchall()
    conn.close()

    return render_template("audit_logs.html", logs=logs)


# ---------------------------------------------------------------------------
# Template Context Processors
# ---------------------------------------------------------------------------
@app.context_processor
def inject_global_data():
    """Provide current year and roles to all Jinja templates."""
    return {
        "current_year": datetime.now().year,
        "ROLE_ADMIN": ROLE_ADMIN,
        "ROLE_OFFICER": ROLE_OFFICER,
        "ROLE_INVESTIGATOR": ROLE_INVESTIGATOR,
        "ROLE_FACULTY": ROLE_FACULTY,
        "current_user": {
            "id": session.get("user_id"),
            "username": session.get("username"),
            "full_name": session.get("full_name"),
            "role": session.get("role"),
            "email": session.get("email")
        } if "user_id" in session else None
    }


# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Application Initialization & Entry Point
# ---------------------------------------------------------------------------

# Initialize database whenever the application starts.
# Required for Render/Gunicorn deployment.
init_db()
seed_data()

print("=" * 60)
print(" Academic Integrity Case Tracker - Server Started")
print(" Database initialized successfully")
print("=" * 60)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
