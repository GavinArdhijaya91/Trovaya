export interface PoisonResult {
  status: "success";
  poisoned_image_base64: string;
  perturbation_hash: `0x${string}`;
  public_ipfs_cid: string;
}

export async function protectImage(file: File, intensity: number): Promise<PoisonResult> {
  const payload = new FormData();
  payload.append("file", file);
  payload.append("intensity", String(intensity));

  const baseUrl = process.env.NEXT_PUBLIC_POISON_ENGINE_URL ?? "http://localhost:8000";
  const response = await fetch(`${baseUrl}/api/v1/poison`, { method: "POST", body: payload });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(error?.detail ?? "We could not protect this image. Please try again.");
  }
  return response.json() as Promise<PoisonResult>;
}
