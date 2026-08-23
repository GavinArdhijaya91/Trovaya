# Trovaya Contract Architecture

Status: initial v1 architecture. `MASTER_SPEC.md` remains the source of truth.

## V1 scope

The PRD defines two P0 on-chain capabilities: IP registration and a mock ZK unlock demo.

`TrovayaIPNFT` provides:

- ERC-721 asset registration and token metadata;
- permissionless self-registration through `mintIP`, which always attributes the
  asset to `msg.sender`;
- role-gated registration through `mintIPFor` for explicitly authorized relayers;
- ERC-2981 creator royalties;
- immutable creator attribution;
- AI-training consent captured at registration;
- a CID for the public perturbed image;
- a CID for the encrypted high-resolution source;
- a one-time, non-exclusive commercial-license purchase per buyer.

`TrovayaVault` provides:

- access authorization for a verified human or commercial-license holder;
- a replaceable `IZKHumanVerifier` adapter;
- an on-chain access record and event for the off-chain key-delivery service.

`MockZKHumanVerifier` provides demo-only identity approval. It is explicitly not a real ZK
verifier and must not be deployed as a production trust mechanism.

The NFT records provenance and protocol declarations. It does not, by itself, transfer or
guarantee copyright under any jurisdiction. Legal license terms must be represented by the
token metadata referenced by `tokenURI`.

## Storage and authority

The original creator address does not change when the NFT is transferred. In v1, royalties
and commercial-license payments continue to use that original creator address. AI consent,
license fee, and CIDs are immutable after minting so historical records cannot be rewritten.

Both CIDs are visible on-chain. The source file referenced by `encryptedVaultCid` must therefore
be encrypted before upload; neither encryption keys nor clean source bytes belong on-chain.

## Contract boundaries

```text
TrovayaIPNFT (v1)
  ├─ ERC-721 ownership and token URI
  ├─ ERC-2981 royalty information
  ├─ IPMetadata and AI consent
  └─ commercial-license receipts

TrovayaVault (v1 demo)
  ├─ checks commercial-license ownership
  ├─ delegates human verification to IZKHumanVerifier
  └─ records authorization for off-chain key delivery

MockZKHumanVerifier (v1 demo)
  └─ owner-managed mock identity status; replace for production

Future creator badge
  └─ non-transferable reputation credentials
```

## Deployment targets

The Hardhat configuration follows the PRD's low-cost EVM targets:

- BSC Testnet (`chainId` 97);
- Base Sepolia (`chainId` 84532);
- Arbitrum Sepolia (`chainId` 421614).

Deployment always creates `TrovayaIPNFT`, the demo-only `MockZKHumanVerifier`, and
`TrovayaVault` in that order. RPC URLs may be overridden through environment variables, and
the deployer key is read only from `DEPLOYER_PRIVATE_KEY`.

## Deferred decisions

The master specification does not yet define the following, so v1 deliberately does not invent
them:

- which production ZK verifier or identity provider is authoritative;
- production proof signals, nullifiers, expiry, revocation, and key-delivery behavior;
- badge types and the authority allowed to issue or revoke them;
- license duration, territory, media, exclusivity, and sublicensing;
- whether future AI-consent changes are allowed and how consent versions affect prior licenses;
- upgrade governance or proxy administration.

These requirements must be added to `MASTER_SPEC.md` before their contracts are implemented.

## Security invariants

1. Royalty basis points never exceed 10,000.
2. A nonexistent token cannot be licensed or queried.
3. The exact non-zero listed fee is required for a commercial license.
4. The same buyer cannot purchase the same license twice.
5. License state is committed before external payment execution.
6. Creator attribution and registered consent metadata cannot be modified in v1.
7. Vault authorization never exposes source bytes or encryption keys on-chain.
8. Only the configured verifier can satisfy the human-verification path.
9. Any wallet may self-register, but only `MINTER_ROLE` may register an asset for
   a different creator address.
