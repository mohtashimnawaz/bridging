import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyToken + OFT Adapter", function () {
  it("deploys token and adapter", async function () {
    const [deployer] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy("My Token", "MTK");
    await token.deployed();

    const LZ_ENDPOINT = ethers.constants.AddressZero; // placeholder for test
    const OFT = await ethers.getContractFactory("MyTokenOFTAdapter");
    const oft = await OFT.deploy(token.address, LZ_ENDPOINT, deployer.address);
    await oft.deployed();

    expect(await token.name()).to.equal("My Token");
    expect(await token.symbol()).to.equal("MTK");
  });
});
