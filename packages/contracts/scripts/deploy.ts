import { ethers, network } from "hardhat";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("DEPLOYER_PRIVATE_KEY is required for testnet deployment");
  }

  const ipNFT = await ethers.deployContract("TrovayaIPNFT", [deployer.address]);
  await ipNFT.waitForDeployment();
  const ipNFTTransaction = ipNFT.deploymentTransaction();
  const ipNFTReceipt = await ipNFTTransaction?.wait();
  if (!ipNFTTransaction || !ipNFTReceipt) throw new Error("IP NFT deployment receipt is unavailable");

  const verifier = await ethers.deployContract("MockZKHumanVerifier", [deployer.address]);
  await verifier.waitForDeployment();
  const verifierTransaction = verifier.deploymentTransaction();
  const verifierReceipt = await verifierTransaction?.wait();
  if (!verifierTransaction || !verifierReceipt) throw new Error("Mock verifier deployment receipt is unavailable");

  const family = await ethers.deployContract("TrovayaFamily", [await ipNFT.getAddress()]);
  await family.waitForDeployment();
  const familyTransaction = family.deploymentTransaction();
  const familyReceipt = await familyTransaction?.wait();
  if (!familyTransaction || !familyReceipt) throw new Error("TrovayaFamily deployment receipt is unavailable");

  const vault = await ethers.deployContract("TrovayaVault", [
    deployer.address,
    await ipNFT.getAddress(),
    await verifier.getAddress(),
  ]);
  await vault.waitForDeployment();
  const vaultTransaction = vault.deploymentTransaction();
  const vaultReceipt = await vaultTransaction?.wait();
  if (!vaultTransaction || !vaultReceipt) throw new Error("Vault deployment receipt is unavailable");

  // Integrate Family into Vault
  const vaultContract = await ethers.getContractAt("TrovayaVault", await vault.getAddress());
  await vaultContract.setTrovayaFamily(await family.getAddress());

  // Machine-readable output can be copied into frontend or indexer environment configuration.
  console.log(JSON.stringify({
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      trovayaIPNFT: {
        address: await ipNFT.getAddress(),
        transactionHash: ipNFTTransaction.hash,
        deploymentBlock: ipNFTReceipt.blockNumber,
      },
      mockZKHumanVerifier: {
        address: await verifier.getAddress(),
        transactionHash: verifierTransaction.hash,
        deploymentBlock: verifierReceipt.blockNumber,
        capability: "mock_not_zero_knowledge",
      },
      trovayaFamily: {
        address: await family.getAddress(),
        transactionHash: familyTransaction.hash,
        deploymentBlock: familyReceipt.blockNumber,
      },
      trovayaVault: {
        address: await vault.getAddress(),
        transactionHash: vaultTransaction.hash,
        deploymentBlock: vaultReceipt.blockNumber,
      },
    },
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
