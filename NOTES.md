# Notes

## What I changed

The original code had the right structure but a few gaps in the engine, the API, and the UI.

**Engine** — `slippageBps` was hardcoded at 15 inside `buildOrdersForTrade`, so there was no way to change it per simulation without editing the source. I made it a parameter with a default so the API can pass it through.

**API** — added `slippageBps` as an optional request field (0–500, defaults to 15) and added a `summary` object to the response with accepted/rejected counts, total notional, and total margin. Previously the client had to compute those itself. I also tightened the `leverage` validation from `.positive()` to `.min(1)` to make the intent explicit.

**Tests** — the original six tests covered the happy path and three rejection reasons, but the notional cap rejection had no test at all. I added four: notional limit rejection, zero quantity after step rounding, SELL slippage direction, and a smoke test for `buildOrdersForTrade` returning one order per follower.

**Frontend structure** — split the original single `App.tsx` into focused files: `types.ts` for shared types, `utils.tsx` for formatters and business logic (validation, reason builder, result mapping), `icons.tsx`, and separate component files for `LeaderForm`, `FollowerCard`, and `Results`. Keeps each file easy to read and change independently.

**UI** — the original table showed raw follower IDs instead of names, had a single generic error message for any validation failure, and no summary after a simulation run. I replaced all of that: follower names resolved from the already-loaded list, per-field validation errors from the Zod response, a summary bar (accepted / rejected / total notional / total margin) that appears only after the first run, a slippage input with a live explainer showing the exact fill price, and a leverage field that warns in real time which followers would be blocked before you even hit Run.

## Assumptions

**Margin uses the leader's leverage, not the follower's cap.** A follower copies the trade at the same leverage the leader used. If that exceeds the follower's limit, the trade is rejected — I didn't silently cap it at their max, because that would hide a risk breach and make the rejection logic harder to follow.

**All rejection checks run even if the first one already fails.** The original engine returned early on the first failed check. I kept that on the backend but rebuilt all applicable reasons on the frontend using the order data the API returns. This way the UI can show "3 risk checks failed" with full detail instead of just the first one.

**`copyRatio > 1` is intentional.** Ben Aggressive has a ratio of 1.2, meaning he sizes up beyond the leader. The engine treats this as a valid configuration, not an error.

**Slippage ceiling at 500 bps (5%).** Arbitrary but reasonable for a simulator. In production this would depend on instrument liquidity and venue.

## What I'd do next for production

- **Save simulation history.** Right now every run is ephemeral. A PM or trader needs to compare runs, see what changed, and audit past decisions.
- **Per-follower slippage.** A single global slippage value is a simplification. In reality it depends on account size, order routing, and market depth at the time of execution.
- **Partial fills.** Currently the engine rejects a trade outright if the full margin isn't available. A real platform would often partially fill — copy a smaller size that fits within the follower's available balance.
- **Auth and a real data layer.** Followers and leader accounts are hardcoded fixtures. Production needs a database, authentication, and support for multiple leaders.
- **Live updates.** Re-submitting a form works for a simulator, but a live copy-trading platform needs push updates — when a leader opens a position, followers should see it immediately.
- **Above-the-fold results.** Right now the results section sits below the form and followers, so after running a simulation the user has to scroll down to see them. I'd revisit the layout — likely auto-scrolling to results on run, or reworking the page structure so the key output is immediately visible.
