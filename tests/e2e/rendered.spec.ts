import { expect, test, type Page } from '@playwright/test';

const responses: Record<string, unknown> = {
  '.|NS': dnsResponse([{ name: '.', type: 2, TTL: 518400, data: 'a.root-servers.net.' }]),
  'com.|NS': dnsResponse([{ name: 'com.', type: 2, TTL: 172800, data: 'a.gtld-servers.net.' }]),
  'google.com.|NS': dnsResponse([
    { name: 'google.com.', type: 2, TTL: 21600, data: 'ns1.google.com.' },
    { name: 'google.com.', type: 2, TTL: 21600, data: 'ns2.google.com.' },
  ]),
  'google.com.|SOA': dnsResponse([
    { name: 'google.com.', type: 6, TTL: 60, data: 'ns1.google.com. dns-admin.google.com. 1 900 900 1800 60' },
  ]),
  '.|SOA': dnsResponse([{ name: '.', type: 6, TTL: 86400, data: 'a.root-servers.net. nstld.verisign-grs.com. 1 1800 900 604800 86400' }]),
  'com.|SOA': dnsResponse([{ name: 'com.', type: 6, TTL: 900, data: 'a.gtld-servers.net. nstld.verisign-grs.com. 1 1800 900 604800 900' }]),
  'google.com.|A': dnsResponse([{ name: 'google.com.', type: 1, TTL: 300, data: '142.250.0.1' }]),
  'google.com.|AAAA': dnsResponse([{ name: 'google.com.', type: 28, TTL: 300, data: '2607:f8b0::1' }]),
  'google.com.|CNAME': dnsResponse([]),
};

test.beforeEach(async ({ page }) => {
  await mockDns(page);
});

test('starts with the causal DNS Story and keeps Explore available on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  await expect(page.getByRole('button', { name: /Story/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'まず、端末は「全部」を調べません。' })).toBeVisible();
  await expect(page.getByText('142.250.0.1')).toBeVisible();

  await page.getByRole('button', { name: '次へ' }).click();
  await expect(page.getByRole('heading', { name: 'RootはIPではなく、次の案内先を返します。' })).toBeVisible();
  await expect(page.getByRole('button', { name: /ROOT/ }).first()).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();

  await page.getByRole('button', { name: /Explore/ }).click();
  await expect(page.getByRole('button', { name: /Explore/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /google\.com\./ }).first().click();
  await expect(page.getByRole('heading', { name: /authoritative zone/i })).toBeVisible();

  expect(await hasHorizontalOverflow(page)).toBe(false);
});

for (const width of [390, 320]) {
  test(`keeps Story controls and the primary DNS flow usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'DNSを探索' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'まず、端末は「全部」を調べません。' })).toBeVisible();
    await expect(page.getByRole('button', { name: '次へ' })).toBeVisible();
    await expect(page.getByText('142.250.0.1')).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
}

async function mockDns(page: Page) {
  await page.route('https://dns.google/resolve**', async (route) => {
    const url = new URL(route.request().url());
    const name = url.searchParams.get('name') ?? '';
    const type = url.searchParams.get('type') ?? '';
    const body = responses[`${name}|${type}`] ?? dnsResponse([]);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}

function dnsResponse(answer: Array<{ name: string; type: number; TTL: number; data: string }>) {
  return {
    Status: 0,
    TC: false,
    RD: true,
    RA: true,
    AD: false,
    CD: false,
    Answer: answer,
  };
}
