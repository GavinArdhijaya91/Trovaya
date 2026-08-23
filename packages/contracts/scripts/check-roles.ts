import "dotenv/config";
import { Contract, JsonRpcProvider, getAddress } from "ethers";

const rpcUrl = required("ROLE_CHECK_RPC_URL");
const ipNFTAddress = getAddress(required("TROVAYA_IP_NFT_ADDRESS"));
const vaultAddress = getAddress(required("TROVAYA_VAULT_ADDRESS"));
const expectedAdmin = getAddress(required("EXPECTED_ADMIN_ADDRESS"));
const expectedPauser = getAddress(required("EXPECTED_PAUSER_ADDRESS"));
const expectedMinter = getAddress(required("EXPECTED_MINTER_ADDRESS"));
const deployer = process.env.DEPLOYER_ADDRESS ? getAddress(process.env.DEPLOYER_ADDRESS) : undefined;
const provider = new JsonRpcProvider(rpcUrl);
const abi = [
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function PAUSER_ROLE() view returns (bytes32)",
  "function MINTER_ROLE() view returns (bytes32)",
  "function hasRole(bytes32,address) view returns (bool)",
];

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function assertCode(address: string, label: string): Promise<void> {
  if (await provider.getCode(address) === "0x") throw new Error(`${label} has no deployed bytecode`);
}

async function main(): Promise<void> {
  await assertCode(ipNFTAddress, "TrovayaIPNFT");
  await assertCode(vaultAddress, "TrovayaVault");
  const ipNFT = new Contract(ipNFTAddress, abi, provider);
  const vault = new Contract(vaultAddress, abi, provider);
  const [adminRole, pauserRole, minterRole] = await Promise.all([
    ipNFT.DEFAULT_ADMIN_ROLE(), ipNFT.PAUSER_ROLE(), ipNFT.MINTER_ROLE(),
  ]);
  const checks: Array<[string, boolean]> = [
    ["IP NFT expected admin", await ipNFT.hasRole(adminRole, expectedAdmin)],
    ["Vault expected admin", await vault.hasRole(adminRole, expectedAdmin)],
    ["IP NFT expected pauser", await ipNFT.hasRole(pauserRole, expectedPauser)],
    ["Vault expected pauser", await vault.hasRole(pauserRole, expectedPauser)],
    ["IP NFT expected minter", await ipNFT.hasRole(minterRole, expectedMinter)],
  ];
  if (deployer && deployer !== expectedAdmin) {
    checks.push(["Deployer admin revoked on IP NFT", !(await ipNFT.hasRole(adminRole, deployer))]);
    checks.push(["Deployer admin revoked on Vault", !(await vault.hasRole(adminRole, deployer))]);
  }
  for (const [label, passed] of checks) {
    console.log(`${passed ? "PASS" : "FAIL"}  ${label}`);
    if (!passed) process.exitCode = 1;
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
