export type FailureScenario = 'working' | 'nodata' | 'nxdomain' | 'missing-delegation' | 'cname-loop';

export interface FailurePathNode {
  role: string;
  name: string;
  tone: 'normal' | 'stop' | 'loop';
}

export interface FailureLabModel {
  scenario: FailureScenario;
  status: string;
  title: string;
  explanation: string;
  distinction: string;
  nodes: FailurePathNode[];
}

export function buildFailureLabModel(hostname: string, scenario: FailureScenario): FailureLabModel {
  const tld = hostname.split('.').at(-1) ?? 'tld';
  const base: FailurePathNode[] = [
    node('CLIENT', 'Your device'),
    node('RESOLVER', 'Recursive resolver'),
    node('ROOT', '.'),
    node('TLD', tld),
  ];

  if (scenario === 'nodata') {
    return {
      scenario,
      status: 'NOERROR / NODATA',
      title: '名前はある。でも、求めたA / AAAAがない。',
      explanation: `${hostname} という名前の管理先までは到達できますが、この模型ではA / AAAAを外しています。DNS応答自体はNOERRORで、要求したレコード種別だけが空です。`,
      distinction: 'NXDOMAINとは違い、名前そのものが存在しないとは言っていません。',
      nodes: [...base, node('AUTHORITATIVE', hostname), node('NODATA', 'NO A / AAAA', 'stop')],
    };
  }

  if (scenario === 'nxdomain') {
    return {
      scenario,
      status: 'NXDOMAIN',
      title: 'その名前自体が存在しない。',
      explanation: `${hostname} を存在しない名前として扱う模型です。権威側まで確認した結果、要求した名前そのものがないという否定応答で終了します。`,
      distinction: 'NODATAは名前が存在してレコード種別だけがない状態。NXDOMAINは名前そのものが存在しない状態です。',
      nodes: [...base, node('AUTHORITATIVE', 'closest enclosing zone'), node('NXDOMAIN', `${hostname} does not exist`, 'stop')],
    };
  }

  if (scenario === 'missing-delegation') {
    return {
      scenario,
      status: 'DELEGATION MISSING',
      title: '次の管理者を示す手掛かりがなく、ここで止まる。',
      explanation: `${tld} 側から ${hostname} を担当する下位DNSへの委任情報を外した模型です。Resolverは次に問い合わせる権威DNSを決められません。`,
      distinction: 'これは「Aレコードがない」のではなく、答えを持つ管理境界へ到達するための委任手掛かりがない状態です。',
      nodes: [...base, node('STOP', 'no delegation clue', 'stop')],
    };
  }

  if (scenario === 'cname-loop') {
    const aliasA = hostname;
    const aliasB = `alias.${hostname}`;
    return {
      scenario,
      status: 'CNAME LOOP',
      title: '別名が、すでに通った名前へ戻ってくる。',
      explanation: `${aliasA} → ${aliasB} → ${aliasA} というCNAME循環を作った模型です。訪問済みの名前へ戻った時点で有限に停止します。`,
      distinction: 'CNAMEは別名を追うためのレコードですが、循環しても無限に追跡してはいけません。',
      nodes: [
        ...base,
        node('AUTHORITATIVE', hostname),
        node('ALIAS', aliasA),
        node('CNAME', aliasB),
        node('CNAME', aliasA, 'loop'),
        node('STOP', 'visited name', 'stop'),
      ],
    };
  }

  return {
    scenario,
    status: 'WORKING',
    title: '委任をたどり、最後にAddressへ到達する。',
    explanation: `${hostname} の正常な小型模型です。Root → TLD → Authoritative DNSの順に責任をたどり、最後にA / AAAAへ到達します。`,
    distinction: 'ここから1つだけ条件を変えて、どの地点で意味が変わるかを観察します。',
    nodes: [...base, node('AUTHORITATIVE', hostname), node('ANSWER', 'A / AAAA')],
  };
}

function node(role: string, name: string, tone: FailurePathNode['tone'] = 'normal'): FailurePathNode {
  return { role, name, tone };
}
