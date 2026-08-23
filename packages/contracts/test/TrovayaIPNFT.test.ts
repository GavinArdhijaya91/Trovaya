import { expect } from "chai";
import { ethers } from "hardhat";

const TERMS_HASH = ethers.keccak256(ethers.toUtf8Bytes("trovaya-license-v1"));
const TERMS_ARGS = ["ipfs://license-terms", TERMS_HASH, 1, 365 * 24 * 60 * 60] as const;

describe("TrovayaIPNFT", () => {
  async function deployFixture() {
    const [creator, buyer] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrovayaIPNFT", [creator.address]);
    return { contract, creator, buyer };
  }

  it("mints IP with consent and protection metadata", async () => {
    const { contract, creator } = await deployFixture();
    await expect(
      contract.mintIP("ipfs://metadata", false, 100n, "QmPoisoned", "QmVault", 500, ...TERMS_ARGS),
    ).to.emit(contract, "IPMinted").withArgs(1n, creator.address, false);

    const metadata = await contract.getIPMetadata(1);
    expect(metadata.creator).to.equal(creator.address);
    expect(metadata.allowAITraining).to.equal(false);
    expect(metadata.publicPoisonedCid).to.equal("QmPoisoned");
    expect(metadata.licenseTermsHash).to.equal(TERMS_HASH);
    expect(metadata.licenseTermsVersion).to.equal(1n);
    expect(await contract.totalSupply()).to.equal(1n);
    expect(await contract.tokenByIndex(0)).to.equal(1n);

    const [, royalty] = await contract.royaltyInfo(1, 10_000n);
    expect(royalty).to.equal(500n);
  });

  it("allows a non-admin creator to self-register IP", async () => {
    const { contract, buyer } = await deployFixture();

    await expect(
      contract.connect(buyer).mintIP("ipfs://buyer-metadata", false, 100n, "QmPublic", "QmVault", 500, ...TERMS_ARGS),
    ).to.emit(contract, "IPMinted").withArgs(1n, buyer.address, false);

    expect(await contract.ownerOf(1)).to.equal(buyer.address);
    expect((await contract.getIPMetadata(1)).creator).to.equal(buyer.address);
  });

  it("records a commercial license and credits pull-payment proceeds", async () => {
    const { contract, creator, buyer } = await deployFixture();
    await contract.mintIP("ipfs://metadata", true, 100n, "QmPoisoned", "QmVault", 500, ...TERMS_ARGS);

    await expect(contract.connect(buyer).purchaseCommercialLicense(1, TERMS_HASH, 1, { value: 100n }))
      .to.emit(contract, "LicensePurchased").withArgs(1n, buyer.address, 100n);
    expect(await contract.pendingWithdrawals(creator.address)).to.equal(100n);
    expect(await contract.totalPendingWithdrawals()).to.equal(100n);
    expect(await contract.hasCommercialLicense(1, buyer.address)).to.equal(true);
    const receipt = await contract.getLicenseReceipt(1, buyer.address);
    expect(receipt.termsHash).to.equal(TERMS_HASH);
    expect(receipt.termsVersion).to.equal(1n);
    expect(receipt.pricePaid).to.equal(100n);

    await expect(contract.connect(creator).withdrawProceeds(creator.address))
      .to.emit(contract, "ProceedsWithdrawn").withArgs(creator.address, creator.address, 100n);
    expect(await contract.pendingWithdrawals(creator.address)).to.equal(0n);
    expect(await contract.totalPendingWithdrawals()).to.equal(0n);
  });

  it("does not let a rejecting creator block license purchase and permits alternate withdrawal", async () => {
    const { contract, creator, buyer } = await deployFixture();
    const rejecting = await ethers.deployContract("RejectingCreator");
    await contract.mintIPFor(await rejecting.getAddress(), "ipfs://metadata", false, 100n, "a", "b", 500, ...TERMS_ARGS);

    await expect(contract.connect(buyer).purchaseCommercialLicense(1, TERMS_HASH, 1, { value: 100n }))
      .to.emit(contract, "LicensePurchased");
    expect(await contract.pendingWithdrawals(await rejecting.getAddress())).to.equal(100n);
    await expect(rejecting.withdrawTo(await contract.getAddress(), creator.address))
      .to.emit(contract, "ProceedsWithdrawn").withArgs(await rejecting.getAddress(), creator.address, 100n);
  });

  it("preserves withdrawal accounting when the recipient rejects Ether", async () => {
    const { contract, creator, buyer } = await deployFixture();
    const rejecting = await ethers.deployContract("RejectingCreator");
    await contract.mintIP("ipfs://metadata", false, 100n, "a", "b", 500, ...TERMS_ARGS);
    await contract.connect(buyer).purchaseCommercialLicense(1, TERMS_HASH, 1, { value: 100n });

    await expect(contract.connect(creator).withdrawProceeds(await rejecting.getAddress()))
      .to.be.revertedWithCustomError(contract, "WithdrawalFailed");
    expect(await contract.pendingWithdrawals(creator.address)).to.equal(100n);
    expect(await ethers.provider.getBalance(await contract.getAddress())).to.equal(100n);
  });

  it("keeps aggregate withdrawal liabilities equal to contract funds", async () => {
    const { contract, creator, buyer } = await deployFixture();
    const [, , secondBuyer] = await ethers.getSigners();
    await contract.mintIP("ipfs://metadata", false, 100n, "a", "b", 500, ...TERMS_ARGS);
    await contract.connect(buyer).purchaseCommercialLicense(1, TERMS_HASH, 1, { value: 100n });
    await contract.connect(secondBuyer).purchaseCommercialLicense(1, TERMS_HASH, 1, { value: 100n });

    expect(await contract.pendingWithdrawals(creator.address)).to.equal(200n);
    expect(await contract.totalPendingWithdrawals()).to.equal(200n);
    expect(await ethers.provider.getBalance(await contract.getAddress())).to.equal(200n);
    await contract.connect(creator).withdrawProceeds(creator.address);
    expect(await contract.totalPendingWithdrawals()).to.equal(0n);
    expect(await ethers.provider.getBalance(await contract.getAddress())).to.equal(0n);
  });

  it("rejects royalties above 100 percent", async () => {
    const { contract } = await deployFixture();
    await expect(contract.mintIP("ipfs://metadata", false, 0, "a", "b", 10_001, ...TERMS_ARGS))
      .to.be.revertedWithCustomError(contract, "InvalidRoyalty");
  });

  it("prevents duplicate commercial license purchases", async () => {
    const { contract, buyer } = await deployFixture();
    await contract.mintIP("ipfs://metadata", false, 100n, "QmPoisoned", "QmVault", 500, ...TERMS_ARGS);
    await contract.connect(buyer).purchaseCommercialLicense(1, TERMS_HASH, 1, { value: 100n });

    await expect(contract.connect(buyer).purchaseCommercialLicense(1, TERMS_HASH, 1, { value: 100n }))
      .to.be.revertedWithCustomError(contract, "LicenseAlreadyPurchased");
  });

  it("advertises ERC-721, ERC-2981, and Trovaya interfaces", async () => {
    const { contract } = await deployFixture();
    expect(await contract.supportsInterface("0x80ac58cd")).to.equal(true);
    expect(await contract.supportsInterface("0x780e9d63")).to.equal(true);
    expect(await contract.supportsInterface("0x2a55205a")).to.equal(true);

    const signatures = [
      "mintIP(string,bool,uint256,string,string,uint96,string,bytes32,uint32,uint64)",
      "mintIPFor(address,string,bool,uint256,string,string,uint96,string,bytes32,uint32,uint64)",
      "purchaseCommercialLicense(uint256,bytes32,uint32)",
      "getIPMetadata(uint256)",
      "hasCommercialLicense(uint256,address)",
      "pendingWithdrawals(address)",
      "withdrawProceeds(address)",
      "getLicenseReceipt(uint256,address)",
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
    await contract.mintIP("ipfs://metadata", false, 100n, "QmPublic", "QmVault", 500, ...TERMS_ARGS);
    await contract.connect(creator).pause();

    await expect(contract.mintIP("ipfs://two", false, 100n, "a", "b", 500, ...TERMS_ARGS))
      .to.be.revertedWithCustomError(contract, "EnforcedPause");
    await expect(contract.connect(buyer).purchaseCommercialLicense(1, TERMS_HASH, 1, { value: 100n }))
      .to.be.revertedWithCustomError(contract, "EnforcedPause");
  });

  it("allows an authorized relayer to register an asset for its creator", async () => {
    const { contract, buyer } = await deployFixture();
    await contract.mintIPFor(buyer.address, "ipfs://metadata", true, 100n, "a", "b", 500, ...TERMS_ARGS);
    expect(await contract.ownerOf(1)).to.equal(buyer.address);
    expect((await contract.getIPMetadata(1)).creator).to.equal(buyer.address);
  });

  it("prevents a non-relayer from registering IP for another creator", async () => {
    const { contract, creator, buyer } = await deployFixture();

    await expect(
      contract.connect(buyer).mintIPFor(
        creator.address, "ipfs://metadata", true, 100n, "a", "b", 500, ...TERMS_ARGS,
      ),
    ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount")
      .withArgs(buyer.address, await contract.MINTER_ROLE());
  });

  it("rejects stale or substituted license terms", async () => {
    const { contract, buyer } = await deployFixture();
    await contract.mintIP("ipfs://metadata", false, 100n, "QmPublic", "QmVault", 500, ...TERMS_ARGS);
    const otherHash = ethers.keccak256(ethers.toUtf8Bytes("substituted"));

    await expect(contract.connect(buyer).purchaseCommercialLicense(1, otherHash, 1, { value: 100n }))
      .to.be.revertedWithCustomError(contract, "LicenseTermsMismatch");
    await expect(contract.connect(buyer).purchaseCommercialLicense(1, TERMS_HASH, 2, { value: 100n }))
      .to.be.revertedWithCustomError(contract, "LicenseTermsMismatch");
  });

  it("rejects registration without immutable license terms", async () => {
    const { contract } = await deployFixture();
    await expect(contract.mintIP("ipfs://metadata", false, 100n, "a", "b", 500, "", ethers.ZeroHash, 0, 0))
      .to.be.revertedWithCustomError(contract, "InvalidLicenseTerms");
  });
});
