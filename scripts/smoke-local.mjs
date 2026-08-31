import { spawn } from "node:child_process";
import process from "node:process";

const compose = ["compose", "-f", "deploy/compose.yml"];
const children = [];
try {
  await run("docker", [...compose, "up", "-d", "--wait", "postgres"]);
  for (const migration of ["001_initial.sql", "002_asset_chain_metadata.sql", "003_public_gallery_boundary.sql", "004_versioned_license_terms.sql", "005_reorg_safe_indexing.sql"]) {
    await run("docker", [...compose, "exec", "-T", "postgres", "psql", "-v", "ON_ERROR_STOP=1", "-U", "trovaya", "-d", "trovaya", "-f", `/migrations/${migration}`]);
  }
  const chain = start("pnpm", ["--filter", "@trovaya/contracts", "exec", "hardhat", "node"]);
  children.push(chain);
  await waitFor(async () => (await capture("node", ["-e", "fetch('http://127.0.0.1:8545',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]})}).then(r=>{if(!r.ok)process.exit(1)})"])).code === 0, "local chain");
  const seeded = await capture("pnpm", ["--filter", "@trovaya/contracts", "deploy:local-smoke"]);
  if (seeded.code !== 0) throw new Error(seeded.output);
  const marker = seeded.output.split(/\r?\n/).find((line) => line.startsWith("TROVAYA_SMOKE_RESULT="));
  if (!marker) throw new Error(`smoke deployment output missing\n${seeded.output}`);
  const deployment = JSON.parse(marker.slice("TROVAYA_SMOKE_RESULT=".length));
  const indexer = start("pnpm", ["--filter", "@trovaya/event-indexer", "start"], {
    INDEXER_RPC_URL: "http://127.0.0.1:8545", INDEXER_EXPECTED_CHAIN_ID: "31337",
    TROVAYA_IP_NFT_ADDRESS: deployment.address, INDEXER_START_BLOCK: String(deployment.deploymentBlock),
    INDEXER_CONFIRMATIONS: "0", INDEXER_POLL_INTERVAL_MS: "250",
    DATABASE_URL: "postgres://trovaya:local-only-trovaya@127.0.0.1:54329/trovaya",
  });
  children.push(indexer);
  await waitFor(async () => {
    const result = await capture("docker", [...compose, "exec", "-T", "postgres", "psql", "-At", "-U", "trovaya", "-d", "trovaya", "-c", "select count(*) from public_gallery_assets where token_id = '1'"]);
    return result.code === 0 && result.output.trim() === "1";
  }, "indexed gallery row", 30_000);
  console.log("Local smoke passed: Hardhat mint -> event indexer -> PostgreSQL -> public_gallery_assets.");
} finally {
  for (const child of children.reverse()) child.kill("SIGTERM");
  await run("docker", [...compose, "down", "--volumes"], true);
}

function start(command, args, extraEnv = {}) { return spawn(command, args, { env: { ...process.env, ...extraEnv }, stdio: "ignore", shell: process.platform === "win32" }); }
function capture(command, args) { return new Promise((resolve) => { let output = ""; const child = spawn(command, args, { shell: process.platform === "win32" }); child.stdout.on("data", (data) => output += data); child.stderr.on("data", (data) => output += data); child.once("exit", (code) => resolve({ code: code ?? 1, output })); }); }
async function run(command, args, ignoreFailure = false) { const result = await capture(command, args); if (result.code && !ignoreFailure) throw new Error(result.output || `${command} failed`); return result; }
async function waitFor(check, label, timeout = 20_000) { const end = Date.now() + timeout; while (Date.now() < end) { if (await check()) return; await new Promise((resolve) => setTimeout(resolve, 500)); } throw new Error(`Timed out waiting for ${label}`); }
