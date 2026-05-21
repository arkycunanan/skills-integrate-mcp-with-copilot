document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const signupContainer = document.getElementById("signup-container");
  const authBtn = document.getElementById("auth-btn");
  const authStatus = document.getElementById("auth-status");

  // --- Auth helpers ---

  function getToken() {
    return sessionStorage.getItem("auth_token");
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function updateAuthUI() {
    if (isLoggedIn()) {
      const username = sessionStorage.getItem("auth_username");
      authStatus.textContent = `Logged in as ${username}`;
      authBtn.textContent = "🔓 Logout";
      signupContainer.classList.remove("hidden");
    } else {
      authStatus.textContent = "";
      authBtn.textContent = "👤 Login";
      signupContainer.classList.add("hidden");
    }
    // Re-render to show/hide delete buttons
    fetchActivities();
  }

  window.handleAuthClick = function () {
    if (isLoggedIn()) {
      logout();
    } else {
      document.getElementById("login-modal").classList.remove("hidden");
      document.getElementById("login-username").focus();
    }
  };

  window.closeLoginModal = function () {
    document.getElementById("login-modal").classList.add("hidden");
    document.getElementById("login-error").classList.add("hidden");
    document.getElementById("login-username").value = "";
    document.getElementById("login-password").value = "";
  };

  window.submitLogin = async function () {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    const errorDiv = document.getElementById("login-error");

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();

      if (response.ok) {
        sessionStorage.setItem("auth_token", result.token);
        sessionStorage.setItem("auth_username", result.username);
        closeLoginModal();
        updateAuthUI();
      } else {
        errorDiv.textContent = result.detail || "Login failed";
        errorDiv.classList.remove("hidden");
      }
    } catch {
      errorDiv.textContent = "Could not connect to server.";
      errorDiv.classList.remove("hidden");
    }
  };

  // Allow Enter key in login form
  document.getElementById("login-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") window.submitLogin();
  });

  async function logout() {
    const token = getToken();
    if (token) {
      await fetch("/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_username");
    updateAuthUI();
  }

  // --- Activities ---

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
                <h5>Participants:</h5>
                <ul class="participants-list">
                  ${details.participants
                    .map(
                      (email) =>
                        `<li>
                          <span class="participant-email">${email}</span>
                          ${isLoggedIn() ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>` : ""}
                        </li>`
                    )
                    .join("")}
                </ul>
              </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize
  updateAuthUI();
});
