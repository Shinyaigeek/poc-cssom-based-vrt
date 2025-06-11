# playwright-cssom-snapshot

Capture CSSOM (CSS Object Model) snapshots for visual regression testing with Playwright. This library uses Chrome DevTools Protocol to capture computed styles of DOM elements, making it perfect for detecting CSS changes, especially in CSS-in-JS scenarios.

## Features

- 🎯 Capture computed styles of specific elements or entire pages
- 🔍 Query elements using CSS selectors
- 📸 Integrates with Playwright's and Vitest's snapshot testing
- 🚀 Lightweight and focused on CSSOM capture
- 💅 Perfect for CSS-in-JS regression testing

## Installation

```bash
npm install --save-dev playwright-cssom-snapshot
```

## Usage

### With Playwright Test

```typescript
import { test, expect } from '@playwright/test';
import { CSSOMSnapshotCapture } from 'playwright-cssom-snapshot';

test('capture page styles', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Capture entire page
  const snapshot = await CSSOMSnapshotCapture.captureSnapshot(page);
  
  // Use Playwright's snapshot testing
  expect(snapshot).toMatchSnapshot('example-page.json');
});

test('capture specific element', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Capture only specific elements
  const snapshot = await CSSOMSnapshotCapture.captureSnapshot(page, {
    selector: '.my-component',
    includeChildren: true
  });
  
  expect(snapshot).toMatchSnapshot('my-component.json');
});
```

### With Vitest

```typescript
import { describe, it, expect } from 'vitest';
import { chromium } from 'playwright';
import { CSSOMSnapshotCapture } from 'playwright-cssom-snapshot';

describe('CSSOM Snapshots', () => {
  it('should capture styles', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.goto('https://example.com');
    
    const snapshot = await CSSOMSnapshotCapture.captureSnapshot(page, {
      selector: 'h1'
    });
    
    expect(snapshot).toMatchSnapshot();
    
    await browser.close();
  });
});
```

## API

### `CSSOMSnapshotCapture.captureSnapshot(page, options?)`

Captures CSSOM snapshot from a Playwright page.

#### Parameters

- `page` (Page): Playwright page instance
- `options` (optional):
  - `selector` (string): CSS selector to capture specific elements
  - `includeChildren` (boolean): Include child elements when using selector (default: true)

#### Returns

Returns a `CSSOMSnapshot` object containing:

```typescript
{
  url: string;           // Page URL
  selector: string;      // Selector used (or 'document')
  timestamp: number;     // Capture timestamp
  styles: {              // Computed styles by selector
    [selector: string]: {
      nodeId: number;
      nodeName: string;
      attributes: string[];
      computedStyle: Record<string, string>;
    }
  }
}
```

## Use Cases

### CSS-in-JS Testing

Perfect for detecting unintended style changes when updating CSS-in-JS libraries:

```typescript
test('CSS-in-JS updates preserve styles', async ({ page }) => {
  await page.goto('/my-app');
  
  const snapshot = await CSSOMSnapshotCapture.captureSnapshot(page, {
    selector: '[data-testid="styled-component"]'
  });
  
  expect(snapshot).toMatchSnapshot();
});
```

### Style Override Detection

Detect when global styles or third-party CSS affects your components:

```typescript
test('component styles are not affected by global CSS', async ({ page }) => {
  await page.goto('/my-app');
  
  const snapshot = await CSSOMSnapshotCapture.captureSnapshot(page, {
    selector: '.my-component',
    includeChildren: true
  });
  
  expect(snapshot).toMatchSnapshot();
});
```

## Examples

See the [examples](./examples) directory for complete examples with:
- Playwright Test integration
- Vitest integration
- CSS-in-JS testing scenarios

## License

MIT