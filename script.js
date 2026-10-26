:root {
  --navy: #08085b;
  --blue: #17178b;
  --blue-dark: #0b0b60;
  --gold: #f4d900;
  --gold-dark: #d4b900;
  --gold-light: #fffbe0;
  --background: #f4f6fc;
  --white: #ffffff;
  --text: #202544;
  --muted: #68728b;
  --border: #dce2ef;
  --danger: #b42318;
  --success: #18794e;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--background);
  color: var(--text);
  font-family: Arial, Helvetica, sans-serif;
  line-height: 1.6;
}

.site-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 22px max(5%, calc((100% - 1100px) / 2));
  background: var(--navy);
  color: var(--white);
  border-bottom: 4px solid var(--gold);
  box-shadow: 0 4px 16px rgba(8, 8, 91, 0.18);
}

.school-mark {
  display: grid;
  place-items: center;
  flex: 0 0 76px;
  width: 76px;
  height: 76px;
  overflow: hidden;
  border: 2px solid var(--gold);
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(244, 217, 0, 0.12);
}

.school-logo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.school-header-text {
  flex: 1 1 0;
  min-width: 0;
  overflow-wrap: anywhere;
}

.site-header h1 {
  margin: 0;
  color: var(--white);
  font-size: clamp(18px, 3vw, 28px);
  line-height: 1.3;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.site-header p {
  margin: 5px 0 0;
  color: #fff4a3;
  font-size: 14px;
  overflow-wrap: anywhere;
}

.container {
  width: min(100% - 32px, 1000px);
  margin: 36px auto;
  flex: 1;
}

.panel {
  min-width: 0;
  padding: clamp(20px, 4vw, 36px);
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(8, 8, 91, 0.06);
}

.panel h2 {
  margin: 0 0 8px;
  color: var(--navy);
  font-size: 26px;
  font-weight: 800;
}

.panel h3 {
  margin: 26px 0 8px;
  padding-bottom: 5px;
  color: var(--navy);
  font-size: 20px;
  font-weight: 750;
  border-bottom: 2px solid var(--gold);
}

.panel h4 {
  margin: 0 0 8px;
  color: var(--navy);
}

.panel > p {
  color: var(--muted);
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 22px;
}

label {
  margin-top: 5px;
  color: var(--navy);
  font-size: 14px;
  font-weight: 700;
}

input,
select {
  width: 100%;
  min-height: 46px;
  padding: 11px 13px;
  color: var(--text);
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  font: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

input:hover,
select:hover {
  border-color: #a8b3cf;
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(23, 23, 139, 0.12);
}

input::placeholder {
  color: #8992a7;
}

button {
  min-height: 44px;
  margin-top: 12px;
  padding: 10px 16px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: var(--blue);
  color: var(--white);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease,
    border-color 0.15s ease, opacity 0.15s ease;
}

button:hover {
  background: var(--blue-dark);
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

button:focus-visible {
  outline: 3px solid var(--gold);
  outline-offset: 3px;
}

.secondary-button {
  margin-top: 0;
  background: #edf0fb;
  color: var(--navy);
  border: 1px solid #d7def0;
}

.secondary-button:hover {
  background: var(--gold-light);
  color: var(--navy);
  border-color: var(--gold-dark);
}

.dashboard-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 2px solid var(--gold);
}

.dashboard-heading h2 {
  overflow-wrap: anywhere;
}

.dashboard-heading p {
  margin: 4px 0 0;
  color: var(--muted);
}

.admin-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 24px 0;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.admin-tab {
  flex: 1 1 150px;
  margin: 0;
  background: #edf0fb;
  color: var(--navy);
  border: 1px solid #dce2f3;
}

.admin-tab:hover {
  background: var(--gold-light);
  color: var(--navy);
  border-color: var(--gold-dark);
}

.admin-tab.active {
  background: var(--navy);
  color: var(--white);
  border-color: var(--gold);
  box-shadow: inset 0 -3px 0 var(--gold);
}

.admin-panel {
  min-width: 0;
}

.admin-panel > p {
  color: var(--muted);
}

.evaluation-panel {
  margin-top: 12px;
  padding: 18px;
  background: #f3f5fc;
  border: 1px solid var(--border);
  border-left: 5px solid var(--blue);
  border-radius: 9px;
}

.evaluation-panel h4 {
  color: var(--navy);
}

.evaluation-panel p {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.evaluation-panel.evaluation-failed {
  background: #fff1f0;
  border-left-color: var(--danger);
}

.evaluation-panel.evaluation-failed p {
  color: var(--danger);
}

.evaluation-panel.evaluation-passed {
  background: #edf9f1;
  border-left-color: var(--success);
}

.evaluation-panel.evaluation-passed p {
  color: var(--success);
}

.message {
  min-height: 24px;
  margin: 14px 0 0;
  font-size: 14px;
  overflow-wrap: anywhere;
}

.message.error {
  color: var(--danger);
  font-weight: 600;
}

.help-text {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.table-container {
  width: 100%;
  max-width: 100%;
  margin-top: 14px;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--white);
  -webkit-overflow-scrolling: touch;
}

.table-container table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}

.table-container th,
.table-container td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}

.table-container th {
  background: #e9ecf9;
  color: var(--navy);
  font-weight: 800;
  white-space: nowrap;
  border-bottom: 2px solid var(--gold-dark);
}

.table-container tbody tr:nth-child(even) {
  background: #fafbff;
}

.table-container tbody tr:hover {
  background: #fffdf0;
}

.table-container tr:last-child td {
  border-bottom: 0;
}

.table-container td {
  overflow-wrap: anywhere;
}

.table-container > p {
  padding: 12px 14px;
  margin: 0;
  color: var(--muted);
}

.table-container td button {
  display: inline-block;
  width: auto;
}

.delete-subject-button {
  min-height: 36px;
  margin-top: 0;
  padding: 8px 12px;
  background: #b42318;
  color: #ffffff;
  border: 1px solid #b42318;
  border-radius: 5px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.delete-subject-button:hover {
  background: #8f1d14;
  border-color: #8f1d14;
}

.edit-grade-button {
  min-height: 36px;
  margin-top: 0;
  padding: 8px 12px;
  background: var(--blue);
  color: #ffffff;
  border: 1px solid var(--blue);
  border-radius: 5px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.edit-grade-button:hover {
  background: var(--blue-dark);
  border-color: var(--gold-dark);
}

.delete-subject-button:disabled,
.edit-grade-button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.delete-subject-button:focus-visible,
.edit-grade-button:focus-visible {
  outline: 3px solid var(--gold);
  outline-offset: 3px;
}

[hidden] {
  display: none !important;
}

footer {
  margin-top: auto;
  padding: 18px;
  background: var(--navy);
  color: #ffffff;
  text-align: center;
  font-size: 13px;
  border-top: 3px solid var(--gold);
}

footer p {
  margin: 0;
}

/* CLASS LIST AND INDIVIDUAL STUDENT RECORDS */

.class-roster-section {
  margin-top: 34px;
  padding-top: 8px;
  border-top: 3px solid var(--gold);
}

.section-intro p {
  margin-top: 4px;
  color: var(--muted);
}

.roster-filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #f8f9fe;
}

.roster-filters > div {
  min-width: 0;
}

.roster-filters label {
  display: block;
  margin-bottom: 5px;
}

.roster-summary {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 14px 0;
  color: var(--muted);
  font-size: 13px;
}

.roster-summary strong {
  color: var(--navy);
  font-size: 17px;
}

.class-roster-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.student-roster-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.student-roster-card:hover {
  border-color: var(--gold-dark);
  box-shadow: 0 4px 14px rgba(8, 8, 91, 0.07);
}

.student-roster-card .student-card-info {
  min-width: 0;
}

.student-roster-card h4 {
  margin: 0 0 4px;
  color: var(--navy);
  overflow-wrap: anywhere;
}

.student-roster-card p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.student-roster-card button {
  flex: 0 0 auto;
  margin: 0;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 20px;
  color: var(--muted);
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: 9px;
}

.student-record-panel {
  margin-top: 28px;
  padding: clamp(16px, 3vw, 26px);
  border: 1px solid var(--border);
  border-top: 4px solid var(--gold-dark);
  border-radius: 12px;
  background: #fff;
}

.student-record-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.student-record-heading h3 {
  margin-top: 2px;
}

.student-record-heading p {
  color: var(--muted);
  margin: 3px 0;
}

.student-record-heading .eyebrow {
  color: var(--blue);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.09em;
}

.student-record-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.record-tab {
  margin: 0;
  background: #edf0fb;
  color: var(--navy);
  border: 1px solid #dce2f3;
}

.record-tab.active {
  background: var(--navy);
  color: #fff;
  border-color: var(--gold);
  box-shadow: inset 0 -3px 0 var(--gold);
}

.record-panel h4 {
  margin: 10px 0 14px;
}

.record-profile-grid,
.evaluation-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.record-info-item,
.evaluation-stat {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fafbff;
}

.record-info-item span,
.evaluation-stat span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.record-info-item strong,
.evaluation-stat strong {
  display: block;
  margin-top: 4px;
  color: var(--navy);
  overflow-wrap: anywhere;
}

.evaluation-stat strong {
  font-size: 22px;
}

@media (max-width: 700px) {
  .roster-filters {
    grid-template-columns: 1fr;
  }

  .class-roster-list {
    grid-template-columns: 1fr;
  }

  .student-record-heading {
    flex-direction: column;
  }

  .student-record-heading button {
    width: 100%;
  }

  .record-profile-grid,
  .evaluation-summary-grid {
    grid-template-columns: 1fr;
  }

  .student-roster-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .student-roster-card button {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .site-header {
    padding: 16px;
    gap: 12px;
  }

  .school-mark {
    flex: 0 0 54px;
    width: 54px;
    height: 54px;
  }

  .school-header-text {
    flex: 1 1 0;
    min-width: 0;
  }

  .site-header h1 {
    font-size: clamp(16px, 4.5vw, 20px);
  }

  .site-header p {
    font-size: 12px;
  }

  .container {
    width: min(100% - 20px, 1000px);
    margin: 20px auto;
  }

  .panel {
    padding: 20px 16px;
  }

  .panel h2 {
    font-size: 23px;
  }

  .panel h3 {
    font-size: 18px;
  }

  .dashboard-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .dashboard-heading .secondary-button {
    width: 100%;
  }

  .admin-tabs {
    flex-direction: column;
  }

  .admin-tab {
    width: 100%;
  }

  .table-container th,
  .table-container td {
    padding: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
  }
}
