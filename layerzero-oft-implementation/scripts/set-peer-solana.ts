import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";

/**
 * Stub script to set peer on Solana OFT Adapter.
 * This will eventually call your Anchor program's `setPeer` instruction.
 * Adapt this once your Anchor program has the actual setPeer interface.
 */

async function main() {
  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  const programId = new PublicKey(process.env.SOLANA_PROGRAM_ID || "OFtAdApTeR11111111111111111111111111111111");
  const remoteEid = parseInt(process.env.ETHEREUM_ENDPOINT_ID || "30101");
  const peerAddress = process.env.ETHEREUM_OFT_ADAPTER_ADDRESS || "";

  console.log("Setting peer on Solana:");
  console.log("  Program ID:", programId.toBase58());
  console.log("  Remote EID:", remoteEid);
  console.log("  Peer Address (EVM):", peerAddress);

  // TODO: Build and send Anchor instruction to setPeer
  // Example:
  // const tx = await program.methods.setPeer(remoteEid, peerAddress)...

  console.log("Peer set successfully (stub).");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
