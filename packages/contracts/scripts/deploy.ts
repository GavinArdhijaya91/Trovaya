import { ethers, network } from "hardhat";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("DEPLOYER_PRIVATE_KEY is required for testnet deployment");
  }

  const ipNFT = await ethers.deployContract("TrovayaIPNFT", [deployer.address]);
  await ipNFT.waitForDeployment();

  const verifier = await ethers.deployContract("MockZKHumanVerifier", [deployer.address]);
  await verifier.waitForDeployment();

  const vault = await ethers.deployContract("TrovayaVault", [
    deployer.address,
    await ipNFT.getAddress(),
    await verifier.getAddress(),
  ]);
  await vault.waitForDeployment();

  // Machine-readable output can be copied into frontend or indexer environment configuration.
  console.log(JSON.stringify({
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      trovayaIPNFT: await ipNFT.getAddress(),
      mockZKHumanVerifier: await verifier.getAddress(),
      trovayaVault: await vault.getAddress(),
    },
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
