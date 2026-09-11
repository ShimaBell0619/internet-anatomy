import type { DnsExploration, NamespaceStage } from './dns.ts';

export type StoryFocus =
  | { kind: 'stage'; index: number }
  | { kind: 'answer'; index: number };

export type StoryActor =
  | { id: 'client'; kind: 'client'; role: string; name: string; detail: string }
  | { id: 'resolver'; kind: 'resolver'; role: string; name: string; detail: string }
  | { id: `stage-${number}`; kind: 'stage'; role: string; name: string; detail: string; index: number }
  | { id: 'answer'; kind: 'answer'; role: string; name: string; detail: string };

export interface StoryAlternative {
  actor: StoryActor;
  explanation: string;
}

export interface StoryAction {
  instruction: string;
  source: StoryActor;
  target: StoryActor;
  alternatives: StoryAlternative[];
}

export interface DnsStoryStep {
  id: string;
  eyebrow: string;
  title: string;
  question: string;
  learned: string;
  whyNext: string;
  focus: StoryFocus;
  action: StoryAction;
}

export function buildDnsStory(exploration: DnsExploration): DnsStoryStep[] {
  const stages = exploration.stages;
  const rootIndex = 0;
  const tldIndex = Math.min(1, Math.max(0, stages.length - 1));
  const delegatedStages = stages
    .map((stage, index) => ({ stage, index }))
    .filter(({ stage, index }) => index > tldIndex && stage.nameServers.length > 0);
  const authoritative = delegatedStages.at(-1);
  const firstAnswer = exploration.answerRecords[0];

  const client = clientActor(exploration.hostname);
  const resolver = resolverActor();
  const root = stageActor(stages[rootIndex], rootIndex, 'ROOT');
  const tld = stageActor(stages[tldIndex], tldIndex, 'TLD');
  const authority = authoritative
    ? stageActor(authoritative.stage, authoritative.index, 'AUTHORITATIVE')
    : null;
  const answer = answerActor(exploration);

  const steps: DnsStoryStep[] = [
    {
      id: 'client-to-resolver',
      eyebrow: 'CLIENT → RECURSIVE RESOLVER',
      title: '端末は、まずResolverへ質問を預けます。',
      question: `${exploration.hostname} の行き先を知りたい。最初に誰へ渡す？`,
      learned: '端末は通常、設定されたRecursive Resolverへ名前解決を依頼します。このアプリはGoogle Public DNSの回答を観測窓として、その役割分担を説明しています。',
      whyNext: 'Resolverが手掛かりを持っていない想定なら、DNS名前空間の入口であるRootを確認します。',
      focus: { kind: 'stage', index: rootIndex },
      action: {
        instruction: '最初に質問を渡す相手を選ぶ',
        source: client,
        target: resolver,
        alternatives: compactAlternatives([
          alternative(root, '端末がRootへ直接たどるのではなく、通常はRecursive Resolverが名前解決を引き受けます。'),
          alternative(tld, 'TLDへ進むための判断もResolver側の仕事です。端末はまずResolverへ質問を渡します。'),
        ]),
      },
    },
    {
      id: 'root-referral',
      eyebrow: 'RECURSIVE RESOLVER → ROOT',
      title: 'Rootは、次の管理範囲を教えます。',
      question: `${exploration.hostname} の担当をまだ知らない。Resolverはどこから手掛かりを得る？`,
      learned: rootLesson(stages[rootIndex], stages[tldIndex]),
      whyNext: `${stages[tldIndex]?.fqdn ?? 'TLD'} を担当するDNSへ進む理由ができました。`,
      focus: { kind: 'stage', index: rootIndex },
      action: {
        instruction: 'Resolverが次に頼るDNSを選ぶ',
        source: resolver,
        target: root,
        alternatives: compactAlternatives([
          alternative(tld, `${tld.name} を誰が担当するかという手掛かりをまだ得ていません。まずRootから案内を受けます。`),
          authority && alternative(authority, '権威DNSへ直接進むには、その場所を示す委任情報がまだ足りません。'),
        ]),
      },
    },
    {
      id: 'tld-referral',
      eyebrow: 'RECURSIVE RESOLVER → TLD',
      title: 'TLDが、より具体的な管理者へつなぎます。',
      question: `Rootから${tld.name}の手掛かりを得た。次にどこへ聞く？`,
      learned: tldLesson(stages[tldIndex], authoritative?.stage),
      whyNext: authoritative
        ? `${authoritative.stage.fqdn} の権威情報へ進みます。`
        : '下位のNS委任点を観測できないため、現在得られている最終回答を確認します。',
      focus: { kind: 'stage', index: tldIndex },
      action: {
        instruction: 'Rootの案内を使って次へ進む',
        source: resolver,
        target: tld,
        alternatives: compactAlternatives([
          authority && alternative(authority, 'まだTLDから下位ゾーンへの委任を確認していません。順番に管理境界をたどります。'),
          alternative(answer, '最終Answerを見る前に、どのDNSがその名前を管理しているかを確認する段階です。'),
        ]),
      },
    },
  ];

  for (const { stage, index } of delegatedStages.slice(0, -1)) {
    const current = stageActor(stage, index, 'DELEGATION');
    steps.push({
      id: `delegation-${index}`,
      eyebrow: 'DELEGATION',
      title: '名前空間は、必要ならさらに委任されます。',
      question: `${exploration.hostname} に、さらに近い管理境界がある。次にどこへ進む？`,
      learned: `${stage.fqdn} でNSレコードを観測しました。これは下位の名前について次の管理境界がある手掛かりです。`,
      whyNext: 'より具体的な委任先があるため、ResolverはそのDNSゾーンへ進みます。',
      focus: { kind: 'stage', index },
      action: {
        instruction: '次の委任先を選ぶ',
        source: resolver,
        target: current,
        alternatives: compactAlternatives([
          alternative(answer, 'まだ最終回答を確認する前に、より具体的な委任先が観測されています。'),
          alternative(client, 'ClientはResolverから最終結果が返るのを待っている段階です。'),
        ]),
      },
    });
  }

  if (authoritative && authority) {
    steps.push({
      id: 'authoritative-zone',
      eyebrow: 'RECURSIVE RESOLVER → AUTHORITATIVE DNS',
      title: '名前の答えを持つ権威情報へ到達します。',
      question: `${exploration.hostname} のレコードを最も具体的に管理している観測地点は？`,
      learned: `${authoritative.stage.fqdn} でNS${authoritative.stage.nameServers.length}件${authoritative.stage.soa ? 'とSOA' : ''}を観測しました。このStoryでは最も具体的な観測済み委任ゾーンを権威情報の到達点として扱います。`,
      whyNext: firstAnswer
        ? 'ここから得られたA / AAAA / CNAMEなどのAnswerを確認します。'
        : '問い合わせが成功しても、要求したA / AAAA / CNAMEがないNODATAの場合があります。',
      focus: { kind: 'stage', index: authoritative.index },
      action: {
        instruction: '最も具体的な管理者を選ぶ',
        source: resolver,
        target: authority,
        alternatives: compactAlternatives([
          alternative(answer, 'Answerを読む前に、その名前を管理している観測済みゾーンへ到達します。'),
          alternative(client, 'Clientへ返すのは、ResolverがAnswerを得た後です。'),
        ]),
      },
    });
  }

  steps.push({
    id: 'answer',
    eyebrow: 'DNS ANSWER',
    title: firstAnswer ? 'DNSの答えが見つかりました。' : 'DNSは「該当レコードなし」と答えることもあります。',
    question: firstAnswer ? `${exploration.hostname} について得られた最終Answerは？` : 'この問い合わせで返せるA / AAAA / CNAMEはある？',
    learned: firstAnswer
      ? `今回は${exploration.answerRecords.length}件のA / AAAA / CNAME系Answerを観測しました。TTLはResolverがその回答を再利用できる時間の目安です。`
      : 'NOERRORでもA / AAAA / CNAMEが返らないNODATAがあります。これは名前自体が存在しないNXDOMAINとは別です。',
    whyNext: 'Resolverが得た結果を問い合わせ元へ返せば、DNSの役割は完了です。',
    focus: firstAnswer
      ? { kind: 'answer', index: 0 }
      : { kind: 'stage', index: authoritative?.index ?? Math.max(0, stages.length - 1) },
    action: {
      instruction: 'Resolverが持ち帰るAnswerを選ぶ',
      source: authority ?? resolver,
      target: answer,
      alternatives: compactAlternatives([
        alternative(root, 'Rootへ戻る必要はありません。Resolverはすでに名前のAnswerまで到達しています。'),
        alternative(client, 'Clientへ返す直前に、まずResolverがAnswerを受け取ります。'),
      ]),
    },
  });

  steps.push({
    id: 'resolver-to-client',
    eyebrow: 'RECURSIVE RESOLVER → CLIENT',
    title: 'Answerが端末へ戻り、次の通信へ進めます。',
    question: 'Resolverが得た結果を最後に誰へ返す？',
    learned: firstAnswer
      ? 'Resolverは観測されたAnswerを問い合わせ元へ返します。キャッシュが使える場合、次回も毎回Rootからたどるとは限りません。'
      : '該当レコードがなければ、そのレコード種別を使った接続先を端末へ返すことはできません。',
    whyNext: 'DNSの役割はここまでです。ExploreではNS / SOA / Answerの実データを詳しく確認できます。',
    focus: firstAnswer
      ? { kind: 'answer', index: 0 }
      : { kind: 'stage', index: authoritative?.index ?? Math.max(0, stages.length - 1) },
    action: {
      instruction: 'Answerを問い合わせ元へ返す',
      source: resolver,
      target: client,
      alternatives: compactAlternatives([
        alternative(root, '名前解決は完了しているのでRootへ戻る必要はありません。'),
        alternative(tld, 'TLDへの問い合わせも完了済みです。今は結果をClientへ返す段階です。'),
      ]),
    },
  });

  return steps;
}

function clientActor(hostname: string): StoryActor {
  return {
    id: 'client',
    kind: 'client',
    role: 'CLIENT',
    name: 'Your device',
    detail: `${hostname} ?`,
  };
}

function resolverActor(): StoryActor {
  return {
    id: 'resolver',
    kind: 'resolver',
    role: 'RECURSIVE RESOLVER',
    name: 'Resolver',
    detail: 'observed via Google Public DNS',
  };
}

function stageActor(stage: NamespaceStage | undefined, index: number, fallbackRole: string): StoryActor {
  return {
    id: `stage-${index}`,
    kind: 'stage',
    role: stage?.kind === 'root' ? 'ROOT' : stage?.kind === 'tld' ? 'TLD' : fallbackRole,
    name: stage?.fqdn ?? 'unobserved',
    detail: stage?.nameServers.length ? `${stage.nameServers.length} NS observed` : 'namespace observed',
    index,
  };
}

function answerActor(exploration: DnsExploration): StoryActor {
  const first = exploration.answerRecords[0];
  return {
    id: 'answer',
    kind: 'answer',
    role: 'DNS ANSWER',
    name: first ? `${first.type} ${first.data}` : 'NODATA',
    detail: first ? `${exploration.answerRecords.length} record${exploration.answerRecords.length === 1 ? '' : 's'} observed` : 'NOERROR · no matching record',
  };
}

function alternative(actor: StoryActor, explanation: string): StoryAlternative {
  return { actor, explanation };
}

function compactAlternatives(items: Array<StoryAlternative | null | undefined>): StoryAlternative[] {
  const seen = new Set<string>();
  const result: StoryAlternative[] = [];
  for (const item of items) {
    if (!item || seen.has(item.actor.id)) continue;
    seen.add(item.actor.id);
    result.push(item);
    if (result.length === 2) break;
  }
  return result;
}

function rootLesson(root: NamespaceStage | undefined, tld: NamespaceStage | undefined): string {
  const observed = root?.nameServers.length
    ? `RootのNSを${root.nameServers.length}件観測しています。`
    : 'RootのNS情報はこの問い合わせでは観測できませんでした。';
  return `${observed} Rootは個々のサイトのIPを全部持つ場所ではなく、${tld?.fqdn ?? 'TLD'}を担当する側へ案内する役割です。`;
}

function tldLesson(tld: NamespaceStage | undefined, authoritative: NamespaceStage | undefined): string {
  if (!tld) {
    return 'TLD段階を個別には観測できませんでした。';
  }
  const destination = authoritative?.fqdn ?? 'より具体的なDNSゾーン';
  return `${tld.fqdn}はトップレベルドメイン側のDNS階層です。最終IPを直接管理するのではなく、${destination}のような下位ゾーンへ責任を渡します。`;
}
