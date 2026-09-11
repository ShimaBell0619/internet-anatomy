import { buildAliasChain, type AliasChain } from './alias.ts';
import type { DnsExploration, DnsRecord, NamespaceStage } from './dns.ts';

export type StoryFocus =
  | { kind: 'stage'; index: number }
  | { kind: 'answer'; index: number };

export type StoryActor =
  | { id: 'client'; kind: 'client'; role: string; name: string; detail: string }
  | { id: 'resolver'; kind: 'resolver'; role: string; name: string; detail: string }
  | { id: `stage-${number}`; kind: 'stage'; role: string; name: string; detail: string; index: number }
  | { id: `alias-${number}`; kind: 'alias'; role: string; name: string; detail: string; hopIndex: number }
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

export interface AliasStoryTrail {
  kind: 'alias';
  queryName: string;
  hops: Array<{ ownerName: string; targetName: string }>;
  terminalName: string;
  terminalRecords: Array<{ name: string; type: string; data: string }>;
  outcome: AliasChain['outcome'];
  activeHop: number;
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
  visual?: AliasStoryTrail;
}

export function buildDnsStory(exploration: DnsExploration): DnsStoryStep[] {
  const stages = exploration.stages;
  const rootIndex = 0;
  const tldIndex = Math.min(1, Math.max(0, stages.length - 1));
  const delegatedStages = stages
    .map((stage, index) => ({ stage, index }))
    .filter(({ stage, index }) => index > tldIndex && stage.nameServers.length > 0);
  const authoritative = delegatedStages.at(-1);
  const aliasChain = buildAliasChain(exploration);
  const directAddress = exploration.answerRecords.find((record) => record.type === 'A' || record.type === 'AAAA');
  const hasAnswer = Boolean(aliasChain || directAddress);

  const client = clientActor(exploration.hostname);
  const resolver = resolverActor();
  const root = stageActor(stages[rootIndex], rootIndex, 'ROOT');
  const tld = stageActor(stages[tldIndex], tldIndex, 'TLD');
  const authority = authoritative
    ? stageActor(authoritative.stage, authoritative.index, 'AUTHORITATIVE')
    : null;
  const answer = answerActor(exploration, aliasChain);

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
      whyNext: aliasChain
        ? 'AnswerにはIPではなくCNAMEの別名参照が含まれています。次はその名前のバトンを追います。'
        : hasAnswer
          ? 'ここから得られたA / AAAAのAnswerを確認します。'
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

  if (aliasChain) {
    appendAliasSteps(steps, exploration, aliasChain, answer, client, root);
  } else {
    const answerIndex = directAddress ? exploration.answerRecords.indexOf(directAddress) : -1;
    steps.push({
      id: 'answer',
      eyebrow: 'DNS ANSWER',
      title: directAddress ? 'DNSの答えが見つかりました。' : 'DNSは「該当レコードなし」と答えることもあります。',
      question: directAddress ? `${exploration.hostname} について得られた最終Addressは？` : 'この問い合わせで返せるA / AAAA / CNAMEはある？',
      learned: directAddress
        ? `今回は${exploration.answerRecords.length}件のA / AAAA系Answerを観測しました。TTLはResolverがその回答を再利用できる時間の目安です。`
        : 'NOERRORでもA / AAAA / CNAMEが返らないNODATAがあります。これは名前自体が存在しないNXDOMAINとは別です。',
      whyNext: 'Resolverが得た結果を問い合わせ元へ返せば、DNSの役割は完了です。',
      focus: answerIndex >= 0
        ? { kind: 'answer', index: answerIndex }
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
  }

  const finalFocus = finalStoryFocus(exploration, aliasChain, authoritative?.index);
  steps.push({
    id: 'resolver-to-client',
    eyebrow: 'RECURSIVE RESOLVER → CLIENT',
    title: 'Answerが端末へ戻り、次の通信へ進めます。',
    question: 'Resolverが得た結果を最後に誰へ返す？',
    learned: aliasChain?.outcome === 'terminal-address'
      ? `ResolverはCNAMEの別名参照を追って得た${aliasChain.terminalName}のAddressを問い合わせ元へ返します。キャッシュが使える場合、次回も毎回Rootからたどるとは限りません。`
      : hasAnswer
        ? 'Resolverは観測されたAnswerを問い合わせ元へ返します。キャッシュが使える場合、次回も毎回Rootからたどるとは限りません。'
        : '該当レコードがなければ、そのレコード種別を使った接続先を端末へ返すことはできません。',
    whyNext: 'DNSの役割はここまでです。ExploreではNS / SOA / Answerの実データを詳しく確認できます。',
    focus: finalFocus,
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

function appendAliasSteps(
  steps: DnsStoryStep[],
  exploration: DnsExploration,
  chain: AliasChain,
  answer: StoryActor,
  client: StoryActor,
  root: StoryActor,
): void {
  const visualBase = aliasVisual(chain, 0);

  chain.hops.forEach((hop, index) => {
    const source = aliasActor(hop.ownerName, index, index === 0 ? 'ALIAS NAME' : 'CANONICAL NAME');
    const target = aliasActor(hop.targetName, index + 1, 'CANONICAL NAME');
    const recordIndex = exploration.answerRecords.indexOf(hop.record);
    const nextHop = chain.hops[index + 1];

    steps.push({
      id: `alias-${index}`,
      eyebrow: 'CNAME DETOUR',
      title: 'IPではなく、別のDNS名へのバトンが返りました。',
      question: `${hop.ownerName} のCNAMEが指している次の名前は？`,
      learned: `${hop.ownerName} のCNAMEは ${hop.targetName} を指しています。CNAMEはIPアドレスではなく、別のDNS名を示すレコードです。`,
      whyNext: nextHop
        ? `${hop.targetName} にもCNAMEが観測されているため、別名のチェーンをもう1段追います。`
        : chain.outcome === 'terminal-address'
          ? `次は ${chain.terminalName} が所有するA / AAAAレコードを確認します。`
          : chain.outcome === 'cycle'
            ? '同じ名前へ戻る参照が観測されたため、チェーンを有限に停止して循環を明示します。'
            : `${chain.terminalName} まで追えましたが、観測済みAnswerにはA / AAAAがありません。`,
      focus: recordIndex >= 0 ? { kind: 'answer', index: recordIndex } : { kind: 'stage', index: 0 },
      action: {
        instruction: 'CNAMEの行き先を追う',
        source,
        target,
        alternatives: compactAlternatives([
          alternative(answer, 'CNAME自体はIPアドレスではありません。まずRDATAが示す別のDNS名へバトンを渡します。'),
          alternative(client, 'Resolverは別名の解決を続けてから、最終結果をClientへ返します。'),
        ]),
      },
      visual: { ...visualBase, activeHop: index },
    });
  });

  const canonical = aliasActor(chain.terminalName, chain.hops.length, 'CANONICAL NAME');
  const terminalIndex = chain.terminalRecords[0]
    ? exploration.answerRecords.indexOf(chain.terminalRecords[0])
    : exploration.answerRecords.indexOf(chain.hops.at(-1)?.record as DnsRecord);

  steps.push({
    id: chain.outcome === 'terminal-address'
      ? 'alias-address'
      : chain.outcome === 'cycle'
        ? 'alias-cycle'
        : 'alias-no-address',
    eyebrow: chain.outcome === 'terminal-address' ? 'CANONICAL ADDRESS' : 'ALIAS OUTCOME',
    title: aliasOutcomeTitle(chain),
    question: aliasOutcomeQuestion(chain),
    learned: aliasOutcomeLesson(chain),
    whyNext: 'この観測結果をResolverが問い合わせ元へ返します。',
    focus: terminalIndex >= 0 ? { kind: 'answer', index: terminalIndex } : { kind: 'stage', index: 0 },
    action: {
      instruction: chain.outcome === 'terminal-address' ? '別名の先にあるAddressを選ぶ' : '別名チェーンの結果を確認する',
      source: canonical,
      target: answer,
      alternatives: compactAlternatives([
        alternative(root, '名前空間の委任を最初からやり直す段階ではありません。今は観測された別名チェーンの結果を確認します。'),
        alternative(client, 'Resolverが別名チェーンの結果を確認してからClientへ返します。'),
      ]),
    },
    visual: { ...visualBase, activeHop: chain.hops.length },
  });
}

function aliasVisual(chain: AliasChain, activeHop: number): AliasStoryTrail {
  return {
    kind: 'alias',
    queryName: chain.queryName,
    hops: chain.hops.map((hop) => ({ ownerName: hop.ownerName, targetName: hop.targetName })),
    terminalName: chain.terminalName,
    terminalRecords: chain.terminalRecords.map((record) => ({ name: record.name, type: record.type, data: record.data })),
    outcome: chain.outcome,
    activeHop,
  };
}

function clientActor(hostname: string): StoryActor {
  return { id: 'client', kind: 'client', role: 'CLIENT', name: 'Your device', detail: `${hostname} ?` };
}

function resolverActor(): StoryActor {
  return { id: 'resolver', kind: 'resolver', role: 'RECURSIVE RESOLVER', name: 'Resolver', detail: 'observed via Google Public DNS' };
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

function aliasActor(name: string, hopIndex: number, role: string): StoryActor {
  return {
    id: `alias-${hopIndex}`,
    kind: 'alias',
    role,
    name,
    detail: hopIndex === 0 ? 'CNAME owner' : 'name referenced by CNAME',
    hopIndex,
  };
}

function answerActor(exploration: DnsExploration, chain: AliasChain | null): StoryActor {
  if (chain?.outcome === 'terminal-address') {
    const first = chain.terminalRecords[0];
    return {
      id: 'answer',
      kind: 'answer',
      role: 'ADDRESS',
      name: first ? `${first.type} ${first.data}` : 'Address',
      detail: `${chain.terminalName} owns this record`,
    };
  }
  if (chain?.outcome === 'cycle') {
    return { id: 'answer', kind: 'answer', role: 'ALIAS RESULT', name: 'CNAME LOOP', detail: `cycle at ${chain.cycleAt ?? chain.terminalName}` };
  }
  if (chain) {
    return { id: 'answer', kind: 'answer', role: 'ALIAS RESULT', name: 'NO TERMINAL ADDRESS', detail: `${chain.terminalName} · no observed A/AAAA` };
  }

  const first = exploration.answerRecords.find((record) => record.type === 'A' || record.type === 'AAAA');
  return {
    id: 'answer',
    kind: 'answer',
    role: 'DNS ANSWER',
    name: first ? `${first.type} ${first.data}` : 'NODATA',
    detail: first ? `${exploration.answerRecords.length} record${exploration.answerRecords.length === 1 ? '' : 's'} observed` : 'NOERROR · no matching record',
  };
}

function aliasOutcomeTitle(chain: AliasChain): string {
  if (chain.outcome === 'terminal-address') return '別名の先で、接続先のAddressが見つかりました。';
  if (chain.outcome === 'cycle') return 'CNAMEが循環しているため、ここで追跡を止めます。';
  return '別名の先まで追えましたが、Addressは観測されませんでした。';
}

function aliasOutcomeQuestion(chain: AliasChain): string {
  if (chain.outcome === 'terminal-address') return `${chain.terminalName} が所有するA / AAAAはどれ？`;
  if (chain.outcome === 'cycle') return `${chain.cycleAt ?? chain.terminalName} へ戻るCNAMEをどう扱う？`;
  return `${chain.terminalName} まで追った結果は？`;
}

function aliasOutcomeLesson(chain: AliasChain): string {
  if (chain.outcome === 'terminal-address') {
    const summary = chain.terminalRecords.map((record) => `${record.type} ${record.data}`).join(' / ');
    return `${chain.terminalName} がownerのAddressを観測しました: ${summary}。元のalias名ではなく、canonical側の名前がこのA / AAAAを所有しています。`;
  }
  if (chain.outcome === 'cycle') {
    return `観測されたCNAMEチェーンが ${chain.cycleAt ?? chain.terminalName} へ戻りました。ループをIPへ置き換えず、循環として有限に停止します。`;
  }
  return `${chain.terminalName} までCNAMEを追えましたが、観測済みAnswerにその名前のA / AAAAはありません。接続先Addressを推測して補完しません。`;
}

function finalStoryFocus(exploration: DnsExploration, chain: AliasChain | null, authoritativeIndex: number | undefined): StoryFocus {
  const finalRecord = chain?.terminalRecords[0]
    ?? chain?.hops.at(-1)?.record
    ?? exploration.answerRecords.find((record) => record.type === 'A' || record.type === 'AAAA');
  const index = finalRecord ? exploration.answerRecords.indexOf(finalRecord) : -1;
  return index >= 0
    ? { kind: 'answer', index }
    : { kind: 'stage', index: authoritativeIndex ?? Math.max(0, exploration.stages.length - 1) };
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
  const observed = tld?.nameServers.length
    ? `${tld.fqdn} のNSを${tld.nameServers.length}件観測しています。`
    : `${tld?.fqdn ?? 'TLD'} のNSは観測できませんでした。`;
  return authoritative
    ? `${observed} TLDは最終IPを全部持つのではなく、${authoritative.fqdn} を担当するDNSへ責任を渡す手掛かりを提供します。`
    : `${observed} この観測では、さらに下位のNS委任点は確認できませんでした。`;
}
