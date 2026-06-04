import React from 'react';
import { Follower, FormValues, Order, RejectionReason, SimResult } from './types';

// ── Formatters ────────────────────────────────────────────────────────────────

export const parseNum = (v: string) => parseFloat(String(v).replace(',', '.').trim());
export const usd  = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const usd0 = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
export const fmtQty = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 6 });

// ── Validation ────────────────────────────────────────────────────────────────

export type ValidationResult = {
  errors: Partial<Record<keyof FormValues, string>>;
  valid: boolean;
  q: number; p: number; l: number; s: number;
};

export function validate(f: FormValues): ValidationResult {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  const q = parseNum(f.qty), p = parseNum(f.price), l = parseNum(f.leverage), s = parseNum(f.slippage);
  if (!(q > 0))     errors.qty      = 'Enter a quantity greater than 0';
  if (!(p > 0))     errors.price    = 'Enter a price greater than 0';
  if (!(l >= 1))    errors.leverage = 'Leverage must be at least 1×';
  else if (l > 125) errors.leverage = 'Max supported leverage is 125×';
  if (isNaN(s) || s < 0) errors.slippage = 'Slippage cannot be negative';
  else if (s > 1000)     errors.slippage = 'Slippage over 1000 bps (10%) is unrealistic';
  return { errors, valid: Object.keys(errors).length === 0, q, p, l, s };
}

// ── Rejection reason builder ──────────────────────────────────────────────────

export function buildReasons(order: Order, fo: Follower, leverage: number): RejectionReason[] {
  const r: RejectionReason[] = [];
  if (!fo.allowedSymbols.includes(order.symbol))
    r.push({ kind: 'symbol',   text: <>Doesn't copy <b>{order.symbol}</b> — only {fo.allowedSymbols.join(', ')}</> });
  if (leverage > fo.maxLeverage)
    r.push({ kind: 'leverage', text: <>Leverage <b>{leverage}×</b> exceeds their max of <b>{fo.maxLeverage}×</b></> });
  if (order.quantity <= 0)
    r.push({ kind: 'qty',      text: <>Trade size rounds to <b>0</b> after ratio and exchange step size</> });
  if (order.notional > fo.maxNotionalPerTrade)
    r.push({ kind: 'size',     text: <>Notional <b>{usd0(order.notional)}</b> over their <b>{usd0(fo.maxNotionalPerTrade)}</b> per-trade cap</> });
  if (order.marginRequired > fo.availableBalance)
    r.push({ kind: 'margin',   text: <>Needs <b>{usd(order.marginRequired)}</b> margin but balance is only <b>{usd(fo.availableBalance)}</b></> });
  return r;
}

export function mapResults(orders: Order[], followers: Follower[], leverage: number): SimResult[] {
  return orders.map((order) => {
    const fo       = followers.find((f) => f.id === order.followerId)!;
    const accepted = order.status === 'ACCEPTED';
    const reasons  = accepted ? [] : buildReasons(order, fo, leverage);
    const util     = Math.min(order.marginRequired / fo.availableBalance, 1);
    return { fo, order, accepted, reasons, util };
  });
}
