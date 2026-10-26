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

        .record-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 16px 0;
        }

        .record-tabs button {
          padding: 9px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #f8fafc;
          cursor: pointer;
        }

        .record-tabs button.active {
          background: #1d4ed8;
          color: white;
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
        "id, student_id, first_name, last_name, role, is_active, grade_level, section"
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
      "id, student_id, first_name, last_name, role, is_active, grade_level, section"
    )
    .eq("role", "student")
    .order("last_name", { ascending: true });

  if (error) {
    console.error("Load students error:", error);
    const roster = $("class-roster-list");
    const count = $("roster-count");

    if (roster) {
      roster.innerHTML = `<p class="empty-state">Could not load student profiles: ${escapeHTML(error.message)}. Check the profiles table SELECT policy and administrator permissions.</p>`;
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
  console.log(`SNHS Portal: loaded ${students.length} student profile(s).`);
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

  count.textContent =
    `${filteredStudents.length} student${filteredStudents.length === 1 ? "" : "s"}`;

  if (filteredStudents.length === 0) {
    roster.innerHTML =
      '<p class="empty-state">No active students match these filters.</p>';
    return;
  }

  roster.innerHTML = filteredStudents.map((student) => `
    <article class="student-roster-card">
      <div class="student-card-info">
        <h4>${escapeHTML(getStudentFullName(student) || "Unnamed student")}</h4>
        <p>Student ID: ${escapeHTML(student.student_id || "Not assigned")}</p>
        <p>${escapeHTML(student.grade_level || "No grade level")} · ${escapeHTML(student.section || "No section assigned")}</p>
      </div>
      <button type="button"
              data-view-student="${escapeHTML(student.id)}">View Record</button>
    </article>
  `).join("");
}

$("roster-grade-filter")?.addEventListener("change", () => {
  populateRosterFilters();
  renderClassRoster();
});

$("roster-section-filter")?.addEventListener("change", renderClassRoster);
$("roster-search")?.addEventListener("input", renderClassRoster);

$("class-roster-list")?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-view-student]");
  if (!button) return;

  const student = students.find(
    (item) => String(item.id) === String(button.dataset.viewStudent)
  );

  if (!student) {
    alert("Student record not found. Refresh the class list and try again.");
    return;
  }

  await openStudentRecord(student);
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
    renderProfileField("Account Status", student.is_active ? "Active" : "Inactive"),
    renderProfileField("Profile ID", student.id)
  ].join("");

  setActiveRecordTab("profile");

  $("record-grades-content").innerHTML = "<p>Loading student grades...</p>";
  $("record-evaluation-content").innerHTML = "";

  recordPanel.scrollIntoView({ behavior: "smooth", block: "start" });

  await loadIndividualStudentGrades(student);
}

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
    const subjectIds = [...new Set([
      ...(enrollmentData || []).map((item) => item.subject_id),
      ...studentGrades.map((item) => item.subject_id)
    ].filter((id) => id !== null && id !== undefined))];

    if (subjectIds.length === 0) {
      gradesContainer.innerHTML =
        '<p>No subjects or grades are currently recorded for this student.</p>';

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

    const { data: subjectData, error: subjectError } =
      await supabaseClient
        .from("subjects")
        .select("id, term_id, subject_name, grade_level")
        .in("id", subjectIds)
        .order("subject_name");

    if (subjectError) throw subjectError;

    const studentSubjects = subjectData || [];
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
        '<p>Subject details could not be found for this student.</p>';
    } else {
      gradesContainer.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>School Year</th>
              <th>Term</th>
              <th>Grade Level</th>
              <th>Subject</th>
              <th>Grade</th>
              <th>Evaluation</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHTML(row.term?.school_year || "Unknown")}</td>
                <td>${escapeHTML(row.term?.term_name || "Unknown")}</td>
                <td>${escapeHTML(row.subject.grade_level || student.grade_level || "—")}</td>
                <td>${escapeHTML(row.subject.subject_name || "Unnamed subject")}</td>
                <td>${formatGrade(row.grade)}</td>
                <td>${escapeHTML(row.evaluation)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
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
// ORGANIZED SAVED GRADES AND EVALUATION
// Replace the original loadAdminGrades() and
// renderAdminGrades() functions with these functions.
// ==================================================

let savedGradeFilters = {
  schoolYear: "",
  term: "",
  gradeLevel: "",
  section: "",
  search: ""
};

async function loadAdminGrades() {
  if (currentProfile?.role !== "admin") return;

  const container = $("grades-list");
  if (!container) return;

  container.innerHTML = "<p>Loading saved grades...</p>";

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

  const enrichedGrades = grades.map((item) => {
    const student = students.find(
      (s) => String(s.id) === String(item.student_id)
    );

    const subject = subjects.find(
      (s) => String(s.id) === String(item.subject_id)
    );

    const term = terms.find(
      (t) => String(t.id) === String(subject?.term_id)
    );

    return {
      ...item,
      student,
      subject,
      term,
      studentName: student
        ? `${student.first_name || ""} ${student.last_name || ""}`.trim()
        : "Unknown student",
      gradeLevel: student?.grade_level || subject?.grade_level || "Unassigned",
      section: student?.section || "Unassigned",
      schoolYear: term?.school_year || "Unknown school year",
      termName: term?.term_name || "Unknown term",
      subjectName: subject?.subject_name || "Unknown subject"
    };
  });

  const schoolYears = getSortedUnique(
    enrichedGrades
      .map((item) => item.schoolYear)
      .filter((value) => value !== "Unknown school year")
  );

  const termNames = getSortedUnique(
    enrichedGrades
      .map((item) => item.termName)
      .filter((value) => value !== "Unknown term")
  );

  const gradeLevels = getSortedUnique(
    enrichedGrades
      .map((item) => item.gradeLevel)
      .filter((value) => value !== "Unassigned")
  );

  const sections = getSortedUnique(
    enrichedGrades
      .map((item) => item.section)
      .filter((value) => value !== "Unassigned")
  );

  const filters = savedGradeFilters;

  const filtered = enrichedGrades.filter((item) => {
    const schoolYearMatches =
      !filters.schoolYear ||
      item.schoolYear === filters.schoolYear;

    const termMatches =
      !filters.term ||
      item.termName === filters.term;

    const gradeMatches =
      !filters.gradeLevel ||
      normalizeGradeLevel(item.gradeLevel) ===
        normalizeGradeLevel(filters.gradeLevel);

    const sectionMatches =
      !filters.section ||
      item.section.toLowerCase() === filters.section.toLowerCase();

    const searchText = [
      item.student?.student_id,
      item.studentName,
      item.subjectName,
      item.gradeLevel,
      item.section,
      item.schoolYear,
      item.termName
    ].join(" ").toLowerCase();

    const searchMatches =
      !filters.search ||
      searchText.includes(filters.search.toLowerCase());

    return schoolYearMatches &&
      termMatches &&
      gradeMatches &&
      sectionMatches &&
      searchMatches;
  });

  const numericGrades = filtered
    .filter((item) =>
      item.grade !== null &&
      item.grade !== undefined &&
      item.grade !== ""
    )
    .map((item) => Number(item.grade))
    .filter((value) =>
      Number.isFinite(value) && value >= 0 && value <= 100
    );

  const passedCount = numericGrades.filter(
    (value) => value >= 75
  ).length;

  const failedCount = numericGrades.filter(
    (value) => value < 75
  ).length;

  const average = numericGrades.length
    ? numericGrades.reduce((sum, value) => sum + value, 0) /
      numericGrades.length
    : null;

  const uniqueStudents = new Set(
    filtered.map((item) => String(item.student_id))
  ).size;

  const groups = {};

  filtered.forEach((item) => {
    const key = [
      item.gradeLevel,
      item.section,
      item.schoolYear,
      item.termName
    ].join("|||");

    if (!groups[key]) {
      groups[key] = {
        gradeLevel: item.gradeLevel,
        section: item.section,
        schoolYear: item.schoolYear,
        termName: item.termName,
        rows: []
      };
    }

    groups[key].rows.push(item);
  });

  const sortedGroups = Object.values(groups).sort((a, b) =>
    a.gradeLevel.localeCompare(b.gradeLevel, undefined, { numeric: true }) ||
    a.section.localeCompare(b.section, undefined, { numeric: true }) ||
    a.schoolYear.localeCompare(b.schoolYear) ||
    a.termName.localeCompare(b.termName)
  );

  function makeOptions(items, selected, placeholder) {
    return `
      <option value="">${escapeHTML(placeholder)}</option>
      ${items.map((item) => `
        <option
          value="${escapeHTML(item)}"
          ${selected === item ? "selected" : ""}
        >${escapeHTML(item)}</option>
      `).join("")}
    `;
  }

  function summaryCard(label, value) {
    return `
      <div class="saved-grade-summary-card">
        <span>${escapeHTML(label)}</span>
        <strong>${escapeHTML(value)}</strong>
      </div>
    `;
  }

  const groupHTML = sortedGroups.map((group) => {
    const groupNumeric = group.rows
      .filter((item) =>
        item.grade !== null &&
        item.grade !== undefined &&
        item.grade !== ""
      )
      .map((item) => Number(item.grade))
      .filter((value) =>
        Number.isFinite(value) && value >= 0 && value <= 100
      );

    const groupAverage = groupNumeric.length
      ? groupNumeric.reduce((sum, value) => sum + value, 0) /
        groupNumeric.length
      : null;

    const groupPassed = groupNumeric.filter(
      (value) => value >= 75
    ).length;

    const groupFailed = groupNumeric.filter(
      (value) => value < 75
    ).length;

    const groupRows = [...group.rows].sort((a, b) =>
      a.studentName.localeCompare(b.studentName) ||
      a.subjectName.localeCompare(b.subjectName)
    );

    return `
      <details class="saved-grade-group">
        <summary>
          <div class="saved-grade-group-heading">
            <strong>
              ${escapeHTML(group.gradeLevel)} — ${escapeHTML(group.section)}
            </strong>
            <span>
              ${escapeHTML(group.schoolYear)} · ${escapeHTML(group.termName)}
            </span>
            <small>
              ${group.rows.length} record(s) ·
              Average: ${groupAverage === null ? "N/A" : groupAverage.toFixed(2)} ·
              Passed: ${groupPassed} · Failed: ${groupFailed}
            </small>
          </div>
        </summary>

        <div class="saved-grade-group-content">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Subject</th>
                  <th>Grade</th>
                  <th>Evaluation</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                ${groupRows.map((item) => `
                  <tr>
                    <td>${escapeHTML(item.student?.student_id || "Unknown")}</td>
                    <td>${escapeHTML(item.studentName)}</td>
                    <td>${escapeHTML(item.subjectName)}</td>
                    <td>${formatGrade(item.grade)}</td>
                    <td>${escapeHTML(gradeEvaluation(item.grade))}</td>
                    <td>
                      ${item.updated_at
                        ? escapeHTML(new Date(item.updated_at).toLocaleDateString())
                        : "—"}
                    </td>
                    <td>
                      <button
                        type="button"
                        class="edit-grade-button"
                        data-student-id="${escapeHTML(item.student_id)}"
                        data-subject-id="${escapeHTML(item.subject_id)}"
                      >Edit</button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    `;
  }).join("");

  container.innerHTML = `
    <style>
      .saved-grade-summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin: 18px 0;
      }

      .saved-grade-summary-card {
        padding: 16px;
        border: 1px solid #dbe3ee;
        border-radius: 12px;
        background: #fff;
      }

      .saved-grade-summary-card span {
        display: block;
        color: #64748b;
      }

      .saved-grade-summary-card strong {
        display: block;
        margin-top: 8px;
        font-size: 1.5rem;
      }

      .saved-grade-filters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        gap: 10px;
        margin: 16px 0;
      }

      .saved-grade-filters select,
      .saved-grade-filters input {
        box-sizing: border-box;
        width: 100%;
        min-height: 42px;
        padding: 9px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
      }

      .saved-grade-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }

      .saved-grade-toolbar button {
        margin: 3px;
        padding: 9px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        cursor: pointer;
      }

      .saved-grade-group {
        margin: 12px 0;
        border: 1px solid #dbe3ee;
        border-radius: 12px;
        overflow: hidden;
        background: #fff;
      }

      .saved-grade-group summary {
        padding: 16px;
        cursor: pointer;
        background: #f8fafc;
      }

      .saved-grade-group-heading strong,
      .saved-grade-group-heading span,
      .saved-grade-group-heading small {
        display: block;
        margin: 4px 0;
      }

      .saved-grade-group-heading span,
      .saved-grade-group-heading small {
        color: #64748b;
      }

      .saved-grade-group-content {
        padding: 12px;
        overflow-x: auto;
      }

      .saved-grade-group table {
        width: 100%;
        border-collapse: collapse;
      }

      .saved-grade-group th,
      .saved-grade-group td {
        padding: 10px;
        border: 1px solid #e2e8f0;
        text-align: left;
      }

      .saved-grade-group th {
        background: #f8fafc;
      }
    </style>

    <div class="saved-grade-toolbar">
      <div>
        <h3>Saved Grades &amp; Evaluation</h3>
        <p>Filter records and expand a class to view individual grades.</p>
      </div>

      <div>
        <button type="button" id="saved-grades-expand-all">Expand All</button>
        <button type="button" id="saved-grades-collapse-all">Collapse All</button>
      </div>
    </div>

    <div class="saved-grade-summary-grid">
      ${summaryCard("Saved Grade Records", filtered.length)}
      ${summaryCard("Students in Results", uniqueStudents)}
      ${summaryCard("Passing Grades", passedCount)}
      ${summaryCard("Failing Grades", failedCount)}
      ${summaryCard("Overall Average", average === null ? "N/A" : average.toFixed(2))}
    </div>

    <div class="saved-grade-filters">
      <select id="saved-grade-year-filter">
        ${makeOptions(schoolYears, filters.schoolYear, "All school years")}
      </select>

      <select id="saved-grade-term-filter">
        ${makeOptions(termNames, filters.term, "All terms")}
      </select>

      <select id="saved-grade-level-filter">
        ${makeOptions(gradeLevels, filters.gradeLevel, "All grade levels")}
      </select>

      <select id="saved-grade-section-filter">
        ${makeOptions(sections, filters.section, "All sections")}
      </select>

      <input
        id="saved-grade-search"
        type="search"
        value="${escapeHTML(filters.search)}"
        placeholder="Search student or subject"
        aria-label="Search saved grades"
      >
    </div>

    <p>
      Showing <strong>${filtered.length}</strong> of
      <strong>${grades.length}</strong> saved grade record(s).
    </p>

    ${
      filtered.length
        ? groupHTML
        : '<p class="empty-state">No saved grades match the selected filters.</p>'
    }
  `;

  const bindFilter = (id, key) => {
    $(id)?.addEventListener("change", (event) => {
      savedGradeFilters[key] = event.target.value;
      renderAdminGrades();
    });
  };

  bindFilter("saved-grade-year-filter", "schoolYear");
  bindFilter("saved-grade-term-filter", "term");
  bindFilter("saved-grade-level-filter", "gradeLevel");
  bindFilter("saved-grade-section-filter", "section");

  $("saved-grade-search")?.addEventListener("input", (event) => {
    savedGradeFilters.search = event.target.value.trim();
    renderAdminGrades();
  });

  $("saved-grades-expand-all")?.addEventListener("click", () => {
    container.querySelectorAll(".saved-grade-group").forEach((group) => {
      group.open = true;
    });
  });

  $("saved-grades-collapse-all")?.addEventListener("click", () => {
    container.querySelectorAll(".saved-grade-group").forEach((group) => {
      group.open = false;
    });
  });
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

    container.innerHTML = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>School Year</th>
              <th>Term</th>
              <th>Subject</th>
              <th>Grade</th>
              <th>Evaluation</th>
            </tr>
          </thead>

          <tbody>
            ${studentSubjects.map((subject) => {
              const term = studentTerms.find(
                (item) => String(item.id) === String(subject.term_id)
              );

              const gradeRecord = studentGrades.find(
                (item) => String(item.subject_id) === String(subject.id)
              );

              const grade = gradeRecord?.grade ?? null;

              return `
                <tr>
                  <td>${escapeHTML(term?.school_year || "Unknown")}</td>
                  <td>${escapeHTML(term?.term_name || "Unknown")}</td>
                  <td>${escapeHTML(subject.subject_name || "Unnamed subject")}</td>
                  <td>${formatGrade(grade)}</td>
                  <td>${escapeHTML(gradeEvaluation(grade))}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
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
