import { buildNamespaceCandidates, normalizeHostname, toFqdn } from './domain.ts';

const GOOGLE_DOH_ENDPOINT = 'https://dns.google/resolve';

const TYPE_NAMES: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  6: 'SOA',
  28: 'AAAA',
};

const DNS_STATUS_NAMES: Record<number, string> = {
  1: 'FORMERR',
  2: 'SERVFAIL',
  3: 'NXDOMAIN',
  4: 'NOTIMP',
  5: 'REFUSED',
};

export interface GoogleDnsRecord {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

export interface GoogleDnsResponse {
  Status: number;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question?: Array<{ name: string; type: number }>;
  Answer?: GoogleDnsRecord[];
  Authority?: GoogleDnsRecord[];
  Comment?: string;
}

export interface DnsRecord {
  name: string;
  type: string;
  ttl: number;
  data: string;
}

export interface NamespaceStage {
  name: string;
  fqdn: string;
  kind: 'root' | 'tld' | 'namespace' | 'host';
  nameServers: DnsRecord[];
  soa: DnsRecord | null;
}

export interface DnsExploration {
  hostname: string;
  stages: NamespaceStage[];
  answerRecords: DnsRecord[];
  authoritativeZone: string | null;
  elapsedMs: number;
  resolver: 'Google Public DNS';
}

export async function queryGoogleDns(
  name: string,
  type: 'A' | 'AAAA' | 'CNAME' | 'NS' | 'SOA',
  signal?: AbortSignal,
): Promise<GoogleDnsResponse> {
  const url = new URL(GOOGLE_DOH_ENDPOINT);
  url.searchParams.set('name', toFqdn(name));
  url.searchParams.set('type', type);
  url.searchParams.set('edns_client_subnet', '0.0.0.0/0');

  const response = await fetch(url, {
    headers: { accept: 'application/dns-json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`DNS問い合わせに失敗しました (HTTP ${response.status})。`);
  }

  return (await response.json()) as GoogleDnsResponse;
}

export function assertDnsResponseStatus(
  response: GoogleDnsResponse,
  context: string,
  allowNxDomain = false,
): void {
  if (response.Status === 0 || (allowNxDomain && response.Status === 3)) {
    return;
  }

  const statusName = DNS_STATUS_NAMES[response.Status] ?? 'UNKNOWN';
  throw new Error(`${context} のDNS応答が ${statusName} (${response.Status}) でした。`);
}

export function extractRecords(response: GoogleDnsResponse): DnsRecord[] {
  return (response.Answer ?? []).map((record) => ({
    name: record.name,
    type: TYPE_NAMES[record.type] ?? `TYPE${record.type}`,
    ttl: record.TTL,
    data: record.data,
  }));
}

export async function exploreDns(input: string, signal?: AbortSignal): Promise<DnsExploration> {
  const hostname = normalizeHostname(input);
  const startedAt = performance.now();
  const candidates = buildNamespaceCandidates(hostname);

  const nsResponses = await Promise.all(
    candidates.map((name) => queryGoogleDns(name, 'NS', signal)),
  );

  nsResponses.forEach((response, index) => {
    assertDnsResponseStatus(response, `${toFqdn(candidates[index])} NS`, true);
  });

  const nsByCandidate = nsResponses.map((response) =>
    extractRecords(response).filter((record) => record.type === 'NS'),
  );

  const soaResponses = await Promise.all(
    candidates.map(async (name, index) => {
      if (nsByCandidate[index].length === 0) {
        return null;
      }

      const response = await queryGoogleDns(name, 'SOA', signal);
      assertDnsResponseStatus(response, `${toFqdn(name)} SOA`);
      return response;
    }),
  );

  const stages: NamespaceStage[] = candidates.map((name, index) => {
    const soaRecord = soaResponses[index]
      ? extractRecords(soaResponses[index] as GoogleDnsResponse).find((record) => record.type === 'SOA') ?? null
      : null;

    return {
      name,
      fqdn: toFqdn(name),
      kind:
        index === 0
          ? 'root'
          : index === 1
            ? 'tld'
            : index === candidates.length - 1
              ? 'host'
              : 'namespace',
      nameServers: nsByCandidate[index],
      soa: soaRecord,
    };
  });

  const [aResponse, aaaaResponse, cnameResponse] = await Promise.all([
    queryGoogleDns(hostname, 'A', signal),
    queryGoogleDns(hostname, 'AAAA', signal),
    queryGoogleDns(hostname, 'CNAME', signal),
  ]);

  const answerResponses = [
    ['A', aResponse],
    ['AAAA', aaaaResponse],
    ['CNAME', cnameResponse],
  ] as const;

  if (answerResponses.every(([, response]) => response.Status === 3)) {
    throw new Error(`${hostname} はDNS上に存在しません (NXDOMAIN)。`);
  }

  answerResponses.forEach(([type, response]) => {
    assertDnsResponseStatus(response, `${toFqdn(hostname)} ${type}`);
  });

  const answerRecords = deduplicateRecords([
    ...extractRecords(aResponse),
    ...extractRecords(aaaaResponse),
    ...extractRecords(cnameResponse),
  ]).filter((record) => ['A', 'AAAA', 'CNAME'].includes(record.type));

  const authoritativeStage = [...stages]
    .reverse()
    .find((stage) => stage.nameServers.length > 0);

  return {
    hostname,
    stages,
    answerRecords,
    authoritativeZone: authoritativeStage?.fqdn ?? null,
    elapsedMs: Math.max(0, performance.now() - startedAt),
    resolver: 'Google Public DNS',
  };
}

function deduplicateRecords(records: DnsRecord[]): DnsRecord[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = `${record.name}|${record.type}|${record.data}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
