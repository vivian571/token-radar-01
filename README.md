# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/vivian571/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/vivian571/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Build the best token launch radar. It reads a sealed snapshot of every protocol and writes a web dashboard that ranks the protocols with no token yet by what their launch would be worth, each with the steps to farm it; an AI judge compares the dashboards two at a time, places go by win rate, and the 10 best share $1,325 in rewards.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <path to snapshot.json>
```

Node 22.18 or later, standard library only — nothing is installed. The program reads the snapshot, writes `board.json` (the ranked board), `data.js` (the dashboard's data), copies `dashboard/` and `screenshots/` to the output, and writes `dossier.json` with the vendored make.fun library.

## How the radar scores

A protocol is eligible when its record carries no token (no CoinGecko id, no symbol) and it is not a wrapped, staked or bridged product of a token that already trades, nor an exchange, nor a versioned pool — the house watchlist's own rule, applied to the whole snapshot instead of only above its $50M floor. Every watchlist slug is on the board; the rest are the early rows the radar exists to find.

Implied value = TVL × category ratio × growth × age, where the category ratio is the median market-cap-per-TVL of the live-token protocols in the same category (five peers or more, else the snapshot-wide median) — what the market already pays per dollar of TVL for this kind of protocol. Growth is the seven-day TVL change, clamped to −50…+150% and weighted 0.6; age is how long the protocol has run with no token, 0.8…1.2 over four years. No protocol name is ever special-cased.

The dashboard (`dashboard/`) is a static page with no network: the board, a detail view for every protocol with its model breakdown and farm plan, filters by category, chain and watchlist, and a live-token view that keeps the already-trading protocols apart with the market's own values.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
