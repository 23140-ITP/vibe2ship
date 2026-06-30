# Playwright E2E Test Suite Readiness Report

This document details the configuration, test coverage, and commands to run the end-to-end (E2E) tests for **The Last-Minute Life Saver**.

---

## 1. Test Execution & Configuration

### Prerequisites
1. Ensure dependencies are installed:
   ```bash
   npm install
   ```
2. Playwright targets the local Google Chrome browser configured in `playwright.config.js` at:
   `C:\Program Files\Google\Chrome\Application\chrome.exe`

### Run Commands

- **List all test cases:**
  ```bash
  npx playwright test --list
  ```
  *(If running in PowerShell and script execution is disabled, use: `cmd /c "npx playwright test --list"`)*

- **Run all E2E tests:**
  ```bash
  npx playwright test
  ```

- **Run a specific test tier (e.g., Tier 1):**
  ```bash
  npx playwright test tests/tier1_features.spec.js
  ```

- **Run tests in UI Mode:**
  ```bash
  npx playwright test --ui
  ```

---

## 2. Test Coverage & Tiers

The test suite is structured into four distinct coverage tiers, containing **82 test cases** in total.

| Test Tier | Focus Area | Test File | Test Case Count |
| :--- | :--- | :--- | :--- |
| **Tier 1** | Happy-Path Feature Coverage | `tests/tier1_features.spec.js` | **35 tests** |
| **Tier 2** | Boundary & Corner Cases | `tests/tier2_boundaries.spec.js` | **35 tests** |
| **Tier 3** | Cross-Feature Interaction Combinations | `tests/tier3_combinations.spec.js` | **7 tests** |
| **Tier 4** | Real-World Application Scenarios | `tests/tier4_scenarios.spec.js` | **5 tests** |
| **Total** | **Full Suite** | | **82 tests** |

---

## 3. Feature-to-Tier Mapping Checklist

Here is a checklist of the 7 main features mapped to their verification across the test tiers:

### 1. Settings & Data Management
- [x] **Tier 1:** API connection checks, voice accent saves, notification permissions, backup export, reduce-motion CSS class toggle.
- [x] **Tier 2:** Empty/invalid API key warnings, corrupted JSON import handling, voice accent test audio playback triggers, double toggle cleanup.
- [x] **Tier 3:** JSON backup import populating tasks in Eisenhower Matrix and Habits tracker.
- [x] **Tier 4:** Restoring state from exported backups during data migration workflows.

### 2. AI Coach Sidebar
- [x] **Tier 1:** Chat message sending and automated response, voice input/output state toggles, coach mood/persona selection, subtask checklist breakdown in Matrix.
- [x] **Tier 2:** Empty chat input blocking, very long message limits, fallback to text when mic permissions are denied, 429 rate limit backoff.
- [x] **Tier 3:** AI Coach breakdown adding subtasks to the Matrix; AI Coach answering scheduling questions; AI Coach congratulating user on habit streaks.
- [x] **Tier 4:** AI Coach guiding student triage, night-before sidetracks, and morning routine setup.

### 3. Focused Workspace (Focus Guard)
- [x] **Tier 1:** Custom Pomodoro duration setup, play/pause/reset timer states, ambient sound slider adjustment & muting, tab visibility blur focus guard alerts.
- [x] **Tier 2:** Zero/negative Pomodoro durations, excessively large durations, sound volume slider boundaries, permission checks, timer accuracy verification.
- [x] **Tier 3:** Active Pomodoro timer running while verifying that the Smart Scheduler calendar slot remains booked.
- [x] **Tier 4:** Pomodoro & ambient sound configuration running as a lock-in focus workspace for tight deadlines.

### 4. Eisenhower Matrix
- [x] **Tier 1:** Adding tasks, moving tasks between quadrants, deleting tasks, AI Auto-Sort triggers, subtask completions.
- [x] **Tier 2:** Empty quadrants, duplicate task titles, corrupted localStorage recovery, invalid quadrant indices, task title character limits.
- [x] **Tier 3:** Priority task breakdown and auto-sort interacting with Settings API key validation.
- [x] **Tier 4:** Batch addition and auto-sorting of multi-quadrant student workloads.

### 5. Smart Scheduler
- [x] **Tier 1:** Weekly view render, peak energy slot auto-scheduling, manual slot reassignment, `.ics` calendar exporter.
- [x] **Tier 2:** Scheduling past dates validation, calendar full scheduling, slot overlap conflict reassignments, exporting empty schedule.
- [x] **Tier 3:** Timer tracking validation alongside scheduler persistence.
- [x] **Tier 4:** Weekly scheduler outputting `.ics` exports after priority auto-schedules.

### 6. AI Drafting Desk
- [x] **Tier 1:** Active subtask selection, split-pane template & email draft generation, copy draft actions.
- [x] **Tier 2:** Empty subtask state, offline/failed API error messages, empty draft copying feedback, format preservation on copies.
- [x] **Tier 3:** Generating email templates directly from Matrix task breakdowns.
- [x] **Tier 4:** Copying and using draft content inside night-before deadline sidetracks.

### 7. Habit Tracker
- [x] **Tier 1:** Adding habits, toggling daily completions, streak increment calculation, deleting habits, unchecking completion streak updates.
- [x] **Tier 2:** Empty habit title validation, streak limit boundaries, logging future dates restrictions, empty checklist states, habit name character limits.
- [x] **Tier 3:** Habit streak achievements triggers customized motivational responses from the AI Coach.
- [x] **Tier 4:** Routine morning check-ins updating daily checklists and streaks.
