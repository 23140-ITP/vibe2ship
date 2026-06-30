import { test, expect } from '@playwright/test';

test.describe('Milestone 8: Workspace Upgrade (Proactive Nudges & Forms)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('R1 & R2: Active Task Select & Visibility Nudge & Form Standards', async ({ page }) => {
    // 1. Audit Form Standards on FocusedWorkspace
    await page.locator('[data-testid="tab-focus"]').click();

    // Check active-task-form
    const activeTaskForm = page.locator('form#active-task-form');
    await expect(activeTaskForm).toBeVisible();

    const label = activeTaskForm.locator('label[for="focus-task-select"]');
    await expect(label).toHaveText('Focus Task');

    const select = activeTaskForm.locator('select#focus-task-select');
    await expect(select).toHaveAttribute('name', 'focusTask');

    // Check other form standards on FocusedWorkspace (e.g. custom duration input)
    const durationInput = page.locator('input#pomodoro-duration-input');
    await expect(durationInput).toHaveAttribute('name', 'pomodoroDuration');
    const durationLabel = page.locator('label[for="pomodoro-duration-input"]');
    await expect(durationLabel).toHaveClass(/sr-only/);

    // 2. Add some incomplete tasks to choose from
    await page.locator('[data-testid="tab-matrix"]').click();
    await page.locator('[data-testid="input-task-title"]').fill('Milestone 8 E2E coding');
    await page.locator('[data-testid="btn-add-task"]').click();

    // 3. Select active task in Focus tab
    await page.locator('[data-testid="tab-focus"]').click();
    await select.selectOption({ label: 'Milestone 8 E2E coding' });

    // 4. Start Pomodoro focus session
    await page.locator('[data-testid="btn-play-pause"]').click(); // Play

    // Mock window.speechSynthesis
    await page.evaluate(() => {
      window.speechSynthesisMockCalled = false;
      window.speechSynthesisNudgeText = '';
      Object.defineProperty(window.speechSynthesis, 'cancel', {
        value: function() {},
        writable: true,
        configurable: true
      });
      Object.defineProperty(window.speechSynthesis, 'speak', {
        value: function(utterance) {
          window.speechSynthesisMockCalled = true;
          window.speechSynthesisNudgeText = utterance.text;
        },
        writable: true,
        configurable: true
      });
    });

    // 5. Trigger visibility change to hidden (blur)
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // 6. Check that the custom nudge is shown immediately in visibility-warning
    const warning = page.locator('[data-testid="visibility-warning"]');
    await expect(warning).toBeVisible();
    const warningText = await warning.innerText();
    expect(warningText).toContain('Milestone 8 E2E coding');

    // Verify speech synthesis mock was called with correct text
    const speechCalled = await page.evaluate(() => window.speechSynthesisMockCalled);
    expect(speechCalled).toBe(true);
    const speechText = await page.evaluate(() => window.speechSynthesisNudgeText);
    expect(speechText).toContain('Milestone 8 E2E coding');
  });
});
