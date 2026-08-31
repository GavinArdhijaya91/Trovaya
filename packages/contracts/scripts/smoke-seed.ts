import { ethers } from "hardhat";

async function main(): Promise<void> {
  const [creator] = await ethers.getSigners();
  const contract = await ethers.deployContract("TrovayaIPNFT", [creator.address]);
  await contract.waitForDeployment();
  const deployment = await contract.deploymentTransaction()?.wait();
  if (!deployment) throw new Error("deployment receipt unavailable");
  const termsHash = ethers.keccak256(ethers.toUtf8Bytes("trovaya-local-smoke-terms-v1"));
  const mint = await contract.mintIP(
    "ipfs://bafy-smoke-metadata", false, 100n, "bafy-smoke-public", "bafy-smoke-vault",
    500, "ipfs://bafy-smoke-terms", termsHash, 1, 86400,
  );
  await mint.wait();
  console.log(`TROVAYA_SMOKE_RESULT=${JSON.stringify({
    address: await contract.getAddress(), deploymentBlock: deployment.blockNumber, creator: creator.address,
  })}`);
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
