import { expect } from "chai";
import { ethers } from "hardhat";

const TERMS_HASH = ethers.keccak256(ethers.toUtf8Bytes("trovaya-license-v1"));

describe("TrovayaVault", () => {
  async function deployFixture() {
    const [owner, creator, buyer, human] = await ethers.getSigners();
    const nft = await ethers.deployContract("TrovayaIPNFT", [creator.address], creator);
    await nft.connect(creator).mintIP(
      "ipfs://metadata", false, 100n, "QmPublic", "QmVault", 500,
      "ipfs://license-terms", TERMS_HASH, 1, 365 * 24 * 60 * 60,
    );
    const verifier = await ethers.deployContract("MockZKHumanVerifier", [owner.address], owner);
    const vault = await ethers.deployContract(
      "TrovayaVault",
      [owner.address, await nft.getAddress(), await verifier.getAddress()],
      owner,
    );
    return { owner, creator, buyer, human, nft, verifier, vault };
  }

  it("rejects zero-address administrative configuration", async () => {
    const [owner] = await ethers.getSigners();
    await expect(ethers.deployContract("MockZKHumanVerifier", [ethers.ZeroAddress]))
      .to.be.revertedWithCustomError(await ethers.getContractFactory("MockZKHumanVerifier"), "InvalidAddress");
    const nft = await ethers.deployContract("TrovayaIPNFT", [owner.address]);
    const verifier = await ethers.deployContract("MockZKHumanVerifier", [owner.address]);
    await expect(ethers.deployContract("TrovayaVault", [ethers.ZeroAddress, await nft.getAddress(), await verifier.getAddress()]))
      .to.be.revertedWithCustomError(await ethers.getContractFactory("TrovayaVault"), "InvalidAddress");
  });

  it("rejects assigning mock verification to the zero address", async () => {
    const { owner, verifier } = await deployFixture();
    await expect(verifier.connect(owner).setVerifiedHuman(ethers.ZeroAddress, true))
      .to.be.revertedWithCustomError(verifier, "InvalidAddress");
  });

  it("unlocks for a verified human using the demo proof", async () => {
    const { owner, human, verifier, vault } = await deployFixture();
    await verifier.connect(owner).setVerifiedHuman(human.address, true);

    await expect(vault.connect(human).unlockWithHumanProof(1, "0x01"))
      .to.emit(vault, "VaultAccessGranted");
    expect(await vault.hasVaultAccess(1, human.address)).to.equal(true);
  });

  it("rejects an unverified human", async () => {
    const { human, vault } = await deployFixture();
    await expect(vault.connect(human).unlockWithHumanProof(1, "0x01"))
      .to.be.revertedWithCustomError(vault, "InvalidHumanProof");
  });

  it("unlocks for an official commercial license holder", async () => {
    const { buyer, nft, vault } = await deployFixture();
    await nft.connect(buyer).purchaseCommercialLicense(1, TERMS_HASH, 1, { value: 100n });

    await expect(vault.connect(buyer).unlockWithLicense(1))
      .to.emit(vault, "VaultAccessGranted");
  });

  it("rejects vault access without a license", async () => {
    const { buyer, vault } = await deployFixture();
    await expect(vault.connect(buyer).unlockWithLicense(1))
      .to.be.revertedWithCustomError(vault, "CommercialLicenseRequired");
  });

  it("halts unlocks during an emergency", async () => {
    const { owner, human, verifier, vault } = await deployFixture();
    await verifier.connect(owner).setVerifiedHuman(human.address, true);
    await vault.connect(owner).pause();
    await expect(vault.connect(human).unlockWithHumanProof(1, "0x01"))
      .to.be.revertedWithCustomError(vault, "EnforcedPause");
  });

  it("expires license access and prevents future delivery eligibility", async () => {
    const { buyer, nft, vault } = await deployFixture();
    await nft.connect(buyer).purchaseCommercialLicense(1, TERMS_HASH, 1, { value: 100n });
    await vault.connect(buyer).unlockWithLicense(1);
    await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine", []);
    expect(await vault.hasVaultAccess(1, buyer.address)).to.equal(false);
  });

  it("allows creator revocation of future key delivery", async () => {
    const { creator, buyer, nft, vault } = await deployFixture();
    await nft.connect(buyer).purchaseCommercialLicense(1, TERMS_HASH, 1, { value: 100n });
    await vault.connect(buyer).unlockWithLicense(1);
    await expect(vault.connect(creator).revokeAccess(1, buyer.address))
      .to.emit(vault, "VaultAccessRevoked").withArgs(1n, buyer.address, creator.address);
    expect(await vault.hasVaultAccess(1, buyer.address)).to.equal(false);
  });
});
