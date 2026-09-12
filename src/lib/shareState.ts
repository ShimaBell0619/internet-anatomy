import { normalizeHostname } from './domain.ts';

export type ShareMode = 'story' | 'compare' | 'lab' | 'explore';
export type ShareLabSection = 'cache' | 'failure';

export interface ShareState {
  mode: ShareMode;
  host: string;
  left: string;
  right: string;
  lab: ShareLabSection;
}

export const DEFAULT_SHARE_STATE: ShareState = {
  mode: 'story',
  host: 'google.com',
  left: 'google.com',
  right: 'github.com',
  lab: 'cache',
};

const MODES = new Set<ShareMode>(['story', 'compare', 'lab', 'explore']);
const LAB_SECTIONS = new Set<ShareLabSection>(['cache', 'failure']);

export function parseShareState(search: string): ShareState {
  const params = new URLSearchParams(search);
  const requestedMode = params.get('mode') as ShareMode | null;
  const mode = requestedMode && MODES.has(requestedMode) ? requestedMode : DEFAULT_SHARE_STATE.mode;
  const requestedLab = params.get('lab') as ShareLabSection | null;

  return {
    mode,
    host: normalizeOrFallback(params.get('host'), DEFAULT_SHARE_STATE.host),
    left: normalizeOrFallback(params.get('left'), DEFAULT_SHARE_STATE.left),
    right: normalizeOrFallback(params.get('right'), DEFAULT_SHARE_STATE.right),
    lab: requestedLab && LAB_SECTIONS.has(requestedLab) ? requestedLab : DEFAULT_SHARE_STATE.lab,
  };
}

export function serializeShareState(state: ShareState): string {
  const params = new URLSearchParams();
  params.set('mode', state.mode);

  if (state.mode === 'compare') {
    params.set('left', normalizeOrFallback(state.left, DEFAULT_SHARE_STATE.left));
    params.set('right', normalizeOrFallback(state.right, DEFAULT_SHARE_STATE.right));
  } else {
    params.set('host', normalizeOrFallback(state.host, DEFAULT_SHARE_STATE.host));
    if (state.mode === 'lab') params.set('lab', state.lab);
  }

  return `?${params.toString()}`;
}

function normalizeOrFallback(value: string | null, fallback: string): string {
  if (!value) return fallback;
  try {
    return normalizeHostname(value);
  } catch {
    return fallback;
  }
}
