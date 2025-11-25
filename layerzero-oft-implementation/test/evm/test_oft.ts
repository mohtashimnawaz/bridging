import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyToken + OFT Adapter", function () {
  it("deploys token successfully", async function () {
    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy("My Token", "MTK");
    await token.waitForDeployment();

    expect(await token.name()).to.equal("My Token");
    expect(await token.symbol()).to.equal("MTK");
  });

  it.skip("deploys OFT adapter (requires mock endpoint)", async function () {
    // This test requires a mock LayerZero endpoint contract
    // Skip for now - will be tested during integration/testnet deployment
    const [deployer] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy("My Token", "MTK");
    await token.waitForDeployment();

    // Would need to deploy a mock endpoint here
    // const LZ_ENDPOINT = await deployMockEndpoint();
    // const OFT = await ethers.getContractFactory("MyTokenOFTAdapter");
    // const oft = await OFT.deploy(await token.getAddress(), LZ_ENDPOINT, deployer.address);
    // await oft.waitForDeployment();
  });

  it("token has zero initial supply", async function () {
    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy("Test Token", "TST");
    await token.waitForDeployment();

    expect(await token.totalSupply()).to.equal(0);
  });

  it("owner can mint tokens", async function () {
    const [deployer, user] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy("Test Token", "TST");
    await token.waitForDeployment();

    await token.mint(user.address, ethers.parseEther("100"));
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("100"));
  });
});
