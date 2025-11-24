# LayerZero OFT Adapter Implementation Guide

## Overview

This guide walks you through implementing a LayerZero V2 OFT Adapter to bridge your existing custom SPL token to Ethereum as an ERC-20.

---

## Prerequisites

### Required Tools

- **Node.js**: v18+ recommended
- **pnpm**: `npm install -g pnpm`
- **Rust**: Latest stable version
- **Anchor Framework**: v0.29.0+
- **Solana CLI**: v1.17.0+
- **Hardhat**: Installed via the project

### Required Wallets & Funds

- **Solana Wallet**: With SOL for deployment (~5-10 SOL for program deployment)
- **Ethereum Wallet**: With ETH for gas fees
- **Your Existing SPL Token**: Mint address and authority access

---

## Phase 1: Project Setup

### Step 1.1: Initialize LayerZero OApp

```bash
# Create new LayerZero OApp project
npx create-lz-oapp@latest

# Select options:
# - Project type: OFT Adapter
# - Source chain: Solana
# - Destination chain: Ethereum (or your target EVM chain)
# - Package manager: pnpm
```

### Step 1.2: Navigate to Project

```bash
cd your-project-name
pnpm install
```

### Step 1.3: Configure Environment Variables

Create `.env` file in the project root:

```env
# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PRIVATE_KEY=your_base58_private_key_here
SOLANA_PROGRAM_ID=will_be_generated_after_deployment

# Your Existing SPL Token
SPL_TOKEN_MINT=your_existing_spl_token_mint_address

# Ethereum Configuration
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ETHEREUM_PRIVATE_KEY=your_ethereum_private_key_0x...

# LayerZero Endpoint IDs
# Solana Mainnet: 30168
# Ethereum Mainnet: 30101
SOLANA_ENDPOINT_ID=30168
ETHEREUM_ENDPOINT_ID=30101
```

---

## Phase 2: Solana Program Deployment

### Step 2.1: Build the OFT Program

The scaffolded project includes a Solana program in `programs/oft-adapter/`.

```bash
# Navigate to Solana program directory
cd programs/oft-adapter

# Build the program
anchor build
```

### Step 2.2: Generate Program ID

```bash
# Generate a new keypair for your program
solana-keygen new -o target/deploy/oft_adapter-keypair.json

# Get the program ID
solana address -k target/deploy/oft_adapter-keypair.json
```

**Important**: Copy this program ID and update it in:
- `Anchor.toml` (replace the existing program ID)
- `programs/oft-adapter/src/lib.rs` (update the `declare_id!` macro)

### Step 2.3: Rebuild with Correct Program ID

```bash
# Clean previous build
anchor clean

# Rebuild with updated program ID
anchor build
```

### Step 2.4: Deploy to Solana Mainnet

```bash
# Set Solana CLI to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Check your balance (need ~5-10 SOL)
solana balance

# Deploy the program
anchor deploy --provider.cluster mainnet
```

**Save the deployment transaction signature** for verification.

---

## Phase 3: Initialize OFT Adapter on Solana

### Step 3.1: Create OFT Store Configuration

Create a configuration file `config/oft-config.json`:

```json
{
  "solana": {
    "programId": "YOUR_DEPLOYED_PROGRAM_ID",
    "mint": "YOUR_EXISTING_SPL_TOKEN_MINT",
    "decimals": 9,
    "admin": "YOUR_SOLANA_WALLET_ADDRESS"
  }
}
```

### Step 3.2: Initialize the OFT Adapter

Run the initialization script:

```bash
pnpm hardhat lz:oft-adapter:solana:create \
  --network solana-mainnet \
  --mint YOUR_EXISTING_SPL_TOKEN_MINT \
  --program-id YOUR_DEPLOYED_PROGRAM_ID
```

This will:
1. Create the OFT Store PDA
2. Create an escrow token account
3. Link the OFT Store to your existing SPL token
4. Set you as the admin

**Save the OFT Store address** - you'll need it for peer configuration.

---

## Phase 4: Ethereum Contract Deployment

### Step 4.1: Configure OFT Contract

Edit `contracts/OFTAdapter.sol` to match your token specifications:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OFTAdapter } from "@layerzerolabs/oft-evm/contracts/OFTAdapter.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract MyTokenOFTAdapter is OFTAdapter {
    constructor(
        address _token,           // Your existing ERC-20 address (or will deploy new)
        address _lzEndpoint,      // LayerZero endpoint on this chain
        address _owner
    ) OFTAdapter(_token, _lzEndpoint, _owner) Ownable(_owner) {}
}
```

### Step 4.2: Deploy ERC-20 Token (if needed)

If you don't have an existing ERC-20, create one:

```solidity
// contracts/MyToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor() ERC20("My Token", "MTK") Ownable(msg.sender) {
        _mint(msg.sender, 0); // Start with 0 supply - will be minted via bridge
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
```

### Step 4.3: Deploy to Ethereum

Create deployment script `scripts/deploy-ethereum.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with:", deployer.address);
  
  // LayerZero Endpoint on Ethereum Mainnet
  const LZ_ENDPOINT = "0x1a44076050125825900e736c501f859c50fE728c";
  
  // Deploy ERC-20 token (or use existing)
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  
  console.log("Token deployed to:", tokenAddress);
  
  // Deploy OFT Adapter
  const OFTAdapter = await ethers.getContractFactory("MyTokenOFTAdapter");
  const oftAdapter = await OFTAdapter.deploy(
    tokenAddress,
    LZ_ENDPOINT,
    deployer.address
  );
  await oftAdapter.waitForDeployment();
  const oftAdapterAddress = await oftAdapter.getAddress();
  
  console.log("OFT Adapter deployed to:", oftAdapterAddress);
  
  // Grant approval for OFT Adapter to spend tokens
  // This is crucial for the lock-and-mint mechanism
  console.log("Note: Users must approve the OFT Adapter to spend their tokens");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Deploy:

```bash
pnpm hardhat run scripts/deploy-ethereum.ts --network ethereum
```

---

## Phase 5: Configure Cross-Chain Peers

### Step 5.1: Set Peer on Solana

Link your Solana OFT Store to the Ethereum OFT Adapter:

```bash
pnpm hardhat lz:oft:solana:set-peer \
  --network solana-mainnet \
  --program-id YOUR_SOLANA_PROGRAM_ID \
  --remote-eid 30101 \
  --peer YOUR_ETHEREUM_OFT_ADAPTER_ADDRESS
```

### Step 5.2: Set Peer on Ethereum

Link your Ethereum OFT Adapter to the Solana OFT Store:

```bash
pnpm hardhat lz:oft:evm:set-peer \
  --network ethereum \
  --contract YOUR_ETHEREUM_OFT_ADAPTER_ADDRESS \
  --remote-eid 30168 \
  --peer YOUR_SOLANA_OFT_STORE_ADDRESS
```

### Step 5.3: Verify Peer Configuration

```bash
# Check Solana peer
pnpm hardhat lz:oft:solana:get-peer \
  --network solana-mainnet \
  --program-id YOUR_SOLANA_PROGRAM_ID \
  --remote-eid 30101

# Check Ethereum peer
pnpm hardhat lz:oft:evm:get-peer \
  --network ethereum \
  --contract YOUR_ETHEREUM_OFT_ADAPTER_ADDRESS \
  --remote-eid 30168
```

---

## Phase 6: Configure Security (DVNs)

LayerZero's security model is configurable. You must set up Decentralized Verifier Networks (DVNs).

### Step 6.1: Choose Your DVNs

Available DVNs on Mainnet:
- **LayerZero Labs**: Default, free
- **Google Cloud**: High reliability
- **Polyhedra**: ZK-based verification
- **Nethermind**: EVM expertise
- **Horizen Labs**: Privacy-focused

Recommended: Use at least 2 DVNs for production.

### Step 6.2: Configure DVNs

Create `config/dvn-config.json`:

```json
{
  "requiredDVNs": [
    "0x589dEDbD617e0CBcB916A9223F4d1300c294236b",  // LayerZero Labs
    "0xD56e4eAb23cb81f43168F9F45211Eb027b9aC7cc"   // Google Cloud
  ],
  "requiredDVNCount": 2,
  "optionalDVNs": [],
  "optionalDVNThreshold": 0
}
```

Apply configuration:

```bash
pnpm hardhat lz:oapp:config:set \
  --network ethereum \
  --contract YOUR_ETHEREUM_OFT_ADAPTER_ADDRESS \
  --config-path config/dvn-config.json
```

---

## Phase 7: Testing the Bridge

### Step 7.1: Test Solana → Ethereum

Create a test script `scripts/test-bridge-sol-to-eth.ts`:

```typescript
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";

async function bridgeFromSolana() {
  // Setup connection
  const connection = new Connection(process.env.SOLANA_RPC_URL!);
  const wallet = Wallet.local();
  const provider = new AnchorProvider(connection, wallet, {});
  
  // Your program
  const programId = new PublicKey(process.env.SOLANA_PROGRAM_ID!);
  const program = new Program(idl, programId, provider);
  
  // Bridge parameters
  const amount = 1_000_000_000; // 1 token (adjust for decimals)
  const destinationAddress = "0xYOUR_ETHEREUM_ADDRESS";
  const destinationEid = 30101; // Ethereum
  
  console.log("Bridging", amount, "tokens to", destinationAddress);
  
  // Send transaction
  const tx = await program.methods
    .send(amount, destinationEid, destinationAddress)
    .accounts({
      // ... accounts
    })
    .rpc();
  
  console.log("Transaction:", tx);
  console.log("Wait 5-10 minutes for cross-chain delivery");
}

bridgeFromSolana();
```

### Step 7.2: Monitor Transaction

Use LayerZero Scan to track:
https://layerzeroscan.com/

Enter your transaction hash to see the full cross-chain journey.

---

## Phase 8: Production Checklist

### Security Audit
- [ ] Solana program audited
- [ ] Ethereum contracts audited
- [ ] DVN configuration reviewed
- [ ] Admin key management strategy defined

### Testing
- [ ] Testnet deployment completed
- [ ] Small mainnet test transaction successful
- [ ] Large amount test successful
- [ ] Failover scenarios tested

### Monitoring
- [ ] Set up transaction monitoring
- [ ] Configure alerts for failed transactions
- [ ] Document recovery procedures

### Documentation
- [ ] User guide created
- [ ] Integration docs for partners
- [ ] Emergency procedures documented

---

## Troubleshooting

### Common Issues

**Issue**: Program deployment fails with "insufficient funds"
- **Solution**: Ensure you have 5-10 SOL in your wallet

**Issue**: Peer configuration fails
- **Solution**: Verify both contracts are deployed and addresses are correct

**Issue**: Transactions stuck/not arriving
- **Solution**: Check LayerZero Scan, verify DVNs are configured

**Issue**: "Invalid peer" error
- **Solution**: Ensure peer addresses are in the correct format (32 bytes for Solana)

---

## Cost Estimates

### Solana Deployment
- Program deployment: ~2-5 SOL
- Rent for accounts: ~0.01 SOL
- Transaction fees: Minimal

### Ethereum Deployment
- ERC-20 deployment: ~0.02-0.05 ETH
- OFT Adapter deployment: ~0.05-0.1 ETH
- Configuration transactions: ~0.01 ETH each

### Per-Transaction Costs
- Solana → Ethereum: ~$5-15 in LayerZero fees
- Ethereum → Solana: ~$10-30 (higher due to ETH gas)

---

## Support Resources

- **LayerZero Docs**: https://docs.layerzero.network
- **Discord**: https://discord.gg/layerzero
- **GitHub**: https://github.com/LayerZero-Labs
- **Solana Docs**: https://docs.solana.com
