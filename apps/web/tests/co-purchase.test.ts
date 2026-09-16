import assert from "node:assert/strict";
import test from "node:test";
import {
  CO_PURCHASE_MAX,
  CO_PURCHASE_MIN,
  isTokenId,
  lockGroup,
  normalizeWallet,
  splitShares,
  validateGroup,
} from "../lib/co-purchase.ts";

const A = "0x0000000000000000000000000000000000000001";
const B = "0x0000000000000000000000000000000000000002";
const C = "0x0000000000000000000000000000000000000003";
const D = "0x0000000000000000000000000000000000000004";
const E = "0x0000000000000000000000000000000000000005";

test("split rata habis tanpa sisa", () => {
  // 0.01 BNB = 10^16 wei dibagi 5 => 0.002 BNB per orang
  const shares = splitShares("10000000000000000", 5);
  assert.equal(shares.length, 5);
  assert.deepEqual(shares, ["2000000000000000", "2000000000000000", "2000000000000000", "2000000000000000", "2000000000000000"]);
});

test("sisa pembulatan wei jatuh ke ketua dan total tetap pas", () => {
  const fee = "10000000000000001"; // 10^16 + 1 wei, tidak habis dibagi 3
  const shares = splitShares(fee, 3);
  const total = shares.reduce((acc, s) => acc + BigInt(s), 0n);
  assert.equal(total.toString(), fee);
  assert.equal(BigInt(shares[0]!) - BigInt(shares[1]!), 2n);
});

test("ukuran grup di luar 3-5 ditolak", () => {
  assert.throws(() => splitShares("100", 2));
  assert.throws(() => splitShares("100", 6));
  assert.equal(CO_PURCHASE_MIN, 3);
  assert.equal(CO_PURCHASE_MAX, 5);
});

test("validasi menolak duplikat, alamat jelek, dan grup kurang orang", () => {
  assert.equal(validateGroup([A, B], 3).ok, false);
  assert.equal(validateGroup([A, A, B], 3).ok, false);
  assert.equal(validateGroup([A, B, "bukan-alamat"], 3).ok, false);
  assert.equal(validateGroup([A, B, C], 3).ok, true);
  assert.equal(validateGroup([A, B, C, D, E], 5).ok, true);
});

test("normalisasi wallet menerima checksum dan menolak sampah", () => {
  assert.equal(normalizeWallet("0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"), "0xab5801a7d398351b8be11c439e05c5b3259aec9b");
  assert.equal(normalizeWallet("  hello  "), null);
});

test("lock-in: kapasitas runtuh jadi jumlah aktual dan iuran genap", () => {
  // Slider 5 tapi terkunci 3 orang -> iuran = fee/3, total tetap pas
  const locked = lockGroup("10000000000000000", 5, [A, B, C]);
  assert.equal(locked.size, 3);
  assert.equal(locked.shares.length, 3);
  const total = locked.shares.reduce((acc, s) => acc + BigInt(s), 0n);
  assert.equal(total.toString(), "10000000000000000");
});

test("lock-in menolak grup di luar 3-5 aktual", () => {
  assert.throws(() => lockGroup("100", 5, [A, B]));
  assert.throws(() => lockGroup("100", 5, [A, A, B]));
  assert.throws(() => lockGroup("100", 2, [A, B, C]));
});

test("token_id hanya menerima digit desimal", () => {
  assert.equal(isTokenId("1"), true);
  assert.equal(isTokenId("12345678901234567890"), true);
  assert.equal(isTokenId(""), false);
  assert.equal(isTokenId("-1"), false);
  assert.equal(isTokenId("1.5"), false);
  assert.equal(isTokenId("0x1"), false);
  assert.equal(isTokenId("1; DROP TABLE users"), false);
  assert.equal(isTokenId(1), false);
  assert.equal(isTokenId(null), false);
});
