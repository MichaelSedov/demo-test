import React, { useState } from 'react';
import { FormValues, SimResult } from './types';
import { validate, usd, usd0, fmtQty } from './utils';
import { Cross, Check, IconI, Chevron } from './icons';

// ── ReasonList ────────────────────────────────────────────────────────────────

function ReasonList({ reasons }: { reasons: SimResult['reasons'] }) {
  return (
    <div className="reasons">
      {reasons.map((re, i) => (
        <div className="reason" key={i}>
          <span className="rx"><Cross /></span>
          <span>{re.text}</span>
        </div>
      ))}
    </div>
  );
}

// ── UtilBlock ─────────────────────────────────────────────────────────────────

function UtilBlock({ r }: { r: SimResult }) {
  return (
    <div className="util-mini">
      <div className="l">
        <span>Margin {usd(r.order.marginRequired)} / balance {usd0(r.fo.availableBalance)}</span>
        <b>{(r.util * 100).toFixed(1)}%</b>
      </div>
      <div className="meter">
        <i style={{ width: (r.util * 100) + '%', background: r.util > 0.8 ? 'var(--amber)' : 'var(--green)' }} />
      </div>
    </div>
  );
}

// ── StatusCell ────────────────────────────────────────────────────────────────

function StatusCell({ r }: { r: SimResult }) {
  const badge = r.accepted
    ? <span className="badge ok"><span className="d" /> Accepted</span>
    : <span className="badge no"><span className="d" /> Rejected</span>;

  const label = r.accepted
    ? <>{(r.util * 100).toFixed(1)}% margin</>
    : <>{r.reasons.length} risk {r.reasons.length === 1 ? 'check' : 'checks'}</>;

  const detail = r.accepted ? <UtilBlock r={r} /> : <ReasonList reasons={r.reasons} />;

  return (
    <div className="status-cell">
      <div className="st-row">
        {badge}
        <div className="pop-wrap">
          <button className="trigger" tabIndex={0}><IconI /><span className="cv">{label}</span></button>
          <div className="pop-detail">
            <div className="ph">{r.accepted ? 'Margin usage' : 'Why rejected'}</div>
            {detail}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Results ───────────────────────────────────────────────────────────────────

type Props = { results: SimResult[]; form: FormValues };

export function Results({ results, form }: Props) {
  const [filter, setFilter] = useState<'all' | 'accepted' | 'rejected'>('all');

  const accepted    = results.filter((r) => r.accepted);
  const rejected    = results.filter((r) => !r.accepted);
  const totNotional = accepted.reduce((a, r) => a + r.order.notional, 0);
  const totMargin   = accepted.reduce((a, r) => a + r.order.marginRequired, 0);
  const rate        = results.length ? accepted.length / results.length : 0;

  // accepted first, then rejected
  const ordered = [...accepted, ...rejected];
  const shown   = ordered.filter((r) =>
    filter === 'all' ? true : filter === 'accepted' ? r.accepted : !r.accepted
  );

  const { q, p, l, s } = validate(form);

  return (
    <div className="card results">
      <div className="card-h">
        <div>
          <h2>Copied orders</h2>
          <span className="sub">
            {form.side} {form.symbol} · {fmtQty(q)} @ {usd(p)} mark · {l}× · {s} bps
          </span>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi k-acc">
          <div className="kl">Accepted</div>
          <div className="kv">{accepted.length}</div>
          <div className="kx">of {results.length} followers</div>
        </div>
        <div className="kpi k-rej">
          <div className="kl">Rejected</div>
          <div className="kv">{rejected.length}</div>
          <div className="kx">risk checks failed</div>
        </div>
        <div className="kpi">
          <div className="kl">Total notional</div>
          <div className="kv">{usd0(totNotional)}</div>
          <div className="kx">filled exposure</div>
        </div>
        <div className="kpi">
          <div className="kl">Total margin</div>
          <div className="kv">{usd0(totMargin)}</div>
          <div className="kx">capital committed</div>
        </div>
      </div>

      <div className="fillbar-wrap">
        <div className="fillbar-top">
          <span className="t"><b>{accepted.length}</b> of {results.length} orders filled</span>
          <span className="t"><b>{(rate * 100).toFixed(0)}%</b> fill rate</span>
        </div>
        <div className="fillbar">
          <div className="seg-acc" style={{ width: (rate * 100) + '%' }} />
        </div>
      </div>

      <div className="filters">
        {(['all', 'accepted', 'rejected'] as const).map((k) => (
          <button key={k} className={'fbtn' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>
            {k.charAt(0).toUpperCase() + k.slice(1)}{' '}
            <span className="ct">
              {k === 'all' ? results.length : k === 'accepted' ? accepted.length : rejected.length}
            </span>
          </button>
        ))}
      </div>

      <div className="tbl">
        <div className="thead">
          <span className="th">Follower</span>
          <span className="th">Symbol</span>
          <span className="th">Side</span>
          <span className="th r">Qty</span>
          <span className="th r">Fill price</span>
          <span className="th r">Notional</span>
          <span className="th r">Margin req.</span>
          <span className="th">Status &amp; risk checks</span>
        </div>
        {shown.map((r) => (
          <div key={r.fo.id} className={'trow ' + (r.accepted ? 'acc' : 'rej')}>
            <span className="td name" data-l="Follower">
              {r.fo.name}
              <small>{r.fo.copyRatio}× ratio · {usd0(r.fo.availableBalance)} balance</small>
            </span>
            <span className="td sym" data-l="Symbol">{r.order.symbol}</span>
            <span className="td" data-l="Side">
              <span className={'side ' + r.order.side.toLowerCase()}>{r.order.side}</span>
            </span>
            <span className="td r num" data-l="Qty">{fmtQty(r.order.quantity)}</span>
            <span className="td r num muted" data-l="Fill price">{usd(r.order.estimatedFillPrice)}</span>
            <span className="td r num" data-l="Notional">{usd(r.order.notional)}</span>
            <span className="td r num" data-l="Margin req.">{usd(r.order.marginRequired)}</span>
            <span className="td status-cell" data-l="Status">
              <StatusCell r={r} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
