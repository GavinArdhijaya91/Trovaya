import { expect } from "chai";
import { ethers } from "hardhat";

describe("TrovayaIPNFT", () => {
  async function deployFixture() {
    const [creator, buyer] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrovayaIPNFT", [creator.address]);
    return { contract, creator, buyer };
  }

  it("mints IP with consent and protection metadata", async () => {
    const { contract, creator } = await deployFixture();
    await expect(
      contract.mintIP("ipfs://metadata", false, 100n, "QmPoisoned", "QmVault", 500),
    ).to.emit(contract, "IPMinted").withArgs(1n, creator.address, false);

    const metadata = await contract.getIPMetadata(1);
    expect(metadata.creator).to.equal(creator.address);
    expect(metadata.allowAITraining).to.equal(false);
    expect(metadata.publicPoisonedCid).to.equal("QmPoisoned");
    expect(await contract.totalSupply()).to.equal(1n);
    expect(await contract.tokenByIndex(0)).to.equal(1n);

    const [, royalty] = await contract.royaltyInfo(1, 10_000n);
    expect(royalty).to.equal(500n);
  });

  it("allows a non-admin creator to self-register IP", async () => {
    const { contract, buyer } = await deployFixture();

    await expect(
      contract.connect(buyer).mintIP("ipfs://buyer-metadata", false, 100n, "QmPublic", "QmVault", 500),
    ).to.emit(contract, "IPMinted").withArgs(1n, buyer.address, false);

    expect(await contract.ownerOf(1)).to.equal(buyer.address);
    expect((await contract.getIPMetadata(1)).creator).to.equal(buyer.address);
  });

  it("records and pays a commercial license", async () => {
    const { contract, creator, buyer } = await deployFixture();
    await contract.mintIP("ipfs://metadata", true, 100n, "QmPoisoned", "QmVault", 500);

    const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);
    await expect(contract.connect(buyer).purchaseCommercialLicense(1, { value: 100n }))
      .to.emit(contract, "LicensePurchased").withArgs(1n, buyer.address, 100n);
    expect(await ethers.provider.getBalance(creator.address)).to.equal(creatorBalanceBefore + 100n);
    expect(await contract.hasCommercialLicense(1, buyer.address)).to.equal(true);
  });

  it("rejects royalties above 100 percent", async () => {
    const { contract } = await deployFixture();
    await expect(contract.mintIP("ipfs://metadata", false, 0, "a", "b", 10_001))
      .to.be.revertedWithCustomError(contract, "InvalidRoyalty");
  });

  it("prevents duplicate commercial license purchases", async () => {
    const { contract, buyer } = await deployFixture();
    await contract.mintIP("ipfs://metadata", false, 100n, "QmPoisoned", "QmVault", 500);
    await contract.connect(buyer).purchaseCommercialLicense(1, { value: 100n });

    await expect(contract.connect(buyer).purchaseCommercialLicense(1, { value: 100n }))
      .to.be.revertedWithCustomError(contract, "LicenseAlreadyPurchased");
  });

  it("advertises ERC-721, ERC-2981, and Trovaya interfaces", async () => {
    const { contract } = await deployFixture();
    expect(await contract.supportsInterface("0x80ac58cd")).to.equal(true);
    expect(await contract.supportsInterface("0x780e9d63")).to.equal(true);
    expect(await contract.supportsInterface("0x2a55205a")).to.equal(true);

    const signatures = [
      "mintIP(string,bool,uint256,string,string,uint96)",
      "mintIPFor(address,string,bool,uint256,string,string,uint96)",
      "purchaseCommercialLicense(uint256)",
      "getIPMetadata(uint256)",
      "hasCommercialLicense(uint256,address)",
    ];
    const trovayaInterfaceId = signatures.reduce(
      (interfaceId, signature) => interfaceId ^ BigInt(ethers.id(signature).slice(0, 10)),
      0n,
    );
    expect(await contract.supportsInterface(`0x${trovayaInterfaceId.toString(16).padStart(8, "0")}`))
      .to.equal(true);
  });

  it("halts registration and purchases during an emergency", async () => {
    const { contract, creator, buyer } = await deployFixture();
    await contract.mintIP("ipfs://metadata", false, 100n, "QmPublic", "QmVault", 500);
    await contract.connect(creator).pause();

    await expect(contract.mintIP("ipfs://two", false, 100n, "a", "b", 500))
      .to.be.revertedWithCustomError(contract, "EnforcedPause");
    await expect(contract.connect(buyer).purchaseCommercialLicense(1, { value: 100n }))
      .to.be.revertedWithCustomError(contract, "EnforcedPause");
  });

  it("allows an authorized relayer to register an asset for its creator", async () => {
    const { contract, buyer } = await deployFixture();
    await contract.mintIPFor(buyer.address, "ipfs://metadata", true, 100n, "a", "b", 500);
    expect(await contract.ownerOf(1)).to.equal(buyer.address);
    expect((await contract.getIPMetadata(1)).creator).to.equal(buyer.address);
  });

  it("prevents a non-relayer from registering IP for another creator", async () => {
    const { contract, creator, buyer } = await deployFixture();

    await expect(
      contract.connect(buyer).mintIPFor(
        creator.address, "ipfs://metadata", true, 100n, "a", "b", 500,
      ),
    ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount")
      .withArgs(buyer.address, await contract.MINTER_ROLE());
  });
});
