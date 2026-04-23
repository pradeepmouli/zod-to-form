import { test, expect, type Route } from '@playwright/test';

const SAMPLE_FILES = [
  {
    path: 'registry/new-york-v4/ui/button.tsx',
    type: 'registry:ui',
    content: 'export function Button() { return null; }'
  },
  {
    path: 'registry/new-york-v4/ui/input.tsx',
    type: 'registry:ui',
    content: 'export function Input() { return null; }'
  },
  {
    path: 'registry/new-york-v4/ui/checkbox.tsx',
    type: 'registry:ui',
    content: 'export function Checkbox() { return null; }'
  },
  {
    path: 'registry/new-york-v4/ui/label.tsx',
    type: 'registry:ui',
    content: 'export function Label() { return null; }'
  },
  {
    path: 'registry/new-york-v4/ui/select.tsx',
    type: 'registry:ui',
    content: 'export function Select() { return null; }'
  },
  {
    path: 'registry/new-york-v4/ui/switch.tsx',
    type: 'registry:ui',
    content: 'export function Switch() { return null; }'
  },
  {
    path: 'registry/new-york-v4/ui/textarea.tsx',
    type: 'registry:ui',
    content: 'export function Textarea() { return null; }'
  }
];

test.describe('shadcn component download', () => {
  test('happy path: /api/shadcn/resolve returns sources, banner does not appear', async ({
    page
  }) => {
    let resolveCallCount = 0;

    await page.route('**/api/shadcn/resolve', async (route: Route) => {
      resolveCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          files: SAMPLE_FILES,
          dependencies: [],
          devDependencies: [],
          cssVars: {}
        })
      });
    });

    // Pre-seed persisted state with shadcn preset active + empty cache so the
    // mount-time fetch is guaranteed to fire — without this the test becomes
    // a no-op if the default preset changes to something other than shadcn.
    await page.addInitScript(() => {
      window.localStorage.removeItem('z2f-shadcn-registry-cache');
      window.localStorage.setItem(
        'z2f-playground-state',
        JSON.stringify({
          editorContent: 'import { z } from "zod";\nexport default z.object({ name: z.string() });',
          componentMap: 'shadcn',
          activeTab: 'preview',
          config: null,
          version: 1
        })
      );
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Give the fetch a deterministic window to complete and the cache to write.
    await expect
      .poll(
        async () =>
          await page.evaluate(() => window.localStorage.getItem('z2f-shadcn-registry-cache'))
      )
      .not.toBeNull();

    // The degraded banner must NOT appear on the happy path.
    await expect(page.getByTestId('shadcn-degraded-notice')).toHaveCount(0);

    // The mocked resolve endpoint must have been hit at least once.
    expect(resolveCallCount).toBeGreaterThanOrEqual(1);

    // localStorage should reflect the new cache version.
    const cache = await page.evaluate(() =>
      window.localStorage.getItem('z2f-shadcn-registry-cache')
    );
    expect(cache).not.toBeNull();
    const parsed = JSON.parse(cache!) as { version: number; sources: Record<string, string> };
    expect(parsed.version).toBe(2);
    expect(parsed.sources['ui/button']).toMatch(/^export function Button/);
  });

  test('failure path: /api/shadcn/resolve 500s → degraded banner visible, rest of UI usable', async ({
    page
  }) => {
    await page.route('**/api/shadcn/resolve', async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'upstream unavailable' })
      });
    });

    // Pre-seed the persisted state so the playground boots with shadcn preset
    // active — guarantees the on-mount fetch fires, which is what we want to fail.
    await page.addInitScript(() => {
      window.localStorage.removeItem('z2f-shadcn-registry-cache');
      window.localStorage.setItem(
        'z2f-playground-state',
        JSON.stringify({
          editorContent: 'import { z } from "zod";\nexport default z.object({ name: z.string() });',
          componentMap: 'shadcn',
          activeTab: 'preview',
          config: null,
          version: 1
        })
      );
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Banner appears once the fetch fails (aria-live polite).
    const banner = page.getByTestId('shadcn-degraded-notice');
    await expect(banner).toBeVisible({ timeout: 10_000 });
    await expect(banner).toHaveAttribute('role', 'status');
    await expect(banner).toContainText(/shadcn components degraded/i);

    // Rest of the UI: CodeMirror schema editor area is still present.
    // The SchemaEditor mounts a .cm-editor DOM node when loaded.
    await expect(page.locator('.cm-editor').first()).toBeVisible();
  });
});
