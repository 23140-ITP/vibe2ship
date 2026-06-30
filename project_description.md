# Google Doc Submission Template — Copy & Paste

This document is formatted and ready to be copied directly into your Google Doc submission for the Vibe2Ship Hackathon.

---

# 🍅 The Last-Minute Life Saver — Submission Description

## 1. Selected Problem Statement
**Problem Statement 1 — The Last-Minute Life Saver**
*Helping students, professionals, and entrepreneurs overcome procrastination and execute tasks proactively before deadlines slip.*

---

## 2. Solution Overview
The Last-Minute Life Saver is a full-stack, AI-powered productivity workspace that transitions traditional passive notifications into an active, conversational coaching partner. 

The application utilizes **Google Cloud Run** to host an Express + React container, and connects passwordlessly to **Google Cloud Vertex AI** (Gemini models) via Service Account IAM default credentials. 

Instead of requiring users to input API keys, the backend automatically obtains secure tokens from the GCP Metadata Server to authenticate LLM requests. The interface uses a premium, calming editorial design system inspired by the ElevenLabs design system to help users focus in high-pressure states.

---

## 3. Key Features

### 🧠 Agentic AI Coach
- Equipped with **Gemini Function Calling (Tool Use)**. The AI Coach can directly inspect, create, delete, and schedule tasks on the user's workspace through chat.
- Supports voice-enabled input (Speech Recognition) and output (Speech Synthesis) for hands-free coaching.
- 4 adaptive coaching personas (Tough Love, YC Partner, Zen Master, Hype Coach) dynamically adjust their messaging based on the user's focus state.

### 🍅 Focused Workspace & Focus Guard
- Pomodoro timer driven by `Date.now()` absolute time subtraction to prevent background tab browser throttling.
- Natively synthesized multi-channel audio mixer (Rain, Forest, White Noise, Lo-Fi) built using the **Web Audio API**.
- **Proactive AI Nudges:** The Page Visibility API tracks tab blurs. When the user leaves the tab during a focus block, the client calls the backend to generate a context-aware warning (e.g. *"Get back to building slides!"*) matching their coach's persona, speaking it aloud.

### 📊 Prioritization Matrix & Smart Scheduler
- 2x2 Eisenhower matrix supporting fluid click-to-move card assignments and **AI Auto-Sort** task categorization.
- Smart Weekly Scheduler that automatically maps High Focus tasks directly to the user's peak daily energy slots (e.g. 9-11 AM, 2-4 PM).
- Client-side `.ics` exporter to sync tasks with Google Calendar/Apple Calendar.

### ✉️ AI Auto-Drafting Desk
- Pre-generates professional email updates and template status notes for any selected subtask to eliminate the "blank page" startup friction.

### 📈 Habits & Portability
- Daily habit log, streak calculation, and data backup (JSON export/import).

---

## 4. Google Technologies Utilized

| Technology | Purpose & Integration |
|---|---|
| **Google Cloud Vertex AI** | Powers the AI Coach chat agent, function calling loop, task breakdown generator, Eisenhower categorization, and status note auto-drafting. |
| **Google Cloud IAM (ADC)** | Links the Cloud Run service account default credentials to authorize Vertex AI endpoints passwordlessly, keeping API keys hidden from client-side code. |
| **Google Cloud Run** | Hosts the containerized Node/Express backend and static Vite assets, deploying them globally on Google Cloud's serverless container infrastructure. |
| **Google Fonts** | Imports and renders `EB Garamond` and `Inter` typefaces to fulfill visual styling requirements. |

---

## 5. Technology Stack
- **Frontend:** React 19, Vite, Vanilla CSS
- **Backend:** Node.js, Express
- **APIs & Protocols:** REST, Vertex AI API, Web Audio API, Web Speech API, Page Visibility API
- **Deployment:** Google Cloud (Cloud Run), Docker
- **Testing:** Playwright E2E Test Suite
