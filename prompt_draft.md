# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

An AI-powered, proactive productivity companion ("The Last-Minute Life Saver") built as a React SPA with Vite, designed around the ElevenLabs aesthetic guidelines to fight procrastination.

Working directory: c:/Users/yashd/Desktop/vibe2ship
Integrity mode: benchmark

## Requirements

### R1. AI Coach Chat & Task Breakdown
- Sidebar chat companion with text and voice input/output fallbacks.
- Break down complex commitments into structured subtask checklists.
- Adaptive coaching persona (Tough Love, YC Partner, etc.) matching user mood.

### R2. Focused Workspace & Focus Guard
- Pomodoro timer with absolute timestamp delta logic (`Date.now()`).
- Ambient sound player/mixer.
- Page Visibility API tab tracker ("Focus Guard") that triggers browser alerts/notifications when user shifts tabs.

### R3. AI Smart Scheduler & Eisenhower Matrix
- 2x2 prioritization matrix with AI Auto-Sort action.
- Weekly visual scheduler with auto-scheduling mapping High Focus tasks to peak energy hours.
- Client-side `.ics` file exporter.

### R4. AI Auto-Drafting Desk
- Split-pane editor pre-generating emails/templates for active subtasks to eliminate empty-page friction.

### R5. Settings, Habits, & Backup
- Settings panel for Gemini API Key connection tests, voice testing, and notification permissions.
- JSON Backup & Restore utility to download/upload localStorage data.
- Daily habit logs and streak indicators.

## Acceptance Criteria

### Functionality
- [ ] Active Pomodoro timer runs accurately in background tabs and survives refreshes.
- [ ] Tab blurs trigger standard browser notifications if permission is granted.
- [ ] AI Auto-Schedule places High Focus tasks in energy slots.
- [ ] Settings panel validates Gemini API key connection.
- [ ] JSON backup downloads all user data, and import restores it fully.

### Design
- [ ] Visual style matches ElevenLabs off-white canvas, warm near-black ink, serif headers, and drifting gradient orbs.
- [ ] Reduce Motion setting disables all CSS keyframe animations.
