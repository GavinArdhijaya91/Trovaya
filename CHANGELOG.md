# Changelog

All notable changes to Trovaya are recorded in this file. Release Please
updates it from Conventional Commit messages merged into `main`.

## [0.7.0](https://github.com/GavinArdhijaya91/Trovaya/compare/v0.6.0...v0.7.0) (2026-09-01)


### Features

* **config:** add environment and migration validation ([e347401](https://github.com/GavinArdhijaya91/Trovaya/commit/e347401e825417647ee7c2c5fbe3854b53591287))
* **poison-engine:** upgrade to multi-scale L-infinity bounded adversarial perturbation pipeline ([b0a02c1](https://github.com/GavinArdhijaya91/Trovaya/commit/b0a02c1c8b93fc617e50170141dfc7e4cddf2f34))
* **runtime:** add production startup and health checks ([239d202](https://github.com/GavinArdhijaya91/Trovaya/commit/239d202f3758b9070b31c09d95a9d1c12755572b))
* **web:** add anti-scraping blur protection and complete license unl… ([ab3ceb5](https://github.com/GavinArdhijaya91/Trovaya/commit/ab3ceb54e71b10b355e62ea986dca9a7fbeb0674))
* **web:** add anti-scraping blur protection and complete license unlock UX to asset gallery ([ffd7fcb](https://github.com/GavinArdhijaya91/Trovaya/commit/ffd7fcb5ad08e9f23517188b0f24257a8a78e0f0))


### Fixes

* **contracts:** patch revocation bypass in vault and enforce CEI in mintIP ([addc3c6](https://github.com/GavinArdhijaya91/Trovaya/commit/addc3c620c906e13ef24d2fdf7f8021c57ddd73c))


### Documentation

* **operations:** document deployment and concurrent workflows ([9042d13](https://github.com/GavinArdhijaya91/Trovaya/commit/9042d13a1435bfda43c7649e1d290f1ae3a00a8f))

## [0.6.0](https://github.com/GavinArdhijaya91/Trovaya/compare/v0.5.0...v0.6.0) (2026-08-29)


### Features

* **supabase:** add gallery core schema with chain and reorg support ([0afb216](https://github.com/GavinArdhijaya91/Trovaya/commit/0afb216f339f6d554ae6af6a2c2543d34ff7fdc2))
* **supabase:** enforce public gallery RLS boundary and license terms ([fa0e245](https://github.com/GavinArdhijaya91/Trovaya/commit/fa0e245246275a71284632909008fad2305e7f7b))
* **web:** add Trovaya SVG logo and update navbar branding ([dc1698f](https://github.com/GavinArdhijaya91/Trovaya/commit/dc1698f02f273c7b025310486b0c4274651dc39d))


### Fixes

* protocol sdk clean lint ([064b4ef](https://github.com/GavinArdhijaya91/Trovaya/commit/064b4eff5139218dc9dd9c104b01aab13431fefd))
* **web:** correct import order for requestJson in poison-api ([101423f](https://github.com/GavinArdhijaya91/Trovaya/commit/101423fb8ebedb96d679cff7eba7acebdea394f2))
* **web:** relocate Trovaya logo to app public directory ([5ba8582](https://github.com/GavinArdhijaya91/Trovaya/commit/5ba85828832f73599b029e76c697c3b0e2b94e1d))

## [0.5.0](https://github.com/GavinArdhijaya91/Trovaya/compare/v0.4.0...v0.5.0) (2026-08-23)


### Features

* **indexer:** add reorg-safe bounded synchronization ([b26f8a2](https://github.com/GavinArdhijaya91/Trovaya/commit/b26f8a27bad7384002b77d646bae1c36ce0c803b))
* **protocol:** complete priority remediation backlog ([73fd158](https://github.com/GavinArdhijaya91/Trovaya/commit/73fd15810f555d7666cef24b6af993d45b7c20d1))
* **protocol:** harden licensing and vault access ([d98315a](https://github.com/GavinArdhijaya91/Trovaya/commit/d98315af6b042af0316e5f8bcb27511c9f7ce7cd))
* **web:** complete licensing and secure key delivery ([0ca9213](https://github.com/GavinArdhijaya91/Trovaya/commit/0ca9213d2b5acfb4d0b1f0053480ae18b89ed7f2))


### Fixes

* **ci:** gate unavailable dependency review ([3e72cc9](https://github.com/GavinArdhijaya91/Trovaya/commit/3e72cc9750e7a1b8fd1fba317dc1e6f28445d6fa))
* **ci:** generate protocol ABI before lint ([f03bb4f](https://github.com/GavinArdhijaya91/Trovaya/commit/f03bb4fdd895b7d3de20d133fa5cdf55c08113bf))
* **ci:** generate protocol ABI before lint ([730d4e9](https://github.com/GavinArdhijaya91/Trovaya/commit/730d4e9661d3161c33930790f093837699466277))
* **ci:** grant read access for secret scan ([e1ecac8](https://github.com/GavinArdhijaya91/Trovaya/commit/e1ecac8e64ac6dc9e085998e83673e9571d8bc30))
* **poison:** harden experimental preview pipeline ([533253e](https://github.com/GavinArdhijaya91/Trovaya/commit/533253e850ce0dbe813901c37a6fe32d0407b873))
* **security:** triage solidity analysis findings ([4bdfffc](https://github.com/GavinArdhijaya91/Trovaya/commit/4bdfffc638a6cb4263f66bd480622593949b932e))
* **security:** update audited Python dependencies ([1ab5083](https://github.com/GavinArdhijaya91/Trovaya/commit/1ab5083da4c2204032c360824e660c69b1823f97))


### Security

* **ci:** add automated release gates ([d926fae](https://github.com/GavinArdhijaya91/Trovaya/commit/d926fae83b00850c62e0254d8771ecc34dbd0c92))


### Documentation

* **release:** define verified acceptance gates ([c3ca9a5](https://github.com/GavinArdhijaya91/Trovaya/commit/c3ca9a5325e625680403eb30e047ae3728f8da18))

## [0.4.0](https://github.com/GavinArdhijaya91/Trovaya/compare/v0.3.1...v0.4.0) (2026-08-23)


### Features

* **auth:** implement email OTP and account foundation ([a75985d](https://github.com/GavinArdhijaya91/Trovaya/commit/a75985ddee37502452efec37473625c6a005440e))
* **auth:** implement Supabase email OTP ([4d9908a](https://github.com/GavinArdhijaya91/Trovaya/commit/4d9908aab8185f420061b74a07f68ed751b39a25))


### Fixes

* **protocol:** enable permissionless self-minting ([530df7c](https://github.com/GavinArdhijaya91/Trovaya/commit/530df7caa322fb2712584680fd7d95507f452edd))
* **web3:** handle missing WalletConnect configuration ([f500d73](https://github.com/GavinArdhijaya91/Trovaya/commit/f500d73a9c8550e8ea9f0c38aa4591ea24baa2e9))


### Security

* **web:** enforce public gallery data boundary ([01a212b](https://github.com/GavinArdhijaya91/Trovaya/commit/01a212b797619b094d10100af3251d64ab619c36))


### Documentation

* align roadmap with verified evaluation ([fb64b25](https://github.com/GavinArdhijaya91/Trovaya/commit/fb64b25aee5277e12c38d4dd3042eadea9a070d3))
* **auth:** define OTP account boundaries ([a3bc2d1](https://github.com/GavinArdhijaya91/Trovaya/commit/a3bc2d17a63acee30a8a21fb6e604ad764c4fe77))

## [0.3.1](https://github.com/GavinArdhijaya91/Trovaya/compare/v0.3.0...v0.3.1) (2026-08-15)


### Documentation

* **readme:** streamline onboarding documentation ([6931578](https://github.com/GavinArdhijaya91/Trovaya/commit/693157870227e3a7dfd2d0ae880ef174094469f8))
* **readme:** streamline onboarding documentation ([9f366c6](https://github.com/GavinArdhijaya91/Trovaya/commit/9f366c66ba0ac559e285658e2067fbb823f71390))

## [0.3.0](https://github.com/GavinArdhijaya91/Trovaya/compare/v0.2.2...v0.3.0) (2026-08-15)


### Features

* **web:** add creator workspace experience ([f1e49c7](https://github.com/GavinArdhijaya91/Trovaya/commit/f1e49c7c1240058218647b1298ed329687b6f99c))
* **web:** add creator workspace experience ([4b26d10](https://github.com/GavinArdhijaya91/Trovaya/commit/4b26d105ff695b7f52160c718a492c3f50ba1e92))


### Documentation

* **design:** translate and formalize visual system ([b871f63](https://github.com/GavinArdhijaya91/Trovaya/commit/b871f63e2721f4bd70cda6caa8be53a2850dbbe0))
* **readme:** add step-by-step developer onboarding ([d52184b](https://github.com/GavinArdhijaya91/Trovaya/commit/d52184babba65e4df155603eb63d14152ab1def2))
* **web:** define frontend design exploration boundaries ([f2784c6](https://github.com/GavinArdhijaya91/Trovaya/commit/f2784c6719f4bc3e723434ff962fd15ac9fcec4e))

## [0.2.2](https://github.com/GavinArdhijaya91/Trovaya/compare/v0.2.1...v0.2.2) (2026-08-14)


### Documentation

* **web:** add frontend contribution guide ([6edb821](https://github.com/GavinArdhijaya91/Trovaya/commit/6edb82147eb52abc952537486542f08c4088bd6d))

## [0.2.1](https://github.com/GavinArdhijaya91/Trovaya/compare/v0.2.0...v0.2.1) (2026-08-14)


### Documentation

* **governance:** establish frontend integration contract ([e873454](https://github.com/GavinArdhijaya91/Trovaya/commit/e873454203ad413d9b894c2d4b0b017d8f513efd))

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
