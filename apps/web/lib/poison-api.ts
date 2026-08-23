export interface PoisonResult {
  status: "success";
  protection_mode: "experimental";
  persistence_status: "not_persisted";
  poisoned_image_base64: string;
  perturbation_hash: `0x${string}`;
  capability_notice: string;
}

export async function protectImage(file: File, intensity: number): Promise<PoisonResult> {
  const payload = new FormData();
  payload.append("file", file);
  payload.append("intensity", String(intensity));

  const baseUrl = process.env.NEXT_PUBLIC_POISON_ENGINE_URL ?? "http://localhost:8000";
  return requestJson<PoisonResult>(`${baseUrl}/api/v1/poison`, { method: "POST", body: payload }, { attempts: 2 });
}
import { requestJson } from "@/lib/service-request";
