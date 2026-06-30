# Project: The Last-Minute Life Saver

## Architecture
A modular client-side React SPA built with Vite. Centralized state is managed via React Context (`AppContext`). Data is persisted in `localStorage`. Styling uses vanilla CSS targeting the ElevenLabs aesthetic guidelines.

### Component Structure
- `App.jsx` (Root and Context Provider)
- `Navigation.jsx` (Header, menu tabs, Settings trigger)
- `AICoach.jsx` (Sidebar, chat, voice control, task breakdown)
- `FocusedWorkspace.jsx` (Pomodoro, ambient sounds, tab tracker)
- `EisenhowerMatrix.jsx` (2x2 priority matrix, drag-and-sort / click-to-move, AI Auto-Sort)
- `SmartScheduler.jsx` (Weekly view, auto-scheduling to peak hours, `.ics` exporter)
- `AIDraftingDesk.jsx` (Split-pane document/email pre-generator for active subtask)
- `HabitTracker.jsx` (Daily habit checklist, streak calculation)
- `Settings.jsx` (Gemini API Key test, voice accent test, JSON import/export, Reduce Motion toggle)

### CSS Layout
- `src/index.css`: Implementation of ElevenLabs typography (EB Garamond / Inter), color palette, floating background gradient orbs, card shapes, and responsive collapsing. Supporting `.reduce-motion` class.

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Scaffolding & Design System | Scaffold Vite React SPA, setup packages, index.html, index.css layout, navigation, gradient orbs, and reduce motion toggle | None | PLANNED |
| 2 | State Context & Settings | Create AppContext, localStorage persistence, Settings Modal with API test, voice test, JSON backup/restore | M1 | PLANNED |
| 3 | Gemini Service Layer | Implement `src/services/gemini.js` with exponential backoff for 429 rate limits | M2 | PLANNED |
| 4 | AI Coach & Drafting Desk | Chat sidebar, voice input/output, subtask checklist breakdown, split-pane email/template drafting desk | M3 | PLANNED |
| 5 | Focused Workspace & Focus Guard | Pomodoro timer (`Date.now()`), ambient sounds, Visibility API Page tracker triggering browser notifications | M2 | PLANNED |
| 6 | Matrix & Smart Scheduler | 2x2 prioritization matrix, AI Auto-Sort, weekly scheduler, peak energy hour scheduling, `.ics` exporter | M3, M5 | PLANNED |
| 7 | Final E2E Pass & Hardening | Integration and passing 100% of E2E test suite (Tiers 1-4), followed by Tier 5 Adversarial Hardening | M1-M6, TEST_READY.md | PLANNED |

## Interface Contracts

### AppContext State
```json
{
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "quadrant": "Q1" | "Q2" | "Q3" | "Q4",
      "subtasks": [
        { "id": "string", "text": "string", "completed": boolean }
      ],
      "createdAt": "ISOString"
    }
  ],
  "events": [
    {
      "id": "string",
      "taskId": "string",
      "title": "string",
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "energyRequired": "high" | "medium" | "low"
    }
  ],
  "habits": [
    {
      "id": "string",
      "title": "string",
      "streak": number,
      "logs": ["YYYY-MM-DD"]
    }
  ],
  "settings": {
    "geminiApiKey": "string",
    "voiceAccent": "string",
    "notificationPermission": "default" | "granted" | "denied",
    "reduceMotion": boolean
  }
}
```

### Gemini Service API
- `testGeminiConnection(apiKey: string): Promise<boolean>`
- `breakdownTask(apiKey: string, title: string, description: string): Promise<string[]>` (returns list of subtasks)
- `autoSortTasks(apiKey: string, tasks: Task[]): Promise<{[taskId: string]: "Q1"|"Q2"|"Q3"|"Q4"}>`
- `autoScheduleTasks(apiKey: string, tasks: Task[], events: Event[]): Promise<Event[]>` (schedules high-focus tasks to peak energy slots: e.g. 9-11 AM, 2-4 PM)
- `generateDrafts(apiKey: string, taskTitle: string, subtaskText: string): Promise<{email: string, template: string}>`

## Code Layout
- `/src/components/Navigation.jsx`
- `/src/components/AICoach.jsx`
- `/src/components/FocusedWorkspace.jsx`
- `/src/components/EisenhowerMatrix.jsx`
- `/src/components/SmartScheduler.jsx`
- `/src/components/AIDraftingDesk.jsx`
- `/src/components/HabitTracker.jsx`
- `/src/components/Settings.jsx`
- `/src/services/gemini.js`
- `/src/AppContext.jsx`
- `/src/index.css`
- `/src/main.jsx`
- `/src/App.jsx`
- `/package.json`
- `/vite.config.js`
