import { test, expect } from '@playwright/test';
import { CSSOMSnapshotCapture } from 'playwright-cssom-snapshot';

test.describe('CSSOM Snapshot Tests', () => {
  test('capture entire page snapshot', async ({ page }) => {
    await page.goto('https://example.com');
    
    const snapshot = await CSSOMSnapshotCapture.captureSnapshot(page);
    
    // Playwright's built-in snapshot testing
    expect(snapshot).toMatchSnapshot('example-com-full-page.json');
  });

  test('capture specific element snapshot', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Capture only the h1 element and its children
    const snapshot = await CSSOMSnapshotCapture.captureSnapshot(page, {
      selector: 'h1',
      includeChildren: true
    });
    
    expect(snapshot).toMatchSnapshot('example-com-h1.json');
  });

  test('capture multiple elements', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Capture all paragraph elements
    const snapshot = await CSSOMSnapshotCapture.captureSnapshot(page, {
      selector: 'p',
      includeChildren: false
    });
    
    expect(snapshot).toMatchSnapshot('example-com-paragraphs.json');
  });

  test('detect style changes', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Capture initial snapshot
    const beforeSnapshot = await CSSOMSnapshotCapture.captureSnapshot(page, {
      selector: 'h1'
    });
    
    // Modify styles via JavaScript
    await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      if (h1) {
        h1.style.color = 'red';
        h1.style.fontSize = '48px';
      }
    });
    
    // Capture snapshot after style change
    const afterSnapshot = await CSSOMSnapshotCapture.captureSnapshot(page, {
      selector: 'h1'
    });
    
    // Both snapshots should be captured, but they should be different
    expect(beforeSnapshot.styles).toBeDefined();
    expect(afterSnapshot.styles).toBeDefined();
    expect(beforeSnapshot).not.toEqual(afterSnapshot);
    
    // Check that the color actually changed
    const h1Selector = Object.keys(afterSnapshot.styles)[0];
    expect(afterSnapshot.styles[h1Selector].computedStyle.color).toBe('rgb(255, 0, 0)');
  });
});