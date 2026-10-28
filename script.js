// ==================================================
// SNHS STUDENT PORTAL
// Complete script.js
// ==================================================

const SUPABASE_URL = "https://dtyowgfrslqgdjfrejug.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_B86cEGzE1BQGdqMKe0ftnw_aiG4vUA5";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const $ = (id) => document.getElementById(id);

const loginSection = $("login-section");
const dashboardSection = $("dashboard-section");
const loginForm = $("login-form");
const loginMessage = $("login-message");
const createStudentForm = $("create-student-form");
const createMessage = $("create-message");

let currentUser = null;
let currentProfile = null;
let terms = [];
let subjects = [];
let students = [];
let grades = [];
let currentRecordStudentId = null;

// ==================================================
// GENERAL HELPERS
// ==================================================

function showMessage(element, message, isError = false) {
  if (!element) return;

  element.textContent = message;
  element.classList.toggle("error", isError);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function normalizeGradeLevel(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^grade\s*/, "")
    .replace(/\s+/g, "");
}

function formatGrade(grade) {
  if (grade === null || grade === undefined || grade === "") {
    return "Not yet graded";
  }

  return Number(grade).toFixed(2);
}

function gradeEvaluation(grade) {
  if (grade === null || grade === undefined || grade === "") {
    return "Not yet graded";
  }

  const value = Number(grade);

  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return "Invalid grade";
  }

  if (value >= 90) return "Outstanding";
  if (value >= 85) return "Very Satisfactory";
  if (value >= 80) return "Satisfactory";
  if (value >= 75) return "Fairly Satisfactory";

  return "Failed";
}

function setOptions(
  element,
  items,
  valueKey,
  labelFunction,
  placeholder
) {
  if (!element) return;

  const previousValue = element.value;

  element.innerHTML = "";

  const firstOption = document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = placeholder;
  element.appendChild(firstOption);

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item[valueKey]);
    option.textContent = labelFunction(item);
    element.appendChild(option);
  });

  if (
    [...element.options].some(
      (option) => option.value === previousValue
    )
  ) {
    element.value = previousValue;
  }
}

function showLoggedOut(message = "") {
  if (loginSection) loginSection.hidden = false;
  if (dashboardSection) dashboardSection.hidden = true;

  if ($("admin-section")) {
    $("admin-section").hidden = true;
  }

  if ($("student-section")) {
    $("student-section").hidden = true;
  }

  currentUser = null;
  currentProfile = null;

  showMessage(loginMessage, message, false);
}

function setActiveAdminTab(tabName) {
  document.querySelectorAll("[data-admin-tab]").forEach((button) => {
    const active = button.dataset.adminTab === tabName;

    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });

  document.querySelectorAll(".admin-panel").forEach((panel) => {
    panel.hidden = panel.id !== `admin-panel-${tabName}`;
  });
}

// ==================================================
// CLASS ROSTER HTML FALLBACK
// Creates the class-list interface when index.html does not yet contain it.
// ==================================================

function ensureClassRosterMarkup() {
  const studentsPanel = $("admin-panel-students");

  if (!studentsPanel) {
    console.error(
      "Cannot create the class list: #admin-panel-students is missing from index.html."
    );
    return;
  }

  if (!$("class-roster-section")) {
    const rosterSection = document.createElement("section");
    rosterSection.id = "class-roster-section";
    rosterSection.className = "portal-card class-roster-section";

    rosterSection.innerHTML = `
      <style>
        .class-roster-section, #student-record-panel {
          margin: 24px 0;
          padding: 20px;
          border: 1px solid #dbe3ee;
          border-radius: 14px;
          background: #fff;
        }

        .roster-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(160px,1fr));
          gap: 12px;
          margin: 16px 0;
        }

        .roster-controls select,
        .roster-controls input {
          box-sizing: border-box;
          width: 100%;
          min-height: 42px;
          padding: 9px 11px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
        }

        .student-roster-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin: 10px 0;
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        .student-card-info h4 {
          margin: 0 0 6px;
        }

        .student-card-info p {
          margin: 3px 0;
        }

        .student-roster-card button,
        #close-student-record {
          padding: 9px 13px;
          border: 0;
          border-radius: 8px;
          cursor: pointer;
        }

   
.record-tabs button,
.record-tabs button:focus,
.record-tabs button:active,
.record-tabs button.active {
  padding: 9px 12px;
  border: 1px solid #17178b !important;
  border-radius: 8px;
  background: #17178b !important;
  background-color: #17178b !important;
  color: #ffffff !important;
  cursor: pointer;
  font-weight: 700;
  opacity: 1 !important;
  box-shadow: none !important;
  appearance: none;
  -webkit-appearance: none;
}

.record-tabs button:hover,
.record-tabs button.active:hover {
  background: #08085b !important;
  background-color: #08085b !important;
  color: #ffffff !important;
}


        .record-info-grid,
        .evaluation-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(180px,1fr));
          gap: 12px;
        }

        .record-info-item,
        .evaluation-stat {
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          overflow-wrap: anywhere;
        }

        .record-info-item span,
        .evaluation-stat span {
          display: block;
          color: #64748b;
          font-size: .88rem;
          margin-bottom: 5px;
        }

        .table-container {
          max-width: 100%;
          overflow-x: auto;
        }

        #record-grades-content table {
          width: 100%;
          border-collapse: collapse;
        }

        #record-grades-content th,
        #record-grades-content td {
          padding: 9px;
          border: 1px solid #e2e8f0;
          text-align: left;
        }

        .empty-state {
          padding: 14px;
          color: #64748b;
        }

        @media (max-width: 560px) {
          .student-roster-card {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      </style>

      <h3>Class List</h3>
      <p>
        Filter students by grade level and section, or search by student ID or name.
      </p>

      <div class="roster-controls">
        <select id="roster-grade-filter" aria-label="Filter by grade level">
          <option value="">All grade levels</option>
        </select>

        <select id="roster-section-filter" aria-label="Filter by section">
          <option value="">All sections</option>
        </select>

        <input
          id="roster-search"
          type="search"
          placeholder="Search student ID or name"
          aria-label="Search students"
        >
      </div>

      <p><strong id="roster-count">Loading students...</strong></p>

      <div id="class-roster-list">
        <p class="empty-state">Loading students...</p>
      </div>
    `;

    const createForm = $("create-student-form");

    if (createForm && createForm.parentNode === studentsPanel) {
      studentsPanel.insertBefore(rosterSection, createForm);
    } else {
      studentsPanel.appendChild(rosterSection);
    }
  }

  if (!$("student-record-panel")) {
    const recordPanel = document.createElement("section");
    recordPanel.id = "student-record-panel";
    recordPanel.hidden = true;

    recordPanel.innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <h3 id="record-student-name">Student Record</h3>
          <p id="record-student-meta"></p>
        </div>

        <button type="button" id="close-student-record">
          Close Record
        </button>
      </div>

      <div class="record-tabs" role="tablist" aria-label="Student record sections">
        <button
          type="button"
          data-record-tab="profile"
          class="active"
          role="tab"
          aria-selected="true"
        >Profile</button>

        <button
          type="button"
          data-record-tab="grades"
          role="tab"
          aria-selected="false"
        >Grades by Subject and Term</button>

        <button
          type="button"
          data-record-tab="evaluation"
          role="tab"
          aria-selected="false"
        >Evaluation Summary</button>
      </div>

      <section id="record-panel-profile" class="record-panel">
        <div id="record-profile-content" class="record-info-grid"></div>
      </section>

      <section id="record-panel-grades" class="record-panel" hidden>
        <div id="record-grades-content"></div>
      </section>

      <section id="record-panel-evaluation" class="record-panel" hidden>
        <div id="record-evaluation-content" class="evaluation-grid"></div>
      </section>
    `;

    studentsPanel.appendChild(recordPanel);
  }
}

// Build the roster markup before its event listeners are registered below.
ensureClassRosterMarkup();

// ==================================================
// LOGIN AND DASHBOARD
// ==================================================

async function loadDashboard() {
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    showLoggedOut();
    return;
  }

  currentUser = sessionData.session.user;

  
  const { data: profile, error: profileError } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, student_id, first_name, last_name, role, is_active, grade_level, section, gender, birthday, blood_type, emergency_contact_name, emergency_contact_relationship, emergency_contact_number"
      )
      .eq("id", currentUser.id)
      .maybeSingle();


  if (
    profileError ||
    !profile ||
    profile.is_active !== true ||
    !["admin", "student"].includes(profile.role)
  ) {
    await supabaseClient.auth.signOut();

    showLoggedOut(
      "Your profile could not be verified. Contact the school administrator."
    );
    return;
  }

  currentProfile = profile;

if (profile.role === "student") {
  populateStudentProfile(profile);
}

  loginSection.hidden = true;
  dashboardSection.hidden = false;

  $("welcome-heading").textContent =
    `Welcome, ${profile.first_name}`;

  $("account-role").textContent =
    profile.role === "admin" ? "Administrator" : "Student";

  $("admin-section").hidden = profile.role !== "admin";
  $("student-section").hidden = profile.role !== "student";

  if (profile.role === "student") {
    $("student-details").textContent =
      `Student ID: ${profile.student_id || "Not assigned"} | ` +
      `Name: ${profile.first_name} ${profile.last_name}` +
      (profile.grade_level
        ? ` | Grade Level: ${profile.grade_level}`
        : "");

    await loadStudentGrades();
  } else {
    ensureClassRosterMarkup();
    setActiveAdminTab("students");
    await loadAdminData();
  }
}

function setStudentProfileFormLocked(locked) {
  const form = $("student-profile-form");
  if (!form) return;

  form.querySelectorAll("input, select").forEach((field) => {
    field.disabled = locked;
  });

  const button = $("save-student-profile");
  if (button) {
    button.textContent = locked
      ? "Edit Profile Information"
      : "Save Profile Information";
  }
}

function populateStudentProfile(profile) {
  if (!profile || profile.role !== "student") return;


  $("profile-gender").value = profile.gender || "";
  $("profile-birthdate").value = profile.birthday || "";
  $("profile-blood-type").value = profile.blood_type || "";
  $("profile-emergency-name").value =
    profile.emergency_contact_name || "";
  $("profile-emergency-relationship").value =
    profile.emergency_contact_relationship || "";
  $("profile-emergency-phone").value =
    profile.emergency_contact_number || "";

  const hasSavedInformation = [
    profile.gender,
    profile.birthday,
    profile.blood_type,
    profile.emergency_contact_name,
    profile.emergency_contact_relationship,
    profile.emergency_contact_number
  ].some((value) => value !== null && value !== undefined && value !== "");

  setStudentProfileFormLocked(hasSavedInformation);
}

const studentProfileForm = $("student-profile-form");

studentProfileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (currentProfile?.role !== "student" || !currentUser) {
    showMessage(
      $("student-profile-message"),
      "Please sign in as a student.",
      true
    );
    return;
  }

  const button = $("save-student-profile");
  const message = $("student-profile-message");

  // If the saved form is locked, unlock it for editing.
  if (button.textContent.trim() === "Edit Profile Information") {
    setStudentProfileFormLocked(false);
    showMessage(message, "You can now edit your personal information.");
    return;
  }


const values = {
  gender: $("profile-gender").value || null,
  birthday: $("profile-birthdate").value || null,
  blood_type: $("profile-blood-type").value || null,
  emergency_contact_name:
    $("profile-emergency-name").value.trim() || null,
  emergency_contact_relationship:
    $("profile-emergency-relationship").value.trim() || null,
  emergency_contact_number:
    $("profile-emergency-phone").value.trim() || null
};


  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .update(values)
      .eq("id", currentUser.id)
      .eq("role", "student")
     .select(
  "id, gender, birthday, blood_type, emergency_contact_name, emergency_contact_relationship, emergency_contact_number"
)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "No profile was updated. Check your Supabase permissions."
      );
    }

    Object.assign(currentProfile, data);

    populateStudentProfile(currentProfile);

    showMessage(
      message,
      "Profile information saved successfully."
    );
  } catch (error) {
    console.error("Student profile save error:", error);

    setStudentProfileFormLocked(false);
    showMessage(
      message,
      "Could not save profile information: " + error.message,
      true
    );
  } finally {
    button.disabled = false;
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = $("login-button");
  button.disabled = true;

  showMessage(loginMessage, "Signing in...");

  try {
    const loginId = $("student-id").value.trim();
    const password = $("password").value;

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

    const { error } =
      await supabaseClient.auth.signInWithPassword({
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
      "Connection error. Please try again.",
      true
    );
  } finally {
    button.disabled = false;
  }
});

$("logout-button").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showLoggedOut("You have signed out.");
});

// ==================================================
// CREATE STUDENT ACCOUNT
// ==================================================

createStudentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (currentProfile?.role !== "admin") {
    showMessage(
      createMessage,
      "Administrator access is required.",
      true
    );
    return;
  }

  const button = $("create-student-button");
  button.disabled = true;

  showMessage(createMessage, "Creating student account...");

  try {
    const { data: sessionData, error: sessionError } =
      await supabaseClient.auth.getSession();

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
      student_id: $("new-student-id").value.trim(),
      first_name: $("first-name").value.trim(),
      last_name: $("last-name").value.trim(),
      grade_level: $("grade-level").value.trim(),
      section: $("section").value.trim(),
      temporary_password: $("temporary-password").value
    };

    if (
      !payload.student_id ||
      !payload.first_name ||
      !payload.last_name ||
      !payload.temporary_password
    ) {
      showMessage(
        createMessage,
        "Complete the Student ID, first name, last name, and temporary password.",
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
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    if (!response.ok) {
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

    await loadAdminData();
  } catch (error) {
    console.error("Create student error:", error);

    showMessage(
      createMessage,
      "Connection error. Please try again.",
      true
    );
  } finally {
    button.disabled = false;
  }
});

// ==================================================
// ADMIN TABS
// ==================================================

document.querySelectorAll("[data-admin-tab]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (currentProfile?.role !== "admin") return;

    const tabName = button.dataset.adminTab;

    setActiveAdminTab(tabName);

    if (tabName === "students") {
      await loadAdminData();
    } else if (tabName === "subjects") {
      await loadTermsAndSubjects();
    } else if (tabName === "grades") {
      await loadTermsAndSubjects();
      await loadStudents();
      await loadGradeEntryData();
      await loadAdminGrades();
    }
  });
});

// ==================================================
// LOAD ADMIN DATA
// ==================================================

async function loadAdminData() {
  if (currentProfile?.role !== "admin") return;

  await Promise.all([
    loadStudents(),
    loadTermsAndSubjects()
  ]);

  renderClassRoster();
}

// ==================================================
// LOAD STUDENTS
// ==================================================

async function loadStudents() {
  if (currentProfile?.role !== "admin") return;

  const { data, error } = await supabaseClient
    .from("profiles")
   

.select(
  "id, student_id, first_name, last_name, role, is_active, grade_level, section, gender, birthday, blood_type, emergency_contact_name, emergency_contact_relationship, emergency_contact_number"
)


    .eq("role", "student")
    .order("last_name", { ascending: true });

  if (error) {
    console.error("Load students error:", error);

    const roster = $("class-roster-list");
    const count = $("roster-count");

    if (roster) {
      roster.innerHTML =
        `<p class="empty-state">Could not load student profiles: ${escapeHTML(error.message)}. Check the profiles table SELECT policy and administrator permissions.</p>`;
    }

    if (count) count.textContent = "Unable to load students";

    showMessage(
      createMessage,
      `Could not load students: ${error.message}`,
      true
    );

    students = [];
    return;
  }

  students = data || [];

  console.log(
    `SNHS Portal: loaded ${students.length} student profile(s).`
  );

  renderClassRoster();

  if ($("grade-level-filter")) {
    const currentGrade = $("grade-level-filter").value.trim();

    if (currentGrade) {
      updateGradeEntryStudents();
    }
  }
}

// ==================================================
// CLASS LIST AND INDIVIDUAL STUDENT RECORDS
// ==================================================


function getStudentFullName(student) {
  return `${student.first_name || ""} ${student.last_name || ""}`.trim();
}

function sortStudentsByGenderAndName(studentList) {
  const genderOrder = {
    male: 0,
    female: 1
  };

  return [...studentList].sort((a, b) => {
    const genderA = genderOrder[String(a.gender || "").trim().toLowerCase()] ?? 2;
    const genderB = genderOrder[String(b.gender || "").trim().toLowerCase()] ?? 2;

    if (genderA !== genderB) {
      return genderA - genderB;
    }

    return String(a.last_name || "").localeCompare(
      String(b.last_name || ""),
      undefined,
      { sensitivity: "base" }
    );
  });
}


function getSortedUnique(values) {
  return [...new Set(
    values
      .filter((value) => value !== null && value !== undefined)
      .map((value) => String(value).trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base"
  }));
}

function populateRosterFilters() {
  const gradeFilter = $("roster-grade-filter");
  const sectionFilter = $("roster-section-filter");

  if (!gradeFilter || !sectionFilter) return;

  const previousGrade = gradeFilter.value;
  const previousSection = sectionFilter.value;

  const gradeLevels = getSortedUnique(
    students.map((student) => student.grade_level)
  );

  const sections = getSortedUnique(
    students
      .filter((student) => {
        return !previousGrade ||
          normalizeGradeLevel(student.grade_level) ===
          normalizeGradeLevel(previousGrade);
      })
      .map((student) => student.section)
  );

  gradeFilter.innerHTML =
    '<option value="">All grade levels</option>' +
    gradeLevels.map((grade) =>
      `<option value="${escapeHTML(grade)}">${escapeHTML(grade)}</option>`
    ).join("");

  if (gradeLevels.includes(previousGrade)) {
    gradeFilter.value = previousGrade;
  }

  sectionFilter.innerHTML =
    '<option value="">All sections</option>' +
    sections.map((section) =>
      `<option value="${escapeHTML(section)}">${escapeHTML(section)}</option>`
    ).join("");

  if (sections.includes(previousSection)) {
    sectionFilter.value = previousSection;
  }
}

function getFilteredStudents() {
  const grade = $("roster-grade-filter")?.value || "";
  const section = $("roster-section-filter")?.value || "";
  const search = ($("roster-search")?.value || "").trim().toLowerCase();

  return students.filter((student) => {
    const gradeMatches = !grade ||
      normalizeGradeLevel(student.grade_level) ===
      normalizeGradeLevel(grade);

    const sectionMatches = !section ||
      String(student.section || "").toLowerCase() === section.toLowerCase();

    const searchableText = [
      student.student_id,
      student.first_name,
      student.last_name,
      getStudentFullName(student),
      student.grade_level,
      student.section
    ].join(" ").toLowerCase();

    const searchMatches = !search || searchableText.includes(search);

    return gradeMatches && sectionMatches && searchMatches;
  });
}



function renderClassRoster() {
  const roster = $("class-roster-list");
  const count = $("roster-count");

  if (!roster || !count) return;

  populateRosterFilters();

  const filteredStudents = getFilteredStudents();

  // Sort alphabetically by last name, then first name.
  filteredStudents.sort((a, b) => {
    const lastNameCompare = String(a.last_name || "").localeCompare(
      String(b.last_name || ""),
      undefined,
      { sensitivity: "base" }
    );

    if (lastNameCompare !== 0) return lastNameCompare;

    return String(a.first_name || "").localeCompare(
      String(b.first_name || ""),
      undefined,
      { sensitivity: "base" }
    );
  });

  // Normalize common gender labels.
  function getRosterGender(student) {
    const gender = String(student.gender || "")
      .trim()
      .toLowerCase();

    if (["male", "m", "man", "boy"].includes(gender)) {
      return "male";
    }

    if (["female", "f", "woman", "girl"].includes(gender)) {
      return "female";
    }

    return "unspecified";
  }

  const maleStudents = filteredStudents.filter(
    student => getRosterGender(student) === "male"
  );

  const femaleStudents = filteredStudents.filter(
    student => getRosterGender(student) === "female"
  );

  const unspecifiedStudents = filteredStudents.filter(
    student => getRosterGender(student) === "unspecified"
  );

  // Update the existing roster count.
  count.textContent =
    `${filteredStudents.length} active student` +
    `${filteredStudents.length === 1 ? "" : "s"}`;

  // Build compact summary cards.
  const summaryHTML = `
    <div class="roster-summary-grid">
      <article class="roster-summary-card roster-summary-total">
        <div class="roster-summary-icon" aria-hidden="true">👥</div>
        <div>
          <p>Total Active Students</p>
          <strong>${filteredStudents.length}</strong>
          <span>Matching current filters</span>
        </div>
      </article>

      <article class="roster-summary-card roster-summary-male">
        <div class="roster-summary-icon" aria-hidden="true">♂</div>
        <div>
          <p>Male Students</p>
          <strong>${maleStudents.length}</strong>
          <span>Matching current filters</span>
        </div>
      </article>

      <article class="roster-summary-card roster-summary-female">
        <div class="roster-summary-icon" aria-hidden="true">♀</div>
        <div>
          <p>Female Students</p>
          <strong>${femaleStudents.length}</strong>
          <span>Matching current filters</span>
        </div>
      </article>
    </div>
  `;

  // Render each student while preserving existing action attributes.
  function renderStudentCards(studentList) {
    if (studentList.length === 0) {
      return `
        <div class="roster-empty-message">
          <span aria-hidden="true">📋</span>
          <p>No students found in this list.</p>
        </div>
      `;
    }

    return studentList.map(student => {
      const fullName =
        getStudentFullName(student) || "Unnamed student";

      const studentId = student.student_id || "Not assigned";
      const grade = student.grade_level || "No grade level";
      const section = student.section || "No section assigned";

      const initials = [
        student.first_name,
        student.last_name
      ]
        .filter(Boolean)
        .map(name => String(name).trim().charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2) || "ST";

      return `
        <article class="student-roster-card">
          <div class="student-avatar" aria-hidden="true">
            ${escapeHTML(initials)}
          </div>

          <div class="student-card-info">
            <h4>${escapeHTML(fullName)}</h4>

            <p class="student-roster-id">
              ID: ${escapeHTML(studentId)}
            </p>

            <p class="student-roster-class">
              ${escapeHTML(grade)}
              <span aria-hidden="true">·</span>
              ${escapeHTML(section)}
            </p>
          </div>

          <div class="student-card-actions">
            <button
              type="button"
              class="roster-action-view"
              data-view-student="${escapeHTML(student.id)}"
              aria-label="View record for ${escapeHTML(fullName)}"
            >View Record</button>

            <button
              type="button"
              class="student-deactivate-button roster-action-remove"
              data-deactivate-student="${escapeHTML(student.id)}"
              aria-label="Remove ${escapeHTML(fullName)} from the active class roster"
            >Remove</button>
          </div>
        </article>
      `;
    }).join("");
  }

  // Two main lists side by side.
  const genderListsHTML = `
    <div class="class-roster-gender-grid">

      <section class="gender-roster-panel male-roster-panel">
        <div class="gender-roster-heading">
          <div class="gender-roster-title">
            <span class="gender-roster-symbol" aria-hidden="true">♂</span>
            <div>
              <h3>Male Students</h3>
              <p>Class roster</p>
            </div>
          </div>

          <span class="gender-roster-count">
            ${maleStudents.length}
          </span>
        </div>

        <div class="gender-roster-list">
          ${renderStudentCards(maleStudents)}
        </div>
      </section>

      <section class="gender-roster-panel female-roster-panel">
        <div class="gender-roster-heading">
          <div class="gender-roster-title">
            <span class="gender-roster-symbol" aria-hidden="true">♀</span>
            <div>
              <h3>Female Students</h3>
              <p>Class roster</p>
            </div>
          </div>

          <span class="gender-roster-count">
            ${femaleStudents.length}
          </span>
        </div>

        <div class="gender-roster-list">
          ${renderStudentCards(femaleStudents)}
        </div>
      </section>

    </div>
  `;

  // Keep students with missing or unrecognized gender visible.
  const unspecifiedHTML = unspecifiedStudents.length
    ? `
      <section class="gender-roster-panel unspecified-roster-panel">
        <div class="gender-roster-heading">
          <div class="gender-roster-title">
            <span class="gender-roster-symbol" aria-hidden="true">•</span>
            <div>
              <h3>Gender Not Specified</h3>
              <p>Update student profiles when appropriate</p>
            </div>
          </div>

          <span class="gender-roster-count">
            ${unspecifiedStudents.length}
          </span>
        </div>

        <div class="gender-roster-list">
          ${renderStudentCards(unspecifiedStudents)}
        </div>
      </section>
    `
    : "";

  roster.innerHTML =
    summaryHTML + genderListsHTML + unspecifiedHTML;
}

$("roster-grade-filter")?.addEventListener("change", () => {
  populateRosterFilters();
  renderClassRoster();
});

$("roster-section-filter")?.addEventListener("change", renderClassRoster);
$("roster-search")?.addEventListener("input", renderClassRoster);

$("class-roster-list")?.addEventListener("click", async (event) => {
  const button = event.target.closest(
    "[data-view-student], [data-edit-student]"
  );

  if (!button) return;

  const studentId =
    button.dataset.viewStudent || button.dataset.editStudent;

  const student = students.find(
    (item) => String(item.id) === String(studentId)
  );

  if (!student) {
    alert("Student record not found. Refresh the class list and try again.");
    return;
  }

  try {
    await openStudentRecord(student);
  } catch (error) {
    console.error("Open student record error:", error);
    alert("Unable to open the student record. Please try again.");
  }
});

$("close-student-record")?.addEventListener("click", () => {
  $("student-record-panel").hidden = true;
  $("class-roster-section").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll("[data-record-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    setActiveRecordTab(button.dataset.recordTab);
  });
});

function setActiveRecordTab(tabName) {
  document.querySelectorAll("[data-record-tab]").forEach((button) => {
    const active = button.dataset.recordTab === tabName;

    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });

  document.querySelectorAll(".record-panel").forEach((panel) => {
    panel.hidden = panel.id !== `record-panel-${tabName}`;
  });
}

function renderProfileField(label, value) {
  return `
    <div class="record-info-item">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value || "Not provided")}</strong>
    </div>
  `;
}

function renderEvaluationStat(label, value) {
  return `
    <div class="evaluation-stat">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
    </div>
  `;
}

async function openStudentRecord(student) {
  if (currentProfile?.role !== "admin") return;

  currentRecordStudentId = student.id;

  const recordPanel = $("student-record-panel");
  recordPanel.hidden = false;

  $("record-student-name").textContent =
    getStudentFullName(student) || "Unnamed student";

  $("record-student-meta").textContent =
    `Student ID: ${student.student_id || "Not assigned"} | ` +
    `${student.grade_level || "No grade level"} | ` +
    `${student.section || "No section assigned"}`;

  $("record-profile-content").innerHTML = [
    renderProfileField("Student ID", student.student_id),
    renderProfileField("First Name", student.first_name),
    renderProfileField("Last Name", student.last_name),
    renderProfileField("Grade Level", student.grade_level),
    renderProfileField("Section", student.section),
    renderProfileField("Gender", student.gender),
    renderProfileField("Birthday", student.birthday),
    renderProfileField("Blood Type", student.blood_type),
    renderProfileField(
      "Emergency Contact Name",
      student.emergency_contact_name
    ),
    renderProfileField(
      "Emergency Contact Relationship",
      student.emergency_contact_relationship
    ),
    renderProfileField(
      "Emergency Contact Number",
      student.emergency_contact_number
    ),
    renderProfileField(
      "Account Status",
      student.is_active ? "Active" : "Inactive"
    ),
    renderProfileField("Profile ID", student.id),

    `
      <div class="record-info-item">
        <h4>Edit Student Information</h4>

        <label for="admin-edit-first-name">First Name</label>
        <input
          id="admin-edit-first-name"
          type="text"
          value="${escapeHTML(student.first_name || "")}"
        >

        <label for="admin-edit-last-name">Last Name</label>
        <input
          id="admin-edit-last-name"
          type="text"
          value="${escapeHTML(student.last_name || "")}"
        >

        <label for="admin-edit-grade-level">Grade Level</label>
        <input
          id="admin-edit-grade-level"
          type="text"
          value="${escapeHTML(student.grade_level || "")}"
        >

        <label for="admin-edit-section">Section</label>
        <input
          id="admin-edit-section"
          type="text"
          value="${escapeHTML(student.section || "")}"
        >

        <label for="admin-edit-gender">Gender</label>
        <select id="admin-edit-gender">
          <option value="" ${
            !student.gender ? "selected" : ""
          }>Not specified</option>
          <option value="Male" ${
            student.gender === "Male" ? "selected" : ""
          }>Male</option>
          <option value="Female" ${
            student.gender === "Female" ? "selected" : ""
          }>Female</option>
          <option value="Prefer not to say" ${
            student.gender === "Prefer not to say" ? "selected" : ""
          }>Prefer not to say</option>
        </select>

        <label for="admin-edit-birthday">Birthday</label>
        <input
          id="admin-edit-birthday"
          type="date"
          value="${escapeHTML(student.birthday || "")}"
        >

        <label for="admin-edit-blood-type">Blood Type</label>
        <select id="admin-edit-blood-type">
          ${["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
            .map(
              (type) => `
                <option value="${type}" ${
                  student.blood_type === type ? "selected" : ""
                }>${type || "Not specified"}</option>
              `
            )
            .join("")}
        </select>

        <label for="admin-edit-emergency-name">
          Emergency Contact Name
        </label>
        <input
          id="admin-edit-emergency-name"
          type="text"
          value="${escapeHTML(student.emergency_contact_name || "")}"
        >

        <label for="admin-edit-emergency-relationship">
          Emergency Contact Relationship
        </label>
        <input
          id="admin-edit-emergency-relationship"
          type="text"
          value="${escapeHTML(
            student.emergency_contact_relationship || ""
          )}"
        >

        <label for="admin-edit-emergency-number">
          Emergency Contact Number
        </label>
        <input
          id="admin-edit-emergency-number"
          type="tel"
          value="${escapeHTML(student.emergency_contact_number || "")}"
        >

        <button type="button" id="save-admin-student-info">
          Save Student Information
        </button>

        <p id="admin-student-info-message" role="status"></p>
      </div>
    `
  ].join("");
}

  setActiveRecordTab("profile");

  $("record-grades-content").innerHTML =
    "<p>Loading student grades...</p>";

  $("record-evaluation-content").innerHTML = "";

  recordPanel.scrollIntoView({ behavior: "smooth", block: "start" });

  await loadIndividualStudentGrades(student);
}


$("record-profile-content")?.addEventListener("click", async (event) => {
  const button = event.target.closest("#save-admin-student-info");
  if (!button) return;

  if (currentProfile?.role !== "admin" || !currentRecordStudentId) {
    alert("Administrator access is required.");
    return;
  }

  const message = $("admin-student-info-message");

  const firstName = $("admin-edit-first-name").value.trim();
  const lastName = $("admin-edit-last-name").value.trim();
  const gradeLevel = $("admin-edit-grade-level").value.trim();
  const section = $("admin-edit-section").value.trim();

  if (!firstName || !lastName) {
    showMessage(message, "First name and last name are required.", true);
    return;
  }

  const updates = {
    first_name: firstName,
    last_name: lastName,
    grade_level: gradeLevel || null,
    section: section || null,
    gender: $("admin-edit-gender").value || null,
    birthday: $("admin-edit-birthday").value || null,
    blood_type: $("admin-edit-blood-type").value || null,
    emergency_contact_name:
      $("admin-edit-emergency-name").value.trim() || null,
    emergency_contact_relationship:
      $("admin-edit-emergency-relationship").value.trim() || null,
    emergency_contact_number:
      $("admin-edit-emergency-number").value.trim() || null
  };

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .update(updates)
      .eq("id", currentRecordStudentId)
      .eq("role", "student")
      .select(
        "id, first_name, last_name, grade_level, section, gender, birthday, blood_type, emergency_contact_name, emergency_contact_relationship, emergency_contact_number"
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        "No changes were saved. Check the administrator's database permissions."
      );
    }

    const student = students.find(
      (item) => String(item.id) === String(data.id)
    );

    if (student) {
      Object.assign(student, data);
    }

    await loadStudents();

    const updatedStudent = students.find(
      (item) => String(item.id) === String(data.id)
    );

    if (updatedStudent) {
      await openStudentRecord(updatedStudent);
    }

    alert("Student information updated successfully.");
  } catch (error) {
    console.error("Save student information error:", error);

    const currentMessage = $("admin-student-info-message");

    if (currentMessage) {
      showMessage(
        currentMessage,
        `Could not save student information: ${error.message}`,
        true
      );
    } else {
      alert(`Could not save student information: ${error.message}`);
    }
  } finally {
    button.disabled = false;
    button.textContent = "Save Student Information";
  }
});


async function loadIndividualStudentGrades(student) {
  const gradesContainer = $("record-grades-content");
  const evaluationContainer = $("record-evaluation-content");

  try {
    const [
      { data: enrollmentData, error: enrollmentError },
      { data: gradeData, error: gradeError }
    ] = await Promise.all([
      supabaseClient
        .from("student_subjects")
        .select("subject_id")
        .eq("student_id", student.id),

      supabaseClient
        .from("student_grades")
        .select("subject_id, grade, updated_at")
        .eq("student_id", student.id)
    ]);

    if (enrollmentError) throw enrollmentError;
    if (gradeError) throw gradeError;

const studentGrades = gradeData || [];

// Load all subjects assigned to this student's grade level,
// including subjects without grades yet.
const { data: subjectData, error: subjectError } =
  await supabaseClient
    .from("subjects")
    .select("id, term_id, subject_name, grade_level")
    .eq("grade_level", student.grade_level)
    .order("subject_name");

if (subjectError) throw subjectError;

const studentSubjects = subjectData || [];

if (studentSubjects.length === 0) {
  gradesContainer.innerHTML =
    "<p>No subjects have been created for this student's grade level yet.</p>";

  evaluationContainer.innerHTML = [
    renderEvaluationStat("Recorded Subjects", "0"),
    renderEvaluationStat("Graded Subjects", "0"),
    renderEvaluationStat("Average Grade", "N/A"),
    renderEvaluationStat("Passed Subjects", "0"),
    renderEvaluationStat("Failed Subjects", "0"),
    renderEvaluationStat("Ungraded Subjects", "0")
  ].join("");

  return;
}

    const termIds = [...new Set(
      studentSubjects
        .map((subject) => subject.term_id)
        .filter((id) => id !== null && id !== undefined)
    )];

    let studentTerms = [];

    if (termIds.length > 0) {
      const { data: termData, error: termError } =
        await supabaseClient
          .from("academic_terms")
          .select("id, term_name, school_year")
          .in("id", termIds);

      if (termError) throw termError;

      studentTerms = termData || [];
    }

    const rows = studentSubjects.map((subject) => {
      const term = studentTerms.find(
        (item) => String(item.id) === String(subject.term_id)
      );

      const gradeRecord = studentGrades.find(
        (item) => String(item.subject_id) === String(subject.id)
      );

      const grade = gradeRecord?.grade ?? null;

      return {
        subject,
        term,
        grade,
        evaluation: gradeEvaluation(grade)
      };
    });

if (rows.length === 0) {
  gradesContainer.innerHTML =
    "<p>No subjects found for this student.</p>";
} else {
  // Group subjects by school year and term
  const groupedRows = {};

  rows.forEach((row) => {
    const schoolYear = row.term?.school_year || "Unknown School Year";
    const termName = row.term?.term_name || "Unassigned Term";
    const groupKey = `${schoolYear}|||${termName}`;

    if (!groupedRows[groupKey]) {
      groupedRows[groupKey] = {
        schoolYear,
        termName,
        rows: []
      };
    }

    groupedRows[groupKey].rows.push(row);
  });

  // Set the preferred term order
  const termOrder = [
    "First Term",
    "Second Term",
    "Third Term"
  ];

  const groups = Object.values(groupedRows).sort((a, b) => {
    const yearCompare = a.schoolYear.localeCompare(b.schoolYear);

    if (yearCompare !== 0) return yearCompare;

    const aIndex = termOrder.indexOf(a.termName);
    const bIndex = termOrder.indexOf(b.termName);

    return (aIndex === -1 ? 99 : aIndex) -
           (bIndex === -1 ? 99 : bIndex);
  });

  gradesContainer.innerHTML = groups.map((group) => `
    <section class="grade-term-group">
      <h3 class="grade-term-heading">
        ${escapeHTML(group.schoolYear)} — ${escapeHTML(group.termName)}
      </h3>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Grade Level</th>
              <th>Subject</th>
              <th>Grade</th>
              <th>Evaluation</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            ${group.rows.map((row) => `
              <tr>
                <td>
                  ${escapeHTML(
                    row.subject.grade_level ||
                    student.grade_level ||
                    "—"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    row.subject.subject_name || "Unnamed subject"
                  )}
                </td>

                <td>${formatGrade(row.grade)}</td>

          <td>${escapeHTML(row.evaluation)}</td>
<td>
  <button
    type="button"
    class="record-edit-grade-button"
    data-student-id="${escapeHTML(student.id)}"
    data-subject-id="${escapeHTML(row.subject.id)}"
  >Edit Grade</button>
</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `).join("");
}
    const numericGrades = rows
      .map((row) => row.grade)
      .filter((grade) => grade !== null && grade !== undefined && grade !== "")
      .map(Number)
      .filter((grade) => Number.isFinite(grade) && grade >= 0 && grade <= 100);

    const passed = numericGrades.filter((grade) => grade >= 75).length;
    const failed = numericGrades.filter((grade) => grade < 75).length;

    const ungraded = rows.filter(
      (row) => row.grade === null || row.grade === undefined || row.grade === ""
    ).length;

    const average = numericGrades.length
      ? numericGrades.reduce((total, grade) => total + grade, 0) /
        numericGrades.length
      : null;

    evaluationContainer.innerHTML = [
      renderEvaluationStat("Recorded Subjects", String(rows.length)),
      renderEvaluationStat("Graded Subjects", String(numericGrades.length)),
      renderEvaluationStat("Average Grade", average === null ? "N/A" : average.toFixed(2)),
      renderEvaluationStat("Passed Subjects", String(passed)),
      renderEvaluationStat("Failed Subjects", String(failed)),
      renderEvaluationStat("Ungraded Subjects", String(ungraded))
    ].join("");
  } catch (error) {
    console.error("Load individual student grades error:", error);

    gradesContainer.innerHTML =
      `<p>Unable to load student grades: ${escapeHTML(error.message || "Unknown error")}</p>`;

    evaluationContainer.innerHTML =
      "<p>Evaluation summary is unavailable because the student grades could not be loaded.</p>";
  }
}

const recordGradesContent = $("record-grades-content");

recordGradesContent?.addEventListener("click", async (event) => {
  const button = event.target.closest(".record-edit-grade-button");
  if (!button) return;

  if (currentProfile?.role !== "admin" || !currentUser) {
    alert("Administrator access is required to edit grades.");
    return;
  }

  const studentId = button.dataset.studentId;
  const subjectId = button.dataset.subjectId;

  const student = students.find(
    (item) => String(item.id) === String(studentId)
  );

  if (!student) {
    alert("Student record not found. Refresh the class list and try again.");
    return;
  }

  const { data: existingRecord, error: lookupError } =
    await supabaseClient
      .from("student_grades")
      .select("grade")
      .eq("student_id", studentId)
      .eq("subject_id", subjectId)
      .maybeSingle();

  if (lookupError) {
    alert(`Could not retrieve the current grade: ${lookupError.message}`);
    return;
  }

  const currentGrade = existingRecord?.grade;

  const enteredGrade = prompt(
    "Enter the corrected numerical grade (0–100):",
    currentGrade == null ? "" : String(currentGrade)
  );

  if (enteredGrade === null) return;

  const rawGrade = enteredGrade.trim();
  const newGrade = Number(rawGrade);

  if (
    rawGrade === "" ||
    !Number.isFinite(newGrade) ||
    newGrade < 0 ||
    newGrade > 100
  ) {
    alert("Invalid grade. Enter a number from 0 to 100.");
    return;
  }

  const oldGradeText =
    currentGrade == null ? "Not yet graded" : String(currentGrade);

  if (!confirm(
    `Change the grade from ${oldGradeText} to ${newGrade}?\n\n` +
    `New evaluation: ${gradeEvaluation(newGrade)}`
  )) {
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const { data, error } = await supabaseClient
      .from("student_grades")
      .upsert(
        {
          student_id: studentId,
          subject_id: Number(subjectId),
          grade: newGrade,
          updated_by: currentUser.id,
          updated_at: new Date().toISOString()
        },
        { onConflict: "student_id,subject_id" }
      )
      .select("student_id, subject_id, grade");

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error(
        "No grade was saved. Check administrator permissions and database policies."
      );
    }

    alert(
      `Grade saved successfully!\n\n` +
      `New grade: ${newGrade}\n` +
      `Evaluation: ${gradeEvaluation(newGrade)}`
    );

    await loadIndividualStudentGrades(student);
    await loadAdminGrades();
  } catch (error) {
    console.error("Student record grade update error:", error);
    alert(`Unable to save grade: ${error.message || "Unknown error"}`);
  } finally {
    button.disabled = false;
    button.textContent = "Edit Grade";
  }
});

// ==================================================
// ACADEMIC TERMS
// ==================================================

$("create-term-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (currentProfile?.role !== "admin") {
    showMessage($("term-message"), "Administrator access is required.", true);
    return;
  }

  const button = $("create-term-button");
  button.disabled = true;

  showMessage($("term-message"), "Saving academic term...");

  try {
    const termName = $("term-name").value;
    const schoolYear = $("school-year").value.trim();

    if (!termName || !schoolYear) {
      showMessage($("term-message"), "Complete all term fields.", true);
      return;
    }

    const { error } = await supabaseClient
      .from("academic_terms")
      .insert({
        term_name: termName,
        school_year: schoolYear
      });

    if (error) {
      console.error("Save term error:", error);

      showMessage(
        $("term-message"),
        error.code === "23505"
          ? "This term already exists for that school year."
          : error.message,
        true
      );

      return;
    }

    showMessage($("term-message"), "Academic term saved successfully.");

    $("create-term-form").reset();

    await loadTermsAndSubjects();
  } catch (error) {
    console.error("Save term error:", error);

    showMessage(
      $("term-message"),
      `Could not save term: ${error.message}`,
      true
    );
  } finally {
    button.disabled = false;
  }
});

// ==================================================
// SUBJECTS AND AUTOMATIC ENROLLMENT
// ==================================================

$("create-subject-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (currentProfile?.role !== "admin") {
    showMessage($("subject-message"), "Administrator access is required.", true);
    return;
  }

  const button = $("create-subject-button");
  button.disabled = true;

  showMessage($("subject-message"), "Saving subject and enrolling students...");

  try {
    const termId = $("subject-term").value;
    const gradeLevel = $("subject-grade-level").value.trim();
    const subjectName = $("subject-name").value.trim();

    if (!termId || !gradeLevel || !subjectName) {
      showMessage($("subject-message"), "Complete all subject fields.", true);
      return;
    }

    const { data: newSubject, error } = await supabaseClient
      .from("subjects")
      .insert({
        term_id: Number(termId),
        grade_level: gradeLevel,
        subject_name: subjectName
      })
      .select("id, term_id, subject_name, grade_level")
      .single();

    if (error) {
      console.error("Save subject error:", error);

      showMessage(
        $("subject-message"),
        error.code === "23505"
          ? "This subject already exists for that term and grade level."
          : `Could not save subject: ${error.message}`,
        true
      );

      return;
    }

    const { count, error: countError } = await supabaseClient
      .from("student_subjects")
      .select("id", { count: "exact", head: true })
      .eq("subject_id", newSubject.id);

    if (countError) {
      console.error("Enrollment count error:", countError);

      showMessage(
        $("subject-message"),
        `Subject "${newSubject.subject_name}" was saved. ` +
        "Automatic enrollment was processed by the database, " +
        "but the enrollment count could not be retrieved."
      );
    } else {
      showMessage(
        $("subject-message"),
        `Subject "${newSubject.subject_name}" saved successfully. ` +
        `${count ?? 0} student(s) enrolled in Grade ${newSubject.grade_level}.`
      );
    }

    $("subject-name").value = "";

    await loadTermsAndSubjects();
    await loadStudents();
    await loadAdminGrades();
  } catch (error) {
    console.error("Subject enrollment error:", error);

    showMessage(
      $("subject-message"),
      `An error occurred: ${error.message}`,
      true
    );
  } finally {
    button.disabled = false;
  }
});

async function loadTermsAndSubjects() {
  if (currentProfile?.role !== "admin") return;

  const { data: termData, error: termError } = await supabaseClient
    .from("academic_terms")
    .select("id, term_name, school_year")
    .order("school_year", { ascending: false })
    .order("term_name");

  if (termError) {
    console.error("Load terms error:", termError);

    showMessage(
      $("term-message"),
      `Could not load academic terms: ${termError.message}`,
      true
    );

    return;
  }

  terms = termData || [];

  const { data: subjectData, error: subjectError } = await supabaseClient
    .from("subjects")
    .select("id, term_id, subject_name, grade_level")
    .order("grade_level")
    .order("subject_name");

  if (subjectError) {
    console.error("Load subjects error:", subjectError);

    showMessage(
      $("subject-message"),
      `Could not load subjects: ${subjectError.message}`,
      true
    );

    return;
  }

  subjects = subjectData || [];

  setOptions(
    $("subject-term"),
    terms,
    "id",
    (term) => `${term.term_name} — ${term.school_year}`,
    "Select academic term"
  );

  renderSubjects();
  updateGradeSubjectOptions();

  await loadGradeEntryData();
}

function renderSubjects() {
  const container = $("subjects-list");
  if (!container) return;

  if (!subjects.length) {
    container.textContent = "No subjects have been added yet.";
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>School Year</th>
            <th>Term</th>
            <th>Grade Level</th>
            <th>Subject</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${subjects.map((subject) => {
            const term = terms.find(
              (item) => String(item.id) === String(subject.term_id)
            );

            return `
              <tr>
                <td>${escapeHTML(term?.school_year || "Unknown")}</td>
                <td>${escapeHTML(term?.term_name || "Unknown")}</td>
                <td>${escapeHTML(subject.grade_level || "")}</td>
                <td>${escapeHTML(subject.subject_name || "")}</td>
                <td>
                  <button
                    type="button"
                    class="delete-subject-button"
                    data-subject-id="${escapeHTML(subject.id)}"
                  >Delete</button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// ==================================================
// DELETE SUBJECT
// ==================================================

const subjectsList = $("subjects-list");

if (subjectsList) {
  subjectsList.addEventListener("click", async (event) => {
    const button = event.target.closest(".delete-subject-button");
    if (!button) return;

    if (currentProfile?.role !== "admin") {
      alert("Only an administrator can delete subjects.");
      return;
    }

    const subjectId = button.dataset.subjectId;

    const subject = subjects.find(
      (item) => String(item.id) === String(subjectId)
    );

    if (!subject) {
      alert("Subject not found. Refresh the list and try again.");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete "${subject.subject_name}"?\n\n` +
      "Its grades and enrollment records will also be deleted. " +
      "This action cannot be undone."
    );

    if (!confirmed) return;

    button.disabled = true;
    button.textContent = "Deleting...";

    try {
      const { error: gradesError } = await supabaseClient
        .from("student_grades")
        .delete()
        .eq("subject_id", subjectId);

      if (gradesError) throw gradesError;

      const { error: enrollmentError } = await supabaseClient
        .from("student_subjects")
        .delete()
        .eq("subject_id", subjectId);

      if (enrollmentError) throw enrollmentError;

      const { error: subjectError } = await supabaseClient
        .from("subjects")
        .delete()
        .eq("id", subjectId);

      if (subjectError) throw subjectError;

      showMessage($("subject-message"), "Subject deleted successfully.");

      await loadTermsAndSubjects();
      await loadStudents();
      await loadAdminGrades();
    } catch (error) {
      console.error("Delete subject error:", error);

      showMessage(
        $("subject-message"),
        `Unable to delete subject: ${error.message || "Unknown database error"}`,
        true
      );

      await loadTermsAndSubjects();
    } finally {
      button.disabled = false;
      button.textContent = "Delete";
    }
  });
}

// ==================================================
// GRADE ENTRY AND AUTOMATIC EVALUATION
// ==================================================

function updateGradeEvaluation() {
  const gradeInput = $("numerical-grade");
  const evaluation = $("grade-evaluation");

  if (!gradeInput || !evaluation) return;

  if (gradeInput.value.trim() === "") {
    evaluation.textContent = "Enter a numerical grade to evaluate.";
    evaluation.classList.remove("evaluation-failed", "evaluation-passed");
    return;
  }

  const result = gradeEvaluation(gradeInput.value);

  evaluation.textContent = result;

  evaluation.classList.toggle(
    "evaluation-failed",
    result === "Failed"
  );

  evaluation.classList.toggle(
    "evaluation-passed",
    result !== "Failed" &&
    result !== "Invalid grade" &&
    result !== "Not yet graded"
  );
}

$("numerical-grade").addEventListener("input", updateGradeEvaluation);

function updateGradeSubjectOptions() {
  const termId = $("grade-term")?.value ?? "";
  const gradeLevel = $("grade-level-filter")?.value ?? "";

  const filteredSubjects = subjects.filter((subject) => {
    const termMatches =
      !termId || String(subject.term_id) === String(termId);

    const gradeMatches =
      !gradeLevel ||
      normalizeGradeLevel(subject.grade_level) ===
      normalizeGradeLevel(gradeLevel);

    return termMatches && gradeMatches;
  });

  setOptions(
    $("grade-subject"),
    filteredSubjects,
    "id",
    (subject) => subject.subject_name,
    "Select subject"
  );
}

function updateGradeStudentOptions() {
  const gradeLevel = $("grade-level-filter")?.value ?? "";

  const filteredStudents = students.filter((student) => {
    if (!gradeLevel) return true;

    return (
      normalizeGradeLevel(student.grade_level) ===
      normalizeGradeLevel(gradeLevel)
    );
  });

  setOptions(
    $("grade-student"),
    filteredStudents,
    "id",
    (student) =>
      `${student.student_id || "No ID"} — ` +
      `${student.last_name}, ${student.first_name}` +
      (student.grade_level
        ? ` (Grade ${String(student.grade_level).replace(/^grade\s*/i, "")})`
        : ""),
    filteredStudents.length
      ? "Select student"
      : "No students found for this grade level"
  );

  if (gradeLevel && filteredStudents.length === 0) {
    console.warn("No students matched the selected grade level.", {
      selectedGradeLevel: gradeLevel,
      loadedStudents: students.map((student) => ({
        student_id: student.student_id,
        grade_level: student.grade_level
      }))
    });
  }
}

$("grade-term").addEventListener("change", updateGradeSubjectOptions);

$("grade-level-filter").addEventListener("change", () => {
  updateGradeSubjectOptions();
  updateGradeStudentOptions();
});

$("grade-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (currentProfile?.role !== "admin") {
    showMessage($("grade-message"), "Administrator access is required.", true);
    return;
  }

  const button = $("save-grade-button");
  button.disabled = true;

  showMessage($("grade-message"), "Saving grade...");

  try {
    const termId = $("grade-term").value;
    const subjectId = $("grade-subject").value;
    const studentId = $("grade-student").value;
    const rawGrade = $("numerical-grade").value.trim();
    const grade = Number(rawGrade);

    if (
      !termId ||
      !subjectId ||
      !studentId ||
      rawGrade === "" ||
      !Number.isFinite(grade) ||
      grade < 0 ||
      grade > 100
    ) {
      showMessage(
        $("grade-message"),
        "Select the term, grade level, subject, and student, then enter a grade from 0 to 100.",
        true
      );
      return;
    }

    const subject = subjects.find(
      (item) => String(item.id) === String(subjectId)
    );

    const student = students.find(
      (item) => String(item.id) === String(studentId)
    );

    if (
      !subject ||
      !student ||
      String(subject.term_id) !== String(termId) ||
      normalizeGradeLevel(subject.grade_level) !==
      normalizeGradeLevel(student.grade_level)
    ) {
      showMessage(
        $("grade-message"),
        "The selected term, subject, and student do not match.",
        true
      );
      return;
    }

    const { data: enrollment, error: enrollmentError } =
      await supabaseClient
        .from("student_subjects")
        .select("id")
        .eq("student_id", studentId)
        .eq("subject_id", subjectId)
        .maybeSingle();

    if (enrollmentError) {
      console.error("Enrollment verification error:", enrollmentError);

      showMessage(
        $("grade-message"),
        "Could not verify student enrollment. Check the student_subjects table and its RLS policies.",
        true
      );

      return;
    }

    if (!enrollment) {
      showMessage(
        $("grade-message"),
        "This student is not enrolled in the selected subject. Check the automatic enrollment setup.",
        true
      );

      return;
    }

    const { error } = await supabaseClient
      .from("student_grades")
      .upsert(
        {
          student_id: studentId,
          subject_id: Number(subjectId),
          grade,
          updated_by: currentUser.id,
          updated_at: new Date().toISOString()
        },
        { onConflict: "student_id,subject_id" }
      );

    if (error) {
      console.error("Save grade error:", error);

      showMessage(
        $("grade-message"),
        `Could not save grade: ${error.message}`,
        true
      );

      return;
    }

    showMessage(
      $("grade-message"),
      `Grade saved successfully. Evaluation: ${gradeEvaluation(grade)}.`
    );

    $("numerical-grade").value = "";
    updateGradeEvaluation();

    await loadAdminGrades();
  } catch (error) {
    console.error("Save grade error:", error);

    showMessage(
      $("grade-message"),
      `An error occurred: ${error.message}`,
      true
    );
  } finally {
    button.disabled = false;
  }
});

async function loadGradeEntryData() {
  if (currentProfile?.role !== "admin") return;

  setOptions(
    $("grade-term"),
    terms,
    "id",
    (term) => `${term.term_name} — ${term.school_year}`,
    "Select academic term"
  );

  updateGradeSubjectOptions();
  updateGradeStudentOptions();
}

// ==================================================
// ADMIN: DISPLAY SAVED GRADES
// ==================================================

async function loadAdminGrades() {
  if (currentProfile?.role !== "admin") return;

  const container = $("grades-list");
  if (!container) return;

  container.textContent = "Loading grades...";

  const { data, error } = await supabaseClient
    .from("student_grades")
    .select("id, student_id, subject_id, grade, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Load grades error:", error);
    container.textContent = `Could not load grades: ${error.message}`;
    return;
  }

  grades = data || [];
  renderAdminGrades();
}

function renderAdminGrades() {
  const container = $("grades-list");
  if (!container) return;

  if (!grades.length) {
    container.textContent = "No grades have been recorded yet.";
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Student Name</th>
            <th>Grade Level</th>
            <th>School Year</th>
            <th>Term</th>
            <th>Subject</th>
            <th>Grade</th>
            <th>Evaluation</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${grades.map((item) => {
            const student = students.find(
              (s) => String(s.id) === String(item.student_id)
            );

            const subject = subjects.find(
              (s) => String(s.id) === String(item.subject_id)
            );

            const term = terms.find(
              (t) => String(t.id) === String(subject?.term_id)
            );

            const studentName = student
              ? `${student.first_name || ""} ${student.last_name || ""}`.trim()
              : "Unknown student";

            return `
              <tr>
                <td>${escapeHTML(student?.student_id || "Unknown")}</td>
                <td>${escapeHTML(studentName)}</td>
                <td>${escapeHTML(
                  subject?.grade_level || student?.grade_level || "—"
                )}</td>
                <td>${escapeHTML(term?.school_year || "Unknown")}</td>
                <td>${escapeHTML(term?.term_name || "Unknown")}</td>
                <td>${escapeHTML(subject?.subject_name || "Unknown")}</td>
                <td>${formatGrade(item.grade)}</td>
                <td>${escapeHTML(gradeEvaluation(item.grade))}</td>
                <td>
                  <button
                    type="button"
                    class="edit-grade-button"
                    data-student-id="${escapeHTML(item.student_id)}"
                    data-subject-id="${escapeHTML(item.subject_id)}"
                  >Edit</button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// ==================================================
// EDIT AN EXISTING GRADE
// ==================================================

const gradesList = $("grades-list");

if (gradesList) {
  gradesList.addEventListener("click", async (event) => {
    const button = event.target.closest(".edit-grade-button");
    if (!button) return;

    if (currentProfile?.role !== "admin") {
      alert("Only an administrator can edit grades.");
      return;
    }

    const studentId = button.dataset.studentId;
    const subjectId = button.dataset.subjectId;

    const existingGrade = grades.find(
      (item) =>
        String(item.student_id) === String(studentId) &&
        String(item.subject_id) === String(subjectId)
    );

    if (!existingGrade) {
      alert("Grade record not found. Refresh the grade list and try again.");
      return;
    }

    const enteredGrade = prompt(
      "Enter the corrected numerical grade (0–100):",
      String(existingGrade.grade)
    );

    if (enteredGrade === null) return;

    const rawGrade = enteredGrade.trim();
    const newGrade = Number(rawGrade);

    if (
      rawGrade === "" ||
      !Number.isFinite(newGrade) ||
      newGrade < 0 ||
      newGrade > 100
    ) {
      alert("Invalid grade. Enter a number from 0 to 100.");
      return;
    }

    const confirmed = confirm(
      `Change the grade from ${existingGrade.grade} to ${newGrade}?\n\n` +
      `New evaluation: ${gradeEvaluation(newGrade)}`
    );

    if (!confirmed) return;

    button.disabled = true;
    button.textContent = "Saving...";

    try {
      const { data, error } = await supabaseClient
        .from("student_grades")
        .update({
          grade: newGrade,
          updated_by: currentUser.id,
          updated_at: new Date().toISOString()
        })
        .eq("student_id", studentId)
        .eq("subject_id", subjectId)
        .select("student_id, subject_id, grade");

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "No grade was updated. Check administrator permissions and the grade record."
        );
      }

      showMessage(
        $("grade-message"),
        `Grade updated successfully. Evaluation: ${gradeEvaluation(newGrade)}.`
      );

      await loadAdminGrades();
    } catch (error) {
      console.error("Edit grade error:", error);

      showMessage(
        $("grade-message"),
        `Unable to update grade: ${error.message || "Unknown database error"}`,
        true
      );
    } finally {
      button.disabled = false;
      button.textContent = "Edit";
    }
  });
}

// ==================================================
// STUDENT: DISPLAY OWN ENROLLED SUBJECTS AND GRADES
// ==================================================

async function loadStudentGrades() {
  if (currentProfile?.role !== "student" || !currentUser) return;

  const container = $("student-grades-list");
  if (!container) return;

  container.textContent = "Loading your subjects and grades...";

  try {
    const [
      { data: enrollmentData, error: enrollmentError },
      { data: gradeData, error: gradeError }
    ] = await Promise.all([
      supabaseClient
        .from("student_subjects")
        .select("subject_id")
        .eq("student_id", currentUser.id),

      supabaseClient
        .from("student_grades")
        .select("subject_id, grade, updated_at")
        .eq("student_id", currentUser.id)
    ]);

    if (enrollmentError) {
      console.error("Load enrollments error:", enrollmentError);

      container.textContent =
        `Your enrollment list could not be loaded: ${enrollmentError.message}`;

      return;
    }

    if (gradeError) {
      console.error("Load student grades error:", gradeError);

      container.textContent =
        `Your grades could not be loaded: ${gradeError.message}. ` +
        "Please contact the school administrator to check grade-view permissions.";

      return;
    }

    const studentGrades = gradeData || [];

    const subjectIds = [
      ...new Set([
        ...(enrollmentData || []).map((item) => item.subject_id),
        ...studentGrades.map((item) => item.subject_id)
      ].filter((id) => id !== null && id !== undefined))
    ];

    if (subjectIds.length === 0) {
      container.textContent =
        "You are not enrolled in any subjects and no grades have been posted yet.";

      return;
    }

    const { data: subjectData, error: subjectError } =
      await supabaseClient
        .from("subjects")
        .select("id, term_id, subject_name, grade_level")
        .in("id", subjectIds)
        .order("subject_name");

    if (subjectError) {
      console.error("Load student subjects error:", subjectError);

      container.textContent =
        `Could not load subject details: ${subjectError.message}`;

      return;
    }

    const studentSubjects = subjectData || [];

    const termIds = [
      ...new Set(
        studentSubjects
          .map((item) => item.term_id)
          .filter((id) => id !== null && id !== undefined)
      )
    ];

    let studentTerms = [];

    if (termIds.length > 0) {
      const { data: termData, error: termError } =
        await supabaseClient
          .from("academic_terms")
          .select("id, term_name, school_year")
          .in("id", termIds);

      if (termError) {
        console.error("Load student terms error:", termError);

        container.textContent =
          `Could not load academic term details: ${termError.message}`;

        return;
      }

      studentTerms = termData || [];
    }

  
    const groupedTerms = new Map();

    studentSubjects.forEach((subject) => {
      const term = studentTerms.find(
        (item) => String(item.id) === String(subject.term_id)
      );

      const termKey = term
        ? `${term.school_year || "Unknown"}|${term.term_name || "Unknown"}|${term.id}`
        : `Unknown|Unknown|${subject.term_id ?? "none"}`;

      if (!groupedTerms.has(termKey)) {
        groupedTerms.set(termKey, {
          term,
          subjects: []
        });
      }

      groupedTerms.get(termKey).subjects.push(subject);
    });

    const getTermOrder = (termName) => {
      const name = String(termName || "").toLowerCase();

      if (name.includes("first")) return 1;
      if (name.includes("second")) return 2;
      if (name.includes("third")) return 3;

      return 99;
    };

    const sortedGroups = [...groupedTerms.values()].sort((a, b) => {
      const yearA = String(a.term?.school_year || "");
      const yearB = String(b.term?.school_year || "");

      if (yearA !== yearB) {
        return yearB.localeCompare(yearA);
      }

      return getTermOrder(a.term?.term_name) -
        getTermOrder(b.term?.term_name);
    });

    console.log("Grouped student terms:", sortedGroups);
container.innerHTML = sortedGroups.map((group) => {
      const termName = group.term?.term_name || "Term Not Assigned";
      const schoolYear =
        group.term?.school_year || "School Year Not Assigned";

      const sortedSubjects = [...group.subjects].sort((a, b) =>
        String(a.subject_name || "").localeCompare(
          String(b.subject_name || "")
        )
      );
  // Calculate the general average for this academic term
const gradedValues = sortedSubjects
  .map((subject) => {
    const gradeRecord = studentGrades.find(
      (item) => String(item.subject_id) === String(subject.id)
    );

    const rawGrade = gradeRecord?.grade;

    if (
      rawGrade === null ||
      rawGrade === undefined ||
      String(rawGrade).trim() === ""
    ) {
      return null;
    }

    const numericGrade = Number(rawGrade);

    return Number.isFinite(numericGrade) &&
      numericGrade >= 0 &&
      numericGrade <= 100
      ? numericGrade
      : null;
  })
  .filter((grade) => grade !== null);

const generalAverage =
  gradedValues.length > 0
    ? gradedValues.reduce((total, grade) => total + grade, 0) /
      gradedValues.length
    : null;

// Determine honors classification
let honorsRecognition = "No honors distinction";

if (generalAverage !== null) {
  if (generalAverage >= 98) {
    honorsRecognition = "With Highest Honors";
  } else if (generalAverage >= 95) {
    honorsRecognition = "With High Honors";
  } else if (generalAverage >= 90) {
    honorsRecognition = "With Honors";
  }
}

      return `
        <section class="student-term-card">
          <div class="student-term-header">
            <div>
              <h3>${escapeHTML(termName)}</h3>
              <p>School Year: ${escapeHTML(schoolYear)}</p>
            </div>

            <span class="student-subject-count">
              ${sortedSubjects.length}
              ${sortedSubjects.length === 1 ? "Subject" : "Subjects"}
            </span>
          </div>
          <div class="student-general-average"
               style="margin: 12px 0; padding: 16px; background: #f0f7ff; border-radius: 10px; border-left: 5px solid #2563eb;">

            <div style="font-size: 13px; color: #475569;">
              GENERAL AVERAGE
            </div>

            <div style="font-size: 28px; font-weight: 700; color: #1d4ed8; margin: 4px 0;">
              ${
                generalAverage !== null
                  ? generalAverage.toFixed(2)
                  : "N/A"
              }
            </div>

            <div style="font-weight: 600; color: #334155;">
              ${
                generalAverage !== null
                  ? escapeHTML(honorsRecognition)
                  : "No grades encoded yet"
              }
            </div>

            <div style="font-size: 12px; color: #64748b; margin-top: 5px;">
              Based on ${gradedValues.length}
              graded ${gradedValues.length === 1 ? "subject" : "subjects"}
            </div>

          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Grade</th>
                  <th>Evaluation</th>
                </tr>
              </thead>

              <tbody>
                ${sortedSubjects.map((subject) => {
                  const gradeRecord = studentGrades.find(
                    (item) =>
                      String(item.subject_id) === String(subject.id)
                  );

                  const grade = gradeRecord?.grade ?? null;

                  return `
                    <tr>
                      <td>${escapeHTML(
                        subject.subject_name || "Unnamed subject"
                      )}</td>
                      <td>${formatGrade(grade)}</td>
                      <td>${escapeHTML(gradeEvaluation(grade))}</td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </section>
      `;
    }).join("");

  } catch (error) {
    console.error("Student dashboard error:", error);

    container.textContent =
      `An error occurred while loading your subjects and grades: ${error.message || "Unknown error"}`;
  }
}

// ==================================================
// REFRESH BUTTONS
// ==================================================

$("refresh-subjects-button")?.addEventListener("click", async () => {
  if (currentProfile?.role !== "admin") return;

  await loadTermsAndSubjects();

  showMessage($("subject-message"), "Subjects refreshed.");
});

$("refresh-grades-button")?.addEventListener("click", async () => {
  if (currentProfile?.role !== "admin") return;

  await loadTermsAndSubjects();
  await loadStudents();
  await loadAdminGrades();

  showMessage($("grade-message"), "Grade records refreshed.");
});

// ==================================================
// AUTHENTICATION STATE
// ==================================================

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || !session) {
    showLoggedOut();
  }
});

// Restore the user's session when the page opens.
loadDashboard().catch((error) => {
  console.error("Dashboard initialization error:", error);

  showLoggedOut(
    "Could not load the dashboard. Please sign in again."
  );
});
