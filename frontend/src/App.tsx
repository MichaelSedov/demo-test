import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Follower, FormValues, SimResult, SymbolCode } from './types';
import { mapResults, parseNum, validate } from './utils';
import { LeaderForm } from './LeaderForm';
import { FollowerCard } from './FollowerCard';
import { Results } from './Results';
import './styles.css';

const API_URL = 'http://localhost:4000/api';

function App() {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [results, setResults]     = useState<SimResult[] | null>(null);
  const [loading, setLoading]     = useState(false);
  const [form, setForm] = useState<FormValues>({
    symbol: 'BTCUSDT', side: 'BUY', qty: '0.5', price: '68000', leverage: '5', slippage: '15',
  });

  useEffect(() => {
    fetch(`${API_URL}/followers`).then((r) => r.json()).then(setFollowers);
  }, []);

  const set = (k: keyof FormValues, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const run = async () => {
    const { q, p, l, s } = validate(form);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/simulate-copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: form.symbol, side: form.side, quantity: q, price: p, leverage: l, slippageBps: s }),
      });
      const payload = await res.json();
      if (!res.ok) return;
      setResults(mapResults(payload.orders, followers, l));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap">
      <p className="eyebrow">DEMO</p>
      <h1 className="title">Copy Trading Simulator</h1>
      <p className="lede">Fire a leader order, then see exactly which followers copied it, how much capital each committed, and why the rest got blocked.</p>

      <div className="grid">
        <LeaderForm form={form} set={set} onRun={run} followers={followers} />

        <div className="card">
          <div className="card-h">
            <h2>Followers</h2>
            <span className="sub">{followers.length} mirroring this leader</span>
          </div>
          <div className="followers">
            {followers.map((f) => (
              <FollowerCard key={f.id} f={f} activeSymbol={form.symbol as SymbolCode}
                result={results?.find((r) => r.fo.id === f.id) ?? null} />
            ))}
          </div>
        </div>
      </div>

      {results ? (
        <Results results={results} form={form} />
      ) : (
        <div className="card results">
          <div className="empty">
            <div className="ic">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" />
              </svg>
            </div>
            <h3>No simulation yet</h3>
            <div>Set up the leader trade and hit <b style={{ color: 'var(--muted)' }}>Run simulation</b> to see copied orders, fill rate, and per-follower risk checks.</div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.3)', zIndex: 50 }}>
          <div style={{ color: 'var(--text)', fontSize: 14, background: 'var(--panel)', padding: '14px 22px', borderRadius: 12, border: '1px solid var(--line-2)' }}>
            Running simulation…
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
