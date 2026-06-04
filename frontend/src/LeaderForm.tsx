import React from 'react';
import { Follower, FormValues, SymbolCode, Side } from './types';
import { validate, usd } from './utils';
import { Cross } from './icons';

const SYMBOLS: SymbolCode[] = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];

function Info({ children }: { children: React.ReactNode }) {
  return (
    <span className="info">
      <span className="dot">i</span>
      <span className="pop">{children}</span>
    </span>
  );
}

function Field({ label, error, hint, info, children }: {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  info?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={'field' + (error ? ' invalid' : '')}>
      <div className="label-row">
        <label className="f-label">{label}</label>
        {info && <Info>{info}</Info>}
        <span className="req-x">required</span>
      </div>
      {children}
      {error
        ? <div className="err-msg"><Cross /> {error}</div>
        : hint && <div className="help">{hint}</div>}
    </div>
  );
}

type Props = {
  form: FormValues;
  set: (k: keyof FormValues, v: string) => void;
  onRun: () => void;
  followers: Follower[];
};

export function LeaderForm({ form, set, onRun, followers }: Props) {
  const { errors, valid, p, l, s } = validate(form);

  const fill      = !isNaN(p) && !isNaN(s) ? (form.side === 'BUY' ? p * (1 + s / 10000) : p * (1 - s / 10000)) : null;
  const slipDelta = fill != null ? Math.abs(fill - p) : null;
  const levBlocks = !isNaN(l) ? followers.filter((f) => l > f.maxLeverage) : [];

  return (
    <div className="card">
      <div className="card-h"><h2>Leader trade</h2><span className="sub">the signal source</span></div>

      <Field label="Symbol">
        <select className="control" value={form.symbol} onChange={(e) => set('symbol', e.target.value as SymbolCode)}>
          {SYMBOLS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>

      <Field label="Side">
        <select className="control" value={form.side} onChange={(e) => set('side', e.target.value as Side)}>
          <option>BUY</option><option>SELL</option>
        </select>
      </Field>

      <div className="two-col">
        <Field label="Quantity" error={errors.qty}>
          <input className="control num" inputMode="decimal" value={form.qty}
            onChange={(e) => set('qty', e.target.value)} placeholder="0.5" />
        </Field>
        <Field label="Price (USDT)" error={errors.price}>
          <input className="control num" inputMode="decimal" value={form.price}
            onChange={(e) => set('price', e.target.value)} placeholder="68000" />
        </Field>
      </div>

      <Field label="Leverage" error={errors.leverage}
        info={<><b>Leverage</b> sets margin: margin = notional ÷ leverage. Higher leverage frees up capital but each follower caps how high you can go.</>}>
        <input className="control num" inputMode="decimal" value={form.leverage}
          onChange={(e) => set('leverage', e.target.value)} placeholder="5" />
        {!errors.leverage && levBlocks.length > 0 && (
          <div className="insight warn">
            At <b>{l}×</b>, <span className="neg">{levBlocks.map((f) => f.name.split(' ')[0]).join(' & ')}</span> will
            reject this copy — their max is {levBlocks.map((f) => f.maxLeverage + '×').join(' / ')}.
          </div>
        )}
        {!errors.leverage && levBlocks.length === 0 && !isNaN(l) && (
          <div className="insight"><span className="pos">All followers</span> allow <b>{l}×</b> leverage.</div>
        )}
      </Field>

      <Field label="Slippage (bps)" error={errors.slippage}
        info={<><b>Slippage</b> is the gap between the mark price and the real fill. 1 bps = 0.01%. A <b>BUY</b> fills higher, a <b>SELL</b> fills lower — it raises notional and the margin each follower needs.</>}>
        <input className="control num" inputMode="decimal" value={form.slippage}
          onChange={(e) => set('slippage', e.target.value)} placeholder="15" />
        {fill != null && !errors.slippage && !errors.price && (
          <div className="insight">
            {form.side} fills at <b>{usd(fill)}</b> — {form.side === 'BUY' ? 'paying' : 'losing'}{' '}
            <b>{usd(slipDelta!)}</b> ({(s / 100).toFixed(2)}%) {form.side === 'BUY' ? 'above' : 'below'} the {usd(p)} mark.
          </div>
        )}
      </Field>

      <button className="run" disabled={!valid} onClick={onRun}>
        {valid ? 'Run simulation' : 'Fix inputs to run'}
      </button>
    </div>
  );
}
