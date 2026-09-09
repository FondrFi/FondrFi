# FondrFi

<p align="center">
  <img src="/fondrfi/public/fondrfi-logo.png" alt="FondrFi logo" width="88" />
</p>

<p align="center">
  <strong>A non-custodial gateway for trading and exploring tokenized markets on Robinhood Chain.</strong>
</p>

<p align="center">
  <a href="https://fondrfi.xyz">Website</a>
  ·
  <a href="https://fondrfi.xyz/docs">Docs</a>
  ·
  <a href="https://fondrfi.xyz/whitepaper">Whitepaper</a>
  ·
  <a href="https://x.com/fondrfi">X</a>
</p>

## Overview

FondrFi brings swaps, market discovery, portfolio visibility, and future staking access into one focused interface built for Robinhood Chain.

The application is non-custodial. FondrFi does not hold user funds or sign transactions on a user's behalf. Wallet owners review and approve every onchain action directly in their wallet.

## Contract

**FondrFi contract**

```text
0x9315ED669D16465b0f267D7B53F225Aa600EF48a
```

[View the contract on Robinhood Chain Explorer](https://robinhoodchain.blockscout.com/address/0x9315ED669D16465b0f267D7B53F225Aa600EF48a)

Always verify the contract address from an official FondrFi channel before interacting with it.

## Features

### Swap

- Live token quotes through the 0x Swap API
- Wallet-controlled transaction confirmation
- Exact ERC-20 approvals instead of unlimited allowances
- Fresh quote validation before swap execution
- EIP-1559 fee handling based on the latest Robinhood Chain block
- Transaction status tracking through confirmation

### Explore

- Browse supported Robinhood Chain assets without connecting a wallet
- Inspect live indicative routes and market availability
- Explore crypto, tokenized equities, and real-world asset categories
- Light and dark mode support

### Portfolio

- Read wallet balances directly from Robinhood Chain
- View supported assets and indicative portfolio values
- Open token and wallet activity in the block explorer

### Earn

Earn is the gateway for future FondrFi staking. Staking actions remain unavailable until the official staking contract, ABI, reward rules, and deployment configuration are published and validated.

FondrFi does not display fabricated APY, TVL, or reward data.

### Documentation

- Product and trading guide
- Wallet and transaction safety guidance
- Earn launch-readiness status
- Living whitepaper covering the product vision and protocol design

## Network

| Property | Value |
| --- | --- |
| Network | Robinhood Chain |
| Chain ID | `4663` |
| Currency | `ETH` |
| RPC | `https://rpc.mainnet.chain.robinhood.com` |
| Explorer | `https://robinhoodchain.blockscout.com` |

## Technology

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Express
- Zod
- TanStack Query
- 0x Swap API
- EIP-1193 browser wallet providers
- pnpm workspace

## Repository Structure

```text
.
├── artifacts/
│   ├── fondrfi/          # Main React application
│   ├── explore-terminal/ # Dedicated market exploration interface
│   └── api-server/       # Express API for quotes and market data
├── lib/
│   ├── api-client-react/ # Generated frontend API client
│   ├── api-spec/         # OpenAPI specification
│   ├── api-zod/          # Shared request and response schemas
│   └── db/               # Shared database package
└── pnpm-workspace.yaml
```

## Local Development

### Requirements

- Node.js
- pnpm
- A 0x API key for live quote and pricing endpoints
- An EVM browser wallet for transaction testing

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
pnpm install
```

### Environment

Configure the following environment variable without committing its value:

```text
ZEROX_API_KEY
```

The API returns an explicit unavailable response when live 0x pricing is not configured.

### Run the API

```bash
pnpm --filter @workspace/api-server run dev
```

### Run the web application

The Vite configuration requires `PORT` and `BASE_PATH`:

```bash
PORT=19600 BASE_PATH=/ pnpm --filter @workspace/fondrfi run dev
```

When running outside Replit, route `/api` requests to the API server on port `8080`.

## Validation

Run the workspace type checks:

```bash
pnpm run typecheck
```

Build all packages and artifacts:

```bash
pnpm run build
```

Build individual services:

```bash
pnpm --filter @workspace/fondrfi run build
pnpm --filter @workspace/api-server run build
```

## Transaction Safety

FondrFi applies several safeguards to wallet-driven transactions:

- The connected account and chain are validated before execution.
- Quote inputs must still match the visible token pair, amount, account, and slippage.
- ERC-20 approvals use the exact swap amount.
- Approval confirmation and swap confirmation are separate wallet actions.
- Updated allowance must be visible onchain before the swap can proceed.
- Gas is simulated before MetaMask confirmation.
- EIP-1559 maximum fees are calculated above the current block base fee.

Wallet confirmation screens cannot be bypassed by the application.

## Current Status

FondrFi is under active development.

- Swaps use live executable 0x quotes when liquidity is available.
- Explore and portfolio values are indicative and should not be treated as oracle prices.
- Asset availability depends on Robinhood Chain deployments and routed liquidity.
- Earn remains pre-launch until the official staking deployment is complete.
- Whitepaper content is a living document and may be updated as verified deployment details become available.

## Contributing

Issues and pull requests are welcome. Before submitting a change:

1. Keep all market and deployment claims factual.
2. Do not add placeholder contract addresses, APY, TVL, or reward values.
3. Preserve non-custodial wallet confirmation flows.
4. Run type checking and production builds.
5. Never commit API keys, wallet credentials, or private keys.

## Security

Never share a seed phrase, private key, or wallet recovery phrase with FondrFi or any contributor.

Before signing:

- Confirm that MetaMask is connected to Robinhood Chain.
- Verify the token, amount, spender, and destination.
- Review the estimated network fee.
- Confirm the official contract address.

## Disclaimer

FondrFi is software for accessing onchain markets. It does not provide financial, investment, legal, or tax advice. Digital assets and tokenized markets involve risk, including smart-contract risk, liquidity risk, market volatility, and potential loss of funds. Users are responsible for reviewing and approving their own transactions.

## License

This project is licensed under the MIT License.
