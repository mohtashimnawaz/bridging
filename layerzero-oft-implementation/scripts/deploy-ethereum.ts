import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const LZ_ENDPOINT = process.env.LZ_ENDPOINT_ETHEREUM || "";

  // Deploy ERC-20 token
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy("My Token", "MTK");
  await token.deployed();
  console.log("Token deployed to:", token.address);

  // Deploy OFT Adapter
  const OFTAdapter = await ethers.getContractFactory("MyTokenOFTAdapter");
  const oftAdapter = await OFTAdapter.deploy(token.address, LZ_ENDPOINT, deployer.address);
  await oftAdapter.deployed();
  console.log("OFT Adapter deployed to:", oftAdapter.address);

  console.log("NOTE: After deployment, grant the OFT Adapter any token roles or approvals needed.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
