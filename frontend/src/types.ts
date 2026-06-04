export type Side = 'BUY' | 'SELL';
export type SymbolCode = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT';

export type Follower = {
  id: string;
  name: string;
  equity: number;
  availableBalance: number;
  copyRatio: number;
  maxLeverage: number;
  maxNotionalPerTrade: number;
  allowedSymbols: SymbolCode[];
};

export type Order = {
  followerId: string;
  symbol: SymbolCode;
  side: Side;
  quantity: number;
  estimatedFillPrice: number;
  notional: number;
  marginRequired: number;
  status: 'ACCEPTED' | 'REJECTED';
};

export type RejectionReason = {
  kind: string;
  text: React.ReactNode;
};

export type SimResult = {
  fo: Follower;
  order: Order;
  accepted: boolean;
  reasons: RejectionReason[];
  util: number;
};

export type FormValues = {
  symbol: SymbolCode;
  side: Side;
  qty: string;
  price: string;
  leverage: string;
  slippage: string;
};
