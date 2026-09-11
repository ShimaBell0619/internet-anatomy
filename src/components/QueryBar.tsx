import type { FormEvent } from 'react';

interface QueryBarProps {
  value: string;
  loading: boolean;
  compact?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function QueryBar({ value, loading, compact = false, onChange, onSubmit }: QueryBarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      className={compact ? 'grid grid-cols-[minmax(0,1fr)_auto] gap-2 self-end' : 'query-bar'}
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="dns-target">
        探索するURLまたはドメイン
      </label>
      <input
        id="dns-target"
        className={compact
          ? 'h-11 min-w-0 rounded-[5px] border border-[var(--color-ink-700)] bg-[var(--color-ink-900)] px-3 font-mono text-[13px] text-[var(--color-paper-50)]'
          : 'query-input'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="google.com"
        autoComplete="url"
        spellCheck={false}
      />
      <button
        className={compact
          ? 'min-h-11 rounded-[5px] border border-[var(--color-signal)] bg-[var(--color-signal)] px-4 text-[11px] font-bold whitespace-nowrap text-[#07231d] disabled:cursor-progress disabled:opacity-55 max-[560px]:px-3 max-[560px]:text-[10px]'
          : 'query-button'}
        type="submit"
        disabled={loading}
      >
        {loading ? '探索中…' : compact ? '再探索' : 'DNSを探索'}
      </button>
    </form>
  );
}
