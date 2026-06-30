import { test, expect } from '@playwright/test';

test.describe('Tier 3: Cross-Feature Combinations (7 tests)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Combination 1: Settings Import -> Matrix & Habits', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    
    // Alert listener
    let alertMsg = '';
    page.on('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.dismiss();
    });

    const mockImportData = {
      tasks: [{ id: 'task-imported', title: 'Imported Homework', description: 'Finish physics', quadrant: 'Q1', subtasks: [] }],
      events: [],
      habits: [{ id: 'habit-imported', title: 'Floss daily', streak: 4, logs: [] }],
      settings: { geminiApiKey: 'api_key', voiceAccent: 'us', notificationPermission: 'default', reduceMotion: false }
    };

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="input-import-backup"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(mockImportData))
    });

    await page.waitForTimeout(500);
    expect(alertMsg).toBe('Backup imported successfully!');

    // Check Matrix
    await page.locator('[data-testid="tab-matrix"]').click();
    await expect(page.locator('[data-testid="quadrant-q1"]')).toContainText('Imported Homework');

    // Check Habits
    await page.locator('[data-testid="tab-habits"]').click();
    await expect(page.locator('[data-testid^="habit-item-"]')).toContainText('Floss daily');
  });

  test('Combination 2: AI Coach Breakdown -> Eisenhower Matrix', async ({ page }) => {
    // Set API Key
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('api_key');

    // Add Task
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Science Project');
    await page.locator('[data-testid="input-task-desc"]').fill('Build volcano');
    await page.locator('[data-testid="btn-add-task"]').click();

    // Trigger AI Coach Breakdown
    await page.locator('[data-testid="btn-breakdown-task"]').click();

    // Verify subtasks added in Matrix
    await expect(page.locator('[data-testid^="subtask-item-"]')).toHaveCount(3);
  });

  test('Combination 3: Eisenhower Matrix -> AI Drafting Desk', async ({ page }) => {
    // Set API Key
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('api_key');

    // Add Task and Breakdown in Matrix
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Tax Report');
    await page.locator('[data-testid="btn-add-task"]').click();
    await page.locator('[data-testid="btn-breakdown-task"]').click();

    // Go to Drafting Desk
    await page.locator('[data-testid="tab-desk"]').click();
    await page.locator('[data-testid="draft-subtask-list"]').selectOption({ index: 1 });
    await page.locator('[data-testid="btn-generate-drafts"]').click();

    // Verify output shows task and subtask text
    const emailVal = await page.locator('[data-testid="draft-email-output"]').inputValue();
    expect(emailVal).toContain('Tax Report');
    expect(emailVal).toContain('Setup outline');
  });

  test('Combination 4: Focused Workspace -> Smart Scheduler', async ({ page }) => {
    // Add Task and assign to Monday 9:00 AM slot
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Focused Study');
    await page.locator('[data-testid="btn-add-task"]').click();

    await page.locator('[data-testid="tab-scheduler"]').click();
    await page.locator('[data-testid="select-reassign-Mon-0900"]').selectOption({ index: 1 });

    // Go to Focused Workspace and start Pomodoro timer
    await page.locator('[data-testid="tab-focus"]').click();
    await page.locator('[data-testid="btn-play-pause"]').click();

    // Go back to Scheduler and verify task is still scheduled
    await page.locator('[data-testid="tab-scheduler"]').click();
    await expect(page.locator('[data-testid="calendar-slot-Mon-0900"]')).toContainText('Focused Study');
  });

  test('Combination 5: Smart Scheduler -> AI Coach', async ({ page }) => {
    // Setup API Key
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('api_key');

    // Add Task
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Urgent Exam prep');
    await page.locator('[data-testid="btn-add-task"]').click();

    // Go to Scheduler and Auto-schedule
    await page.locator('[data-testid="tab-scheduler"]').click();
    await page.locator('[data-testid="btn-auto-schedule"]').click();

    // Chat with AI Coach about schedule
    await page.locator('[data-testid="chat-input"]').fill('Check my schedule');
    await page.locator('[data-testid="chat-send-btn"]').click();

    // Coach responds to actions
    await expect(page.locator('[data-testid="chat-messages"]')).toContainText('Coach:');
  });

  test('Combination 6: Habit Tracker -> AI Coach', async ({ page }) => {
    // Pre-populate a 5-day habit streak
    await page.evaluate(() => {
      const state = {
        tasks: [],
        events: [],
        habits: [{ id: 'habit-1', title: 'Running', streak: 5, logs: ['2026-06-25', '2026-06-26', '2026-06-27', '2026-06-28', '2026-06-29'] }],
        settings: { geminiApiKey: '', voiceAccent: 'us', notificationPermission: 'default', reduceMotion: false }
      };
      localStorage.setItem('lastMinuteState', JSON.stringify(state));
    });
    await page.reload();

    // Send chat about streak
    await page.locator('[data-testid="chat-input"]').fill('I completed my streak!');
    await page.locator('[data-testid="chat-send-btn"]').click();

    // Coach should respond with congratulations message containing the 5 days streak info
    await expect(page.locator('[data-testid="chat-messages"]')).toContainText('Amazing! You have a streak of 5 days!');
  });

  test('Combination 7: Settings API Key -> AI Coach / Matrix / Drafting Desk', async ({ page }) => {
    // 1. Initially empty API Key
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Key Task');
    await page.locator('[data-testid="btn-add-task"]').click();
    
    // Trigger breakdown (should warn in Coach chat)
    await page.locator('[data-testid="btn-breakdown-task"]').click();
    await expect(page.locator('[data-testid="chat-messages"]')).toContainText('API Error: Please set your Gemini API Key');

    // 2. Add API Key in Settings
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('new_api_key');
    await page.locator('[data-testid="btn-test-api"]').click();

    // 3. Retry breakdown
    await page.locator('[data-testid="btn-breakdown-task"]').click();
    // Check that breakdown succeeded (adds 3 subtasks)
    await expect(page.locator('[data-testid^="subtask-item-"]')).toHaveCount(3);
  });
});
