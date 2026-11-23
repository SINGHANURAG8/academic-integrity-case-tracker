/**
 * Academic Integrity Case Tracker - Client Scripts
 * Pure Vanilla JavaScript for UI enhancements and demo helpers.
 */

document.addEventListener("DOMContentLoaded", function () {
    console.log("Academic Integrity Case Tracker - Client scripts loaded.");

    // 1. Quick-Fill Demo Credentials on Login Page
    initDemoAccountFiller();

    // 2. Auto-dismiss & Click-to-close Flash Alerts
    initAlertDismissers();

    // 3. Status Change Confirmation
    initStatusConfirmations();

    // 4. Instant Table Live Search on Case Records Table
    initInstantTableFilter();
});

/**
 * Click on any demo account card on the login page to auto-fill the credentials.
 */
function initDemoAccountFiller() {
    const demoItems = document.querySelectorAll(".demo-account-item");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const roleSelect = document.getElementById("role");

    if (!demoItems.length || !usernameInput || !passwordInput) return;

    demoItems.forEach(function (card) {
        card.style.cursor = "pointer";
        card.setAttribute("title", "Click to auto-fill these login credentials");

        card.addEventListener("click", function () {
            const roleNameEl = card.querySelector(".demo-role-name span");
            const roleName = roleNameEl ? roleNameEl.textContent.trim() : "";
            const credElements = card.querySelectorAll(".demo-cred");

            if (credElements.length >= 2) {
                const user = credElements[0].textContent.trim();
                const pass = credElements[1].textContent.trim();

                usernameInput.value = user;
                passwordInput.value = pass;

                if (roleSelect && roleName) {
                    for (let i = 0; i < roleSelect.options.length; i++) {
                        if (roleSelect.options[i].value === roleName) {
                            roleSelect.selectedIndex = i;
                            break;
                        }
                    }
                }

                // Visual highlight effect
                card.style.borderColor = "#2563eb";
                setTimeout(function () {
                    card.style.borderColor = "";
                }, 600);
            }
        });
    });
}

/**
 * Click on any flash message alert to dismiss it immediately.
 */
function initAlertDismissers() {
    const alerts = document.querySelectorAll(".alert");
    alerts.forEach(function (alertBox) {
        alertBox.style.cursor = "pointer";
        alertBox.setAttribute("title", "Click to dismiss");

        alertBox.addEventListener("click", function () {
            alertBox.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            alertBox.style.opacity = "0";
            alertBox.style.transform = "translateY(-6px)";
            setTimeout(function () {
                alertBox.remove();
            }, 300);
        });
    });
}

/**
 * Ask for confirmation before changing case status or assigning investigators.
 */
function initStatusConfirmations() {
    const statusForm = document.querySelector("form[action*='/status']");
    if (statusForm) {
        statusForm.addEventListener("submit", function (e) {
            const statusSelect = statusForm.querySelector("select[name='status']");
            if (statusSelect) {
                const selectedText = statusSelect.options[statusSelect.selectedIndex].text;
                const confirmMsg = "Confirm changing case status to '" + selectedText.trim() + "'?";
                if (!window.confirm(confirmMsg)) {
                    e.preventDefault();
                }
            }
        });
    }
}

/**
 * Instant live filtering for the case table as the user types.
 */
function initInstantTableFilter() {
    const searchInput = document.querySelector(".search-input-wrapper input[name='search']");
    const dataTable = document.querySelector(".data-table tbody");

    if (!searchInput || !dataTable) return;

    searchInput.addEventListener("input", function () {
        const query = searchInput.value.toLowerCase().trim();
        const rows = dataTable.querySelectorAll("tr");

        rows.forEach(function (row) {
            const rowText = row.textContent.toLowerCase();
            if (!query || rowText.indexOf(query) !== -1) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    });
}
