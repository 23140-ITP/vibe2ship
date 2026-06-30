import { test, expect } from '@playwright/test';

test.describe('Tier 1: Feature Coverage (35 tests)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  // ==========================================
  // 1. Settings & Data Management (5 tests)
  // ==========================================
  test('Settings - API connection check', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('valid_test_key_123');
    await page.locator('[data-testid="btn-test-api"]').click();
    await expect(page.locator('[data-testid="api-status"]')).toHaveText('Connection Successful!');
  });

  test('Settings - Voice settings save', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="select-voice"]').selectOption('uk');
    const val = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('lastMinuteState'));
      return state.settings.voiceAccent;
    });
    expect(val).toBe('uk');
  });

  test('Settings - Notifications permissions update', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="select-notifications"]').selectOption('granted');
    const val = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('lastMinuteState'));
      return state.settings.notificationPermission;
    });
    expect(val).toBe('granted');
  });

  test('Settings - Data export', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="btn-export-backup"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('life_saver_backup.json');
  });

  test('Settings - Reduce Motion toggle', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    const toggle = page.locator('[data-testid="toggle-reduce-motion"]');
    await toggle.check();
    const hasClass = await page.evaluate(() => document.documentElement.classList.contains('reduce-motion'));
    expect(hasClass).toBe(true);
  });

  // ==========================================
  // 2. AI Coach Sidebar (5 tests)
  // ==========================================
  test('AI Coach - Send message', async ({ page }) => {
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('Hello Coach');
    await page.locator('[data-testid="chat-send-btn"]').click();
    const chatMsgs = page.locator('[data-testid="chat-messages"]');
    await expect(chatMsgs).toContainText('You: Hello Coach');
    await expect(chatMsgs).toContainText('Coach: I\'m your AI Coach.');
  });

  test('AI Coach - Voice input toggle', async ({ page }) => {
    const btn = page.locator('[data-testid="btn-voice-input"]');
    await btn.click();
    await expect(btn).toHaveText('Voice Input On');
  });

  test('AI Coach - Voice output toggle', async ({ page }) => {
    const btn = page.locator('[data-testid="btn-voice-output"]');
    await btn.click();
    await expect(btn).toHaveText('Voice Output On');
  });

  test('AI Coach - Mood persona selector', async ({ page }) => {
    const select = page.locator('[data-testid="select-coach-persona"]');
    await select.selectOption('supportive');
    await expect(select).toHaveValue('supportive');
  });

  test('AI Coach - Subtask breakdown', async ({ page }) => {
    // Set API Key
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('test_api_key');
    await page.locator('[data-testid="btn-test-api"]').click();

    // Add Task in Matrix
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Main Task');
    await page.locator('[data-testid="input-task-desc"]').fill('Main Desc');
    await page.locator('[data-testid="btn-add-task"]').click();

    // Click Breakdown
    await page.locator('[data-testid="btn-breakdown-task"]').click();

    // Verify subtasks are generated in matrix
    await expect(page.locator('[data-testid^="subtask-item-"]')).toHaveCount(3);
  });

  // ==========================================
  // 3. Focused Workspace / Focus Guard (5 tests)
  // ==========================================
  test('Focused Workspace - Set Pomodoro duration', async ({ page }) => {
    const input = page.locator('[data-testid="input-pomodoro-duration"]');
    await input.fill('15');
    await input.dispatchEvent('change');
    await expect(page.locator('[data-testid="timer-display"]')).toHaveText('15:00');
  });

  test('Focused Workspace - Play, pause and reset timer', async ({ page }) => {
    const playPauseBtn = page.locator('[data-testid="btn-play-pause"]');
    await playPauseBtn.click();
    await expect(playPauseBtn).toHaveText('Pause');
    await playPauseBtn.click();
    await expect(playPauseBtn).toHaveText('Play');
    await page.locator('[data-testid="btn-reset-timer"]').click();
    await expect(page.locator('[data-testid="timer-display"]')).toHaveText('25:00');
  });

  test('Focused Workspace - Ambient sounds adjust', async ({ page }) => {
    const slider = page.locator('[data-testid="volume-rain"]');
    await slider.fill('75');
    await slider.dispatchEvent('input');
    await expect(slider).toHaveValue('75');
  });

  test('Focused Workspace - Mute ambient sounds', async ({ page }) => {
    const muteBtn = page.locator('[data-testid="btn-mute-rain"]');
    await muteBtn.click();
    await expect(muteBtn).toHaveText('Unmute Rain');
    await expect(page.locator('[data-testid="volume-rain"]')).toHaveValue('0');
  });

  test('Focused Workspace - Visibility focus guard check', async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.locator('[data-testid="visibility-warning"]')).toBeVisible();
  });

  // ==========================================
  // 4. Eisenhower Matrix (5 tests)
  // ==========================================
  test('Eisenhower Matrix - Add task', async ({ page }) => {
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Study physics');
    await page.locator('[data-testid="input-task-desc"]').fill('Chapter 4 electromagnetism');
    await page.locator('[data-testid="select-new-task-quadrant"]').selectOption('Q2');
    await page.locator('[data-testid="btn-add-task"]').click();

    await expect(page.locator('[data-testid="quadrant-q2"]')).toContainText('Study physics');
  });

  test('Eisenhower Matrix - Move task', async ({ page }) => {
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Laundry');
    await page.locator('[data-testid="btn-add-task"]').click();

    const card = page.locator('[data-testid^="task-card-"]');
    await card.locator('[data-testid="select-task-quadrant"]').selectOption('Q4');

    await expect(page.locator('[data-testid="quadrant-q4"]')).toContainText('Laundry');
  });

  test('Eisenhower Matrix - Delete task', async ({ page }) => {
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Garbage');
    await page.locator('[data-testid="btn-add-task"]').click();

    const deleteBtn = page.locator('[data-testid^="btn-delete-task-"]');
    await deleteBtn.click();

    await expect(page.locator('[data-testid="quadrant-q1"]')).toContainText('No tasks in this quadrant');
  });

  test('Eisenhower Matrix - AI Auto-Sort', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('api_key');

    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Urgent exam deadline');
    await page.locator('[data-testid="btn-add-task"]').click();

    await page.locator('[data-testid="btn-auto-sort"]').click();
    await expect(page.locator('[data-testid="quadrant-q1"]')).toContainText('Urgent exam deadline');
  });

  test('Eisenhower Matrix - Complete subtask', async ({ page }) => {
    // Add subtasks
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('api_key');
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Thesis');
    await page.locator('[data-testid="btn-add-task"]').click();
    await page.locator('[data-testid="btn-breakdown-task"]').click();

    const checkbox = page.locator('[data-testid^="checkbox-subtask-"]').first();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  // ==========================================
  // 5. Smart Scheduler (5 tests)
  // ==========================================
  test('Smart Scheduler - Weekly grid slots check', async ({ page }) => {
    await page.locator('[data-testid="tab-scheduler"]').click();
    await expect(page.locator('[data-testid^="calendar-slot-Mon-"]')).toHaveCount(4);
  });

  test('Smart Scheduler - Auto-schedule tasks', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('api_key');

    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Work task');
    await page.locator('[data-testid="btn-add-task"]').click();

    await page.locator('[data-testid="tab-scheduler"]').click();
    await page.locator('[data-testid="btn-auto-schedule"]').click();

    await expect(page.locator('[data-testid^="scheduled-task-"]')).toBeVisible();
  });

  test('Smart Scheduler - Set task energy level', async ({ page }) => {
    await page.locator('[data-testid="tab-scheduler"]').click();
    const select = page.locator('[data-testid="select-energy-level"]');
    await select.selectOption('low');
    await expect(select).toHaveValue('low');
  });

  test('Smart Scheduler - Manual assignment', async ({ page }) => {
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Manual Task');
    await page.locator('[data-testid="btn-add-task"]').click();

    await page.locator('[data-testid="tab-scheduler"]').click();
    const select = page.locator('[data-testid^="select-reassign-Mon-0900"]');
    await select.selectOption({ index: 1 }); // Select the first task

    await expect(page.locator('[data-testid^="scheduled-task-"]')).toHaveText(/Manual Task/);
  });

  test('Smart Scheduler - Export .ics calendar', async ({ page }) => {
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Export Task');
    await page.locator('[data-testid="btn-add-task"]').click();

    await page.locator('[data-testid="tab-scheduler"]').click();
    const select = page.locator('[data-testid^="select-reassign-Mon-0900"]');
    await select.selectOption({ index: 1 });

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="btn-export-ics"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('schedule.ics');
  });

  // ==========================================
  // 6. AI Drafting Desk (5 tests)
  // ==========================================
  test('AI Drafting Desk - Active subtask display', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('api_key');
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Report');
    await page.locator('[data-testid="btn-add-task"]').click();
    await page.locator('[data-testid="btn-breakdown-task"]').click();

    await page.locator('[data-testid="tab-desk"]').click();
    const select = page.locator('[data-testid="draft-subtask-list"]');
    await expect(select.locator('option')).toHaveCount(4); // default option + 3 subtasks
  });

  test('AI Drafting Desk - Open drafting pane', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('api_key');
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Report');
    await page.locator('[data-testid="btn-add-task"]').click();
    await page.locator('[data-testid="btn-breakdown-task"]').click();

    await page.locator('[data-testid="tab-desk"]').click();
    const select = page.locator('[data-testid="draft-subtask-list"]');
    await select.selectOption({ index: 1 });
    await expect(select).not.toHaveValue('');
  });

  test('AI Drafting Desk - Generate email and templates', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('api_key');
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Report');
    await page.locator('[data-testid="btn-add-task"]').click();
    await page.locator('[data-testid="btn-breakdown-task"]').click();

    await page.locator('[data-testid="tab-desk"]').click();
    const select = page.locator('[data-testid="draft-subtask-list"]');
    await select.selectOption({ index: 1 });

    await page.locator('[data-testid="btn-generate-drafts"]').click();
    await expect(page.locator('[data-testid="draft-email-output"]')).not.toHaveValue('');
    await expect(page.locator('[data-testid="draft-template-output"]')).not.toHaveValue('');
  });

  test('AI Drafting Desk - Copy email draft', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('api_key');
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Report');
    await page.locator('[data-testid="btn-add-task"]').click();
    await page.locator('[data-testid="btn-breakdown-task"]').click();

    await page.locator('[data-testid="tab-desk"]').click();
    await page.locator('[data-testid="draft-subtask-list"]').selectOption({ index: 1 });
    await page.locator('[data-testid="btn-generate-drafts"]').click();

    await page.locator('[data-testid="btn-copy-email"]').click();
    await expect(page.locator('[data-testid="copy-feedback"]')).toHaveText('Draft copied to clipboard!');
  });

  test('AI Drafting Desk - Copy template draft', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('api_key');
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Report');
    await page.locator('[data-testid="btn-add-task"]').click();
    await page.locator('[data-testid="btn-breakdown-task"]').click();

    await page.locator('[data-testid="tab-desk"]').click();
    await page.locator('[data-testid="draft-subtask-list"]').selectOption({ index: 1 });
    await page.locator('[data-testid="btn-generate-drafts"]').click();

    await page.locator('[data-testid="btn-copy-template"]').click();
    await expect(page.locator('[data-testid="copy-feedback"]')).toHaveText('Draft copied to clipboard!');
  });

  // ==========================================
  // 7. Habit Tracker (5 tests)
  // ==========================================
  test('Habit Tracker - Add habit', async ({ page }) => {
    await page.locator('[data-testid="tab-habits"]').click();
    await page.locator('[data-testid="input-habit-title"]').fill('Drink water');
    await page.locator('[data-testid="btn-add-habit"]').click();

    await expect(page.locator('[data-testid^="habit-item-"]')).toContainText('Drink water');
  });

  test('Habit Tracker - Toggle habit daily check-in', async ({ page }) => {
    await page.locator('[data-testid="tab-habits"]').click();
    await page.locator('[data-testid="input-habit-title"]').fill('Read 10 pages');
    await page.locator('[data-testid="btn-add-habit"]').click();

    const checkbox = page.locator('[data-testid^="checkbox-habit-"]').first();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test('Habit Tracker - Habit streak increments', async ({ page }) => {
    await page.locator('[data-testid="tab-habits"]').click();
    await page.locator('[data-testid="input-habit-title"]').fill('Exercise');
    await page.locator('[data-testid="btn-add-habit"]').click();

    const checkbox = page.locator('[data-testid^="checkbox-habit-"]').first();
    await checkbox.check();

    const streak = page.locator('[data-testid^="habit-streak-"]').first();
    await expect(streak).toHaveText('1 days');
  });

  test('Habit Tracker - Delete habit', async ({ page }) => {
    await page.locator('[data-testid="tab-habits"]').click();
    await page.locator('[data-testid="input-habit-title"]').fill('Meditation');
    await page.locator('[data-testid="btn-add-habit"]').click();

    const item = page.locator('[data-testid^="habit-item-"]').first();
    await item.locator('button', { hasText: 'Delete' }).click();

    await expect(page.locator('[data-testid="habits-list"]')).toContainText('No habits tracked yet.');
  });

  test('Habit Tracker - Unchecking updates streak', async ({ page }) => {
    await page.locator('[data-testid="tab-habits"]').click();
    await page.locator('[data-testid="input-habit-title"]').fill('No sugar');
    await page.locator('[data-testid="btn-add-habit"]').click();

    const checkbox = page.locator('[data-testid^="checkbox-habit-"]').first();
    await checkbox.check();
    await checkbox.uncheck();

    const streak = page.locator('[data-testid^="habit-streak-"]').first();
    await expect(streak).toHaveText('0 days');
  });
});
