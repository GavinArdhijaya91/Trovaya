import { expect } from "chai";
import { ethers } from "hardhat";

describe("TrovayaVault", () => {
  async function deployFixture() {
    const [owner, creator, buyer, human] = await ethers.getSigners();
    const nft = await ethers.deployContract("TrovayaIPNFT", [creator.address], creator);
    await nft.connect(creator).mintIP("ipfs://metadata", false, 100n, "QmPublic", "QmVault", 500);
    const verifier = await ethers.deployContract("MockZKHumanVerifier", [owner.address], owner);
    const vault = await ethers.deployContract(
      "TrovayaVault",
      [owner.address, await nft.getAddress(), await verifier.getAddress()],
      owner,
    );
    return { owner, creator, buyer, human, nft, verifier, vault };
  }

  it("unlocks for a verified human using the demo proof", async () => {
    const { owner, human, verifier, vault } = await deployFixture();
    await verifier.connect(owner).setVerifiedHuman(human.address, true);

    await expect(vault.connect(human).unlockWithHumanProof(1, "0x01"))
      .to.emit(vault, "VaultAccessGranted").withArgs(1n, human.address, false);
    expect(await vault.hasVaultAccess(1, human.address)).to.equal(true);
  });

  it("rejects an unverified human", async () => {
    const { human, vault } = await deployFixture();
    await expect(vault.connect(human).unlockWithHumanProof(1, "0x01"))
      .to.be.revertedWithCustomError(vault, "InvalidHumanProof");
  });

  it("unlocks for an official commercial license holder", async () => {
    const { buyer, nft, vault } = await deployFixture();
    await nft.connect(buyer).purchaseCommercialLicense(1, { value: 100n });

    await expect(vault.connect(buyer).unlockWithLicense(1))
      .to.emit(vault, "VaultAccessGranted").withArgs(1n, buyer.address, true);
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
});
