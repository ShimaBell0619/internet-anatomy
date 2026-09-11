import type { DnsExploration, NamespaceStage } from './dns.ts';

export type StoryFocus =
  | { kind: 'stage'; index: number }
  | { kind: 'answer'; index: number };

export interface DnsStoryStep {
  id: string;
  eyebrow: string;
  title: string;
  question: string;
  learned: string;
  whyNext: string;
  focus: StoryFocus;
}

export function buildDnsStory(exploration: DnsExploration): DnsStoryStep[] {
  const stages = exploration.stages;
  const rootIndex = 0;
  const tldIndex = Math.min(1, Math.max(0, stages.length - 1));
  const delegatedStages = stages
    .map((stage, index) => ({ stage, index }))
    .filter(({ stage, index }) => index > tldIndex && stage.nameServers.length > 0);
  const authoritative = delegatedStages.at(-1) ?? deepestObservedZone(stages);
  const firstAnswer = exploration.answerRecords[0];

  const steps: DnsStoryStep[] = [
    {
      id: 'client-to-resolver',
      eyebrow: 'CLIENT → RECURSIVE RESOLVER',
      title: 'まず、端末は「全部」を調べません。',
      question: `${exploration.hostname} の行き先を知りたい。`,
      learned:
        '一般的な名前解決では、端末は設定されたRecursive Resolverへ質問し、Resolverが必要なDNS情報を集めます。このアプリはGoogle Public DNSの回答を材料に、その役割分担を再構成しています。',
      whyNext: 'Resolverが最終回答をまだ持っていない想定なら、DNS名前空間の入口であるRootから手掛かりを探します。',
      focus: { kind: 'stage', index: rootIndex },
    },
    {
      id: 'root-referral',
      eyebrow: 'RECURSIVE RESOLVER → ROOT',
      title: 'RootはIPではなく、次の案内先を返します。',
      question: `${exploration.hostname} を知っている場所は？`,
      learned: rootLesson(stages[rootIndex], stages[tldIndex]),
      whyNext: `${stages[tldIndex]?.fqdn ?? 'TLD'} を担当するDNSへ問い合わせる理由ができました。`,
      focus: { kind: 'stage', index: rootIndex },
    },
    {
      id: 'tld-referral',
      eyebrow: 'RECURSIVE RESOLVER → TLD',
      title: 'TLDは、より具体的な管理者へつなぎます。',
      question: `${exploration.hostname} の権威情報はどこにある？`,
      learned: tldLesson(stages[tldIndex], authoritative?.stage),
      whyNext: authoritative
        ? `${authoritative.stage.fqdn} の権威情報へ進みます。`
        : '観測できた最も具体的なDNS情報へ進みます。',
      focus: { kind: 'stage', index: tldIndex },
    },
  ];

  for (const { stage, index } of delegatedStages.slice(0, -1)) {
    steps.push({
      id: `delegation-${index}`,
      eyebrow: 'DELEGATION',
      title: '名前空間は、必要ならさらに委任されます。',
      question: `${exploration.hostname} に、さらに近い権威DNSは？`,
      learned: `${stage.fqdn} でNSレコードを観測しました。これは、このDNSゾーンが下位の名前について次の管理境界を持つ手掛かりです。`,
      whyNext: 'より具体的な委任先があるため、Resolverは次のDNSゾーンへ進みます。',
      focus: { kind: 'stage', index },
    });
  }

  if (authoritative) {
    steps.push({
      id: 'authoritative-zone',
      eyebrow: 'RECURSIVE RESOLVER → AUTHORITATIVE DNS',
      title: 'ここで、名前の答えを持つ権威DNSへ到達します。',
      question: `${exploration.hostname} のレコードは？`,
      learned: `${authoritative.stage.fqdn} ではNS${authoritative.stage.nameServers.length}件${authoritative.stage.soa ? 'とSOA' : ''}を観測しました。このアプリでは、観測できた最も具体的な委任ゾーンを権威情報の到達点として説明しています。`,
      whyNext: firstAnswer
        ? `権威情報から得られた ${firstAnswer.type} などの最終回答を確認します。`
        : '問い合わせ自体は成功しても、要求したA / AAAA / CNAMEが存在しないNODATAの場合があります。',
      focus: { kind: 'stage', index: authoritative.index },
    });
  }

  steps.push({
    id: 'answer',
    eyebrow: 'DNS ANSWER',
    title: firstAnswer ? '名前が、接続に使える答えへ変わります。' : 'DNSは「該当レコードなし」と答えることもあります。',
    question: `${exploration.hostname} の最終回答は？`,
    learned: firstAnswer
      ? `今回は ${firstAnswer.type} ${firstAnswer.data} を含む${exploration.answerRecords.length}件の回答を観測しました。TTLはResolverが回答を再利用できる時間の目安です。`
      : 'NOERRORでもA / AAAA / CNAMEが返らないことがあります。これは名前自体が存在しないNXDOMAINとは別の状態です。',
    whyNext: '最後に、Resolverが得た結果を問い合わせ元へ返すことで、名前解決の役割が完了します。',
    focus: firstAnswer
      ? { kind: 'answer', index: 0 }
      : { kind: 'stage', index: authoritative?.index ?? Math.max(0, stages.length - 1) },
  });

  steps.push({
    id: 'resolver-to-client',
    eyebrow: 'RECURSIVE RESOLVER → CLIENT',
    title: 'Resolverが答えを返し、次の通信へ進めます。',
    question: '端末が最終的に受け取るものは？',
    learned: firstAnswer
      ? `端末側は ${firstAnswer.data} のような回答を受け取り、次のTCP / QUIC / TLSなどの接続処理へ進めます。ResolverはTTLに従って回答をキャッシュできるため、毎回Rootから辿るとは限りません。`
      : '該当レコードがなければ、端末はそのレコード種別を使った接続先を得られません。',
    whyNext: 'DNSの役割はここまでです。Exploreへ切り替えると、各NS / SOA / Answer recordを詳細に確認できます。',
    focus: firstAnswer
      ? { kind: 'answer', index: 0 }
      : { kind: 'stage', index: authoritative?.index ?? Math.max(0, stages.length - 1) },
  });

  return steps;
}

function deepestObservedZone(stages: NamespaceStage[]) {
  for (let index = stages.length - 1; index >= 0; index -= 1) {
    if (stages[index]?.nameServers.length) {
      return { stage: stages[index], index };
    }
  }
  return stages[0] ? { stage: stages[0], index: 0 } : undefined;
}

function rootLesson(root: NamespaceStage | undefined, tld: NamespaceStage | undefined): string {
  const observed = root?.nameServers.length
    ? `RootのNSを${root.nameServers.length}件観測しています。`
    : 'RootのNS情報はこの問い合わせでは観測できませんでした。';
  return `${observed} Rootの仕事は個々のサイトのIPを全部保持することではなく、${tld?.fqdn ?? 'TLD'} のようなトップレベルドメインを担当する側へ案内することです。`;
}

function tldLesson(tld: NamespaceStage | undefined, authoritative: NamespaceStage | undefined): string {
  if (!tld) {
    return 'TLD段階を個別には観測できませんでした。';
  }
  const destination = authoritative?.fqdn ?? 'より具体的なDNSゾーン';
  return `${tld.fqdn} はトップレベルドメイン側のDNS階層です。最終IPを直接管理するのではなく、${destination} のような下位ゾーンを担当するName Serverへ委任します。`;
}
