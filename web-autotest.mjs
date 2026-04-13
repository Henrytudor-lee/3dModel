import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const FRAMEWORK = process.env.FRAMEWORK || 'unknown';
const NEEDS_WEBGL = process.env.NEEDS_WEBGL === 'true';
const DIR = '/tmp/autotest-screenshots';
fs.mkdirSync(DIR, { recursive: true });

const BROWSER_ARGS = NEEDS_WEBGL ? [
  '--use-gl=swiftshader',
  '--enable-webgl',
  '--enable-webgl2',
  '--enable-accelerated-2d-canvas',
  '--ignore-gpu-blocklist',
  '--no-sandbox',
  '--disable-dev-shm-usage',
] : ['--no-sandbox'];

const results = {
  framework: FRAMEWORK, url: BASE_URL,
  timestamp: new Date().toISOString(),
  webgl_mode: NEEDS_WEBGL ? 'swiftshader' : 'disabled',
  console_errors: [], console_warnings: [], hydration_errors: [],
  network_errors: [], ui_issues: [], interaction_issues: [],
  webgl_issues: [],
  performance: {}, screenshots: []
};

const shot = async (page, name, note) => {
  const file = path.join(DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  results.screenshots.push({ file, note });
};

const browser = await chromium.launch({ headless: true, args: BROWSER_ARGS });

// Dimension 1: Console errors + Hydration
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      const isHydration = /hydrat|did not match/i.test(text);
      (isHydration ? results.hydration_errors : results.console_errors)
        .push({ text, location: msg.location() });
    }
    if (msg.type() === 'warning' && !/DevTools/.test(msg.text()))
      results.console_warnings.push({ text });
  });

  page.on('pageerror', err =>
    results.console_errors.push({ text: err.message, stack: err.stack, type: 'uncaught' }));

  page.on('response', res => {
    if (res.status() >= 400)
      results.network_errors.push({ url: res.url(), status: res.status() });
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
  } catch (e) {
    results.console_errors.push({ text: `Load failed: ${e.message}`, type: 'load-error' });
  }

  await shot(page, '01-desktop', 'Desktop initial state');
  await ctx.close();
}

// Dimension 2: Visual UI
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });

  results.ui_issues.push(...await page.evaluate(() => {
    const issues = [];
    document.querySelectorAll('img').forEach(img => {
      if (!img.complete || img.naturalWidth === 0)
        issues.push({ type: 'broken-image', src: img.src });
    });
    return issues;
  }));

  // Check for G-MODELER text
  const hasTitle = await page.evaluate(() => {
    return document.body.textContent.includes('G-MODELER');
  });
  if (!hasTitle) {
    results.ui_issues.push({ type: 'missing-title', message: 'G-MODELER title not found' });
  }

  // Mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);
  await shot(page, '02-mobile-375', 'iPhone SE (375px)');

  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(300);
  await shot(page, '03-tablet-768', 'iPad (768px)');

  await ctx.close();
}

// Dimension 3: Interaction
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const interactionErrors = [];

  page.on('console', msg => { if (msg.type() === 'error') interactionErrors.push(msg.text()); });
  page.on('pageerror', err => interactionErrors.push(err.message));

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });

  // Button click test
  const buttons = await page.$$('button:visible, [role="button"]:visible');
  for (let i = 0; i < Math.min(buttons.length, 5); i++) {
    try {
      const text = await buttons[i].textContent();
      const before = interactionErrors.length;
      await buttons[i].click({ timeout: 3000 });
      await page.waitForTimeout(800);
      if (interactionErrors.length > before) {
        await shot(page, `05-btn-error-${i}`, `Button error: ${text?.trim().slice(0,20)}`);
        results.interaction_issues.push({
          type: 'button-click-error',
          button: text?.trim().slice(0, 30),
          errors: interactionErrors.slice(before)
        });
      }
    } catch {}
  }

  await ctx.close();
}

// Dimension 4: Performance
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

  results.performance = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const lcp = performance.getEntriesByType('largest-contentful-paint').pop();
    return {
      domContentLoaded: Math.round(nav?.domContentLoadedEventEnd || 0) + 'ms',
      loadComplete: Math.round(nav?.loadEventEnd || 0) + 'ms',
      fcp: paint.find(p => p.name === 'first-contentful-paint') ? Math.round(paint.find(p => p.name === 'first-contentful-paint').startTime) + 'ms' : 'N/A',
      lcp: lcp ? Math.round(lcp.startTime) + 'ms' : 'N/A',
    };
  });

  await ctx.close();
}

await browser.close();

results.summary = {
  total_issues: results.console_errors.length + results.network_errors.length +
                results.ui_issues.length + results.interaction_issues.length +
                results.hydration_errors.length + results.webgl_issues.length,
  console_errors: results.console_errors.length,
  hydration_errors: results.hydration_errors.length,
  network_errors: results.network_errors.length,
  ui_issues: results.ui_issues.length,
  interaction_issues: results.interaction_issues.length,
  webgl_issues: results.webgl_issues.length,
};

fs.writeFileSync('/tmp/autotest-results.json', JSON.stringify(results, null, 2));
console.log('\n=== Test Complete ===');
console.log(JSON.stringify(results.summary, null, 2));