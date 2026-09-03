import "dotenv/config";
import postgres from "postgres";
import { createPublicClient, http, parseAbiItem, type Address } from "viem";
import { nativeCurrencyFor, trovayaIPNFTAbi } from "@trovaya/protocol-sdk";
import { chunkRanges, confirmedHead, requiresFullReplay, rollbackBlock, withRetry } from "./sync-utils.js";

const rpcUrl = required("INDEXER_RPC_URL");
const contractAddress = required("TROVAYA_IP_NFT_ADDRESS") as Address;
const databaseUrl = required("DATABASE_URL");
const expectedChainId = numberSetting("INDEXER_EXPECTED_CHAIN_ID", 97, 1);
const startBlock = bigintSetting("INDEXER_START_BLOCK", 0n, 0n);
const chunkSize = bigintSetting("INDEXER_CHUNK_SIZE", 2_000n, 1n);
const confirmations = bigintSetting("INDEXER_CONFIRMATIONS", 6n, 0n);
const reorgDepth = bigintSetting("INDEXER_REORG_DEPTH", 12n, 1n);
const pollIntervalMs = numberSetting("INDEXER_POLL_INTERVAL_MS", 5_000, 100);
const retryAttempts = numberSetting("INDEXER_RETRY_ATTEMPTS", 4, 1);
const retryBaseDelayMs = numberSetting("INDEXER_RETRY_BASE_DELAY_MS", 500, 0);
const retryMaxDelayMs = numberSetting("INDEXER_RETRY_MAX_DELAY_MS", 5_000, 0);
const sql = postgres(databaseUrl, { max: 5, idle_timeout: 20 });
const client = createPublicClient({ transport: http(rpcUrl) });
let stopping = false;

const mintEvent = parseAbiItem("event IPMinted(uint256 indexed tokenId,address indexed creator,bool allowAITraining)");
const licenseEvent = parseAbiItem("event LicensePurchased(uint256 indexed tokenId,address indexed buyer,uint256 fee)");

async function rpc<T>(name: string, operation: () => Promise<T>): Promise<T> {
  return withRetry(operation, {
    attempts: retryAttempts, baseDelayMs: retryBaseDelayMs, maxDelayMs: retryMaxDelayMs,
    onRetry: (error, attempt, delayMs) => metric("rpc_retry", { name, attempt, delayMs, error: errorMessage(error) }),
  });
}

async function reconcileReorg(chainId: number, cursor: { last_block: string; last_block_hash: string | null }): Promise<bigint> {
  const lastBlock = BigInt(cursor.last_block);
  const canonical = await rpc("get_cursor_block", () => client.getBlock({ blockNumber: lastBlock }));
  if (cursor.last_block_hash && canonical.hash.toLowerCase() === cursor.last_block_hash.toLowerCase()) return lastBlock;

  if (requiresFullReplay(lastBlock, reorgDepth, startBlock)) {
    await sql.begin(async (tx) => {
      await tx`delete from licenses where chain_id = ${chainId}`;
      await tx`delete from ip_assets where chain_id = ${chainId}`;
      await tx`delete from indexer_cursors where chain_id = ${chainId} and contract_address = ${contractAddress}`;
    });
    metric("reorg_full_replay", { chainId, previousBlock: lastBlock, startBlock, missingPriorHash: !cursor.last_block_hash });
    return startBlock - 1n;
  }

  const rewindTo = rollbackBlock(lastBlock, reorgDepth, startBlock);
  const rewindBlock = await rpc("get_rollback_block", () => client.getBlock({ blockNumber: rewindTo }));
  await sql.begin(async (tx) => {
    await tx`delete from licenses where chain_id = ${chainId} and block_number > ${rewindTo.toString()}`;
    await tx`delete from ip_assets where chain_id = ${chainId} and block_number > ${rewindTo.toString()}`;
    await tx`update indexer_cursors set last_block = ${rewindTo.toString()}, last_block_hash = ${rewindBlock.hash}, updated_at = now()
      where chain_id = ${chainId} and contract_address = ${contractAddress}`;
  });
  metric("reorg_rollback", { chainId, previousBlock: lastBlock, rewindTo, missingPriorHash: !cursor.last_block_hash });
  return rewindTo;
}

async function syncChunk(chainId: number, fromBlock: bigint, toBlock: bigint): Promise<void> {
  const startedAt = Date.now();
  let mints: Awaited<ReturnType<typeof client.getLogs>> = [];
  let licenses: Awaited<ReturnType<typeof client.getLogs>> = [];
  let endBlock: Awaited<ReturnType<typeof client.getBlock>>;
  try {
    [mints, licenses, endBlock] = await Promise.all([
      rpc("get_mint_logs", () => client.getLogs({ address: contractAddress, event: mintEvent, fromBlock, toBlock })),
      rpc("get_license_logs", () => client.getLogs({ address: contractAddress, event: licenseEvent, fromBlock, toBlock })),
      rpc("get_chunk_end_block", () => client.getBlock({ blockNumber: toBlock })),
    ]);
  } catch (e) {
    // Adaptif: kalau limit exceeded, belah chunk jadi dua dan retry otomatis
    const msg = errorMessage(e);
    if (msg.includes("limit exceeded") && fromBlock < toBlock) {
      const mid = (fromBlock + toBlock) / 2n;
      metric("chunk_split_retry", { fromBlock, toBlock, mid });
      await syncChunk(chainId, fromBlock, mid);
      await syncChunk(chainId, mid + 1n, toBlock);
      return;
    }
    throw e;
  }
  await sql.begin(async (tx) => {
    for (const log of mints) {
      const [metadata, tokenUri] = await Promise.all([
        rpc("read_ip_metadata", () => client.readContract({ address: contractAddress, abi: trovayaIPNFTAbi, functionName: "getIPMetadata", args: [log.args.tokenId!], blockNumber: log.blockNumber })),
        rpc("read_token_uri", () => client.readContract({ address: contractAddress, abi: trovayaIPNFTAbi, functionName: "tokenURI", args: [log.args.tokenId!], blockNumber: log.blockNumber })),
      ]);
      await tx`insert into users (wallet_address) values (${log.args.creator!.toLowerCase()}) on conflict do nothing`;
      await tx`insert into ip_assets (chain_id, token_id, creator_wallet, allow_ai_training, public_poisoned_cid,
          encrypted_vault_cid, commercial_license_fee_wei, token_uri, license_terms_uri, license_terms_hash,
          license_terms_version, license_duration_seconds, tx_hash, log_index, block_number, block_hash, status)
        values (${chainId}, ${log.args.tokenId!.toString()}, ${log.args.creator!.toLowerCase()}, ${log.args.allowAITraining!},
          ${metadata.publicPoisonedCid}, ${metadata.encryptedVaultCid}, ${metadata.commercialLicenseFee.toString()},
          ${tokenUri}, ${metadata.licenseTermsURI}, ${metadata.licenseTermsHash}, ${metadata.licenseTermsVersion},
          ${metadata.licenseDurationSeconds.toString()}, ${log.transactionHash}, ${log.logIndex},
          ${log.blockNumber.toString()}, ${log.blockHash}, 'MINTED')
        on conflict (chain_id, tx_hash, log_index) do nothing`;
    }
    for (const log of licenses) {
      const [block, metadata] = await Promise.all([
        rpc("get_license_block", () => client.getBlock({ blockNumber: log.blockNumber })),
        rpc("read_license_metadata", () => client.readContract({ address: contractAddress, abi: trovayaIPNFTAbi, functionName: "getIPMetadata", args: [log.args.tokenId!], blockNumber: log.blockNumber })),
      ]);
      await tx`insert into users (wallet_address) values (${log.args.buyer!.toLowerCase()}) on conflict do nothing`;
      await tx`insert into licenses (chain_id, token_id, buyer_wallet, tx_hash, log_index, price_paid_wei,
          crypto_symbol, purchased_at, accepted_terms_uri, accepted_terms_hash, accepted_terms_version, block_number, block_hash)
        values (${chainId}, ${log.args.tokenId!.toString()}, ${log.args.buyer!.toLowerCase()}, ${log.transactionHash},
          ${log.logIndex}, ${log.args.fee!.toString()}, ${nativeCurrencyFor(chainId)}, ${new Date(Number(block.timestamp) * 1000)},
          ${metadata.licenseTermsURI}, ${metadata.licenseTermsHash}, ${metadata.licenseTermsVersion},
          ${log.blockNumber.toString()}, ${log.blockHash})
        on conflict (chain_id, tx_hash, log_index) do nothing`;
    }
    await tx`insert into indexer_cursors (chain_id, contract_address, last_block, last_block_hash)
      values (${chainId}, ${contractAddress}, ${toBlock.toString()}, ${endBlock.hash})
      on conflict (chain_id, contract_address) do update set last_block = excluded.last_block,
        last_block_hash = excluded.last_block_hash, updated_at = now()`;
  });
  metric("chunk_synced", { chainId, fromBlock, toBlock, mints: mints.length, licenses: licenses.length, durationMs: Date.now() - startedAt });
}

async function sync(): Promise<void> {
  const chainId = await rpc("get_chain_id", () => client.getChainId());
  if (chainId !== expectedChainId) {
    throw new Error(`RPC chain ${chainId} does not match INDEXER_EXPECTED_CHAIN_ID ${expectedChainId}`);
  }
  const [cursor] = await sql<{ last_block: string; last_block_hash: string | null }[]>`
    select last_block, last_block_hash from indexer_cursors where chain_id = ${chainId} and contract_address = ${contractAddress}`;
  const lastProcessed = cursor ? await reconcileReorg(chainId, cursor) : startBlock - 1n;
  const latest = await rpc("get_latest_block", () => client.getBlockNumber());
  const safeHead = confirmedHead(latest, confirmations);
  if (safeHead === null || lastProcessed >= safeHead) return;
  const fromBlock = lastProcessed + 1n < startBlock ? startBlock : lastProcessed + 1n;
  for (const [from, to] of chunkRanges(fromBlock, safeHead, chunkSize)) {
    if (stopping) break;
    await syncChunk(chainId, from, to);
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
function numberSetting(name: string, fallback: number, minimum: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`${name} must be an integer >= ${minimum}`);
  return value;
}
function bigintSetting(name: string, fallback: bigint, minimum: bigint): bigint {
  const value = BigInt(process.env[name] ?? fallback);
  if (value < minimum) throw new Error(`${name} must be >= ${minimum}`);
  return value;
}
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function metric(event: string, values: Record<string, string | number | bigint | boolean>): void {
  console.log(JSON.stringify({ level: "info", service: "event-indexer", event, timestamp: new Date().toISOString(), ...values },
    (_, value) => typeof value === "bigint" ? value.toString() : value));
}
async function delay(ms: number): Promise<void> { await new Promise((resolve) => setTimeout(resolve, ms)); }

async function main(): Promise<void> {
  process.once("SIGINT", () => { stopping = true; metric("shutdown_requested", { signal: "SIGINT" }); });
  process.once("SIGTERM", () => { stopping = true; metric("shutdown_requested", { signal: "SIGTERM" }); });
  metric("indexer_started", { contractAddress, expectedChainId, startBlock, chunkSize, confirmations, reorgDepth });
  while (!stopping) {
    try { await sync(); }
    catch (error) { console.error(JSON.stringify({ level: "error", service: "event-indexer", event: "sync_failed", timestamp: new Date().toISOString(), error: errorMessage(error) })); }
    if (!stopping) await delay(pollIntervalMs);
  }
  await sql.end({ timeout: 10 });
  metric("indexer_stopped", { graceful: true });
}

void main().catch(async (error: unknown) => {
  console.error(error);
  await sql.end({ timeout: 5 });
  process.exitCode = 1;
});
