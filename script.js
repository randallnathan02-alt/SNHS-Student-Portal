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

// GENERAL HELPERS

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

function setOptions(element, items, valueKey, labelFunction, placeholder) {
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

  if ([...element.options].some((option) => option.value === previousValue)) {
    element.value = previousValue;
  }
}

function gradeEvaluation(grade) {
  const value = Number(grade);

  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return "Enter a grade from 0 to 100.";
  }

  if (value >= 90) return "Outstanding";
  if (value >= 85) return "Very Satisfactory";
  if (value >= 80) return "Satisfactory";
  if (value >= 75) return "Fairly Satisfactory";

  return "Failed";
}

function formatGrade(grade) {
  return Number(grade).toFixed(2);
}

function showLoggedOut(message = "") {
  if (loginSection) loginSection.hidden = false;
  if (dashboardSection) dashboardSection.hidden = true;

  if ($("admin-section")) $("admin-section").hidden = true;
  if ($("student-section")) $("student-section").hidden = true;

  currentUser = null;
  currentProfile = null;

  showMessage(loginMessage, message, Boolean(message));
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

// LOGIN AND DASHBOARD

async function loadDashboard() {
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    showLoggedOut();
    return;
  }

  currentUser = sessionData.session.user;

  const { data: profile, error: profileError } = await supabaseClient
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

  $("welcome-heading").textContent = `Welcome, ${profile.first_name}`;

  $("account-role").textContent =
    profile.role === "admin" ? "Administrator" : "Student";

  $("admin-section").hidden = profile.role !== "admin";
  $("student-section").hidden = profile.role !== "student";

  if (profile.role === "student") {
    $("student-details").textContent =
      `Student ID: ${profile.student_id || "Not assigned"} | ` +
      `Name: ${profile.first_name} ${profile.last_name}` +
      (profile.grade_level ? ` | Grade Level: ${profile.grade_level}` : "");

    await loadStudentGrades();
  } else {
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
    showMessage(loginMessage, "Connection error. Please try again.", true);
  } finally {
    button.disabled = false;
  }
});

$("logout-button").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showLoggedOut("You have signed out.");
});

// CREATE STUDENT ACCOUNT

createStudentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = $("create-student-button");
  button.disabled = true;
  showMessage(createMessage, "Creating student account...");

  try {
    const { data: sessionData, error: sessionError } =
      await supabaseClient.auth.getSession();

    const accessToken = sessionData.session?.access_token;

    if (
      sessionError ||
      !accessToken ||
      currentProfile?.role !== "admin"
    ) {
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
    showMessage(createMessage, "Connection error. Please try again.", true);
  } finally {
    button.disabled = false;
  }
});

// ADMIN TABS

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
      await loadGradeEntryData();
      await loadAdminGrades();
    }
  });
});

// LOAD ADMIN DATA

async function loadAdminData() {
  if (currentProfile?.role !== "admin") return;

  await loadStudents();

  if (!$("admin-panel-subjects")?.hidden) {
    await loadTermsAndSubjects();
  }

  if (!$("admin-panel-grades")?.hidden) {
    await loadGradeEntryData();
    await loadAdminGrades();
  }
}

// LOAD STUDENTS
// Corrected to normalize grade-level values and refresh the dropdown.

async function loadStudents() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, student_id, first_name, last_name, grade_level, section")
    .eq("role", "student")
    .eq("is_active", true)
    .order("last_name");

  if (error) {
    console.error("Load students error:", error);

    showMessage(
      createMessage,
      `Could not load students: ${error.message}`,
      true
    );

    students = [];
    updateGradeStudentOptions();
    return;
  }

  students = data || [];

  updateGradeStudentOptions();

  console.info(`Loaded ${students.length} active student profile(s).`);
}

// ACADEMIC TERMS

$("create-term-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (currentProfile?.role !== "admin") return;

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
  } finally {
    button.disabled = false;
  }
});

// SUBJECTS

$("create-subject-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (currentProfile?.role !== "admin") return;

  const button = $("create-subject-button");
  button.disabled = true;
  showMessage($("subject-message"), "Saving subject...");

  try {
    const termId = $("subject-term").value;
    const gradeLevel = $("subject-grade-level").value.trim();
    const subjectName = $("subject-name").value.trim();

    if (!termId || !gradeLevel || !subjectName) {
      showMessage($("subject-message"), "Complete all subject fields.", true);
      return;
    }

    const { error } = await supabaseClient
      .from("subjects")
      .insert({
        term_id: Number(termId),
        grade_level: gradeLevel,
        subject_name: subjectName
      });

    if (error) {
      console.error("Save subject error:", error);

      showMessage(
        $("subject-message"),
        error.code === "23505"
          ? "This subject already exists for that term and grade level."
          : error.message,
        true
      );
      return;
    }

    showMessage($("subject-message"), "Subject saved successfully.");
    $("subject-name").value = "";

    await loadTermsAndSubjects();
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
    showMessage($("term-message"), "Could not load academic terms.", true);
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
    showMessage($("subject-message"), "Could not load subjects.", true);
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
          </tr>
        </thead>
        <tbody>
          ${subjects.map((subject) => {
            const term = terms.find(
              (item) => item.id === subject.term_id
            );

            return `
              <tr>
                <td>${escapeHTML(term?.school_year || "Unknown")}</td>
                <td>${escapeHTML(term?.term_name || "Unknown")}</td>
                <td>${escapeHTML(subject.grade_level)}</td>
                <td>${escapeHTML(subject.subject_name)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// GRADE ENTRY AND AUTOMATIC EVALUATION

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

  evaluation.classList.toggle("evaluation-failed", result === "Failed");

  evaluation.classList.toggle(
    "evaluation-passed",
    result !== "Failed" && !result.startsWith("Enter a grade")
  );
}

$("numerical-grade").addEventListener("input", updateGradeEvaluation);

function updateGradeSubjectOptions() {
  const termId = $("grade-term").value;
  const gradeLevel = $("grade-level-filter").value;

  const filteredSubjects = subjects.filter((subject) =>
    (!termId || String(subject.term_id) === termId) &&
    (!gradeLevel ||
      normalizeGradeLevel(subject.grade_level) ===
      normalizeGradeLevel(gradeLevel))
  );

  setOptions(
    $("grade-subject"),
    filteredSubjects,
    "id",
    (subject) => subject.subject_name,
    "Select subject"
  );
}

// NORMALIZE GRADE LEVEL
// For example, "Grade 7", "grade 7", and "7" are treated as equivalent.

function normalizeGradeLevel(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^grade\s*/, "")
    .replace(/\s+/g, "");
}

// CORRECTED STUDENT DROPDOWN

function updateGradeStudentOptions() {
  const gradeLevel = $("grade-level-filter")?.value ?? "";

  const filteredStudents = students.filter((student) => {
    if (!gradeLevel) return true;

    return normalizeGradeLevel(student.grade_level) ===
      normalizeGradeLevel(gradeLevel);
  });

  setOptions(
    $("grade-student"),
    filteredStudents,
    "id",
    (student) =>
      `${student.student_id || "No ID"} — ${student.last_name}, ${student.first_name}` +
      (student.grade_level
        ? ` (Grade ${String(student.grade_level).replace(/^grade\s*/i, "")})`
        : ""),
    filteredStudents.length
      ? "Select student"
      : "No students found for this grade level"
  );

  if (gradeLevel && filteredStudents.length === 0) {
    console.warn(
      "No students matched the selected grade level.",
      {
        selectedGradeLevel: gradeLevel,
        loadedStudents: students.map((student) => ({
          student_id: student.student_id,
          grade_level: student.grade_level
        }))
      }
    );
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
      (item) => String(item.id) === subjectId
    );

    const student = students.find(
      (item) => item.id === studentId
    );

    if (
      !subject ||
      !student ||
      String(subject.term_id) !== termId ||
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
      showMessage($("grade-message"), error.message, true);
      return;
    }

    showMessage(
      $("grade-message"),
      `Grade saved. Evaluation: ${gradeEvaluation(grade)}.`
    );

    $("numerical-grade").value = "";
    updateGradeEvaluation();

    await loadAdminGrades();
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

// DISPLAY SAVED GRADES FOR ADMINISTRATORS

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
    container.textContent =
      "Could not load grades. Check database permissions.";
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
          </tr>
        </thead>
        <tbody>
          ${grades.map((item) => {
            const student = students.find((s) => s.id === item.student_id);
            const subject = subjects.find((s) => s.id === item.subject_id);
            const term = terms.find((t) => t.id === subject?.term_id);

            return `
              <tr>
                <td>${escapeHTML(student?.student_id || "Unknown")}</td>
                <td>${escapeHTML(
                  student
                    ? `${student.first_name} ${student.last_name}`
                    : "Unknown student"
                )}</td>
                <td>${escapeHTML(
                  subject?.grade_level || student?.grade_level || "—"
                )}</td>
                <td>${escapeHTML(term?.school_year || "Unknown")}</td>
                <td>${escapeHTML(term?.term_name || "Unknown")}</td>
                <td>${escapeHTML(subject?.subject_name || "Unknown")}</td>
                <td>${formatGrade(item.grade)}</td>
                <td>${escapeHTML(gradeEvaluation(item.grade))}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// STUDENT VIEW: OWN GRADES ONLY

async function loadStudentGrades() {
  if (currentProfile?.role !== "student") return;

  const container = $("student-grades-list");
  if (!container) return;

  container.textContent = "Loading your grades...";

  const { data: gradeData, error: gradeError } = await supabaseClient
    .from("student_grades")
    .select("id, subject_id, grade, updated_at")
    .eq("student_id", currentUser.id)
    .order("updated_at", { ascending: false });

  if (gradeError) {
    console.error("Load student grades error:", gradeError);

    container.textContent =
      "Your grades could not be loaded. Please contact the school administrator.";
    return;
  }

  if (!gradeData || gradeData.length === 0) {
    container.textContent = "No grades have been recorded yet.";
    return;
  }

  const subjectIds = [...new Set(gradeData.map((item) => item.subject_id))];

  const { data: subjectData, error: subjectError } = await supabaseClient
    .from("subjects")
    .select("id, term_id, subject_name, grade_level")
    .in("id", subjectIds);

  if (subjectError) {
    console.error("Load student subjects error:", subjectError);
    container.textContent = "Could not load subject details.";
    return;
  }

  const studentSubjects = subjectData || [];
  const termIds = [...new Set(studentSubjects.map((item) => item.term_id))];

  let studentTerms = [];

  if (termIds.length) {
    const { data: termData, error: termError } = await supabaseClient
      .from("academic_terms")
      .select("id, term_name, school_year")
      .in("id", termIds);

    if (termError) {
      console.error("Load student terms error:", termError);
      container.textContent = "Could not load academic term details.";
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
          ${gradeData.map((item) => {
            const subject = studentSubjects.find(
              (s) => s.id === item.subject_id
            );

            const term = studentTerms.find(
              (t) => t.id === subject?.term_id
            );

            return `
              <tr>
                <td>${escapeHTML(term?.school_year || "Unknown")}</td>
                <td>${escapeHTML(term?.term_name || "Unknown")}</td>
                <td>${escapeHTML(subject?.subject_name || "Unknown")}</td>
                <td>${formatGrade(item.grade)}</td>
                <td>${escapeHTML(gradeEvaluation(item.grade))}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// REFRESH BUTTONS

$("refresh-subjects-button")?.addEventListener("click", async () => {
  await loadTermsAndSubjects();
  showMessage($("subject-message"), "Subjects refreshed.");
});

$("refresh-grades-button")?.addEventListener("click", async () => {
  await loadAdminData();
  await loadAdminGrades();
});

// AUTHENTICATION STATE

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || !session) {
    showLoggedOut();
  }
});

// RESTORE SESSION

loadDashboard();
