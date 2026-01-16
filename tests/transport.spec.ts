import { test, expect } from '@playwright/test';

test('transport accessibility map shows markers', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  await page.goto('/transport-accessibility');

  // Wait for the map container to be present
  await expect(page.locator('#map')).toBeVisible();

  // Wait for some time to allow markers to be added
  await page.waitForTimeout(10000); // Increased timeout to 10 seconds

  const markersCount = await page.locator('.leaflet-marker-icon').count();

  console.log('Browser Console Logs:');
  console.log(logs.join('\n'));
  console.log(`Found ${markersCount} markers on the map.`);

  expect(markersCount).toBeGreaterThan(0);
});
