# Technical Report: Bridging Architectures for Custom SPL to ERC-20 Migration

## 1. Executive Summary

Bridging custom Solana Program Library (SPL) tokens to the Ethereum Virtual Machine (EVM) requires navigating a fundamental architectural chasm between Solana's stateless, parallel runtime and Ethereum's stateful, serial environment. For developers of custom assets, the choice of bridging infrastructure is a critical architectural decision that dictates the token's sovereignty, security model, and future fungibility.

This report evaluates the four primary infrastructure options for bridging existing custom SPL tokens to ERC-20:

1. **Wormhole Portal**: The legacy "Lock-and-Mint" standard. Best for immediate, no-code deployment, but results in "wrapped" assets with no developer control.

2. **LayerZero V2 (OFT Adapter)**: A modular messaging layer offering the highest level of sovereignty. It requires the developer to compile and deploy a custom Rust program on Solana to act as an "Adapter" for the existing token.

3. **Wormhole Native Token Transfers (NTT)**: A framework allowing developers to deploy their own bridge contracts. It enables "Native" status on both chains but requires managing Solana program deployments.

4. **Axelar Interchain Token Service (ITS)**: A "Hub-and-Spoke" model that automates the deployment of canonical token managers via a no-code portal.

### Recommendation:

- **For maximum control and sovereignty**, utilize **LayerZero V2 OFT Adapter**. It offers the most robust "Infrastructure-as-Code" solution, allowing you to retain ownership of the token contracts and security parameters (DVNs).

- **For speed of deployment with zero coding**, utilize **Wormhole Portal**.

---

## 2. The Engineering Challenge: Bridging Heterogeneous Chains

Bridging between EVM chains (e.g., Ethereum to Arbitrum) is trivial due to shared cryptographic primitives (secp256k1) and memory models. Bridging Solana to Ethereum is non-trivial:

### Key Challenges:

1. **Address Incompatibility**: Solana uses 32-byte ed25519 public keys; Ethereum uses 20-byte secp256k1 addresses. The bridge must handle this translation securely to prevent fund loss.

2. **Program vs. Contract**: On Ethereum, the token is the contract. On Solana, the token is an Account (data) managed by the Token Program (logic).

3. **The "Existing Token" Problem**: Since your SPL token already exists and has a supply, you cannot easily make it "native" on Ethereum without defining a canonical bridging mechanism. You must choose between wrapping it (creating a synthetic representation) or adapting it (locking the original to mint a native version on the destination).

---

## 3. Solution A: Wormhole Portal (The "Wrapped" Standard)

The Portal Bridge (formerly Wormhole Token Bridge) is the most established path. It uses a "Lock-and-Mint" mechanism validated by 19 "Guardians."

### 3.1 Mechanism: Permissionless Attestation

Portal allows any user to register a custom SPL token on Ethereum without permission from the Wormhole team. This is done via **Attestation**.

- **Attestation (Source)**: You interact with the Wormhole bridge on Solana to "Attest" your custom SPL token. The bridge reads the metadata (Name, Symbol, Decimals) from the SPL Mint Account and broadcasts a VAA (Verified Action Approval).

- **Creation (Destination)**: You submit this VAA to the Wormhole contract on Ethereum. The contract deploys a new Wormhole-Wrapped ERC-20 contract that programmatically mirrors your SPL token's metadata.

### 3.2 Trade-offs

**Pros:**
- Zero code required
- Instant deployment
- High liquidity in the Solana ecosystem

**Cons:**
- You do not own the ERC-20 contract on Ethereum
- You cannot upgrade it, add tax logic, or blacklist addresses
- The token exists as a "Wormhole Wrapped" asset, which is often considered a "second-class citizen" compared to native tokens

---

## 4. Solution B: LayerZero V2 OFT Adapter (The Sovereign Choice)

LayerZero V2 introduces the OFT (Omnichain Fungible Token) Adapter specifically for existing tokens. This solution decouples the security layer from the application layer, allowing you to choose your own verifiers (e.g., Google Cloud, Polyhedra) rather than trusting a single bridge consortium.

### 4.1 Architecture: The OFT Store

LayerZero's implementation on Solana differs from its EVM implementation. On EVM chains, developers typically inherit from a library and deploy a contract. On Solana, LayerZero mandates that developers deploy their own instance of the OFT Program.

- **The OFT Program**: You compile and deploy a clone of the LayerZero OFT Program. This gives you the Upgrade Authority, ensuring no one else can change your bridge logic.

- **The OFT Store**: This is a PDA (Program Derived Address) that manages the state.

- **The Escrow**: A Token Account owned by the OFT Store that locks your custom SPL tokens.

### 4.2 Implementation Steps

1. **Scaffold**: Use `npx create-lz-oapp@latest` and select "OFT Adapter (Solana)".

2. **Deploy Program**: Build the Rust binary (`anchor build`) and deploy it to Solana Mainnet.

3. **Initialize Adapter**: Run the configuration task to link your existing SPL token mint to the new OFT Store.

```bash
pnpm hardhat lz:oft-adapter:solana:create --mint <EXISTING_SPL_ADDRESS> --program-id <YOUR_NEW_PROGRAM_ID>
```

4. **Wire**: Call `setPeer` on both chains to link the Solana OFT Store with your Ethereum OFT Adapter contract.

### 4.3 Trade-offs

**Pros:**
- Absolute sovereignty
- You control the security (DVNs) and the code
- No vendor lock-in to a specific validation set

**Cons:**
- High technical barrier
- Requires Rust/Anchor knowledge to manage the Solana program deployment

---

## 5. Solution C: Wormhole Native Token Transfers (NTT)

NTT is an open-source framework designed to solve the "Wrapped Asset" problem. It allows you to deploy your own bridge contracts, giving you full control over the token on both chains.

### 5.1 Mechanism: The Manager Pattern

Instead of using the global Wormhole bridge contract, you deploy your own `NttManager` program on Solana and `NttManager` contract on Ethereum.

- **On Solana (Source)**: You configure the `NttManager` in "Locking" mode. When a user bridges, they transfer their SPL tokens to the `NttManager`'s custody.

- **On Ethereum (Destination)**: You deploy a standard ERC-20 that you own. You grant the Ethereum `NttManager` the `MINTER_ROLE`. When it receives a message from Solana, it mints real (not wrapped) tokens.

### 5.2 Implementation Nuance

This requires using the NTT CLI. You must perform a "Peer Linking" process, explicitly authorizing your Solana Program to send messages to your Ethereum Contract. This prevents spoofing and ensures that only your bridge logic can mint your tokens.

---

## 6. Comparative Matrix & Recommendation

| Feature | Wormhole Portal | LayerZero V2 OFT | Wormhole NTT | Axelar ITS |
|---------|----------------|------------------|--------------|------------|
| **Token Type** | Wrapped (Synthetic) | Native (OFT Standard) | Native (Canonical) | Native (Interchain) |
| **Developer Control** | None (Bridge Owned) | Maximum (Dev Owned) | High (Dev Owned) | High (Dev Owned) |
| **Solana Code** | None | Deploy OFT Program | Deploy NttManager | None (via Portal) |
| **Security Model** | 19 Guardians (PoA) | Configurable DVNs | 19 Guardians (PoA) | Dynamic Validators (PoS) |
| **Implementation** | No-Code (UI) | Rust / Anchor / CLI | CLI / TypeScript | No-Code (UI) |

---

## Final Verdict

### Scenario A: You need it done today with zero engineering overhead

**Choose: Wormhole Portal**

**Why:** You can attest your custom SPL token in 5 minutes using the UI. It works immediately.

**Warning:** You will be stuck with a "Wormhole Wrapped" asset on Ethereum that you cannot upgrade or control.

---

### Scenario B: You are building a serious protocol and need control

**Choose: LayerZero V2 OFT Adapter**

**Why:** It offers the most robust "Infrastructure-as-Code" solution. By deploying your own Solana program, you eliminate the risk of a shared bridge contract exploit affecting your token. The ability to configure your own security verifiers (DVNs) is a massive advantage for long-term risk management.

---

### Scenario C: You want native tokens but minimal DevOps

**Choose: Axelar ITS**

**Why:** The ITS Portal offers a "deploy once, everywhere" experience that approximates the native benefits of LayerZero/NTT without requiring you to write and maintain Rust code.

---

## Conclusion

The choice of bridging infrastructure is not merely technical—it's a strategic decision that impacts your token's long-term viability, security posture, and ecosystem integration. Choose wisely based on your team's capabilities, timeline, and sovereignty requirements.
