# 📐 Development Rules & Coding Standards

## 1. Monorepo & General Conventions
- Maintain strict directory boundary separation:
  - Frontend code **only** inside `apps/web`[cite: 1].
  - Python poisoning service **only** inside `services/poison-engine`[cite: 1].
  - Smart contracts **only** inside `packages/contracts`[cite: 1].
- Do not commit environment secrets (`.env`). Use `.env.example` as reference.

---

## 2. Smart Contract Rules (Solidity)
- Target Solidity version: `^0.8.20`.
- Use OpenZeppelin verified libraries for standard primitives (`ERC721`, `ERC2981`, `Ownable`, `ReentrancyGuard`)[cite: 1].
- Use **Custom Errors** instead of long string `require()` statements to optimize gas fees[cite: 1].
- All transfer or withdrawal functions **must** implement `nonReentrant` modifier[cite: 1].
- Variable Naming:
  - State variables: `s_variableName` or standard `camelCase`.
  - Constants: `UPPER_CASE_WITH_UNDERSCORE`.

---

## 3. Python Service Rules (FastAPI)
- Enforce strict type hinting (`pydantic` models for payloads).
- Always process image transformations in-memory (using `BytesIO` or `NumPy` arrays) without writing temporary files to disk.
- Wrap processing pipelines in `try-except` blocks and return JSON error responses with clear status codes.

---

## 4. Frontend Rules (TypeScript & React)
- Strict mode enabled (`noImplicitAny: true`).
- Use `wagmi` hooks for contract interactions. Never instantiate raw Ethers provider manually if wagmi wrapper exists[cite: 1].
- Abstrasikan istilah Web3 di level UI:
  - Gunakan *"Biaya Transaksi"* untuk *"Gas Fee"*[cite: 1].
  - Gunakan *"Kunci Akses"* untuk *"Private Key/Signature"*[cite: 1].
- All AI-generated insight text **must** render with the explicit disclaimer badge[cite: 1].