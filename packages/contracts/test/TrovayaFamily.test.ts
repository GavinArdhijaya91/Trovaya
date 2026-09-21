import { expect } from "chai";
import { ethers } from "hardhat";

describe("TrovayaFamily", () => {
  async function deployFixture() {
    const [creator, memberA, memberB, memberC, outsider] = await ethers.getSigners();
    const nft = await ethers.deployContract("TrovayaIPNFT", [creator.address]);
    const family = await ethers.deployContract("TrovayaFamily", [await nft.getAddress()]);
    const members = [memberA.address, memberB.address, memberC.address];
    return { nft, family, creator, memberA, memberB, memberC, outsider, members };
  }

  it("creates a collective funding group and records its target", async () => {
    const { family, creator, members } = await deployFixture();

    await expect(family.createFamily(members, 1, 300n))
      .to.emit(family, "GroupCreated").withArgs(1n, creator.address, 1n, 300n);

    const group = await family.groups(1);
    expect(await family.groupCount()).to.equal(1n);
    expect(group.creator).to.equal(creator.address);
    expect(group.tokenId).to.equal(1n);
    expect(group.targetAmount).to.equal(300n);
    expect(group.currentAmount).to.equal(0n);
    expect(group.isPurchased).to.equal(false);
  });

  it("requires between three and five members", async () => {
    const { family, memberA, memberB, memberC, outsider } = await deployFixture();

    await expect(family.createFamily([memberA.address, memberB.address], 1, 300n))
      .to.be.revertedWithCustomError(family, "InvalidMemberCount");
    await expect(
      family.createFamily(
        [memberA.address, memberB.address, memberC.address, outsider.address, memberA.address, memberB.address],
        1,
        300n,
      ),
    ).to.be.revertedWithCustomError(family, "InvalidMemberCount");
  });

  it("rejects contributions to an unknown group", async () => {
    const { family, memberA } = await deployFixture();

    await expect(family.connect(memberA).contribute(99, { value: 100n }))
      .to.be.revertedWithCustomError(family, "GroupDoesNotExist");
  });

  it("restricts contributions to registered members", async () => {
    const { family, members, outsider } = await deployFixture();
    await family.createFamily(members, 1, 300n);

    await expect(family.connect(outsider).contribute(1, { value: 100n }))
      .to.be.revertedWithCustomError(family, "NotAMember");
    expect(await ethers.provider.getBalance(await family.getAddress())).to.equal(0n);
  });

  it("rejects zero-value and duplicate contributions", async () => {
    const { family, memberA, members } = await deployFixture();
    await family.createFamily(members, 1, 300n);

    await expect(family.connect(memberA).contribute(1))
      .to.be.revertedWithCustomError(family, "InvalidAmount");

    await family.connect(memberA).contribute(1, { value: 100n });
    await expect(family.connect(memberA).contribute(1, { value: 50n }))
      .to.be.revertedWithCustomError(family, "AlreadyContributed");
    expect(await family.contributions(1, memberA.address)).to.equal(100n);
  });

  it("accumulates member contributions below the target", async () => {
    const { family, memberA, memberB, members } = await deployFixture();
    await family.createFamily(members, 1, 300n);

    await expect(family.connect(memberA).contribute(1, { value: 100n }))
      .to.emit(family, "Contributed").withArgs(1n, memberA.address, 100n);
    await family.connect(memberB).contribute(1, { value: 100n });

    const group = await family.groups(1);
    expect(group.currentAmount).to.equal(200n);
    expect(group.isPurchased).to.equal(false);
    expect(await family.contributions(1, memberB.address)).to.equal(100n);
  });

  it("rejects a refund when no contribution is recorded", async () => {
    const { family, memberA, members } = await deployFixture();
    await family.createFamily(members, 1, 300n);

    await expect(family.connect(memberA).claimRefund(1))
      .to.be.revertedWithCustomError(family, "InsufficientFunds");
  });

  it("refunds a contribution and settles the group accounting", async () => {
    const { family, memberA, members } = await deployFixture();
    await family.createFamily(members, 1, 300n);
    await family.connect(memberA).contribute(1, { value: 120n });

    const balanceBefore = await ethers.provider.getBalance(memberA.address);
    const receipt = await (await family.connect(memberA).claimRefund(1)).wait();
    const balanceAfter = await ethers.provider.getBalance(memberA.address);

    await expect(receipt).to.emit(family, "RefundClaimed").withArgs(1n, memberA.address, 120n);
    expect(balanceAfter).to.equal(balanceBefore + 120n - receipt!.gasUsed * receipt!.gasPrice);
    expect(await family.contributions(1, memberA.address)).to.equal(0n);
    expect((await family.groups(1)).currentAmount).to.equal(0n);
    expect(await ethers.provider.getBalance(await family.getAddress())).to.equal(0n);

    await expect(family.connect(memberA).claimRefund(1))
      .to.be.revertedWithCustomError(family, "InsufficientFunds");
  });

  it("withholds vault access until the group purchases the license", async () => {
    const { family, memberA, outsider, members } = await deployFixture();
    await family.createFamily(members, 1, 300n);
    await family.connect(memberA).contribute(1, { value: 100n });

    expect(await family.isMemberOfPurchasedFamily(1, memberA.address)).to.equal(false);
    expect(await family.isMemberOfPurchasedFamily(1, outsider.address)).to.equal(false);
    expect(await family.isMemberOfPurchasedFamily(2, memberA.address)).to.equal(false);
  });
});
