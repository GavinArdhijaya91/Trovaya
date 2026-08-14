# Changelog

All notable changes to Trovaya are recorded in this file. Release Please
updates it from Conventional Commit messages merged into `main`.

## [0.2.0](https://github.com/GavinArdhijaya91/Trovaya/compare/v0.1.0...v0.2.0) (2026-08-14)


### Features

* **contracts:** add secure IP registry and vault access ([cb129ae](https://github.com/GavinArdhijaya91/Trovaya/commit/cb129ae18233f42e10593c60802eb3b50160400c))
* **indexer:** persist protocol events idempotently ([6c05403](https://github.com/GavinArdhijaya91/Trovaya/commit/6c05403eaa69454d920a6102049c53258c7a3998))
* **integration:** connect protection flow end to end ([2a0d469](https://github.com/GavinArdhijaya91/Trovaya/commit/2a0d46963aef74139986afb3720c13aaddb9599c))
* **poison-engine:** add protected image and KYC pipelines ([662916c](https://github.com/GavinArdhijaya91/Trovaya/commit/662916c33bad9b26d9dd63a851221a4e5e9682da))
* **sdk:** define frontend integration lifecycle ([b063890](https://github.com/GavinArdhijaya91/Trovaya/commit/b06389010f8cbb7f28eb91ec9cff96bd417c2071))
* **sdk:** generate shared protocol interfaces ([f6383eb](https://github.com/GavinArdhijaya91/Trovaya/commit/f6383eb207c093491312ba9afd3bc69ad9717106))
* **web:** scaffold creator protection experience ([59064b5](https://github.com/GavinArdhijaya91/Trovaya/commit/59064b5f0a7176790b6caace4d0f176b55ebfa78))
* **web:** standardize protocol action states ([caee545](https://github.com/GavinArdhijaya91/Trovaya/commit/caee5454f87fc5f9963fd6629c2f92c517970cb2))


### Fixes

* **poison-engine:** satisfy CI lint rules ([93396ff](https://github.com/GavinArdhijaya91/Trovaya/commit/93396ff028e28c7c13ba02dfb5b1b6f5944db4c0))


### Documentation

* establish automated project changelog ([2a29976](https://github.com/GavinArdhijaya91/Trovaya/commit/2a299766e82f2b138925a8d4693b4da66ed0b3bf))
* formalize trust and insights roadmap ([f7d8bec](https://github.com/GavinArdhijaya91/Trovaya/commit/f7d8bec9a007d5bdd19fe7b0d03148a5f5f11185))

## 0.1.0 - Foundation

### Features

- Established the pnpm monorepo for the web app, poison engine, contracts,
  protocol SDK, and event indexer.
- Implemented the protected-asset flow from image perturbation and encryption
  through on-chain registration, indexing, licensing, and vault authorization.
- Added ERC-721 and ERC-2981 contracts with AI-training consent and protected
  asset metadata.

### Documentation

- Formalized the passwordless trust and account expansion.
- Added the optional creator insights, Dune analytics, and social distribution
  roadmap without replacing the core IP-protection MVP.

### Security

- Added repository secret boundaries, local-state exclusions, contract access
  controls, and CI quality gates.
