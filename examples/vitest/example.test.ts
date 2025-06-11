import { describe, it, expect } from 'vitest';
import { chromium } from 'playwright';
import { CSSOMSnapshotCapture } from 'playwright-cssom-snapshot';

describe('CSSOM Snapshot with Vitest', () => {
  it('should capture page styles', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.goto('https://example.com');
    
    const snapshot = await CSSOMSnapshotCapture.captureSnapshot(page);
    
    // Use Vitest's snapshot testing
    expect(snapshot).toMatchSnapshot();
    
    await browser.close();
  });

  it('should capture specific element styles', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.goto('https://example.com');
    
    const snapshot = await CSSOMSnapshotCapture.captureSnapshot(page, {
      selector: 'body > div',
      includeChildren: true
    });
    
    expect(snapshot.selector).toBe('body > div');
    expect(Object.keys(snapshot.styles).length).toBeGreaterThan(0);
    expect(snapshot).toMatchSnapshot();
    
    await browser.close();
  });

  it('should detect CSS-in-JS changes', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Create a simple page with CSS-in-JS
    await page.setContent(`
      <html>
        <head>
          <style id="dynamic-styles"></style>
        </head>
        <body>
          <div class="component">Hello World</div>
        </body>
      </html>
    `);
    
    // Initial styles
    await page.evaluate(() => {
      const styleEl = document.getElementById('dynamic-styles');
      if (styleEl) {
        styleEl.textContent = '.component { color: blue; font-size: 16px; }';
      }
    });
    
    const beforeSnapshot = await CSSOMSnapshotCapture.captureSnapshot(page, {
      selector: '.component'
    });
    
    // Update CSS-in-JS styles
    await page.evaluate(() => {
      const styleEl = document.getElementById('dynamic-styles');
      if (styleEl) {
        styleEl.textContent = '.component { color: red; font-size: 20px; }';
      }
    });
    
    const afterSnapshot = await CSSOMSnapshotCapture.captureSnapshot(page, {
      selector: '.component'
    });
    
    // Verify the styles changed
    const selector = Object.keys(afterSnapshot.styles)[0];
    expect(afterSnapshot.styles[selector].computedStyle.color).toBe('rgb(255, 0, 0)');
    expect(afterSnapshot.styles[selector].computedStyle['font-size']).toBe('20px');
    
    await browser.close();
  });
});