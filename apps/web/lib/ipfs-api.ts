export interface PinResult { cid: string; mode: "pinata" | "demo"; }

export async function pinFile(file: Blob, name: string): Promise<PinResult> {
  const data = new FormData();
  data.append("file", file, name);
  // Public NEXT_PUBLIC_ var on purpose: the real check happens server-side.
  // It only gates quota abuse, it is not a secret.
  const demoToken = process.env.NEXT_PUBLIC_DEMO_UPLOAD_TOKEN;
  const response = await fetch("/api/ipfs/pin", {
    method: "POST",
    body: data,
    ...(demoToken ? { headers: { "x-demo-token": demoToken } } : {}),
  });
  if (response.status === 401) throw new Error("Token demo tidak valid. Minta token terbaru ke tim.");
  if (!response.ok) throw new Error("Penyimpanan terdesentralisasi belum dapat dihubungi.");
  return response.json() as Promise<PinResult>;
}

export async function pinJson(value: object, name: string): Promise<PinResult> {
  return pinFile(new Blob([JSON.stringify(value)], { type: "application/json" }), name);
}
