# Agentic Depth Upgrade: Gemini Function Calling

This plan details the implementation of a full-fledged agentic loop within **The Last-Minute Life Saver** AI Coach. By moving beyond simple text generation to **Gemini Function Calling (Tool Use)**, the AI Coach transitions from a passive chat window into an active agent capable of inspecting, modifying, and managing the user's workspace in real-time.

This upgrade directly targets the **Agentic Depth (20%)** and **Usage of Google Technologies (15%)** criteria in the Vibe2Ship evaluation matrix.

## User Review Required

> [!IMPORTANT]
> - **Client-side execution:** All tools are resolved inside the user's browser, updating the React Context (`AppContext`) state.
> - **API Compatibility:** Requires a valid Gemini API key (supplied by the user in Settings). The mock fallback handler will remain active for users testing the app without an API key.

## Open Questions

None. The state operations mapped to tools are standard CRUD operations exposed by our existing `AppContext`.

## Proposed Changes

### AI Coach & State Integration

---

#### [MODIFY] [AICoach.jsx](file:///C:/Users/yashd/Desktop/vibe2ship/src/components/AICoach.jsx)
- Define a list of Google Gemini tool declarations (`tools` array with `function_declarations` object) containing:
  - `create_task(title, description, quadrant, energy)`
  - `delete_task(taskId)`
  - `get_current_tasks()`
  - `add_habit(name)`
  - `toggle_habit(habitId)`
  - `get_habits_and_streaks()`
  - `breakdown_task(taskId, subtasks)`
- Rewrite the `callGemini` service function to include the `tools` definition in the request payload.
- Update the message loop to parse `functionCall` objects in Gemini's response:
  - Dispatch corresponding actions to `addTask`, `deleteTask`, `updateTask`, `addHabit`, and `toggleHabit` from `useApp()`.
  - Perform a second API request to Gemini sending back the execution result (`functionResponse` in `parts`) to generate a conversational confirmation.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify there are no compilation errors with the new tool-calling logic.

### Manual Verification
1. **Create Task via Chat:** Tell the AI Coach: *"Add a task to buy groceries to my Q2 quadrant"*. Verify the task appears immediately on the Eisenhower Matrix.
2. **List Tasks via Chat:** Ask the AI Coach: *"What are my current tasks?"*. Verify the AI lists all active tasks.
3. **Manage Habits via Chat:** Tell the AI Coach: *"Add a daily habit to read books"*. Verify the habit appears in the Habit Tracker.
4. **Delete/Modify Task via Chat:** Tell the AI Coach: *"Delete the grocery task"*. Verify the task is removed.
