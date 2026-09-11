const MAX_HOSTNAME_LENGTH = 253;
const MAX_LABEL_LENGTH = 63;

export function normalizeHostname(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('URLまたはドメインを入力してください。');
  }

  let url: URL;
  try {
    url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error('URLまたはドメインの形式を確認してください。');
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!hostname || hostname.length > MAX_HOSTNAME_LENGTH) {
    throw new Error('有効なDNSホスト名を入力してください。');
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')) {
    throw new Error('IPアドレスではなく、DNS名を入力してください。');
  }

  const labels = hostname.split('.');
  if (labels.length < 2) {
    throw new Error('TLDを含むDNS名を入力してください。');
  }

  for (const label of labels) {
    if (
      label.length === 0 ||
      label.length > MAX_LABEL_LENGTH ||
      label.startsWith('-') ||
      label.endsWith('-') ||
      !/^[a-z0-9-]+$/i.test(label)
    ) {
      throw new Error('DNS名に使用できない文字またはラベルがあります。');
    }
  }

  return hostname;
}

export function buildNamespaceCandidates(hostname: string): string[] {
  const labels = hostname.split('.');
  const candidates = ['.'];

  for (let index = labels.length - 1; index >= 0; index -= 1) {
    candidates.push(labels.slice(index).join('.'));
  }

  return candidates;
}

export function toFqdn(name: string): string {
  return name === '.' ? '.' : `${name.replace(/\.$/, '')}.`;
}
