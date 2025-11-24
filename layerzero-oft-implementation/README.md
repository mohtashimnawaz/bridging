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

First, ensure you have the required tools:
- Node.js 18+
- pnpm: `npm install -g pnpm`
- Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Solana CLI: `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`
- Anchor: `cargo install --git https://github.com/coral-xyz/anchor avm --locked --force && avm install latest && avm use latest`

Then install project dependencies:

```bash
cd layerzero-oft-implementation
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
# Edit .env with your RPC URLs, private keys, token addresses, etc.
```

**Critical values to set:**
- `SOLANA_RPC_URL` - Your Solana RPC endpoint
- `SOLANA_PRIVATE_KEY` - Base58 encoded Solana keypair
- `SPL_TOKEN_MINT` - Your existing SPL token mint address
- `ETHEREUM_RPC_URL` - Ethereum RPC (Alchemy/Infura)
- `ETHEREUM_PRIVATE_KEY` - Your Ethereum private key (0x...)
- `LZ_ENDPOINT_ETHEREUM` - LayerZero endpoint (default provided)

### 3. Build Everything

```bash
# Build both EVM contracts and Solana program
pnpm build
```

### 4. Deploy to Testnet First (Recommended)

Update `.env` for testnet:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

Deploy:
```bash
# Deploy Solana program
pnpm deploy:solana

# Deploy Ethereum contracts
pnpm deploy:ethereum:sepolia
```

### 5. Configure Cross-Chain Peers

After deployment, update `.env` with deployed addresses, then:

```bash
# Link Solana to Ethereum
pnpm set-peer:solana

# Link Ethereum to Solana
pnpm set-peer:evm
```

### 6. Test

```bash
# Run all tests
pnpm test
```

### 7. Follow Implementation Guide

See `IMPLEMENTATION_GUIDE.md` for complete step-by-step instructions and `NEXT_STEPS.md` for production checklist.

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
# Build everything (EVM first, then Solana)
pnpm build

# Build Solana only
pnpm build:solana

# Build Ethereum only
pnpm build:evm
```

### Deploy
```bash
# Deploy Solana program (to cluster configured in Anchor.toml or SOLANA_RPC_URL)
pnpm deploy:solana

# Deploy Ethereum contracts (mainnet)
pnpm deploy:ethereum

# Deploy Ethereum contracts (testnet - Sepolia)
pnpm deploy:ethereum:sepolia
```

### Configure Peers
After both chains are deployed, link them:

```bash
# Set peer on Solana (links to Ethereum OFT Adapter)
pnpm set-peer:solana

# Set peer on Ethereum (links to Solana OFT Store)
pnpm set-peer:evm
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

### Verify (Etherscan)
```bash
# Verify contract on Etherscan after deployment
pnpm verify:ethereum <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
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

## Troubleshooting

### Build Issues

**Error: `anchor: command not found`**
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

**Error: `hardhat compile` fails with missing dependencies**
```bash
rm -rf node_modules package-lock.json
pnpm install
```

**Error: Solana program fails to build**
```bash
# Ensure Rust is up to date
rustup update

# Clean and rebuild
cd programs/oft-adapter
anchor clean
anchor build
```

### Deployment Issues

**Error: Insufficient funds on Solana**
- You need 5-10 SOL for program deployment
- Get devnet SOL: `solana airdrop 2`
- For mainnet, fund your wallet first

**Error: Program ID mismatch in Anchor.toml**
- After generating a program keypair, update `declare_id!` in `programs/oft-adapter/src/lib.rs`
- Update `[programs.devnet]` in `Anchor.toml` with the same program ID
- Rebuild: `anchor build`

**Error: Gas estimation failed on Ethereum**
- Ensure your wallet has enough ETH
- Check RPC URL is correct
- Try increasing gas limit in hardhat.config.ts

### Runtime Issues

**Peer configuration fails**
- Verify both contracts are deployed
- Ensure addresses in `.env` are correct (no typos)
- Check that you're using the correct endpoint IDs

**Transactions not arriving cross-chain**
- Check LayerZero Scan: https://layerzeroscan.com/
- Verify DVNs are configured
- Ensure both setPeer calls were successful
- Wait 10-15 minutes (cross-chain messaging takes time)

## File Structure

```
layerzero-oft-implementation/
├── contracts/                      # Ethereum/EVM Solidity contracts
│   ├── MyToken.sol                # ERC-20 token
│   └── MyTokenOFTAdapter.sol      # OFT Adapter for EVM
├── programs/                       # Solana Anchor programs
│   └── oft-adapter/
│       ├── Cargo.toml             # Rust dependencies
│       ├── Anchor.toml            # Anchor config
│       └── src/
│           └── lib.rs             # Anchor program (OFT Store)
├── scripts/                        # Deployment and utility scripts
│   ├── deploy-ethereum.ts         # Deploy EVM contracts
│   ├── deploy-solana.sh           # Deploy Solana program
│   ├── set-peer-evm.ts            # Configure Ethereum peer
│   └── set-peer-solana.ts         # Configure Solana peer
├── test/                          # Tests
│   └── evm/
│       └── test_oft.ts            # Hardhat tests
├── tests/
│   └── oft-adapter.ts             # Anchor tests
├── .github/workflows/
│   └── ci.yml                     # GitHub Actions CI
├── hardhat.config.ts              # Hardhat configuration
├── Anchor.toml                    # Top-level Anchor config
├── package.json                   # Node dependencies and scripts
├── .env.example                   # Environment template
├── IMPLEMENTATION_GUIDE.md        # Detailed step-by-step guide
├── NEXT_STEPS.md                  # Production checklist
└── README.md                      # This file
```

## Support

- [LayerZero Documentation](https://docs.layerzero.network)
- [LayerZero Discord](https://discord.gg/layerzero)
- [Solana Documentation](https://docs.solana.com)
- [Anchor Documentation](https://www.anchor-lang.com)
- [GitHub Issues](https://github.com/LayerZero-Labs/LayerZero-v2/issues)

## License

MIT
