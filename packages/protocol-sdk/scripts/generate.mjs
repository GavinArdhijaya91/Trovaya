import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractsRoot = path.resolve(packageRoot, "../contracts/artifacts/contracts");
const contracts = {
  TrovayaIPNFT: "TrovayaIPNFT.sol/TrovayaIPNFT.json",
  TrovayaVault: "TrovayaVault.sol/TrovayaVault.json",
  MockZKHumanVerifier: "mocks/MockZKHumanVerifier.sol/MockZKHumanVerifier.json",
};

const generated = {};
for (const [name, relativeArtifact] of Object.entries(contracts)) {
  const artifact = JSON.parse(await readFile(path.join(contractsRoot, relativeArtifact), "utf8"));
  generated[name] = artifact.abi;
}

const outputDirectory = path.join(packageRoot, "src/generated");
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, "abis.ts"),
  `// Generated from Hardhat artifacts. Do not edit manually.\n` +
    Object.entries(generated).map(([name, abi]) =>
      `export const ${name[0].toLowerCase()}${name.slice(1)}Abi = ${JSON.stringify(abi, null, 2)} as const;\n`,
    ).join("\n"),
  "utf8",
);
