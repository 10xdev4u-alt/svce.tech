import { test, expect } from '@playwright/test';

test.describe('home page', () => {
  test('renders hero and core sections', async ({ page }) => {
    await page.goto('/');
    // Home has two h1s (hero + events section) — assert the first is visible.
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText('Events', { exact: true }).first()).toBeVisible();
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});

test.describe('theme', () => {
  test('defaults to light and toggles to dark', async ({ page }) => {
    await page.goto('/');
    // Light by default (no stored preference).
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(
      false
    );
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(true);
    // Toggle back to light.
    await page.getByRole('button', { name: 'Switch to light theme' }).click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(false);
  });
});

test.describe('mobile nav', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger opens sheet and navigates', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const sheet = page.locator('#mobile-nav');
    await expect(sheet).toBeVisible();
    await sheet.getByRole('link', { name: 'Clubs' }).click();
    await page.waitForURL('**/clubs');
    await expect(page).toHaveURL(/\/clubs$/);
  });

  test('sheet closes on outside click', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await page.locator('body').click({ position: { x: 180, y: 700 }, force: true });
    await expect(page.locator('#mobile-nav')).toBeHidden();
  });
});

test.describe('search palette', () => {
  test('opens with ⌘K and shows results', async ({ page }) => {
    await page.goto('/');
    // Wait for hydration: the search button exists only after React mounts.
    await expect(page.getByRole('button', { name: /search/i }).first()).toBeVisible();
    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder(/search/i);
    await expect(input).toBeVisible();
    await input.fill('hackathon');
    // At least one result renders in the palette dialog.
    await expect(page.locator('[role="dialog"] a, [role="dialog"] button').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).toBeHidden();
  });
});

test.describe('page routes', () => {
  const routes = ['/clubs', '/opportunities', '/resources'];

  for (const route of routes) {
    test(`${route} renders without errors`, async ({ page }) => {
      await page.goto(route);
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.waitForLoadState('networkidle');
      expect(errors).toEqual([]);
      expect(await page.locator('h1').count()).toBeGreaterThan(0);
    });
  }
});

test.describe('subscription feeds', () => {
  test('events.ics serves a valid iCalendar file', async ({ request }) => {
    const res = await request.get('/events.ics');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/calendar');
    const body = await res.text();
    expect(body).toContain('BEGIN:VCALENDAR');
    expect(body).toContain('BEGIN:VEVENT');
    expect(body).toMatch(/DTSTART:\d{8}T\d{6}/);
  });

  test('feed.xml serves valid RSS', async ({ request }) => {
    const res = await request.get('/feed.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/rss+xml');
    const body = await res.text();
    expect(body).toContain('<?xml version="1.0"');
    expect(body).toContain('<rss version="2.0"');
    expect(body).toContain('<item>');
  });

  test('subscribe links are visible on the events section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Calendar feed' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'RSS' })).toBeVisible();
  });
});
