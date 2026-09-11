import { expect, test, type Page } from '@playwright/test';

const cname = { name: 'www.github.com.', type: 5, TTL: 60, data: 'github.com.' };
const githubAddress = { name: 'github.com.', type: 1, TTL: 60, data: '140.82.112.4' };

const responses: Record<string, unknown> = {
  '.|NS': dnsResponse([{ name: '.', type: 2, TTL: 518400, data: 'a.root-servers.net.' }]),
  'com.|NS': dnsResponse([{ name: 'com.', type: 2, TTL: 172800, data: 'a.gtld-servers.net.' }]),
  'google.com.|NS': dnsResponse([
    { name: 'google.com.', type: 2, TTL: 21600, data: 'ns1.google.com.' },
    { name: 'google.com.', type: 2, TTL: 21600, data: 'ns2.google.com.' },
  ]),
  'github.com.|NS': dnsResponse([
    { name: 'github.com.', type: 2, TTL: 3600, data: 'dns1.p08.nsone.net.' },
    { name: 'github.com.', type: 2, TTL: 3600, data: 'dns2.p08.nsone.net.' },
  ]),
  'www.github.com.|NS': dnsResponse([]),
  '.|SOA': dnsResponse([{ name: '.', type: 6, TTL: 86400, data: 'a.root-servers.net. nstld.verisign-grs.com. 1 1800 900 604800 86400' }]),
  'com.|SOA': dnsResponse([{ name: 'com.', type: 6, TTL: 900, data: 'a.gtld-servers.net. nstld.verisign-grs.com. 1 1800 900 604800 900' }]),
  'google.com.|SOA': dnsResponse([
    { name: 'google.com.', type: 6, TTL: 60, data: 'ns1.google.com. dns-admin.google.com. 1 900 900 1800 60' },
  ]),
  'github.com.|SOA': dnsResponse([
    { name: 'github.com.', type: 6, TTL: 60, data: 'dns1.p08.nsone.net. hostmaster.nsone.net. 1 7200 900 1209600 3600' },
  ]),
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

test.beforeEach(async ({ page }) => {
  await mockDns(page);
});

test('Story advances by touching DNS actors and explains an early choice without punishment', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  await expect(page.getByRole('button', { name: /Story/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: '最初に質問を渡す相手を選ぶ' })).toBeVisible();
  await expect(page.getByText('次に到達できる相手は？')).toBeVisible();
  expect(await hasPageVerticalScroll(page)).toBe(false);

  await page.getByRole('button', { name: /^ROOT / }).click();
  await expect(page.getByText('WHY NOT YET?')).toBeVisible();
  await expect(page.getByText(/通常はRecursive Resolver/)).toBeVisible();
  await expect(page.getByRole('heading', { name: '最初に質問を渡す相手を選ぶ' })).toBeVisible();

  await page.getByRole('button', { name: /RECURSIVE RESOLVER Resolver/ }).click();
  await expect(page.getByRole('heading', { name: 'Resolverが次に頼るDNSを選ぶ' })).toBeVisible();
  await expect(page.getByText('WHAT JUST HAPPENED')).toBeVisible();
  await expect(page.getByText(/端末は通常、設定されたRecursive Resolver/)).toBeVisible();

  await page.getByRole('button', { name: /^TLD com\./ }).click();
  await expect(page.getByText(/まずRootから案内/)).toBeVisible();

  await page.getByRole('button', { name: /^ROOT / }).click();
  await expect(page.getByRole('heading', { name: 'Rootの案内を使って次へ進む' })).toBeVisible();
  await expect(page.getByText(/Rootは個々のサイトのIPを全部持つ場所ではなく/)).toBeVisible();
  expect(await hasPageVerticalScroll(page)).toBe(false);
});

test('CNAME example becomes a visible name-to-name detour before the canonical address', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  await page.getByRole('button', { name: /CNAMEの寄り道を見る/ }).click();
  await expect(page.getByLabel('探索するURLまたはドメイン')).toHaveValue('www.github.com');
  await expect(page.getByRole('heading', { name: '最初に質問を渡す相手を選ぶ' })).toBeVisible();

  await advanceToAlias(page);

  await expect(page.getByRole('heading', { name: 'CNAMEの行き先を追う' })).toBeVisible();
  await expect(page.getByText('OBSERVED ALIAS CHAIN')).toBeVisible();
  await expect(page.getByText('www.github.com', { exact: true })).toBeVisible();
  await expect(page.getByText('github.com', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('CNAME →')).toBeVisible();
  await expect(page.getByText(/A 140\.82\.112\.4/)).toBeVisible();

  await page.getByRole('button', { name: /CANONICAL NAME github\.com/ }).click();
  await expect(page.getByRole('heading', { name: '別名の先にあるAddressを選ぶ' })).toBeVisible();
  await expect(page.getByText(/元のalias名ではなく/)).toHaveCount(0);

  await page.getByRole('button', { name: /ADDRESS A 140\.82\.112\.4/ }).click();
  await expect(page.getByRole('heading', { name: 'Answerを問い合わせ元へ返す' })).toBeVisible();
  await expect(page.getByText(/canonical側の名前がこのA \/ AAAAを所有/)).toBeVisible();
  expect(await hasPageVerticalScroll(page)).toBe(false);
});

test('Story keeps Auto secondary and Explore/Compare remain available', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  const auto = page.getByRole('button', { name: 'Autoで見る' });
  await expect(auto).toBeVisible();
  await auto.click();
  await expect(page.getByRole('button', { name: 'Auto停止' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /Explore/ }).click();
  await expect(page.getByRole('button', { name: /Explore/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('142.250.0.1')).toBeVisible();

  await page.getByRole('button', { name: /Compare/ }).click();
  await expect(page.getByRole('button', { name: /Compare/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('比較する1つ目のURLまたはドメイン')).toHaveValue('google.com');
  await expect(page.getByLabel('比較する2つ目のURLまたはドメイン')).toHaveValue('github.com');
  await expect(page.getByRole('heading', { name: /com\. までは共通/ })).toBeVisible();
  await expect(page.getByText('DELEGATION DIVERGENCE')).toBeVisible();
  expect(await hasHorizontalOverflow(page)).toBe(false);
});

for (const [width, height] of [[390, 844], [320, 800]] as const) {
  test(`keeps the normal Story scene within one viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: '最初に質問を渡す相手を選ぶ' })).toBeVisible();
    await expect(page.getByRole('button', { name: /RECURSIVE RESOLVER Resolver/ })).toBeVisible();
    await expect(page.getByText('TOUCH THE MODEL')).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);
    expect(await hasPageVerticalScroll(page)).toBe(false);

    await page.getByRole('button', { name: /RECURSIVE RESOLVER Resolver/ }).click();
    await expect(page.getByRole('heading', { name: 'Resolverが次に頼るDNSを選ぶ' })).toBeVisible();
    await expect(page.getByText('WHAT JUST HAPPENED')).toBeVisible();
    expect(await hasPageVerticalScroll(page)).toBe(false);
  });

  test(`keeps the CNAME detour readable without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.getByRole('button', { name: /CNAMEの寄り道を見る/ }).click();
    await advanceToAlias(page);

    await expect(page.getByRole('heading', { name: 'CNAMEの行き先を追う' })).toBeVisible();
    await expect(page.getByText('OBSERVED ALIAS CHAIN')).toBeVisible();
    await expect(page.getByRole('button', { name: /CANONICAL NAME github\.com/ })).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);
    expect(await hasPageVerticalScroll(page)).toBe(false);
  });
}

async function advanceToAlias(page: Page) {
  await page.getByRole('button', { name: /RECURSIVE RESOLVER Resolver/ }).click();
  await page.getByRole('button', { name: /^ROOT / }).click();
  await page.getByRole('button', { name: /^TLD com\./ }).click();
  await page.getByRole('button', { name: /AUTHORITATIVE github\.com\./ }).click();
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

async function hasPageVerticalScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 1);
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
