/**
 * Academic Integrity Case Tracker
 * Client Scripts: Single-Page Architecture, Role-Based Navigation & Workflow Stepper
 */

// Initial Data State
const DEFAULT_USERS = [
    { username: "admin", password: "admin123", full_name: "Dr. Arthur Vance", role: "Administrator", email: "vance@college.edu", created_at: "2026-10-01" },
    { username: "officer", password: "officer123", full_name: "Brenda Miller", role: "Integrity Officer", email: "miller@college.edu", created_at: "2026-10-01" },
    { username: "investigator", password: "invest123", full_name: "Dr. Carlos Ruiz", role: "Investigator", email: "ruiz@college.edu", created_at: "2026-10-02" },
    { username: "investigator2", password: "invest123", full_name: "Dr. Elena Ramos", role: "Investigator", email: "ramos@college.edu", created_at: "2026-10-02" },
    { username: "faculty", password: "faculty123", full_name: "Prof. Diana Chen", role: "Faculty/Reporter", email: "chen@college.edu", created_at: "2026-10-03" }
];

const DEFAULT_CASES = [
    {
        id: 1,
        case_number: "AIC-2026-001",
        student_id: "STU-1042",
        student_name: "Samir Patel",
        course_name: "CS201 Data Structures",
        incident_type: "Plagiarism",
        incident_date: "2026-10-10",
        date_reported: "2026-10-11 09:30:00",
        reported_by: "Prof. Diana Chen (Faculty)",
        reported_by_username: "faculty",
        assigned_investigator: "Dr. Carlos Ruiz",
        assigned_investigator_username: "investigator",
        investigator_email: "ruiz@college.edu",
        status: "Investigation",
        description: "Submitted programming assignment 3 code with identical unique variable names and structure matching an external repository.",
        investigation_notes: "Interviewed student on 2026-10-15. Reviewing Git commit history and version timestamps.",
        resolution: ""
    },
    {
        id: 2,
        case_number: "AIC-2026-002",
        student_id: "STU-2189",
        student_name: "Taylor Reed",
        course_name: "ENG102 College Writing",
        incident_type: "Contract Cheating",
        incident_date: "2026-10-08",
        date_reported: "2026-10-09 14:15:00",
        reported_by: "Prof. Diana Chen (Faculty)",
        reported_by_username: "faculty",
        assigned_investigator: "Dr. Carlos Ruiz",
        assigned_investigator_username: "investigator",
        investigator_email: "ruiz@college.edu",
        status: "Decision Pending",
        description: "Submitted 3000-word term paper with document author metadata pointing to a commercial online essay writing agency.",
        investigation_notes: "Hearing held with Student Conduct Committee on 2026-10-18. Awaiting formal committee verdict.",
        resolution: ""
    },
    {
        id: 3,
        case_number: "AIC-2026-003",
        student_id: "STU-3301",
        student_name: "Jordan Lee",
        course_name: "MATH150 Calculus I",
        incident_type: "Exam Cheating",
        incident_date: "2026-10-14",
        date_reported: "2026-10-15 11:00:00",
        reported_by: "Prof. Diana Chen (Faculty)",
        reported_by_username: "faculty",
        assigned_investigator: "Dr. Elena Ramos",
        assigned_investigator_username: "investigator2",
        investigator_email: "ramos@college.edu",
        status: "Under Review",
        description: "Observed accessing unauthorized formula sheet on a mobile device during midterm examination.",
        investigation_notes: "Initial report received. Scheduling preliminary investigative interview.",
        resolution: ""
    },
    {
        id: 4,
        case_number: "AIC-2026-004",
        student_id: "STU-4412",
        student_name: "Morgan Bailey",
        course_name: "BIO210 Cellular Biology",
        incident_type: "Data Fabrication",
        incident_date: "2026-09-28",
        date_reported: "2026-09-29 16:45:00",
        reported_by: "Prof. Diana Chen (Faculty)",
        reported_by_username: "faculty",
        assigned_investigator: "Dr. Elena Ramos",
        assigned_investigator_username: "investigator2",
        investigator_email: "ramos@college.edu",
        status: "Resolved",
        description: "Reported lab data fabrication for microscopy cell count observations.",
        investigation_notes: "Investigation completed. Committee hearing held.",
        resolution: "Sanctions imposed: Zero grade for laboratory module, mandatory academic ethics training completion."
    },
    {
        id: 5,
        case_number: "AIC-2026-005",
        student_id: "STU-5520",
        student_name: "Alex Rivera",
        course_name: "CHEM101 General Chemistry",
        incident_type: "Unauthorized Collaboration",
        incident_date: "2026-10-19",
        date_reported: "2026-10-20 08:20:00",
        reported_by: "Prof. Diana Chen (Faculty)",
        reported_by_username: "faculty",
        assigned_investigator: "Unassigned",
        assigned_investigator_username: "",
        investigator_email: "",
        status: "Reported",
        description: "Two students submitted identical synthesis reaction mechanism worksheets for an individual assignment.",
        investigation_notes: "",
        resolution: ""
    }
];

const DEFAULT_LOGS = [
    { case_id: 1, case_number: "AIC-2026-001", username: "faculty", role: "Faculty/Reporter", action: "Case Created", details: "Faculty submitted initial incident report for student STU-1042.", timestamp: "2026-10-11 09:30:00" },
    { case_id: 1, case_number: "AIC-2026-001", username: "officer", role: "Integrity Officer", action: "Investigator Assigned", details: "Assigned case to Dr. Carlos Ruiz.", timestamp: "2026-10-12 10:00:00" },
    { case_id: 1, case_number: "AIC-2026-001", username: "officer", role: "Integrity Officer", action: "Status Changed to Investigation", details: "Moved case to active investigation.", timestamp: "2026-10-12 10:05:00" },
    { case_id: 2, case_number: "AIC-2026-002", username: "faculty", role: "Faculty/Reporter", action: "Case Created", details: "Faculty submitted initial incident report for student STU-2189.", timestamp: "2026-10-09 14:15:00" },
    { case_id: 2, case_number: "AIC-2026-002", username: "officer", role: "Integrity Officer", action: "Status Changed to Decision Pending", details: "Committee hearing concluded, awaiting final order.", timestamp: "2026-10-18 16:00:00" },
    { case_id: 4, case_number: "AIC-2026-004", username: "officer", role: "Integrity Officer", action: "Status Changed to Resolved", details: "Case closed with formal grade penalty and counseling.", timestamp: "2026-10-05 14:00:00" }
];

const WORKFLOW_STEPS = ["Reported", "Under Review", "Investigation", "Decision Pending", "Resolved", "Closed"];

// State Store
let appState = {
    users: JSON.parse(localStorage.getItem("aic_users")) || DEFAULT_USERS,
    cases: JSON.parse(localStorage.getItem("aic_cases")) || DEFAULT_CASES,
    logs: JSON.parse(localStorage.getItem("aic_logs")) || DEFAULT_LOGS,
    currentUser: JSON.parse(sessionStorage.getItem("aic_current_user")) || null,
    activeCaseId: 1
};

function saveState() {
    localStorage.setItem("aic_users", JSON.stringify(appState.users));
    localStorage.setItem("aic_cases", JSON.stringify(appState.cases));
    localStorage.setItem("aic_logs", JSON.stringify(appState.logs));
    if (appState.currentUser) {
        sessionStorage.setItem("aic_current_user", JSON.stringify(appState.currentUser));
    } else {
        sessionStorage.removeItem("aic_current_user");
    }
}

// ---------------------------------------------------------------------------
// DOM Ready Lifecycle
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
    initDemoClickFillers();
    initLoginForm();
    initNavigation();
    initCaseFilterAndSearch();
    initCaseActionForms();
    initNewCaseForm();
    initAddUserForm();
    initLogout();

    // Check if user is already logged in
    if (appState.currentUser) {
        showPortalWorkspace(appState.currentUser);
    } else {
        showLoginView();
    }
});

// ---------------------------------------------------------------------------
// Authentication & Role Routing
// ---------------------------------------------------------------------------
function initDemoClickFillers() {
    const demoCards = document.querySelectorAll(".demo-account-item");
    const userInput = document.getElementById("username");
    const passInput = document.getElementById("password");
    const roleSelect = document.getElementById("role");

    if (!demoCards.length || !userInput || !passInput) return;

    demoCards.forEach(card => {
        card.style.cursor = "pointer";
        card.addEventListener("click", function () {
            const user = card.getAttribute("data-user");
            const pass = card.getAttribute("data-pass");
            const role = card.getAttribute("data-role");

            userInput.value = user;
            passInput.value = pass;

            if (roleSelect && role) {
                roleSelect.value = role;
            }

            card.style.borderColor = "#2563eb";
            setTimeout(() => card.style.borderColor = "", 600);
        });
    });
}

function initLoginForm() {
    const form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const selectedRole = document.getElementById("role").value;

        const user = appState.users.find(u => u.username.toLowerCase() === username.toLowerCase());

        if (user && user.password === password) {
            if (selectedRole && selectedRole !== user.role) {
                showLoginAlert("Account '" + username + "' is registered as '" + user.role + "', not '" + selectedRole + "'.", "danger");
                return;
            }

            // Authenticated successfully
            appState.currentUser = user;
            saveState();

            // Role-based redirection
            showPortalWorkspace(user);

            // Determine target role view
            if (user.role === "Administrator") {
                navigateToView("users");
                showSystemAlert("Welcome back, " + user.full_name + "! Directed to User Administration.", "success");
            } else if (user.role === "Integrity Officer") {
                navigateToView("cases");
                showSystemAlert("Welcome back, " + user.full_name + "! Directed to Case Registry for triage.", "success");
            } else if (user.role === "Investigator") {
                navigateToView("cases");
                showSystemAlert("Welcome back, " + user.full_name + "! Directed to your assigned cases.", "success");
            } else {
                navigateToView("dashboard");
                showSystemAlert("Welcome back, " + user.full_name + "! Directed to your Operational Dashboard.", "success");
            }
        } else {
            showLoginAlert("Invalid username or password. Please try again.", "danger");
        }
    });
}

function showLoginAlert(msg, category) {
    const container = document.getElementById("login-alert-container");
    if (!container) return;
    container.innerHTML = '<div class="alert alert-' + category + '" style="cursor: pointer;" title="Click to dismiss">' + msg + '</div>';
    initDismissableAlerts();
}

function showSystemAlert(msg, category) {
    const container = document.getElementById("system-alert-container");
    if (!container) return;
    container.innerHTML = '<div class="alert alert-' + category + '" style="cursor: pointer;" title="Click to dismiss">' + msg + '</div>';
    initDismissableAlerts();
}

function initDismissableAlerts() {
    document.querySelectorAll(".alert").forEach(alert => {
        alert.addEventListener("click", function () {
            alert.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            alert.style.opacity = "0";
            alert.style.transform = "translateY(-6px)";
            setTimeout(() => alert.remove(), 300);
        });
    });
}

function initLogout() {
    const btn = document.getElementById("btn-logout");
    if (!btn) return;
    btn.addEventListener("click", function () {
        const userName = appState.currentUser ? appState.currentUser.full_name : "User";
        appState.currentUser = null;
        saveState();
        showLoginView();
        showLoginAlert("You have been successfully logged out, " + userName + ".", "info");
    });
}

function showLoginView() {
    document.body.className = "login-page-body";
    const loginContainer = document.getElementById("login-view-container");
    const workspace = document.getElementById("app-workspace");

    if (loginContainer) loginContainer.style.display = "grid";
    if (workspace) workspace.style.display = "none";
}

function showPortalWorkspace(user) {
    document.body.className = "";
    const loginContainer = document.getElementById("login-view-container");
    const workspace = document.getElementById("app-workspace");

    if (loginContainer) loginContainer.style.display = "none";
    if (workspace) workspace.style.display = "flex";

    // Set user profile info
    const sidebarName = document.getElementById("sidebar-user-name");
    const sidebarRole = document.getElementById("sidebar-user-role");
    const headerBadge = document.getElementById("header-role-badge");
    const headerUser = document.getElementById("header-username");

    if (sidebarName) sidebarName.textContent = user.full_name;
    if (sidebarRole) sidebarRole.textContent = user.role;
    if (headerUser) headerUser.textContent = user.username;

    if (headerBadge) {
        headerBadge.textContent = user.role;
        headerBadge.className = "current-role-badge " + getRoleBadgeClass(user.role);
    }

    // Role-specific nav restrictions
    const navAdminSection = document.querySelector(".nav-admin-section");
    const navAdminOnly = document.querySelectorAll(".nav-admin-only");
    const navOfficerAdmin = document.querySelectorAll(".nav-officer-admin");
    const navFacultyOnly = document.querySelectorAll(".nav-faculty-only");

    if (user.role === "Administrator") {
        if (navAdminSection) navAdminSection.style.display = "";
        navAdminOnly.forEach(el => el.style.display = "");
        navOfficerAdmin.forEach(el => el.style.display = "");
        navFacultyOnly.forEach(el => el.style.display = "");
    } else if (user.role === "Integrity Officer") {
        if (navAdminSection) navAdminSection.style.display = "";
        navAdminOnly.forEach(el => el.style.display = "none");
        navOfficerAdmin.forEach(el => el.style.display = "");
        navFacultyOnly.forEach(el => el.style.display = "");
    } else if (user.role === "Investigator") {
        if (navAdminSection) navAdminSection.style.display = "none";
        navAdminOnly.forEach(el => el.style.display = "none");
        navOfficerAdmin.forEach(el => el.style.display = "none");
        navFacultyOnly.forEach(el => el.style.display = "none");
    } else { // Faculty
        if (navAdminSection) navAdminSection.style.display = "none";
        navAdminOnly.forEach(el => el.style.display = "none");
        navOfficerAdmin.forEach(el => el.style.display = "none");
        navFacultyOnly.forEach(el => el.style.display = "");
    }

    refreshDashboard();
    renderCasesTable();
    renderUsersTable();
    renderAuditLogsTable();
}

function getRoleBadgeClass(role) {
    if (role === "Administrator") return "role-badge-admin";
    if (role === "Integrity Officer") return "role-badge-officer";
    if (role === "Investigator") return "role-badge-investigator";
    return "role-badge-faculty";
}

// ---------------------------------------------------------------------------
// Navigation & Views Switcher
// ---------------------------------------------------------------------------
function initNavigation() {
    // Sidebar nav links
    document.querySelectorAll(".sidebar-nav .nav-link").forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const targetView = link.getAttribute("data-view");
            if (targetView) navigateToView(targetView);
        });
    });

    // Action button navigators
    document.addEventListener("click", function (e) {
        const actionBtn = e.target.closest(".btn-nav-action");
        if (actionBtn) {
            e.preventDefault();
            const target = actionBtn.getAttribute("data-target");
            if (target) navigateToView(target);
        }
    });
}

function navigateToView(viewName) {
    // Hide all subviews
    document.querySelectorAll(".subview-section").forEach(sec => sec.style.display = "none");

    // Remove active class from nav
    document.querySelectorAll(".sidebar-nav .nav-link").forEach(l => l.classList.remove("active"));

    // Activate corresponding view and nav link
    const targetEl = document.getElementById("view-" + viewName);
    if (targetEl) {
        targetEl.style.display = "";
        targetEl.style.animation = "pageFadeIn 0.35s ease forwards";
    }

    const activeNav = document.querySelector('.sidebar-nav .nav-link[data-view="' + viewName + '"]');
    if (activeNav) activeNav.classList.add("active");

    // Update main heading
    const headingEl = document.getElementById("page-main-heading");
    if (headingEl) {
        if (viewName === "dashboard") headingEl.textContent = "Operational Dashboard";
        else if (viewName === "cases") headingEl.textContent = "Academic Integrity Cases";
        else if (viewName === "case-detail") headingEl.textContent = "Case Details & Workflow Stepper";
        else if (viewName === "new-case") headingEl.textContent = "Report Academic Integrity Incident";
        else if (viewName === "users") headingEl.textContent = "User Account Administration";
        else if (viewName === "audit-logs") headingEl.textContent = "System Activity & Audit Trail";
    }

    // Refresh contents
    if (viewName === "dashboard") refreshDashboard();
    else if (viewName === "cases") renderCasesTable();
    else if (viewName === "users") renderUsersTable();
    else if (viewName === "audit-logs") renderAuditLogsTable();
}

// ---------------------------------------------------------------------------
// Dashboard Statistics & Recent Table
// ---------------------------------------------------------------------------
function refreshDashboard() {
    const user = appState.currentUser;
    if (!user) return;

    // Filter cases based on role
    let visibleCases = appState.cases;
    if (user.role === "Faculty/Reporter") {
        visibleCases = appState.cases.filter(c => c.reported_by_username === user.username);
    } else if (user.role === "Investigator") {
        visibleCases = appState.cases.filter(c => c.assigned_investigator_username === user.username);
    }

    const total = visibleCases.length;
    const openReview = visibleCases.filter(c => c.status === "Reported" || c.status === "Under Review").length;
    const activeInv = visibleCases.filter(c => c.status === "Investigation" || c.status === "Decision Pending").length;
    const resolved = visibleCases.filter(c => c.status === "Resolved" || c.status === "Closed").length;

    const statTotal = document.getElementById("stat-total");
    const statOpen = document.getElementById("stat-open");
    const statActive = document.getElementById("stat-active");
    const statResolved = document.getElementById("stat-resolved");

    if (statTotal) statTotal.textContent = total;
    if (statOpen) statOpen.textContent = openReview;
    if (statActive) statActive.textContent = activeInv;
    if (statResolved) statResolved.textContent = resolved;

    // Welcome banner text
    const welcomeHeading = document.getElementById("dashboard-welcome-heading");
    const roleDesc = document.getElementById("dashboard-role-description");
    if (welcomeHeading) welcomeHeading.textContent = "Welcome back, " + user.full_name + "!";
    if (roleDesc) {
        if (user.role === "Administrator") roleDesc.textContent = "Managing institutional records, user permissions, and audit logs.";
        else if (user.role === "Integrity Officer") roleDesc.textContent = "Triage reports, assign investigators, and advance committee decisions.";
        else if (user.role === "Investigator") roleDesc.textContent = "Review assigned incident evidence, log interview notes, and advance cases.";
        else roleDesc.textContent = "Submit and monitor academic misconduct reports for your courses.";
    }

    // Recent cases
    const tbody = document.getElementById("dashboard-recent-tbody");
    if (!tbody) return;

    if (visibleCases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">No cases found for your account.</td></tr>';
        return;
    }

    tbody.innerHTML = visibleCases.slice(0, 5).map(c => `
        <tr>
            <td><strong style="color: var(--primary-navy);">${c.case_number}</strong></td>
            <td><strong>${c.student_name}</strong><br><span style="font-size: 11px; color: var(--text-muted);">${c.student_id}</span></td>
            <td>${c.course_name}</td>
            <td><span class="type-tag">${c.incident_type}</span></td>
            <td style="font-size: 12px; color: var(--text-muted);">${c.date_reported.split(" ")[0]}</td>
            <td><span class="status-pill status-${c.status.toLowerCase().replace(/ /g, '-')}">${c.status}</span></td>
            <td><button class="btn btn-sm btn-primary btn-view-case" data-id="${c.id}">View</button></td>
        </tr>
    `).join("");

    attachCaseViewListeners();
}

// ---------------------------------------------------------------------------
// Cases Registry Table & Instant Filter
// ---------------------------------------------------------------------------
function renderCasesTable() {
    const user = appState.currentUser;
    if (!user) return;

    const tbody = document.getElementById("cases-registry-tbody");
    const countBadge = document.getElementById("case-count-badge");
    const searchVal = (document.getElementById("case-search-input")?.value || "").toLowerCase().trim();
    const statusVal = document.getElementById("case-status-filter")?.value || "All";

    if (!tbody) return;

    let filtered = appState.cases;

    // Role filtering
    if (user.role === "Faculty/Reporter") {
        filtered = filtered.filter(c => c.reported_by_username === user.username);
    } else if (user.role === "Investigator") {
        filtered = filtered.filter(c => c.assigned_investigator_username === user.username);
    }

    // Search filter
    if (searchVal) {
        filtered = filtered.filter(c =>
            c.case_number.toLowerCase().includes(searchVal) ||
            c.student_name.toLowerCase().includes(searchVal) ||
            c.student_id.toLowerCase().includes(searchVal) ||
            c.course_name.toLowerCase().includes(searchVal) ||
            c.incident_type.toLowerCase().includes(searchVal)
        );
    }

    // Status filter
    if (statusVal !== "All") {
        filtered = filtered.filter(c => c.status === statusVal);
    }

    if (countBadge) countBadge.textContent = filtered.length + " Total Cases";

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">No matching cases found.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(c => `
        <tr>
            <td><strong style="color: var(--primary-navy);">${c.case_number}</strong></td>
            <td><strong>${c.student_name}</strong><br><span style="font-size: 11px; color: var(--text-muted);">${c.student_id}</span></td>
            <td>${c.course_name}</td>
            <td><span class="type-tag">${c.incident_type}</span></td>
            <td style="font-size: 12px; color: var(--text-muted);">${c.date_reported.split(" ")[0]}</td>
            <td style="font-size: 13px;">${c.assigned_investigator || '<span style="color: var(--text-muted); font-style: italic;">Unassigned</span>'}</td>
            <td><span class="status-pill status-${c.status.toLowerCase().replace(/ /g, '-')}">${c.status}</span></td>
            <td><button class="btn btn-sm btn-primary btn-view-case" data-id="${c.id}">View Details</button></td>
        </tr>
    `).join("");

    attachCaseViewListeners();
}

function initCaseFilterAndSearch() {
    const searchInput = document.getElementById("case-search-input");
    const statusSelect = document.getElementById("case-status-filter");
    const resetBtn = document.getElementById("btn-reset-filter");

    if (searchInput) searchInput.addEventListener("input", renderCasesTable);
    if (statusSelect) statusSelect.addEventListener("change", renderCasesTable);
    if (resetBtn) {
        resetBtn.addEventListener("click", function () {
            if (searchInput) searchInput.value = "";
            if (statusSelect) statusSelect.value = "All";
            renderCasesTable();
        });
    }
}

function attachCaseViewListeners() {
    document.querySelectorAll(".btn-view-case").forEach(btn => {
        btn.addEventListener("click", function () {
            const caseId = parseInt(btn.getAttribute("data-id"), 10);
            openCaseDetail(caseId);
        });
    });
}

// ---------------------------------------------------------------------------
// Case Detail & 6-Stage Workflow Stepper
// ---------------------------------------------------------------------------
function openCaseDetail(caseId) {
    const targetCase = appState.cases.find(c => c.id === caseId);
    if (!targetCase) return;

    appState.activeCaseId = caseId;

    // Header info
    const statusPill = document.getElementById("detail-status-pill");
    if (statusPill) {
        statusPill.textContent = targetCase.status;
        statusPill.className = "status-pill status-" + targetCase.status.toLowerCase().replace(/ /g, '-');
    }

    // Stepper
    renderWorkflowStepper(targetCase.status);

    // Text fields
    document.getElementById("detail-incident-type-tag").textContent = targetCase.incident_type;
    document.getElementById("detail-case-number").textContent = targetCase.case_number;
    document.getElementById("detail-student-name").textContent = targetCase.student_name;
    document.getElementById("detail-student-id").textContent = "• ID: " + targetCase.student_id;
    document.getElementById("detail-course-name").textContent = targetCase.course_name;
    document.getElementById("detail-incident-date").textContent = targetCase.incident_date;
    document.getElementById("detail-date-reported").textContent = targetCase.date_reported;
    document.getElementById("detail-reported-by").textContent = targetCase.reported_by;
    document.getElementById("detail-description").textContent = targetCase.description;
    document.getElementById("detail-investigation-notes").textContent = targetCase.investigation_notes || "No investigation notes recorded yet.";

    // Resolution card
    const resCard = document.getElementById("detail-resolution-card");
    const resText = document.getElementById("detail-resolution");
    if (targetCase.resolution && targetCase.resolution.trim()) {
        resCard.style.display = "";
        resText.textContent = targetCase.resolution;
    } else {
        resCard.style.display = "none";
    }

    // Assigned Investigator
    document.getElementById("detail-inv-name").textContent = targetCase.assigned_investigator;
    document.getElementById("detail-inv-email").textContent = targetCase.investigator_email || "Pending assignment";
    const assignSelect = document.getElementById("assign-inv-select");
    if (assignSelect) assignSelect.value = targetCase.assigned_investigator;

    // Status select
    const statusSelect = document.getElementById("update-status-select");
    if (statusSelect) statusSelect.value = targetCase.status;

    // Case Timeline
    renderCaseTimeline(caseId);

    // Administrative controls visibility
    const user = appState.currentUser;
    const assignCard = document.getElementById("card-assign-investigator");
    const workflowCard = document.getElementById("card-status-workflow");

    if (user.role === "Administrator" || user.role === "Integrity Officer") {
        if (assignCard) assignCard.style.display = "";
        if (workflowCard) workflowCard.style.display = "";
    } else if (user.role === "Investigator") {
        if (assignCard) assignCard.style.display = "none";
        if (workflowCard) workflowCard.style.display = "";
    } else { // Faculty
        if (assignCard) assignCard.style.display = "none";
        if (workflowCard) workflowCard.style.display = "none";
    }

    navigateToView("case-detail");
}

function renderWorkflowStepper(currentStatus) {
    const container = document.getElementById("workflow-stepper-container");
    if (!container) return;

    const currentIdx = WORKFLOW_STEPS.indexOf(currentStatus);
    const validIdx = currentIdx !== -1 ? currentIdx : 0;

    container.innerHTML = WORKFLOW_STEPS.map((step, idx) => {
        let stepClass = "";
        let marker = idx + 1;

        if (idx < validIdx) {
            stepClass = "completed";
            marker = "✓";
        } else if (idx === validIdx) {
            stepClass = "active";
            marker = idx + 1;
        }

        return `
            <div class="workflow-step ${stepClass}">
                <div class="step-marker">${marker}</div>
                <div class="step-title">${step}</div>
            </div>
        `;
    }).join("");
}

function renderCaseTimeline(caseId) {
    const tbody = document.getElementById("detail-timeline-tbody");
    if (!tbody) return;

    const caseLogs = appState.logs.filter(l => l.case_id === caseId);

    if (caseLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="padding: 20px; font-size: 13px; color: var(--text-muted); text-align: center;">No activity recorded for this case.</td></tr>';
        return;
    }

    tbody.innerHTML = caseLogs.map(l => `
        <tr>
            <td><strong style="color: var(--primary-navy);">${l.action}</strong></td>
            <td>
                <div>${l.username}</div>
                <span class="current-role-badge ${getRoleBadgeClass(l.role)}" style="font-size: 10px; padding: 2px 6px;">${l.role}</span>
            </td>
            <td style="font-size: 13px;">${l.details}</td>
            <td style="font-size: 12px; color: var(--text-muted); white-space: nowrap;">${l.timestamp}</td>
        </tr>
    `).join("");
}

// ---------------------------------------------------------------------------
// Case Action Forms (Status Update & Assignment)
// ---------------------------------------------------------------------------
function initCaseActionForms() {
    // Status Update Form
    const statusForm = document.getElementById("form-update-status");
    const statusSelect = document.getElementById("update-status-select");
    const resolutionGroup = document.getElementById("group-resolution-input");

    if (statusSelect && resolutionGroup) {
        statusSelect.addEventListener("change", function () {
            if (statusSelect.value === "Resolved" || statusSelect.value === "Closed") {
                resolutionGroup.style.display = "";
            } else {
                resolutionGroup.style.display = "none";
            }
        });
    }

    if (statusForm) {
        statusForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const targetCase = appState.cases.find(c => c.id === appState.activeCaseId);
            if (!targetCase) return;

            const newStatus = statusSelect.value;
            const note = document.getElementById("update-status-notes").value.trim();
            const resolutionOrder = document.getElementById("update-resolution-text")?.value.trim();

            if ((newStatus === "Resolved" || newStatus === "Closed") && !resolutionOrder) {
                alert("Please provide the official resolution order/sanctions before closing or resolving this case.");
                return;
            }

            const oldStatus = targetCase.status;
            targetCase.status = newStatus;

            if (resolutionOrder) {
                targetCase.resolution = resolutionOrder;
            }

            if (note) {
                targetCase.investigation_notes = (targetCase.investigation_notes ? targetCase.investigation_notes + "\n\n" : "") +
                    "[" + new Date().toISOString().split("T")[0] + " - " + appState.currentUser.full_name + "]: " + note;
            }

            // Record Log
            const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
            appState.logs.unshift({
                case_id: targetCase.id,
                case_number: targetCase.case_number,
                username: appState.currentUser.username,
                role: appState.currentUser.role,
                action: "Status Changed to " + newStatus,
                details: note || "Status updated from " + oldStatus + " to " + newStatus + ".",
                timestamp: nowStr
            });

            saveState();
            openCaseDetail(targetCase.id);
            showSystemAlert("Case " + targetCase.case_number + " status successfully updated to " + newStatus + "!", "success");
        });
    }

    // Assignment Form
    const assignForm = document.getElementById("form-assign-investigator");
    if (assignForm) {
        assignForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const targetCase = appState.cases.find(c => c.id === appState.activeCaseId);
            if (!targetCase) return;

            const invName = document.getElementById("assign-inv-select").value;
            if (!invName) return;

            const invUser = appState.users.find(u => u.full_name === invName);

            targetCase.assigned_investigator = invName;
            targetCase.assigned_investigator_username = invUser ? invUser.username : "";
            targetCase.investigator_email = invUser ? invUser.email : "";

            const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
            appState.logs.unshift({
                case_id: targetCase.id,
                case_number: targetCase.case_number,
                username: appState.currentUser.username,
                role: appState.currentUser.role,
                action: "Investigator Assigned",
                details: "Assigned case to " + invName + ".",
                timestamp: nowStr
            });

            saveState();
            openCaseDetail(targetCase.id);
            showSystemAlert("Investigator updated to " + invName + " for case " + targetCase.case_number + "!", "success");
        });
    }
}

// ---------------------------------------------------------------------------
// Report Incident Form
// ---------------------------------------------------------------------------
function initNewCaseForm() {
    const form = document.getElementById("form-new-case");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const studentId = document.getElementById("new-student-id").value.trim().toUpperCase();
        const studentName = document.getElementById("new-student-name").value.trim();
        const courseName = document.getElementById("new-course-name").value.trim();
        const incidentType = document.getElementById("new-incident-type").value;
        const incidentDate = document.getElementById("new-incident-date").value || new Date().toISOString().split("T")[0];
        const description = document.getElementById("new-description").value.trim();

        const count = appState.cases.length + 1;
        const padCount = count < 10 ? "00" + count : (count < 100 ? "0" + count : count);
        const caseNumber = "AIC-2026-" + padCount;
        const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);

        const newCaseObj = {
            id: Date.now(),
            case_number: caseNumber,
            student_id: studentId,
            student_name: studentName,
            course_name: courseName,
            incident_type: incidentType,
            incident_date: incidentDate,
            date_reported: nowStr,
            reported_by: appState.currentUser.full_name + " (" + appState.currentUser.role + ")",
            reported_by_username: appState.currentUser.username,
            assigned_investigator: "Unassigned",
            assigned_investigator_username: "",
            investigator_email: "",
            status: "Reported",
            description: description,
            investigation_notes: "",
            resolution: ""
        };

        appState.cases.unshift(newCaseObj);

        // Audit Log
        appState.logs.unshift({
            case_id: newCaseObj.id,
            case_number: caseNumber,
            username: appState.currentUser.username,
            role: appState.currentUser.role,
            action: "Case Created",
            details: "Reported incident for student " + studentId + " (" + studentName + ") in " + courseName + ".",
            timestamp: nowStr
        });

        saveState();
        form.reset();
        openCaseDetail(newCaseObj.id);
        showSystemAlert("Case " + caseNumber + " submitted successfully!", "success");
    });
}

// ---------------------------------------------------------------------------
// User Management & Audit Tables
// ---------------------------------------------------------------------------
function renderUsersTable() {
    const tbody = document.getElementById("users-table-tbody");
    const countBadge = document.getElementById("users-count-badge");
    if (!tbody) return;

    if (countBadge) countBadge.textContent = "• " + appState.users.length + " Total Users";

    tbody.innerHTML = appState.users.map(u => `
        <tr>
            <td>
                <strong>${u.full_name}</strong>
                <br>
                <span style="font-family: monospace; font-size: 12px; color: var(--text-muted);">@${u.username}</span>
            </td>
            <td>
                <span class="current-role-badge ${getRoleBadgeClass(u.role)}">${u.role}</span>
            </td>
            <td style="font-size: 13px;">${u.email}</td>
            <td style="font-size: 12px; color: var(--text-muted);">${u.created_at}</td>
        </tr>
    `).join("");
}

function initAddUserForm() {
    const form = document.getElementById("form-add-user");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const fullName = document.getElementById("add-user-fullname").value.trim();
        const username = document.getElementById("add-user-username").value.trim().toLowerCase();
        const role = document.getElementById("add-user-role").value;
        const email = document.getElementById("add-user-email").value.trim();
        const password = document.getElementById("add-user-password").value.trim();

        if (appState.users.some(u => u.username === username)) {
            alert("A user account with username '" + username + "' already exists.");
            return;
        }

        const nowStr = new Date().toISOString().split("T")[0];
        appState.users.push({
            username: username,
            password: password,
            full_name: fullName,
            role: role,
            email: email,
            created_at: nowStr
        });

        // Audit Log
        appState.logs.unshift({
            case_id: null,
            case_number: "",
            username: appState.currentUser.username,
            role: appState.currentUser.role,
            action: "User Account Created",
            details: "Created new " + role + " account for " + fullName + " (@" + username + ").",
            timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
        });

        saveState();
        form.reset();
        renderUsersTable();
        showSystemAlert("User account @" + username + " created successfully!", "success");
    });
}

function renderAuditLogsTable() {
    const tbody = document.getElementById("audit-table-tbody");
    if (!tbody) return;

    if (appState.logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding: 30px; text-align: center; color: var(--text-muted);">No audit logs recorded yet.</td></tr>';
        return;
    }

    tbody.innerHTML = appState.logs.map(l => `
        <tr>
            <td><strong style="color: var(--primary-navy);">${l.action}</strong></td>
            <td>${l.case_number ? '<a href="#case-detail" class="btn-view-case" data-id="' + l.case_id + '"><strong>' + l.case_number + '</strong></a>' : '<span style="color: var(--text-muted); font-size: 12px;">System / Account</span>'}</td>
            <td>
                <div>${l.username}</div>
                <span class="current-role-badge ${getRoleBadgeClass(l.role)}" style="font-size: 10px; padding: 2px 6px;">${l.role}</span>
            </td>
            <td style="font-size: 13px; max-width: 350px;">${l.details}</td>
            <td style="font-size: 12px; color: var(--text-muted); white-space: nowrap;">${l.timestamp}</td>
        </tr>
    `).join("");

    attachCaseViewListeners();
}
