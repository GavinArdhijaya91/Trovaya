import "dotenv/config";
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer / Creator:", deployer.address);

  // We can reuse or create a funded buyer wallet
  // Let's create a random buyer or reuse if balance exists
  const buyer = ethers.Wallet.createRandom(ethers.provider);
  console.log("Created Buyer Wallet:", buyer.address);

  const fundTx = await deployer.sendTransaction({
    to: buyer.address,
    value: ethers.parseEther("0.003"),
  });
  await fundTx.wait();
  console.log("Funded buyer tx:", fundTx.hash);

  const ipNFTAddress = process.env.TROVAYA_IP_NFT_ADDRESS!;
  const vaultAddress = process.env.TROVAYA_VAULT_ADDRESS!;

  const ipNFT = await ethers.getContractAt("TrovayaIPNFT", ipNFTAddress, buyer);
  const vault = await ethers.getContractAt("TrovayaVault", vaultAddress, buyer);

  const tokenId = 14n;
  const termsHash = "0xc1df6002f06144bb95739ebef4fab4e9c8ff8341ca9c55e1559c607a867b523e";
  const termsVersion = 1;
  const fee = 1000000000000n; // 0.000001 BNB

  console.log("Purchasing commercial license for Token 14...");
  const purchaseTx = await ipNFT.purchaseCommercialLicense(tokenId, termsHash, termsVersion, { value: fee });
  const purchaseReceipt = await purchaseTx.wait();
  console.log("Purchase Tx Hash:", purchaseTx.hash, "Block:", purchaseReceipt?.blockNumber);

  console.log("Authorizing vault access via unlockWithLicense...");
  const vaultTx = await vault.unlockWithLicense(tokenId);
  const vaultReceipt = await vaultTx.wait();
  console.log("Vault Auth Tx Hash:", vaultTx.hash, "Block:", vaultReceipt?.blockNumber);

  // Verify access
  const hasLicense = await ipNFT.hasCommercialLicense(tokenId, buyer.address);
  const hasVault = await vault.hasVaultAccess(tokenId, buyer.address);
  console.log("Verification - License:", hasLicense, "Vault Access:", hasVault);

  console.log(JSON.stringify({
    buyerWallet: buyer.address,
    buyerPrivateKey: buyer.privateKey,
    purchaseTxHash: purchaseTx.hash,
    vaultTxHash: vaultTx.hash,
    purchaseBlock: purchaseReceipt?.blockNumber,
    vaultBlock: vaultReceipt?.blockNumber,
  }, null, 2));
}

main().catch((err) => {
  console.error("Error executing buyer path:", err);
  process.exitCode = 1;
});
