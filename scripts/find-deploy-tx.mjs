async function fetchTx(addr) {
  const res = await fetch(`https://testnet.bscscan.com/address/${addr}`, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const html = await res.text();
  const txMatches = [...html.matchAll(/\/tx\/(0x[a-fA-F0-9]{64})/g)].map(m => m[1]);
  console.log(addr, "Found txs:", txMatches.slice(0, 3));
}
await fetchTx("0x3dCA908025e6276285BbFfD584357aD06Ba7Db9F");
await fetchTx("0x4b47095929251ECb3E332B5b8048C466Ec5D3794");
