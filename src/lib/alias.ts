import type { DnsExploration, DnsRecord } from './dns.ts';

export interface AliasHop {
  record: DnsRecord;
  ownerName: string;
  targetName: string;
}

export interface AliasChain {
  queryName: string;
  hops: AliasHop[];
  terminalName: string;
  terminalRecords: DnsRecord[];
  outcome: 'terminal-address' | 'alias-without-address' | 'cycle';
  cycleAt: string | null;
}

export function buildAliasChain(exploration: DnsExploration): AliasChain | null {
  const cnameByOwner = new Map<string, DnsRecord>();
  const addressesByOwner = new Map<string, DnsRecord[]>();

  for (const record of exploration.answerRecords) {
    const owner = normalizeDnsName(record.name);
    if (record.type === 'CNAME' && !cnameByOwner.has(owner)) {
      cnameByOwner.set(owner, record);
      continue;
    }
    if (record.type === 'A' || record.type === 'AAAA') {
      const records = addressesByOwner.get(owner) ?? [];
      records.push(record);
      addressesByOwner.set(owner, records);
    }
  }

  const queryName = normalizeDnsName(exploration.hostname);
  if (!cnameByOwner.has(queryName)) return null;

  const hops: AliasHop[] = [];
  const visited = new Set<string>();
  let current = queryName;

  while (true) {
    if (visited.has(current)) {
      return {
        queryName,
        hops,
        terminalName: current,
        terminalRecords: [],
        outcome: 'cycle',
        cycleAt: current,
      };
    }
    visited.add(current);

    const cname = cnameByOwner.get(current);
    if (!cname) break;

    const target = normalizeDnsName(cname.data);
    hops.push({
      record: cname,
      ownerName: current,
      targetName: target,
    });
    current = target;

    if (hops.length > exploration.answerRecords.length) {
      return {
        queryName,
        hops,
        terminalName: current,
        terminalRecords: [],
        outcome: 'cycle',
        cycleAt: current,
      };
    }
  }

  const terminalRecords = addressesByOwner.get(current) ?? [];
  return {
    queryName,
    hops,
    terminalName: current,
    terminalRecords,
    outcome: terminalRecords.length > 0 ? 'terminal-address' : 'alias-without-address',
    cycleAt: null,
  };
}

export function normalizeDnsName(value: string): string {
  return value.trim().replace(/\.+$/, '').toLowerCase();
}
