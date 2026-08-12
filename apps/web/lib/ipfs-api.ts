export interface PinResult { cid: string; mode: "pinata" | "demo"; }

export async function pinFile(file: Blob, name: string): Promise<PinResult> {
  const data = new FormData();
  data.append("file", file, name);
  const response = await fetch("/api/ipfs/pin", { method: "POST", body: data });
  if (!response.ok) throw new Error("Penyimpanan terdesentralisasi belum dapat dihubungi.");
  return response.json() as Promise<PinResult>;
}

export async function pinJson(value: object, name: string): Promise<PinResult> {
  return pinFile(new Blob([JSON.stringify(value)], { type: "application/json" }), name);
}
