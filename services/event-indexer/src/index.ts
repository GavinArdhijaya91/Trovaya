import "dotenv/config";
import postgres from "postgres";
import { createPublicClient, http, parseAbiItem, type Address } from "viem";
import { nativeCurrencyFor, trovayaIPNFTAbi } from "@trovaya/protocol-sdk";

const rpcUrl = required("INDEXER_RPC_URL");
const contractAddress = required("TROVAYA_IP_NFT_ADDRESS") as Address;
const databaseUrl = required("DATABASE_URL");
const startBlock = BigInt(process.env.INDEXER_START_BLOCK ?? "0");
const sql = postgres(databaseUrl, { max: 5, idle_timeout: 20 });
const client = createPublicClient({ transport: http(rpcUrl) });

async function sync(): Promise<void> {
  const chainId = await client.getChainId();
  const [cursor] = await sql<{ last_block: string }[]>`
    select last_block from indexer_cursors where chain_id = ${chainId} and contract_address = ${contractAddress}
  `;
  const fromBlock = cursor ? BigInt(cursor.last_block) + 1n : startBlock;
  const latest = await client.getBlockNumber();
  if (fromBlock > latest) return;

  const [mints, licenses] = await Promise.all([
    client.getLogs({ address: contractAddress, event: parseAbiItem("event IPMinted(uint256 indexed tokenId,address indexed creator,bool allowAITraining)"), fromBlock, toBlock: latest }),
    client.getLogs({ address: contractAddress, event: parseAbiItem("event LicensePurchased(uint256 indexed tokenId,address indexed buyer,uint256 fee)"), fromBlock, toBlock: latest }),
  ]);
  await sql.begin(async (tx) => {
    for (const log of mints) {
      const metadata = await client.readContract({
        address: contractAddress, abi: trovayaIPNFTAbi, functionName: "getIPMetadata",
        args: [log.args.tokenId!], blockNumber: log.blockNumber,
      });
      const tokenUri = await client.readContract({
        address: contractAddress, abi: trovayaIPNFTAbi, functionName: "tokenURI",
        args: [log.args.tokenId!], blockNumber: log.blockNumber,
      });
      await tx`insert into users (wallet_address) values (${log.args.creator!.toLowerCase()}) on conflict do nothing`;
      await tx`insert into ip_assets (chain_id, token_id, creator_wallet, allow_ai_training,
          public_poisoned_cid, encrypted_vault_cid, commercial_license_fee_wei, token_uri,
          tx_hash, log_index, status)
        values (${chainId}, ${log.args.tokenId!.toString()}, ${log.args.creator!.toLowerCase()},
          ${log.args.allowAITraining!}, ${metadata.publicPoisonedCid}, ${metadata.encryptedVaultCid},
          ${metadata.commercialLicenseFee.toString()}, ${tokenUri}, ${log.transactionHash},
          ${log.logIndex}, 'MINTED')
        on conflict (chain_id, tx_hash, log_index) do nothing`;
    }
    for (const log of licenses) {
      const block = await client.getBlock({ blockNumber: log.blockNumber });
      await tx`insert into users (wallet_address) values (${log.args.buyer!.toLowerCase()}) on conflict do nothing`;
      await tx`insert into licenses (chain_id, token_id, buyer_wallet, tx_hash, log_index, price_paid_wei, crypto_symbol, purchased_at)
        values (${chainId}, ${log.args.tokenId!.toString()}, ${log.args.buyer!.toLowerCase()}, ${log.transactionHash}, ${log.logIndex}, ${log.args.fee!.toString()}, ${nativeCurrencyFor(chainId)}, ${new Date(Number(block.timestamp) * 1000)})
        on conflict (chain_id, tx_hash, log_index) do nothing`;
    }
    await tx`insert into indexer_cursors (chain_id, contract_address, last_block) values (${chainId}, ${contractAddress}, ${latest.toString()})
      on conflict (chain_id, contract_address) do update set last_block = excluded.last_block, updated_at = now()`;
  });
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main(): Promise<void> {
  await sync();
  setInterval(() => void sync().catch(console.error), 5_000);
  console.log(`Indexing ${contractAddress}; ABI contains ${trovayaIPNFTAbi.length} entries`);
}

void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
