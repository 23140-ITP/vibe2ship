# Implementation Plan - The Last-Minute Life Saver

An AI-powered, proactive productivity companion built with React + Vite and structured around the ElevenLabs-inspired design system. The app helps users combat procrastination, break down complex commitments, automatically schedule tasks, and track their habits, using the Google Gemini API for agentic intelligence.

## User Review Required

> [!IMPORTANT]
> - **Gemini API Key:** The application runs entirely client-side. The user must provide their own Gemini API Key in the **Settings** panel. This key is saved in `localStorage` and never leaves their browser.
> - **Web Speech API:** The voice features (Speech-to-Text and Text-to-Speech) leverage the browser's native capabilities (Chrome/Edge recommended). Includes text fallback.

## Proposed Changes

### Setup & Infrastructure

#### [NEW] [package.json](file:///c:/Users/yashd/Desktop/vibe2ship/package.json)
- Set up React + Vite project structure.
- Add dependencies: `@google/generative-ai` for Gemini API, `lucide-react` for premium icons.

#### [NEW] [vite.config.js](file:///c:/Users/yashd/Desktop/vibe2ship/vite.config.js)
- Configure Vite server settings for local development.

#### [MODIFY] [index.html](file:///c:/Users/yashd/Desktop/vibe2ship/index.html)
- Inject Google Fonts stylesheet imports for **EB Garamond** (weights 300, 400) and **Inter** (weights 300, 400, 500, 600), and define basic viewport scaling.

#### [NEW] [firebase.json](file:///c:/Users/yashd/Desktop/vibe2ship/firebase.json)
- Define hosting configurations for static site output (`dist` directory redirections) for Google Cloud Firebase Hosting.

#### [NEW] [.firebaserc](file:///c:/Users/yashd/Desktop/vibe2ship/.firebaserc)
- Set up project aliases mapping the deploy build target to the hackathon project ID.

### Design System & Layout

#### [NEW] [src/index.css](file:///c:/Users/yashd/Desktop/vibe2ship/src/index.css)
- Implement the ElevenLabs visual language:
  - **Colors:** Off-white canvas (`#f5f5f5`), warm near-black ink (`#0c0a09` / `#292524`), and pastel gradient orbs (mint, peach, lavender, sky, rose) moving gently in the background.
  - **Typography:** Pair **EB Garamond** (serif display weight 300) and **Inter** (sans-serif body).
  - **Performance Optimization:** Support the browser's `prefers-reduced-motion` media query and add conditional `.reduce-motion` classes to disable CPU/GPU intensive moving blur gradient animations for older systems.

### App Architecture & Components

#### [NEW] [src/App.jsx](file:///c:/Users/yashd/Desktop/vibe2ship/src/App.jsx)
- Root component managing tabs, settings, and shared context (`AppContext`) for tasks, events, habits, and user settings.

#### [NEW] [src/components/Navigation.jsx](file:///c:/Users/yashd/Desktop/vibe2ship/src/components/Navigation.jsx)
- Top navigation bar featuring the editorial wordmark, tab switches, and Settings trigger.

#### [NEW] [src/components/AICoach.jsx](file:///c:/Users/yashd/Desktop/vibe2ship/src/components/AICoach.jsx)
- Core chat companion with Web Speech voice controls, mood selector, and step-by-step checklist breakdown.

#### [NEW] [src/components/AIDraftingDesk.jsx](file:///c:/Users/yashd/Desktop/vibe2ship/src/components/AIDraftingDesk.jsx)
- Side-by-side editing panel displaying pre-generated templates/drafts for the active subtask to eliminate empty-page friction.

#### [NEW] [src/components/EisenhowerMatrix.jsx](file:///c:/Users/yashd/Desktop/vibe2ship/src/components/EisenhowerMatrix.jsx)
- 2x2 prioritization matrix with drag-to-sort or click-to-move quadrants and an AI Auto-Sort action.

#### [NEW] [src/components/FocusedWorkspace.jsx](file:///c:/Users/yashd/Desktop/vibe2ship/src/components/FocusedWorkspace.jsx)
- Focus workspace holding Pomodoro timer state, ambient sound player, and subtask checklist. 
  - **Countdown Accuracy:** Uses absolute timestamp subtraction (`Date.now()`) on every tick to prevent lag/freezing when browsers throttle background tab timers.
  - **Distraction Alerts:** Uses `visibilitychange` (Focus Guard) to nudge users via standard browser Notifications if they switch tabs. Falls back to text warnings if speech playback is blocked by browser autoplay policies.
  - **State Persistence:** Persists active countdown, task ID, and checked off subtasks to `localStorage` against accidental refreshes.

#### [NEW] [src/components/SmartScheduler.jsx](file:///c:/Users/yashd/Desktop/vibe2ship/src/components/SmartScheduler.jsx)
- Weekly visual scheduler with auto-scheduling (mapping High Focus tasks to peak energy hours) and click-to-reassign controls. Supports exporting schedule as `.ics`.

#### [NEW] [src/components/HabitTracker.jsx](file:///c:/Users/yashd/Desktop/vibe2ship/src/components/HabitTracker.jsx)
- Daily habit log with streak indicators and AI-suggested milestones.

#### [NEW] [src/components/Settings.jsx](file:///c:/Users/yashd/Desktop/vibe2ship/src/components/Settings.jsx)
- Modal panel for:
  - Gemini API Key input and "Test Connection" validation.
  - Web Speech voice accent config and "Test Voice" test button.
  - Notification Permissions request and status display.
  - JSON Backup & Restore buttons to import/export all data and prevent localStorage loss.
  - "Reduce Motion" setting to toggle off background floating gradient animations.

#### [NEW] [src/services/gemini.js](file:///c:/Users/yashd/Desktop/vibe2ship/src/services/gemini.js)
- Integration layer for the Gemini API, providing structured prompts for mood-based coaching, auto-scheduling, and matrix sorting.
  - **Self-Healing API Requests:** Implements exponential backoff retry loops for 429 Rate Limit error codes to handle free-tier API quotas.

### Documentation & Submission Setup

#### [NEW] [README.md](file:///c:/Users/yashd/Desktop/vibe2ship/README.md)
- Complete project documentation describing architecture, features, and how to run locally.

#### [NEW] [project_description.md](file:///c:/Users/yashd/Desktop/vibe2ship/project_description.md)
- Pre-filled copy-pasteable markdown document containing the Hackathon Selected Problem Statement, Solution Overview, Key Features, Technologies Used, and Google Technologies Utilized (Gemini API, Firebase Hosting) to easily copy into the required Google Doc submission format.

### Deployment & Distribution
- **Google Cloud Deployment:** The application will be deployed on Google Cloud via **Firebase Hosting**. This provides a fast, static secure environment on Google's CDN with zero-config setup (`firebase init` + `firebase deploy`).

## Verification Plan

### Automated Verification
- Run local development build using `npm run dev` to verify full compilation.
- Verify zero runtime console errors.

### Manual Verification
1. **API Key Setup:** Input key in Settings, verify "Test Connection" succeeds.
2. **AI Task Breakdown:** Add task, verify subtasks and drafts generate dynamically.
3. **Smart Scheduler:** Verify auto-scheduling respects the cognitive energy curve, and exports `.ics` file.
4. **Focused Workspace:** Start focus, verify visibility-change triggers browser notification when tab is blurred.

---

## GSTACK REVIEW REPORT

### Runs / Status / Findings
| Phase | Runs | Status | Findings / Details |
|---|---|---|---|
| CEO Review | 1 | CLEAR | Mode: SCOPE_EXPANSION. Added AI Draft Desk, Adaptive Persona, Focus Guard, Cognitive Energy Scheduling. |
| Architecture | 1 | CLEAR | Separated active ticking timer state to prevent app-wide re-renders. |
| Errors / Rescue| 1 | CLEAR | Speech fallbacks, API connection test, background tab throttled alert fallback. |
| UX Edge Cases | 1 | CLEAR | Form submit button disabled during async requests to prevent duplicate calls. |
| Feasibility | 1 | CLEAR | Replaced complex drag-and-drop scheduler with native click-to-move reassignments. |

### System Diagrams

#### System Architecture
```
+----------------------------------------------------------------------------------------+
|                                    React Client (SPA)                                  |
|                                                                                        |
|  +----------------+  +--------------------------------------------------------------+  |
|  |   Navigation   |  |                         AppContext                           |  |
|  +--------+-------+  |   (Global State: tasks, habits, events, API keys, settings)  |  |
|           |          +--------------------------------------------------------------+  |
|           |                                         |                                  |
|           v                                         v                                  |
|  +----------------+  +------------------+  +------------------+  +------------------+  |
|  |    Settings    |  |     AICoach      |  | FocusedWorkspace |  |  SmartScheduler  |  |
|  +----------------+  | (Voice / speech) |  |  (Local Timer)   |  |   (Calendar)     |  |
|                      +--------+---------+  +--------+---------+  +--------+---------+  |
|                               |                     |                     |            |
|                               v                     v                     v            |
|                      +------------------+  +------------------+  +------------------+  |
|                      |  AIDraftingDesk  |  |   Focus Guard    |  |    ICS Export    |  |
|                      +--------+---------+  +--------+---------+  +------------------+  |
|                               |                     |                                  |
|                               +----------+----------+                                  |
|                                          |                                             |
|                                          v                                             |
|                             +--------------------------+                               |
|                             |      Gemini API          |                               |
|                             |  (Generative AI Service) |                               |
|                             +--------------------------+                               |
+----------------------------------------------------------------------------------------+
```

#### Focus Guard Data Flow
```
  USER ACTION (Blur Tab) ──▶ Focus Guard (visibilitychange) ──▶ Log Event ──▶ Web Notifications API
          │                                                                            │
          ▼                                                                            ▼
  [Active Timer runs]                                                         [Spoken check-in triggers]
```

### Verdict
VERDICT: CLEARED — CEO Review passed with Scope Expansion

NO UNRESOLVED DECISIONS
