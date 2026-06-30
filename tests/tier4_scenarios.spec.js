import { test, expect } from '@playwright/test';

test.describe('Tier 4: Real-World Application Scenarios (5 tests)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Scenario 1: Student Triage Scenario', async ({ page }) => {
    // 1. Set API Key
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('gemini_student_key');
    await page.locator('[data-testid="btn-test-api"]').click();

    // 2. Add 5 school tasks
    await page.locator('[data-testid="tab-matrix"]').click();
    const tasks = [
      { title: 'Math homework now', quad: 'Q1' },
      { title: 'Physics lab study', quad: 'Q2' },
      { title: 'History paper plan', quad: 'Q2' },
      { title: 'English meeting call', quad: 'Q3' },
      { title: 'Biology exam deadline', quad: 'Q1' }
    ];

    for (const task of tasks) {
      await page.locator('[data-testid="input-task-title"]').fill(task.title);
      await page.locator('[data-testid="select-new-task-quadrant"]').selectOption(task.quad);
      await page.locator('[data-testid="btn-add-task"]').click();
    }

    // 3. Run AI Auto-Sort
    await page.locator('[data-testid="btn-auto-sort"]').click();

    // Verify tasks sorted into correct quadrants
    await expect(page.locator('[data-testid="quadrant-q1"]')).toContainText('Math homework now');
    await expect(page.locator('[data-testid="quadrant-q1"]')).toContainText('Biology exam deadline');
    await expect(page.locator('[data-testid="quadrant-q2"]')).toContainText('Physics lab study');

    // 4. Auto-schedule tasks
    await page.locator('[data-testid="tab-scheduler"]').click();
    await page.locator('[data-testid="btn-auto-schedule"]').click();

    // 5. Export schedule to .ics
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="btn-export-ics"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('schedule.ics');
  });

  test('Scenario 2: Night Before Deadline Sprint', async ({ page }) => {
    // 1. Setup Pomodoro & Ambient Sound in Focused Workspace
    await page.locator('[data-testid="input-pomodoro-duration"]').fill('25');
    await page.locator('[data-testid="input-pomodoro-duration"]').dispatchEvent('change');
    
    // Play timer
    await page.locator('[data-testid="btn-play-pause"]').click();
    
    // Sound mix
    await page.locator('[data-testid="volume-rain"]').fill('40');
    await page.locator('[data-testid="volume-rain"]').dispatchEvent('input');
    await page.locator('[data-testid="volume-white-noise"]').fill('60');
    await page.locator('[data-testid="volume-white-noise"]').dispatchEvent('input');

    // 2. Set API Key
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="input-api-key"]').fill('urgent_api_key');

    // 3. Add Urgent Q1 Task
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Submit Thesis');
    await page.locator('[data-testid="input-task-desc"]').fill('Final draft due at midnight');
    await page.locator('[data-testid="select-new-task-quadrant"]').selectOption('Q1');
    await page.locator('[data-testid="btn-add-task"]').click();

    // 4. Break down task via AI Coach
    await page.locator('[data-testid="btn-breakdown-task"]').click();

    // 5. Draft request email at Drafting Desk
    await page.locator('[data-testid="tab-desk"]').click();
    await page.locator('[data-testid="draft-subtask-list"]').selectOption({ index: 1 });
    await page.locator('[data-testid="btn-generate-drafts"]').click();

    await page.locator('[data-testid="btn-copy-email"]').click();
    await expect(page.locator('[data-testid="copy-feedback"]')).toHaveText('Draft copied to clipboard!');

    // 6. Complete task subtask in matrix
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid^="checkbox-subtask-"]').first().check();
    await expect(page.locator('[data-testid^="checkbox-subtask-"]').first()).toBeChecked();
  });

  test('Scenario 3: Morning Routine Setup', async ({ page }) => {
    // 1. Add habits in Habit Tracker
    await page.locator('[data-testid="tab-habits"]').click();
    const habits = ['Drink water', 'Stretch', 'Meditation'];
    for (const habit of habits) {
      await page.locator('[data-testid="input-habit-title"]').fill(habit);
      await page.locator('[data-testid="btn-add-habit"]').click();
    }

    // 2. Settings adjustments
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="toggle-reduce-motion"]').check();
    await page.locator('[data-testid="select-voice"]').selectOption('uk');
    await page.locator('[data-testid="btn-test-voice"]').click();
    await expect(page.locator('[data-testid="voice-status"]')).toContainText('Testing voice playback in UK accent...');

    // 3. Morning motivation chat
    await page.locator('[data-testid="chat-input"]').fill('Give me some morning motivation');
    await page.locator('[data-testid="chat-send-btn"]').click();
    await expect(page.locator('[data-testid="chat-messages"]')).toContainText('Coach: I\'m your AI Coach.');

    // 4. Check schedule
    await page.locator('[data-testid="tab-scheduler"]').click();
    await expect(page.locator('[data-testid="calendar-slot-Mon-0900"]')).toBeVisible();
  });

  test('Scenario 4: Data Migration Scenario', async ({ page }) => {
    // 1. Initial State populate
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Migration Task 1');
    await page.locator('[data-testid="btn-add-task"]').click();

    await page.locator('[data-testid="tab-habits"]').click();
    await page.locator('[data-testid="input-habit-title"]').fill('Migration Habit 1');
    await page.locator('[data-testid="btn-add-habit"]').click();

    // 2. Export Backup
    await page.locator('[data-testid="tab-settings"]').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="btn-export-backup"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('life_saver_backup.json');

    // Read the file buffer to import later
    const path = await download.path();
    
    // 3. Clear data
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Verify empty states
    await page.locator('[data-testid="tab-matrix"]').click();
    await expect(page.locator('[data-testid="quadrant-q1"]')).toContainText('No tasks in this quadrant');
    
    await page.locator('[data-testid="tab-habits"]').click();
    await expect(page.locator('[data-testid="habits-list"]')).toContainText('No habits tracked yet.');

    // 4. Import Backup
    await page.locator('[data-testid="tab-settings"]').click();
    
    // Alert dialog listener
    let alertMsg = '';
    page.on('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.dismiss();
    });

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="input-import-backup"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path);

    await page.waitForTimeout(500);
    expect(alertMsg).toBe('Backup imported successfully!');

    // 5. Verify restored state
    await page.locator('[data-testid="tab-matrix"]').click();
    await expect(page.locator('[data-testid="quadrant-q1"]')).toContainText('Migration Task 1');

    await page.locator('[data-testid="tab-habits"]').click();
    await expect(page.locator('[data-testid^="habit-item-"]')).toContainText('Migration Habit 1');
  });

  test('Scenario 5: Focus Mode Guarded Workflow', async ({ page }) => {
    // 1. Notification Permission Set
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="select-notifications"]').selectOption('granted');

    // 2. Start Pomodoro
    await page.locator('[data-testid="tab-focus"]').click();
    await page.locator('[data-testid="btn-play-pause"]').click();

    // 3. Simulate Tab Hiding (Focus Guard Alert)
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    // 4. Check warning notification
    await expect(page.locator('[data-testid="visibility-warning"]')).toBeVisible();

    // 5. Add and Check Habit
    await page.locator('[data-testid="tab-habits"]').click();
    await page.locator('[data-testid="input-habit-title"]').fill('Focus Habit');
    await page.locator('[data-testid="btn-add-habit"]').click();

    const checkbox = page.locator('[data-testid^="checkbox-habit-"]').first();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });
});
