import { requestJson } from "@/lib/service-request";

export interface PoisonResult {
  status: "success";
  protection_mode: "experimental";
  persistence_status: "not_persisted";
  poisoned_image_base64: string;
  perturbation_hash: `0x${string}`;
  capability_notice: string;
}

const DEMO_SOFT_LIMIT_BYTES = 2 * 1024 * 1024;

export async function protectImage(file: File, intensity: number): Promise<PoisonResult> {
  if (process.env.NEXT_PUBLIC_DEMO_LITE === "1" && file.size > DEMO_SOFT_LIMIT_BYTES) {
    throw new Error(
      "Mode demo: gunakan gambar ≤ 2 MB agar poison engine tidak timeout di panggung. " +
        "File besar tetap didukung produksi (maks 15 MB).",
    );
  }
  const payload = new FormData();
  payload.append("file", file);
  payload.append("intensity", String(intensity));

  const baseUrl = process.env.NEXT_PUBLIC_POISON_ENGINE_URL ?? "http://localhost:8000";
  try {
    return await requestJson<PoisonResult>(`${baseUrl}/api/v1/poison`, { method: "POST", body: payload }, { attempts: 2 });
  } catch (caught) {
    const msg = caught instanceof Error ? caught.message : String(caught);
    throw new Error(
      `Poison engine tidak merespons (${msg}). Untuk demo: cek service :8000/health, ` +
        `atau lanjutkan dengan aset cadangan yang sudah di-mint.`,
    );
  }
}
