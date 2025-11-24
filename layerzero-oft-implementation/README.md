# LayerZero OFT Adapter Implementation

This project implements a LayerZero V2 OFT Adapter to bridge an existing custom SPL token from Solana to Ethereum (and other EVM chains) as an ERC-20 token.

## Project Structure

```
.
├── contracts/                 # Ethereum/EVM contracts
│   ├── OFTAdapter.sol        # Main OFT Adapter contract
│   └── Token.sol             # Optional: ERC-20 token if needed
├── programs/                  # Solana programs
│   └── oft-adapter/          # OFT Adapter Solana program
├── scripts/                   # Deployment and utility scripts
├── test/                      # Test files
├── config/                    # Configuration files
└── IMPLEMENTATION_GUIDE.md   # Detailed implementation guide

```

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### 3. Follow Implementation Guide

See `IMPLEMENTATION_GUIDE.md` for complete step-by-step instructions.

## Key Features

- **Sovereign Architecture**: You own and control the bridge contracts
- **Configurable Security**: Choose your own DVNs (Decentralized Verifier Networks)
- **Multi-Chain Support**: Bridge to Ethereum, Arbitrum, Optimism, Base, Polygon, and more
- **Existing Token Support**: Works with your already-deployed SPL token
- **No Vendor Lock-in**: Full control over upgrade authority and parameters

## Architecture Overview

### Solana Side
- **OFT Program**: Custom Rust program you deploy and control
- **OFT Store**: PDA that manages bridge state
- **Escrow Account**: Holds locked SPL tokens

### Ethereum Side
- **OFT Adapter**: Smart contract that manages the ERC-20 token
- **ERC-20 Token**: Your token on Ethereum (existing or new)
- **LayerZero Endpoint**: Handles cross-chain messaging

## Commands

### Build
```bash
# Build everything
pnpm build

# Build Solana only
pnpm build:solana

# Build Ethereum only
pnpm build:evm
```

### Deploy
```bash
# Deploy Solana program
pnpm deploy:solana

# Deploy Ethereum contracts
pnpm deploy:ethereum
```

### Test
```bash
# Run all tests
pnpm test

# Test Solana only
pnpm test:solana

# Test Ethereum only
pnpm test:evm
```

## Security Considerations

1. **DVN Configuration**: Use multiple DVNs for production
2. **Admin Keys**: Secure your deployment private keys
3. **Audit**: Get contracts audited before mainnet deployment
4. **Testing**: Thoroughly test on testnet first
5. **Monitoring**: Set up transaction monitoring and alerts

## Cost Estimates

### One-Time Deployment
- Solana: ~2-5 SOL
- Ethereum: ~0.1-0.2 ETH (varies with gas)

### Per-Transaction
- Solana → Ethereum: $5-15 USD
- Ethereum → Solana: $10-30 USD

## Support

- [LayerZero Documentation](https://docs.layerzero.network)
- [LayerZero Discord](https://discord.gg/layerzero)
- [GitHub Issues](https://github.com/LayerZero-Labs/LayerZero-v2/issues)

## License

MIT
