
const SUPABASE_URL = "https://dtyowgfrslqgdjfrejug.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_B86cEGzE1BQGdqMKe0ftnw_aiG4vUA5";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const createStudentForm = document.getElementById("create-student-form");
const createMessage = document.getElementById("create-message");

function showMessage(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("error", isError);
}

function showLoggedOut(message = "") {
  if (loginSection) loginSection.hidden = false;
  if (dashboardSection) dashboardSection.hidden = true;

  const adminSection = document.getElementById("admin-section");
  const studentSection = document.getElementById("student-section");

  if (adminSection) adminSection.hidden = true;
  if (studentSection) studentSection.hidden = true;

  showMessage(loginMessage, message, Boolean(message));
}

async function loadDashboard() {
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    showLoggedOut();
    return;
  }

  const user = sessionData.session.user;

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select(
      "student_id, first_name, last_name, role, is_active"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.is_active !== true) {
    await supabaseClient.auth.signOut();
    showLoggedOut(
      "Your profile could not be verified. Contact the school administrator."
    );
    return;
  }

  loginSection.hidden = true;
  dashboardSection.hidden = false;

  document.getElementById("welcome-heading").textContent =
    `Welcome, ${profile.first_name}`;

  document.getElementById("account-role").textContent =
    profile.role === "admin" ? "Administrator" : "Student";

  document.getElementById("admin-section").hidden =
    profile.role !== "admin";

  document.getElementById("student-section").hidden =
    profile.role !== "student";

  if (profile.role === "student") {
    document.getElementById("student-details").textContent =
      `Student ID: ${profile.student_id || "Not assigned"} | ` +
      `Name: ${profile.first_name} ${profile.last_name}`;
  }
}

// LOGIN: administrators use email; students use Student ID.
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = document.getElementById("login-button");
  button.disabled = true;
  showMessage(loginMessage, "Signing in...");

  try {
    const loginId = document.getElementById("student-id").value.trim();
    const password = document.getElementById("password").value;

    if (!loginId || !password) {
      showMessage(
        loginMessage,
        "Enter your Student ID or administrator email and password.",
        true
      );
      return;
    }

    const email = loginId.includes("@")
      ? loginId.toLowerCase()
      : `${loginId.toLowerCase()}@students.snhs.invalid`;

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("Login error:", error.message);
      showMessage(
        loginMessage,
        "Sign-in failed. Check your login ID and password.",
        true
      );
      return;
    }

    await loadDashboard();
  } catch (error) {
    console.error("Login connection error:", error);
    showMessage(
      loginMessage,
      "A connection error occurred. Please try again.",
      true
    );
  } finally {
    button.disabled = false;
  }
});

// LOGOUT
document.getElementById("logout-button").addEventListener(
  "click",
  async () => {
    await supabaseClient.auth.signOut();
    showLoggedOut("You have signed out.");
  }
);

// CREATE STUDENT ACCOUNT: administrator only.
createStudentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = document.getElementById("create-student-button");
  button.disabled = true;
  showMessage(createMessage, "Creating student account...");

  try {
    const {
      data: sessionData,
      error: sessionError
    } = await supabaseClient.auth.getSession();

    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      showMessage(
        createMessage,
        "Please sign in again as administrator.",
        true
      );
      return;
    }

    const payload = {
      student_id: document.getElementById("new-student-id").value.trim(),
      first_name: document.getElementById("first-name").value.trim(),
      last_name: document.getElementById("last-name").value.trim(),
      grade_level: document.getElementById("grade-level").value.trim(),
      section: document.getElementById("section").value.trim(),
      temporary_password:
        document.getElementById("temporary-password").value
    };

    if (
      !payload.student_id ||
      !payload.first_name ||
      !payload.last_name ||
      !payload.temporary_password
    ) {
      showMessage(
        createMessage,
        "Please complete the Student ID, first name, last name, and temporary password.",
        true
      );
      return;
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/create-student`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Create student error:", result.error);
      showMessage(
        createMessage,
        result.error || "Could not create student account.",
        true
      );
      return;
    }

    showMessage(
      createMessage,
      `Student account created successfully: ${result.student_id}`
    );

    createStudentForm.reset();
  } catch (error) {
    console.error("Create student connection error:", error);
    showMessage(
      createMessage,
      "Connection error. Please try again.",
      true
    );
  } finally {
    button.disabled = false;
  }
});

// Respond to sign-out events.
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || !session) {
    showLoggedOut();
  }
});

// Restore the existing login session when the page loads.
loadDashboard();
