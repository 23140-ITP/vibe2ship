# The Last-Minute Life Saver

An AI-powered, proactive productivity companion designed to combat procrastination and help users execute commitments before deadlines slip. 

🚀 **Live Production URL:** [vibe2ship-660662083426.us-central1.run.app](https://vibe2ship-660662083426.us-central1.run.app/)  
📂 **Source Code:** [github.com/23140-ITP/vibe2ship](https://github.com/23140-ITP/vibe2ship)

---

## 💡 Overview & Problem Statement
Traditional task managers are passive; they send reminders that are easily swiped away, creating a false sense of productivity while users continue to procrastinate. **The Last-Minute Life Saver** flips this paradigm by acting as an active **Productivity Partner**. 

Dump your raw, unstructured thoughts, and the system immediately parses, schedules, and prioritizes them. During focus blocks, the app actively monitors your attention, using a voice-enabled AI Coach to keep you accountable and nudge you back when you drift away.

---

## 🎨 Design Philosophy — "A Steady Hand in the Storm"
Designed to provide a calming, authoritative interface for users in high-pressure, close-to-deadline states:
- **ElevenLabs-Inspired Aesthetic:** Minimalist off-white canvas (`#f5f5f5`), deep warm ink (`#0c0a09`), and subtle hairline borders (`1px solid var(--color-hairline)`).
- **Typography:** `EB Garamond` (editorial display serif) paired with `Inter` (high-readability interface sans-serif).
- **Micro-Interactions:** Subtle scale-down clicks (`scale(0.97)`), responsive nav indicators, and drifting background atmospheric gradient orbs (lavender, peach, mint, rose) that move gently to create depth.
- **Accessibility:** Respects user system media queries (`prefers-reduced-motion`) and offers a dedicated setting toggle to freeze all animations instantly.

---

## 🧠 System Architecture & Data Flow

```
                                  +---------------------------------------+
                                  |         Google Cloud Platform         |
                                  |                                       |
                                  |  +---------------------------------+  |
                                  |  |        Google Cloud Run         |  |
                                  |  |        (Express Server)         |  |
                                  |  +----------------+----------------+  |
                                  |                   |                   |
                                  |                   v                   |
                                  |  +----------------+----------------+  |
                                  |  |    Google Cloud Vertex AI       |  |
                                  |  |   (Gemini 1.5/2.5/2.0 Flash)    |  |
                                  |  +---------------------------------+  |
                                  +-------------------+-------------------+
                                                      |
                                        REST APIs     |
                                     (JSON / HTTPS)   v
+-----------------------------------------------------------------------------------------+
|                                    React Client (SPA)                                   |
|                                                                                         |
|  +----------------------+    +-------------------------------------------------------+  |
|  |     Navigation       |    |                      AppContext                       |  |
|  +----------+-----------+    |      (tasks, habits, pomodoro, settings, chatHistory) |  |
|             |                +--------------------------+----------------------------+  |
|             v                                           |                               |
|  +----------+-----------+                               v                               |
|  |    Settings Modal    |    +--------------------------+----------------------------+  |
|  | (Model Selector,     |    |   +------------------------------------------------+  |  |
|  | Backup/Restore,      |◀───|   |                     Views                      |  |  |
|  | Voice controls)      |    |   |  - Focus Workspace (Timer + Ambient Mixer)     |  |  |
|  +----------------------+    |   |  - Eisenhower Matrix (Drag & drop priority)    |  |  |
|                              |   |  - Smart Weekly Scheduler (Peak energy slots)  |  |  |
|                              |   |  - Habit Tracker (Streaks & statistics)        |  |  |
|                              |   |  - AI Coach Chat (Voice input/output)          |  |  |
|                              |   |  - AI Drafting Desk (Blank page rescue pane)   |  |  |
|                              |   +------------------------------------------------+  |  |
|                              +-------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

---

## ⚙️ Core Modules & Features

### 1. 🧠 AI Companion & Agentic Tool Loop
- Chat with 4 adaptive coaching personas:
  - **Tough Love:** Direct, blunt, excuses-challenging coach.
  - **YC Partner:** High-signal startup-style strategist.
  - **Zen Master:** Mindful, calm, focus-rebalancing mentor.
  - **Hype Coach:** High-energy motivational cheerleader.
- **Agentic Function Calling:** Uses Gemini's native tool execution (`tools` and `function_declarations`). The AI Coach can directly inspect, create, delete, or break down tasks and habits on your screen via conversation.
- **Voice Controls:** Fully voice-enabled input (Speech Recognition) and output (Speech Synthesis) for eyes-free coaching.

### 2. 🍅 Focused Workspace & Focus Guard
- **Accurate Timer:** Countdown clock driven by absolute timestamp subtraction (`Date.now()`), surviving background tab throttling and reloads.
- **Ambient Mixer:** Multi-channel audio mixer (Rain, Forest, White Noise, Lo-Fi) synthesized natively via the **Web Audio API**.
- **Proactive AI Nudges:** The Visibility API tracks tab blurs. When you switch tabs, a background request to the AI Coach API generates a custom warning based on the active task and persona (e.g. *"Get back to building slides!"*) and speaks it to the user.

### 3. 📊 Eisenhower Priority Matrix
- 2x2 urgent/important priority grid with drag-and-drop or click-to-move card assignments.
- **AI Auto-Sort:** Submits tasks to the backend to categorize them automatically based on cognitive importance.

### 4. 📅 Smart Scheduler & Calendar Export
- Weekly view calendar grid.
- **Auto-Scheduling:** Maps High Focus tasks directly into your peak daily energy slots (e.g. 9-11 AM, 2-4 PM) to optimize performance.
- Client-side `.ics` file builder to export the schedule to Google Calendar or Apple Calendar.

### 5. ✉️ AI Auto-Drafting Desk
- Pre-generates professional email updates and template status notes for any selected subtask to eliminate initial writing friction.

### 6. 📈 Habits & Data Portability
- Daily habit completion log, automatic streak calculation, and statistics tracker.
- Full local data portability (JSON backup export & import).

---

## ☁️ Google Cloud Infrastructure & Security
The application is deployed as a secure, full-stack Express + React Vite container on **Google Cloud Run**:
- **Passwordless Authentication:** The backend Node/Express server checks the **GCP Metadata Server** for an access token when deployed on Cloud Run. It uses Google's Application Default Credentials (ADC) to authorize requests with the **Vertex AI API**, removing the need to store or expose API keys.
- **Vite Containerization:** The `Dockerfile` compiles the Vite static front-end assets directly inside the build container using a secure, multi-stage layout, serving them statically alongside proxy API routes.

---

## 📦 Local Installation & Setup

### Prerequisites
- Node.js v18 or v20
- A Google Gemini API Key (for local testing without GCP permissions)

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/23140-ITP/vibe2ship.git
   cd vibe2ship
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set your local developer environment key:
   ```bash
   # Windows (CMD)
   set GEMINI_API_KEY=your_key_here
   # Linux/macOS
   export GEMINI_API_KEY=your_key_here
   ```
4. Start the local server:
   ```bash
   npm start
   ```
   Open [http://localhost:8080](http://localhost:8080) to run the full-stack app.

---

## 🧪 E2E Test Suite
Verified using **Playwright** to test critical workflows, tab tracking, and API fallbacks:
```bash
# Install test browsers
npx playwright install
# Run test suite
npm test
```
All tests compiled and passing successfully.
