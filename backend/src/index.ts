import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { buildOrdersForTrade } from './copyEngine.js';
import { followers, leaderTrades } from './fixtures.js';
import { LeaderTrade } from './types.js';

const app = express();
app.use(cors());
app.use(express.json());

const tradeSchema = z.object({
  symbol: z.enum(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']),
  side: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive(),
  price: z.number().positive(),
  leverage: z.number().int().min(1).max(125),
  slippageBps: z.number().int().min(0).max(500).default(15)
});

app.get('/api/leader-trades', (_req, res) => res.json(leaderTrades));
app.get('/api/followers', (_req, res) => res.json(followers));

app.post('/api/simulate-copy', (req, res) => {
  const parsed = tradeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { slippageBps, ...tradeData } = parsed.data;
  const trade: LeaderTrade = {
    id: `lt_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...tradeData
  };

  const orders = buildOrdersForTrade(trade, followers, slippageBps);
  const accepted = orders.filter((o) => o.status === 'ACCEPTED');

  return res.json({
    trade,
    orders,
    summary: {
      acceptedCount: accepted.length,
      rejectedCount: orders.length - accepted.length,
      totalNotional: Number(accepted.reduce((s, o) => s + o.notional, 0).toFixed(2)),
      totalMargin: Number(accepted.reduce((s, o) => s + o.marginRequired, 0).toFixed(2))
    }
  });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`Copy trading test API running on http://localhost:${port}`));
