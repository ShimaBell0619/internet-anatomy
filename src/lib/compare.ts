import type { DnsExploration, DnsRecord, NamespaceStage } from './dns.ts';

export type DnsDivergenceKind = 'same-target' | 'tld' | 'delegation';

export interface SharedDnsStage {
  fqdn: string;
  kind: NamespaceStage['kind'];
  leftNameServerCount: number;
  rightNameServerCount: number;
}

export interface DnsComparisonBranch {
  hostname: string;
  stages: NamespaceStage[];
  observedDelegationZone: string | null;
  answerRecords: DnsRecord[];
}

export interface DnsComparison {
  left: DnsComparisonBranch;
  right: DnsComparisonBranch;
  sharedStages: SharedDnsStage[];
  divergence: {
    kind: DnsDivergenceKind;
    sharedThrough: string | null;
    leftNext: string | null;
    rightNext: string | null;
  };
  title: string;
  explanation: string;
}

export function buildDnsComparison(left: DnsExploration, right: DnsExploration): DnsComparison {
  const sharedCount = countSharedStages(left.stages, right.stages);
  const sharedStages = left.stages.slice(0, sharedCount).map((stage, index) => ({
    fqdn: stage.fqdn,
    kind: stage.kind,
    leftNameServerCount: stage.nameServers.length,
    rightNameServerCount: right.stages[index]?.nameServers.length ?? 0,
  }));
  const leftBranchStages = left.stages.slice(sharedCount);
  const rightBranchStages = right.stages.slice(sharedCount);
  const sharedThrough = sharedStages.at(-1)?.fqdn ?? null;
  const leftNext = leftBranchStages[0]?.fqdn ?? null;
  const rightNext = rightBranchStages[0]?.fqdn ?? null;
  const kind = divergenceKind(left, right, sharedCount);

  return {
    left: branch(left, leftBranchStages),
    right: branch(right, rightBranchStages),
    sharedStages,
    divergence: { kind, sharedThrough, leftNext, rightNext },
    title: comparisonTitle(kind, sharedThrough),
    explanation: comparisonExplanation(kind, sharedThrough, leftNext, rightNext),
  };
}

function countSharedStages(left: NamespaceStage[], right: NamespaceStage[]): number {
  const limit = Math.min(left.length, right.length);
  let count = 0;

  while (count < limit && left[count]?.fqdn === right[count]?.fqdn) {
    count += 1;
  }

  return count;
}

function divergenceKind(
  left: DnsExploration,
  right: DnsExploration,
  sharedCount: number,
): DnsDivergenceKind {
  if (left.hostname === right.hostname) {
    return 'same-target';
  }

  return sharedCount <= 1 ? 'tld' : 'delegation';
}

function branch(exploration: DnsExploration, stages: NamespaceStage[]): DnsComparisonBranch {
  const observedDelegationZone = [...stages]
    .reverse()
    .find((stage) => stage.nameServers.length > 0)?.fqdn ?? null;

  return {
    hostname: exploration.hostname,
    stages,
    observedDelegationZone,
    answerRecords: exploration.answerRecords,
  };
}

function comparisonTitle(kind: DnsDivergenceKind, sharedThrough: string | null): string {
  if (kind === 'same-target') {
    return '同じ名前を比べています。DNS責任の経路も同じです。';
  }

  if (kind === 'tld') {
    return 'Rootまでは共通。TLDから責任が分かれます。';
  }

  return `${sharedThrough ?? '上位DNS'} までは共通。次の委任で責任が分かれます。`;
}

function comparisonExplanation(
  kind: DnsDivergenceKind,
  sharedThrough: string | null,
  leftNext: string | null,
  rightNext: string | null,
): string {
  if (kind === 'same-target') {
    return '入力が同一なので、共有部分と分岐部分の差は生まれません。別のドメインを指定すると責任境界を比較できます。';
  }

  if (kind === 'tld') {
    return `Rootは共通ですが、次に進むTLDが ${leftNext ?? '一方のTLD'} と ${rightNext ?? 'もう一方のTLD'} に分かれます。TLDが違えば、その時点から別のDNS管理階層へ進みます。`;
  }

  return `${sharedThrough ?? '上位のDNS階層'} までは同じ名前空間を共有しています。その次に ${leftNext ?? '一方のゾーン'} と ${rightNext ?? 'もう一方のゾーン'} へ分かれるため、ここが2つの名前でDNS責任が別々になる最初の地点です。`;
}
