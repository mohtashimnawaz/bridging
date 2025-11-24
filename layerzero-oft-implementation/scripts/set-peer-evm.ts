import { ethers } from "hardhat";

/**
 * Script to set peer on the Ethereum OFT Adapter.
 * Calls setPeer(remoteEid, peerAddress) on the deployed OFT Adapter contract.
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting peer with account:", deployer.address);

  const oftAdapterAddress = process.env.ETHEREUM_OFT_ADAPTER_ADDRESS || "";
  const remoteEid = parseInt(process.env.SOLANA_ENDPOINT_ID || "30168");
  const solanaOftStore = process.env.SOLANA_OFT_STORE_ADDRESS || "";

  if (!oftAdapterAddress || !solanaOftStore) {
    throw new Error("Missing ETHEREUM_OFT_ADAPTER_ADDRESS or SOLANA_OFT_STORE_ADDRESS in .env");
  }

  const OFT = await ethers.getContractFactory("MyTokenOFTAdapter");
  const oft = OFT.attach(oftAdapterAddress);

  console.log("Calling setPeer on OFT Adapter:", oftAdapterAddress);
  console.log("  Remote EID:", remoteEid);
  console.log("  Peer Address (Solana):", solanaOftStore);

  const tx = await oft.setPeer(remoteEid, ethers.utils.hexZeroPad(solanaOftStore, 32));
  await tx.wait();

  console.log("Peer set successfully. TX:", tx.hash);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
