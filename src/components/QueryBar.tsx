import type { FormEvent } from 'react';

interface QueryBarProps {
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function QueryBar({ value, loading, onChange, onSubmit }: QueryBarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="query-bar" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="dns-target">
        探索するURLまたはドメイン
      </label>
      <input
        id="dns-target"
        className="query-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="google.com"
        autoComplete="url"
        spellCheck={false}
      />
      <button className="query-button" type="submit" disabled={loading}>
        {loading ? '探索中…' : 'DNSを探索'}
      </button>
    </form>
  );
}
