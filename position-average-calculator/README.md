# Position Average Calculator

A single-page React + TypeScript calculator for estimating the effect of adding to an existing same-direction trading position.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The calculator estimates current notional, add-on quantity/notional, new total size, new average entry price, add-on margin, and final required margin. It intentionally does not model reducing, closing, flipping direction, liquidation price, fees, funding, maintenance margin, or exchange-specific margin rules.
