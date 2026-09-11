import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const dnsResponse = (Answer) => ({ Status: 0, TC: false, RD: true, RA: true, AD: false, CD: false, Answer });
const responses = {
  '.|NS': dnsResponse([{ name: '.', type: 2, TTL: 518400, data: 'a.root-servers.net.' }]),
  'com.|NS': dnsResponse([{ name: 'com.', type: 2, TTL: 172800, data: 'a.gtld-servers.net.' }]),
  'google.com.|NS': dnsResponse([{ name: 'google.com.', type: 2, TTL: 21600, data: 'ns1.google.com.' }]),
  '.|SOA': dnsResponse([{ name: '.', type: 6, TTL: 86400, data: 'a.root-servers.net. hostmaster.root. 1 1800 900 604800 86400' }]),
  'com.|SOA': dnsResponse([{ name: 'com.', type: 6, TTL: 900, data: 'a.gtld-servers.net. hostmaster.com. 1 1800 900 604800 900' }]),
  'google.com.|SOA': dnsResponse([{ name: 'google.com.', type: 6, TTL: 60, data: 'ns1.google.com. dns-admin.google.com. 1 900 900 1800 60' }]),
  'google.com.|A': dnsResponse([{ name: 'google.com.', type: 1, TTL: 300, data: '142.250.0.1' }]),
  'google.com.|AAAA': dnsResponse([{ name: 'google.com.', type: 28, TTL: 300, data: '2607:f8b0::1' }]),
  'google.com.|CNAME': dnsResponse([]),
};

await mkdir('ui-review', { recursive: true });
const browser = await chromium.launch({ headless: true });
for (const [name, width, height] of [
  ['desktop', 1440, 1000],
  ['mobile', 390, 844],
  ['narrow', 320, 800],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.route('https://dns.google/resolve**', async (route) => {
    const url = new URL(route.request().url());
    const key = `${url.searchParams.get('name') ?? ''}|${url.searchParams.get('type') ?? ''}`;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responses[key] ?? dnsResponse([])) });
  });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Lab/ }).click();
  await page.getByRole('button', { name: /Break DNS/ }).click();
  await page.getByRole('button', { name: 'CNAME loopを作る' }).click();
  await page.screenshot({ path: `ui-review/${name}-cname-loop.png`, fullPage: true });
  await page.getByRole('button', { name: 'A / AAAAを外す' }).click();
  await page.screenshot({ path: `ui-review/${name}-nodata.png`, fullPage: true });
  await page.close();
}
await browser.close();
