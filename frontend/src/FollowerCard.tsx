import React from 'react';
import { Follower, SimResult, SymbolCode } from './types';
import { usd, usd0 } from './utils';
import { Check, Cross } from './icons';

type Props = {
  f: Follower;
  result: SimResult | null;
  activeSymbol: SymbolCode;
};

export function FollowerCard({ f, result, activeSymbol }: Props) {
  const cls = result ? (result.accepted ? 'accepted' : 'rejected') : '';
  const tag = f.name.split(' ').slice(1).join(' ');

  return (
    <div className={'f-card ' + cls}>
      <span className="accent-edge" />
      <div className="f-top">
        <span className="f-name">{f.name}</span>
        <span className="f-tag">{tag}</span>
      </div>
      <div className="f-meta">
        <div className="f-row"><span className="k">Balance</span><span className="v">{usd0(f.availableBalance)}</span></div>
        <div className="f-row"><span className="k">Copy ratio</span><span className="v">{f.copyRatio}×</span></div>
        <div className="f-row"><span className="k">Max leverage</span><span className="v">{f.maxLeverage}×</span></div>
        <div className="f-row"><span className="k">Max trade</span><span className="v">{usd0(f.maxNotionalPerTrade)}</span></div>
      </div>
      <div className="f-syms">
        {f.allowedSymbols.map((s) => <span key={s} className="chip">{s}</span>)}
        {!f.allowedSymbols.includes(activeSymbol) && <span className="chip off">{activeSymbol}</span>}
      </div>
      {result && (
        <>
          <div className="f-status">
            {result.accepted
              ? <span className="badge ok"><Check /> Copied</span>
              : <span className="badge no"><Cross /> Rejected</span>}
          </div>
          {result.accepted && (
            <div className="f-util">
              <div className="f-row" style={{ marginBottom: 6 }}>
                <span className="k">Margin used</span>
                <span className="v">{usd(result.order.marginRequired)} · {(result.util * 100).toFixed(1)}%</span>
              </div>
              <div className="meter">
                <i style={{ width: (result.util * 100) + '%', background: 'var(--green)' }} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
