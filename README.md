# The Last-Minute Life Saver

An AI-powered, proactive productivity companion designed to fight procrastination and help users take immediate action on deadlines.

🚀 **Live App URL:** [vibe2ship-921de.web.app](https://vibe2ship-921de.web.app/)

---

## 🎨 Design Philosophy — "A Steady Hand in the Storm"
Designed around ElevenLabs editorial design guidelines to provide visual authority and clean structure for users in high-pressure states:
- **Palette:** Sleek off-white (`#f5f5f5`) canvas, deep warm ink (`#0c0a09`), and micro-gradients.
- **Typography:** `EB Garamond` for display headers, `Inter` for functional UI elements.
- **Aesthetic:** Drifting background atmospheric gradient orbs, thin hairline borders, scale-based active button press feedback (`scale(0.97)`), active nav indicators, and responsive card containers.
- **Accessibility:** Fully supports user `reduceMotion` media queries and custom setting toggles.

---

## ⚙️ Key Features

### 1. 🧠 Agentic AI Coach (Powered by Gemini 3.5/2.5 Flash)
- **Agentic Function Calling:** The AI Coach is equipped with real-time tool execution (`tools` & `function_declarations`) enabling it to inspect, create, delete, and schedule tasks, or toggle habits directly on your screen via conversation.
- **Model Selector:** Fully configurable to use the latest **Gemini 2.5 Flash** (latest version), **Gemini 1.5 Flash**, or **Gemini 2.0 Flash**.
- **4 Adaptive Coaching Personas:**
  - **Tough Love:** Brutally honest, direct, zero-excuses push.
  - **YC Partner:** Actionable, high-signal startup strategist advice.
  - **Zen Master:** Mindful, calm, sustainable pacing focus.
  - **Hype Coach:** High-energy motivational companion.
- **Task Breakdown:** Break down complex, overwhelming tasks into structured subtask checklists instantly.
- **Voice Control:** Voice-enabled input/output options (Web Speech API).


### 2. 🍅 Focused Workspace & Focus Guard
- Accurate Pomodoro timer driven by `Date.now()` delta logic (survives tab switches/reloads).
- **Focus Guard:** Utilizes the Page Visibility API to detect tab blurs, triggering native browser notifications to bring you back.
- Built-in multi-channel Web Audio sound mixer (White Noise, Rain, Forest, Lo-Fi).

### 3. 📊 Eisenhower Matrix & Priority Desk
- 2×2 priority grid with fluid drag-and-drop or click-to-move task organization.
- **AI Auto-Sort:** Automatically categorizes tasks using Gemini based on urgency/importance.

### 4. 📅 Smart Scheduler
- Weekly view calendar grid.
- **Auto-Scheduling:** Maps High Focus tasks directly into your peak daily energy slots (e.g. 9-11 AM, 2-4 PM).
- Client-side `.ics` file generation to export your schedule to Google Calendar/Apple Calendar.

### 5. ✉️ AI Auto-Drafting Desk
- Eliminates the blank-page problem. 
- Split-pane editor that pre-generates professional email updates and template status notes for any selected subtask using the Gemini API.

### 6. 📈 Habits & Backup
- Daily habit logs and streak tracking.
- Full local data portability (JSON backup export & import).
- Settings interface with active Gemini API key validation tests.

---

## 🛠️ Technology Stack
- **Framework:** React 18 + Vite (SPA)
- **Styling:** Vanilla CSS
- **AI Services:** Google Gemini API (`v1beta`)
- **Testing:** Playwright E2E suite
- **Deployment:** Google Cloud (Firebase Hosting)

---

## 📦 Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/23140-ITP/vibe2ship.git
   cd vibe2ship
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run developer server:
   ```bash
   npm run dev
   ```

4. Build production static bundle:
   ```bash
   npm run build
   ```
