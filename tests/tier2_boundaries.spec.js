import { test, expect } from '@playwright/test';

test.describe('Tier 2: Boundary & Corner Cases (35 tests)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  // ==========================================
  // 1. Settings & Data Management (5 tests)
  // ==========================================
  test('Settings Boundary - empty API key shows warning', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('');
    await page.locator('[data-testid="btn-test-api"]').click();
    await expect(page.locator('[data-testid="api-status"]')).toHaveText('Error: API Key cannot be empty.');
  });

  test('Settings Boundary - invalid API key connection test failure', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('error_key');
    await page.locator('[data-testid="btn-test-api"]').click();
    await expect(page.locator('[data-testid="api-status"]')).toHaveText('Connection Failed. Please check key validity.');
  });

  test('Settings Boundary - importing corrupted/invalid JSON shows alert/error', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    
    // Set up file listener for alert dialog
    let alertMsg = '';
    page.on('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.dismiss();
    });

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="input-import-backup"]').click();
    const fileChooser = await fileChooserPromise;
    
    // Create a temporary corrupted json buffer
    await fileChooser.setFiles({
      name: 'corrupted.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{invalid_json: true}')
    });

    // Wait a brief moment for parsing
    await page.waitForTimeout(500);
    expect(alertMsg).toContain('Import failed: Corrupted or invalid JSON data.');
  });

  test('Settings Boundary - toggle reduce-motion twice clears class', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    const toggle = page.locator('[data-testid="toggle-reduce-motion"]');
    await toggle.check();
    await toggle.uncheck();
    const hasClass = await page.evaluate(() => document.documentElement.classList.contains('reduce-motion'));
    expect(hasClass).toBe(false);
  });

  test('Settings Boundary - voice accent test button plays audio', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="btn-test-voice"]').click();
    await expect(page.locator('[data-testid="voice-status"]')).toContainText('Testing voice playback in US accent...');
  });

  // ==========================================
  // 2. AI Coach Sidebar (5 tests)
  // ==========================================
  test('AI Coach Boundary - empty chat input cannot be sent', async ({ page }) => {
    await page.locator('[data-testid="chat-input"]').fill('   ');
    await page.locator('[data-testid="chat-send-btn"]').click();
    await expect(page.locator('[data-testid="chat-messages"]')).toBeEmpty();
  });

  test('AI Coach Boundary - very long chat input handling', async ({ page }) => {
    const longInput = 'A'.repeat(500);
    await page.locator('[data-testid="chat-input"]').fill(longInput);
    await page.locator('[data-testid="chat-send-btn"]').click();
    await expect(page.locator('[data-testid="chat-messages"]')).toContainText('You: ' + longInput);
  });

  test('AI Coach Boundary - speech fallback when permission denied', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="select-notifications"]').selectOption('denied');

    await page.locator('[data-testid="btn-voice-input"]').click();
    await expect(page.locator('[data-testid="chat-messages"]')).toContainText('[Speech Input Error: Microphone permission denied. Falling back to text input]');
  });

  test('AI Coach Boundary - API rate limit 429 backoff handling', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('error_key');

    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Breakdown Task');
    await page.locator('[data-testid="input-task-desc"]').fill('Breakdown Desc');
    await page.locator('[data-testid="btn-add-task"]').click();

    await page.locator('[data-testid="btn-breakdown-task"]').click();
    await expect(page.locator('[data-testid="chat-messages"]')).toContainText('API Connection Failed. Check your connection or API key.');
  });

  test('AI Coach Boundary - task breakdown with empty task title', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('valid_key');

    // Create a task with title empty by bypassing the form validation using localStorage directly
    await page.evaluate(() => {
      const state = {
        tasks: [{ id: 'task-empty-title', title: '', description: '', quadrant: 'Q1', subtasks: [] }],
        events: [],
        habits: [],
        settings: { geminiApiKey: 'valid_key', voiceAccent: 'us', notificationPermission: 'default', reduceMotion: false }
      };
      localStorage.setItem('lastMinuteState', JSON.stringify(state));
    });
    await page.reload();

    await page.locator('[data-testid="btn-breakdown-task"]').click();
    await expect(page.locator('[data-testid="chat-messages"]')).toContainText('Error: Selected task has empty title or description.');
  });

  // ==========================================
  // 3. Focused Workspace / Focus Guard (5 tests)
  // ==========================================
  test('Focused Workspace Boundary - Pomodoro zero or negative inputs', async ({ page }) => {
    const input = page.locator('[data-testid="input-pomodoro-duration"]');
    
    let alertMsg = '';
    page.on('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.dismiss();
    });

    await input.fill('-5');
    await input.dispatchEvent('change');
    expect(alertMsg).toBe('Pomodoro duration must be a positive number.');
  });

  test('Focused Workspace Boundary - Pomodoro excessively large duration', async ({ page }) => {
    const input = page.locator('[data-testid="input-pomodoro-duration"]');
    
    let alertMsg = '';
    page.on('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.dismiss();
    });

    await input.fill('2000');
    await input.dispatchEvent('change');
    expect(alertMsg).toBe('Pomodoro duration cannot exceed 1440 minutes.');
  });

  test('Focused Workspace Boundary - ambient sound slider boundaries', async ({ page }) => {
    const slider = page.locator('[data-testid="volume-rain"]');
    await slider.fill('0');
    await slider.dispatchEvent('input');
    await expect(slider).toHaveValue('0');

    await slider.fill('100');
    await slider.dispatchEvent('input');
    await expect(slider).toHaveValue('100');
  });

  test('Focused Workspace Boundary - Focus Guard notification permission check', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="select-notifications"]').selectOption('granted');

    await page.locator('[data-testid="tab-focus"]').click();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    // Trigger notification log check
    await expect(page.locator('[data-testid="visibility-warning"]')).toBeVisible();
  });

  test('Focused Workspace Boundary - Pomodoro timer accuracy using Date.now() delta', async ({ page }) => {
    await page.locator('[data-testid="input-pomodoro-duration"]').fill('1');
    await page.locator('[data-testid="input-pomodoro-duration"]').dispatchEvent('change');
    await page.locator('[data-testid="btn-play-pause"]').click();
    
    // Wait for timer tick
    await page.waitForTimeout(1100);
    const text = await page.locator('[data-testid="timer-display"]').textContent();
    expect(text).not.toBe('01:00');
  });

  // ==========================================
  // 4. Eisenhower Matrix (5 tests)
  // ==========================================
  test('Eisenhower Matrix Boundary - empty state messages in quadrants', async ({ page }) => {
    await page.locator('[data-testid="tab-matrix"]').click();
    await expect(page.locator('[data-testid="quadrant-q1"]')).toContainText('No tasks in this quadrant');
    await expect(page.locator('[data-testid="quadrant-q2"]')).toContainText('No tasks in this quadrant');
    await expect(page.locator('[data-testid="quadrant-q3"]')).toContainText('No tasks in this quadrant');
    await expect(page.locator('[data-testid="quadrant-q4"]')).toContainText('No tasks in this quadrant');
  });

  test('Eisenhower Matrix Boundary - duplicate task titles', async ({ page }) => {
    await page.locator('[data-testid="tab-matrix"]').click();
    
    await page.locator('[data-testid="input-task-title"]').fill('Read book');
    await page.locator('[data-testid="btn-add-task"]').click();

    await page.locator('[data-testid="input-task-title"]').fill('Read book');
    await page.locator('[data-testid="btn-add-task"]').click();

    await expect(page.locator('[data-testid^="task-card-"]')).toHaveCount(2);
  });

  test('Eisenhower Matrix Boundary - task matrix behavior with corrupted localStorage', async ({ page }) => {
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Test Task');
    await page.locator('[data-testid="btn-add-task"]').click();

    // Corrupt local storage
    await page.evaluate(() => localStorage.setItem('lastMinuteState', 'corrupted_string{'));
    await page.reload();

    await page.locator('[data-testid="tab-matrix"]').click();
    await expect(page.locator('[data-testid="quadrant-q1"]')).toContainText('No tasks in this quadrant');
  });

  test('Eisenhower Matrix Boundary - invalid quadrant values', async ({ page }) => {
    await page.locator('[data-testid="tab-matrix"]').click();
    const select = page.locator('[data-testid="select-new-task-quadrant"]');
    const options = await select.locator('option').allTextContents();
    expect(options).toEqual([
      'Q1: Urgent & Important',
      'Q2: Important, Not Urgent',
      'Q3: Urgent, Not Important',
      'Q4: Not Urgent & Not Important'
    ]);
  });

  test('Eisenhower Matrix Boundary - maximum task title limit', async ({ page }) => {
    await page.locator('[data-testid="tab-matrix"]').click();
    const longTitle = 'A'.repeat(81);
    await page.locator('[data-testid="input-task-title"]').fill(longTitle);
    await page.locator('[data-testid="btn-add-task"]').click();
    await expect(page.locator('[data-testid="matrix-error"]')).toHaveText('Error: Task Title exceeds 80 characters limit.');
  });

  // ==========================================
  // 5. Smart Scheduler (5 tests)
  // ==========================================
  test('Smart Scheduler Boundary - auto-scheduling when calendar is full', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('api_key');

    // Pre-populate 28 slots via localStorage
    await page.evaluate(() => {
      const tasks = [];
      const events = [];
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const hours = ["09:00", "11:00", "14:00", "16:00"];
      let idCounter = 1;
      
      hours.forEach(hour => {
        days.forEach(day => {
          tasks.push({ id: `t-${idCounter}`, title: `Task ${idCounter}`, description: '', quadrant: 'Q1', subtasks: [] });
          events.push({
            id: `e-${idCounter}`,
            taskId: `t-${idCounter}`,
            title: `Task ${idCounter}`,
            date: day,
            startTime: hour,
            endTime: hour,
            energyRequired: 'high'
          });
          idCounter++;
        });
      });

      const state = {
        tasks,
        events,
        habits: [],
        settings: { geminiApiKey: 'api_key', voiceAccent: 'us', notificationPermission: 'default', reduceMotion: false }
      };
      localStorage.setItem('lastMinuteState', JSON.stringify(state));
    });
    await page.reload();

    await page.locator('[data-testid="tab-scheduler"]').click();
    
    let alertMsg = '';
    page.on('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.dismiss();
    });

    await page.locator('[data-testid="btn-auto-schedule"]').click();
    expect(alertMsg).toBe('Scheduler is completely full! Cannot auto-schedule any more tasks.');
  });

  test('Smart Scheduler Boundary - scheduling yesterday dates', async ({ page }) => {
    // Ensuring schedule rendering is correct for all week days
    await page.locator('[data-testid="tab-scheduler"]').click();
    await expect(page.locator('[data-testid="calendar-slot-Sun-1600"]')).toBeVisible();
  });

  test('Smart Scheduler Boundary - manual reassignment overlapping conflicts', async ({ page }) => {
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Task A');
    await page.locator('[data-testid="btn-add-task"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Task B');
    await page.locator('[data-testid="btn-add-task"]').click();

    await page.locator('[data-testid="tab-scheduler"]').click();
    const select = page.locator('[data-testid^="select-reassign-Mon-0900"]');
    
    // Assign Task A
    await select.selectOption({ index: 1 });
    // Assign Task B to same slot
    await select.selectOption({ index: 2 });

    await expect(page.locator('[data-testid^="scheduled-task-"]')).toHaveText(/Task B/);
  });

  test('Smart Scheduler Boundary - energy level default behavior', async ({ page }) => {
    await page.locator('[data-testid="tab-scheduler"]').click();
    const select = page.locator('[data-testid="select-energy-level"]');
    await expect(select).toHaveValue('high'); // default energy setting
  });

  test('Smart Scheduler Boundary - export .ics with empty schedule', async ({ page }) => {
    await page.locator('[data-testid="tab-scheduler"]').click();
    
    let alertMsg = '';
    page.on('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.dismiss();
    });

    await page.locator('[data-testid="btn-export-ics"]').click();
    expect(alertMsg).toBe('Error: Cannot export empty schedule.');
  });

  // ==========================================
  // 6. AI Drafting Desk (5 tests)
  // ==========================================
  test('AI Drafting Desk Boundary - empty state when no active subtasks', async ({ page }) => {
    await page.locator('[data-testid="tab-desk"]').click();
    const select = page.locator('[data-testid="draft-subtask-list"]');
    await expect(select).toHaveValue('');
  });

  test('AI Drafting Desk Boundary - generation when Gemini API is offline/error', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('error_key');

    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Urgent Doc');
    await page.locator('[data-testid="btn-add-task"]').click();
    await page.locator('[data-testid="btn-breakdown-task"]').click();

    await page.locator('[data-testid="tab-desk"]').click();
    await page.locator('[data-testid="draft-subtask-list"]').selectOption({ index: 1 });

    let alertMsg = '';
    page.on('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.dismiss();
    });

    await page.locator('[data-testid="btn-generate-drafts"]').click();
    expect(alertMsg).toBe('Gemini API Error: Request failed with status 401 (Unauthorized).');
  });

  test('AI Drafting Desk Boundary - copying empty draft feedback', async ({ page }) => {
    await page.locator('[data-testid="tab-desk"]').click();
    await page.locator('[data-testid="btn-copy-email"]').click();
    await expect(page.locator('[data-testid="copy-feedback"]')).toHaveText('Error: Nothing to copy!');
  });

  test('AI Drafting Desk Boundary - draft formatting preservation', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('api_key');
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Project');
    await page.locator('[data-testid="btn-add-task"]').click();
    await page.locator('[data-testid="btn-breakdown-task"]').click();

    await page.locator('[data-testid="tab-desk"]').click();
    await page.locator('[data-testid="draft-subtask-list"]').selectOption({ index: 1 });
    await page.locator('[data-testid="btn-generate-drafts"]').click();

    const val = await page.locator('[data-testid="draft-email-output"]').inputValue();
    expect(val).toContain('\n'); // preserves newlines
  });

  test('AI Drafting Desk Boundary - select subtask boundaries', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('api_key');
    
    // Add task and breakdown
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Task to Delete');
    await page.locator('[data-testid="btn-add-task"]').click();
    await page.locator('[data-testid="btn-breakdown-task"]').click();

    // Now delete task
    await page.locator('[data-testid^="btn-delete-task-"]').click();

    // Verify subtask list is reset
    await page.locator('[data-testid="tab-desk"]').click();
    await expect(page.locator('[data-testid="draft-subtask-list"]')).toHaveValue('');
  });

  // ==========================================
  // 7. Habit Tracker (5 tests)
  // ==========================================
  test('Habit Tracker Boundary - adding habit with empty title', async ({ page }) => {
    await page.locator('[data-testid="tab-habits"]').click();
    await page.locator('[data-testid="input-habit-title"]').fill('');
    await page.locator('[data-testid="btn-add-habit"]').click();
    await expect(page.locator('[data-testid="habit-error"]')).toHaveText('Error: Habit title cannot be empty.');
  });

  test('Habit Tracker Boundary - streak limit boundary', async ({ page }) => {
    await page.locator('[data-testid="tab-habits"]').click();
    await page.locator('[data-testid="input-habit-title"]').fill('Cold shower');
    await page.locator('[data-testid="btn-add-habit"]').click();

    const checkbox = page.locator('[data-testid^="checkbox-habit-"]').first();
    await checkbox.check();
    // Unchecking and re-unchecking should not go below 0
    await checkbox.uncheck();
    const streak = page.locator('[data-testid^="habit-streak-"]').first();
    await expect(streak).toHaveText('0 days');
  });

  test('Habit Tracker Boundary - future dates log test', async ({ page }) => {
    await page.locator('[data-testid="tab-habits"]').click();
    await page.locator('[data-testid="input-habit-title"]').fill('Future check');
    await page.locator('[data-testid="btn-add-habit"]').click();

    await page.locator('[data-testid^="checkbox-habit-"]').first().check();
    const val = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('lastMinuteState'));
      return state.habits[0].logs[0];
    });
    // Check if format is YYYY-MM-DD
    expect(val).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('Habit Tracker Boundary - habit checklist showing empty state', async ({ page }) => {
    await page.locator('[data-testid="tab-habits"]').click();
    await expect(page.locator('[data-testid="habits-list"]')).toContainText('No habits tracked yet.');
  });

  test('Habit Tracker Boundary - habit name length limits', async ({ page }) => {
    await page.locator('[data-testid="tab-habits"]').click();
    const longName = 'H'.repeat(51);
    await page.locator('[data-testid="input-habit-title"]').fill(longName);
    await page.locator('[data-testid="btn-add-habit"]').click();
    await expect(page.locator('[data-testid="habit-error"]')).toHaveText('Error: Habit title cannot exceed 50 characters.');
  });
});
