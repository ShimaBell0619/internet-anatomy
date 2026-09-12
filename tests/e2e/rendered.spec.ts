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

test('share URL opens a normalized Story hostname and round-trips committed state', async ({ page }) => {
  await page.goto('/?mode=story&host=https%3A%2F%2FWWW.GITHUB.COM%2Fdocs');
  await expect(page.getByRole('button', { name: /Story/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('探索するURLまたはドメイン')).toHaveValue('www.github.com');
  await expect(page.getByRole('heading', { name: '最初に質問を渡す相手を選ぶ' })).toBeVisible();
  await expect.poll(() => new URL(page.url()).search).toBe('?mode=story&host=www.github.com');
});

test('share URL opens a comparison pair', async ({ page }) => {
  await page.goto('/?mode=compare&left=google.com&right=github.com');
  await expect(page.getByRole('button', { name: /Compare/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('比較する1つ目のURLまたはドメイン')).toHaveValue('google.com');
  await expect(page.getByLabel('比較する2つ目のURLまたはドメイン')).toHaveValue('github.com');
  await expect(page.getByRole('heading', { name: /com\. までは共通/ })).toBeVisible();
  await expect.poll(() => new URL(page.url()).search).toBe('?mode=compare&left=google.com&right=github.com');
});

test('share URL opens Break DNS and invalid URL state falls back safely', async ({ page }) => {
  await page.goto('/?mode=lab&host=google.com&lab=failure');
  await expect(page.getByRole('button', { name: /^Lab/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('BREAK DNS · SIMULATION')).toBeVisible();
  await expect.poll(() => new URL(page.url()).search).toBe('?mode=lab&host=google.com&lab=failure');

  await page.goto('/?mode=unknown&host=localhost&lab=other');
  await expect(page.getByRole('button', { name: /Story/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('探索するURLまたはドメイン')).toHaveValue('google.com');
  await expect.poll(() => new URL(page.url()).search).toBe('?mode=story&host=google.com');
});

test('Story advances by directly activating the next protocol handoff', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  await expect(page.getByRole('button', { name: /Story/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: '最初に質問を渡す相手を選ぶ' })).toBeVisible();
  await expect(page.getByText('次のhandoffを起こす')).toBeVisible();
  await expect(page.getByRole('button', { name: /RECURSIVE RESOLVER Resolver/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^ROOT / })).toHaveCount(0);
  expect(await hasPageVerticalScroll(page)).toBe(false);

  await page.getByRole('button', { name: /RECURSIVE RESOLVER Resolver/ }).click();
  await expect(page.getByRole('heading', { name: 'Resolverが次に頼るDNSを選ぶ' })).toBeVisible();
  await expect(page.getByText('WHAT JUST HAPPENED')).toBeVisible();
  await expect(page.getByText(/端末は通常、設定されたRecursive Resolver/)).toBeVisible();
  await expect(page.getByRole('button', { name: /^ROOT / })).toBeVisible();

  await page.getByRole('button', { name: /^ROOT / }).click();
  await expect(page.getByRole('heading', { name: 'Rootの案内を使って次へ進む' })).toBeVisible();
  await expect(page.getByText(/Rootは個々のサイトのIPを全部持つ場所ではなく/)).toBeVisible();
  expect(await hasPageVerticalScroll(page)).toBe(false);
});

test('Story preserves semantic handoff with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  const source = page.getByLabel(/現在の役割: CLIENT Your device/);
  await expect(source).toBeVisible();
  expect(await source.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');

  await page.getByRole('button', { name: /RECURSIVE RESOLVER Resolver/ }).click();
  await expect(page.getByRole('heading', { name: 'Resolverが次に頼るDNSを選ぶ' })).toBeVisible();
  await expect(page.getByText('WHAT JUST HAPPENED')).toBeVisible();
  await expect(page.getByRole('button', { name: /^ROOT / })).toBeVisible();
});

test('CNAME example becomes a visible name-to-name detour before the canonical address', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  await page.getByRole('button', { name: /CNAMEの寄り道を見る/ }).click();
  await expect(page.getByLabel('探索するURLまたはドメイン')).toHaveValue('www.github.com');
  await expect(page.getByRole('heading', { name: '最初に質問を渡す相手を選ぶ' })).toBeVisible();

  await advanceToAlias(page);

  await expect(page.getByRole('heading', { name: 'CNAMEの行き先を追う' })).toBeVisible();
  await expect(page.getByRole('button', { name: /ADDRESS A 140\.82\.112\.4/ })).toHaveCount(0);
  const trail = page.getByLabel('観測されたCNAME chain');
  await expect(trail.getByText('OBSERVED ALIAS CHAIN')).toBeVisible();
  await expect(trail.getByText('www.github.com', { exact: true }).first()).toBeVisible();
  await expect(trail.getByText('github.com', { exact: true }).first()).toBeVisible();
  await expect(trail.getByText('CNAME →')).toBeVisible();
  await expect(trail.getByText(/A 140\.82\.112\.4/)).toHaveCount(0);

  await page.getByRole('button', { name: /CANONICAL NAME github\.com/ }).click();
  await expect(page.getByRole('heading', { name: '別名の先にあるAddressを選ぶ' })).toBeVisible();
  await expect(trail.getByText(/A 140\.82\.112\.4/)).toBeVisible();

  await page.getByRole('button', { name: /ADDRESS A 140\.82\.112\.4/ }).click();
  await expect(page.getByRole('heading', { name: 'Answerを問い合わせ元へ返す' })).toBeVisible();
  await expect(page.getByText(/canonical側の名前がこのA \/ AAAAを所有/)).toBeVisible();
  expect(await hasPageVerticalScroll(page)).toBe(false);
});

test('Cache TTL Lab collapses and reopens the modeled lookup path as TTL state changes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: /^Lab/ }).click();

  await expect(page.getByRole('button', { name: /^Lab/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: '同じ名前を、もう一度引いたら？' })).toBeVisible();
  await expect(page.getByText('CACHE / TTL LAB · SIMULATION')).toBeVisible();
  await expect(page.getByLabel('次の問い合わせ経路: FULL RESOLUTION')).toBeVisible();
  await expect(page.getByText(/実cacheを観測しているわけではありません/)).toBeVisible();

  await page.getByRole('button', { name: '今問い合わせる' }).click();
  await expect(page.getByLabel('次の問い合わせ経路: ANSWER CACHE HIT')).toBeVisible();
  await expect(page.getByText('300s LEFT')).toBeVisible();
  await expect(page.getByText('ANSWER CACHE', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'A / AAAAを期限切れにする' }).click();
  await expect(page.getByLabel('次の問い合わせ経路: DELEGATION CACHE HIT')).toBeVisible();
  await expect(page.getByText('EXPIRED')).toBeVisible();
  await expect(page.getByText('DELEGATION CACHE', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '今問い合わせる' }).click();
  await page.getByRole('button', { name: '委任も期限切れにする' }).click();
  await expect(page.getByLabel('次の問い合わせ経路: FULL RESOLUTION')).toBeVisible();
  await expect(page.getByText('ROOT', { exact: true })).toBeVisible();
  await expect(page.getByText('TLD', { exact: true })).toBeVisible();
  expect(await hasHorizontalOverflow(page)).toBe(false);
});

test('Break DNS Lab exposes causal failure states without quiz mechanics', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: /^Lab/ }).click();
  await page.getByRole('button', { name: /Break DNS/ }).click();

  await expect(page.getByText('BREAK DNS · SIMULATION')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'DNSを壊すと、どこで止まる？' })).toBeVisible();
  await expect(page.getByText('WORKING', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'A / AAAAを外す' }).click();
  await expect(page.getByText('NOERROR / NODATA', { exact: true })).toBeVisible();
  await expect(page.getByText(/NXDOMAIN/).last()).toBeVisible();

  await page.getByRole('button', { name: '名前自体を消す' }).click();
  await expect(page.getByText('NXDOMAIN', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: '委任を外す' }).click();
  await expect(page.getByText('DELEGATION MISSING', { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Break DNS route/).getByText('AUTHORITATIVE', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'CNAME loopを作る' }).click();
  await expect(page.getByText('CNAME LOOP', { exact: true })).toBeVisible();
  await expect(page.getByText('visited name', { exact: true })).toBeVisible();
  expect(await hasHorizontalOverflow(page)).toBe(false);
});

test('Cache TTL Lab preserves state meaning with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: /^Lab/ }).click();

  const node = page.locator('.cache-node').first();
  await expect(node).toBeVisible();
  expect(await node.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
  await page.getByRole('button', { name: '今問い合わせる' }).click();
  await expect(page.getByLabel('次の問い合わせ経路: ANSWER CACHE HIT')).toBeVisible();
});

test('Story keeps Auto secondary and Explore/Compare/Lab remain available', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  const auto = page.getByRole('button', { name: 'Autoで見る' });
  await expect(auto).toBeVisible();
  await auto.click();
  await expect(page.getByRole('button', { name: 'Auto停止' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /Explore/ }).click();
  await expect(page.getByRole('button', { name: /Explore/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('142.250.0.1')).toBeVisible();

  await page.getByRole('button', { name: /^Lab/ }).click();
  await expect(page.getByRole('button', { name: /^Lab/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('CACHE / TTL LAB · SIMULATION')).toBeVisible();

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
    await expect(page.getByText('TOUCH TO HAND OFF')).toBeVisible();
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
    const trail = page.getByLabel('観測されたCNAME chain');
    await expect(trail).toBeVisible();
    await expect(trail.getByText(/A 140\.82\.112\.4/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /CANONICAL NAME github\.com/ })).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);
    expect(await hasPageVerticalScroll(page)).toBe(false);
  });

  test(`keeps Break DNS readable without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.getByRole('button', { name: /^Lab/ }).click();
    await page.getByRole('button', { name: /Break DNS/ }).click();
    await page.getByRole('button', { name: 'CNAME loopを作る' }).click();

    await expect(page.getByText('CNAME LOOP', { exact: true })).toBeVisible();
    await expect(page.getByText('visited name', { exact: true })).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test(`keeps Cache TTL Lab causal state readable without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.getByRole('button', { name: /^Lab/ }).click();

    await expect(page.getByRole('heading', { name: '同じ名前を、もう一度引いたら？' })).toBeVisible();
    await expect(page.getByLabel('次の問い合わせ経路: FULL RESOLUTION')).toBeVisible();
    await expect(page.getByRole('button', { name: '今問い合わせる' })).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);

    await page.getByRole('button', { name: '今問い合わせる' }).click();
    await expect(page.getByLabel('次の問い合わせ経路: ANSWER CACHE HIT')).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);
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
