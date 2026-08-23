import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const files = {
  web: "apps/web/.env.local",
  indexer: "services/event-indexer/.env",
};

function readEnv(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(readFileSync(file, "utf8").split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    return match ? [[match[1], match[2].replace(/^['"]|['"]$/g, "")]] : [];
  }));
}

const env = Object.fromEntries(Object.entries(files).map(([name, file]) => [name, readEnv(file)]));
const checks = [];
const add = (name, ok, detail) => checks.push({ name, ok, detail });
const present = (value) => Boolean(value && !/^(change|replace|your-|<)/i.test(value));
const address = (value) => /^0x[0-9a-fA-F]{40}$/.test(value ?? "") && !/^0x0{40}$/i.test(value);
const positiveInteger = (value) => /^[1-9]\d*$/.test(value ?? "");
const url = (value) => { try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; } };

add("web env file", existsSync(files.web), files.web);
add("indexer env file", existsSync(files.indexer), files.indexer);
add("Poison Engine URL", url(env.web.NEXT_PUBLIC_POISON_ENGINE_URL), "browser-safe service URL");
add("primary chain is BSC testnet", env.web.NEXT_PUBLIC_CHAIN_ID === "97", "NEXT_PUBLIC_CHAIN_ID=97");
add("web IP NFT address", address(env.web.NEXT_PUBLIC_TROVAYA_IP_NFT_ADDRESS), "deployed 0x address");
add("web Vault address", address(env.web.NEXT_PUBLIC_TROVAYA_VAULT_ADDRESS), "deployed 0x address");
add("separate web contracts", address(env.web.NEXT_PUBLIC_TROVAYA_IP_NFT_ADDRESS)
  && address(env.web.NEXT_PUBLIC_TROVAYA_VAULT_ADDRESS)
  && env.web.NEXT_PUBLIC_TROVAYA_IP_NFT_ADDRESS.toLowerCase() !== env.web.NEXT_PUBLIC_TROVAYA_VAULT_ADDRESS.toLowerCase(), "IP NFT and Vault must differ");
add("Pinata JWT", present(env.web.PINATA_JWT), "server-only credential");
add("Supabase public URL", url(env.web.NEXT_PUBLIC_SUPABASE_URL), "Auth browser URL");
add("Supabase public key", present(env.web.NEXT_PUBLIC_SUPABASE_ANON_KEY), "anon/publishable key");
add("Supabase gallery URL", url(env.web.SUPABASE_URL), "server gallery URL");
add("Supabase gallery key", present(env.web.SUPABASE_ANON_KEY), "anon key, never service-role");
add("Supabase project match", url(env.web.NEXT_PUBLIC_SUPABASE_URL)
  && env.web.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "") === env.web.SUPABASE_URL?.replace(/\/$/, ""), "browser and server use one project");
add("Supabase anon key match", present(env.web.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  && env.web.NEXT_PUBLIC_SUPABASE_ANON_KEY === env.web.SUPABASE_ANON_KEY, "browser and gallery use one anon key");
add("Supabase vault service key", present(env.web.SUPABASE_SERVICE_ROLE_KEY), "server-only service-role key");
add("Vault RPC", url(env.web.VAULT_RPC_URL), "server-side chain verification");
add("Vault master key", (() => { try { return Buffer.from(env.web.VAULT_MASTER_KEY ?? "", "base64").length === 32; } catch { return false; } })(), "32 random bytes encoded as base64");
add("indexer RPC", url(env.indexer.INDEXER_RPC_URL), "BSC testnet RPC URL");
add("indexer expected chain", env.indexer.INDEXER_EXPECTED_CHAIN_ID === "97", "INDEXER_EXPECTED_CHAIN_ID=97");
add("indexer contract address", address(env.indexer.TROVAYA_IP_NFT_ADDRESS), "must match web IP NFT");
add("indexer deployment block", positiveInteger(env.indexer.INDEXER_START_BLOCK), "IP NFT deployment block");
add("indexer database", present(env.indexer.DATABASE_URL), "PostgreSQL connection string");
add("web/indexer contract match", address(env.web.NEXT_PUBLIC_TROVAYA_IP_NFT_ADDRESS) && env.web.NEXT_PUBLIC_TROVAYA_IP_NFT_ADDRESS.toLowerCase() === (env.indexer.TROVAYA_IP_NFT_ADDRESS ?? "").toLowerCase(), "same deployment");

for (const check of checks) console.log(`${check.ok ? "PASS" : "FAIL"}  ${check.name} — ${check.detail}`);
const failed = checks.filter((check) => !check.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} readiness checks passed. Values were not printed.`);
if (failed) process.exitCode = 1;
