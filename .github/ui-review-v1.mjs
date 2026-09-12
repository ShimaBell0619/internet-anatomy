import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const cname = { name: 'www.github.com.', type: 5, TTL: 60, data: 'github.com.' };
const githubAddress = { name: 'github.com.', type: 1, TTL: 60, data: '140.82.112.4' };
const dnsResponse = (Answer) => ({ Status: 0, TC: false, RD: true, RA: true, AD: false, CD: false, Answer });
const responses = {
  '.|NS': dnsResponse([{ name: '.', type: 2, TTL: 518400, data: 'a.root-servers.net.' }]),
  'com.|NS': dnsResponse([{ name: 'com.', type: 2, TTL: 172800, data: 'a.gtld-servers.net.' }]),
  'google.com.|NS': dnsResponse([{ name: 'google.com.', type: 2, TTL: 21600, data: 'ns1.google.com.' }]),
  'github.com.|NS': dnsResponse([{ name: 'github.com.', type: 2, TTL: 3600, data: 'dns1.p08.nsone.net.' }]),
  'www.github.com.|NS': dnsResponse([]),
  '.|SOA': dnsResponse([{ name: '.', type: 6, TTL: 86400, data: 'a.root-servers.net. hostmaster.root. 1 1800 900 604800 86400' }]),
  'com.|SOA': dnsResponse([{ name: 'com.', type: 6, TTL: 900, data: 'a.gtld-servers.net. hostmaster.com. 1 1800 900 604800 900' }]),
  'google.com.|SOA': dnsResponse([{ name: 'google.com.', type: 6, TTL: 60, data: 'ns1.google.com. dns-admin.google.com. 1 900 900 1800 60' }]),
  'github.com.|SOA': dnsResponse([{ name: 'github.com.', type: 6, TTL: 60, data: 'dns1.p08.nsone.net. hostmaster.nsone.net. 1 7200 900 1209600 3600' }]),
  'google.com.|A': dnsResponse([{ name: 'google.com.', type: 1, TTL: 300, data: '142.250.0.1' }]),
  'google.com.|AAAA': dnsResponse([{ name: 'google.com.', type: 28, TTL: 300, data: '2607:f8b0::1' }]),
  'google.com.|CNAME': dnsResponse([]),
  'github.com.|A': dnsResponse([githubAddress]),
  'github.com.|AAAA': dnsResponse([]),
  'github.com.|CNAME': dnsResponse([]),
  'www.github.com.|A': dnsResponse([cname, githubAddress]),
  'www.github.com.|AAAA': dnsResponse([cname]),
  'www.github.com.|CNAME': dnsResponse([cname]),
};

await mkdir('ui-review', { recursive: true });
const browser = await chromium.launch({ headless: true });
const cases = [
  ['desktop-story', 1440, 1000, '/?mode=story&host=google.com', false],
  ['mobile-story', 390, 844, '/?mode=story&host=google.com', false],
  ['narrow-story-reduced', 320, 800, '/?mode=story&host=google.com', true],
  ['desktop-compare', 1440, 1000, '/?mode=compare&left=google.com&right=github.com', false],
  ['mobile-failure', 390, 844, '/?mode=lab&host=google.com&lab=failure', false],
  ['narrow-failure', 320, 800, '/?mode=lab&host=google.com&lab=failure', true],
];

for (const [name, width, height, path, reducedMotion] of cases) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
  await page.route('https://dns.google/resolve**', async (route) => {
    const url = new URL(route.request().url());
    const key = `${url.searchParams.get('name') ?? ''}|${url.searchParams.get('type') ?? ''}`;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responses[key] ?? dnsResponse([])) });
  });
  await page.goto(`http://127.0.0.1:4173${path}`, { waitUntil: 'networkidle' });
  if (name.includes('failure')) await page.getByRole('button', { name: 'CNAME loopを作る' }).click();
  await page.screenshot({ path: `ui-review/${name}.png`, fullPage: true });
  const metrics = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    verticalScroll: document.documentElement.scrollHeight > window.innerHeight + 1,
    url: location.href,
  }));
  console.log(name, metrics);
  await page.close();
}
await browser.close();
