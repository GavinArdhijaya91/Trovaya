import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isCanonicalIpfsCid } from "@/lib/vault/validation";

export const runtime = "nodejs";
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  // Friends-preview guard: when DEMO_UPLOAD_TOKEN is set (public deploy),
  // callers must send it as x-demo-token. Unset = local dev, no guard.
  // Without this, anyone with the URL could burn our Pinata quota.
  const expectedToken = process.env.DEMO_UPLOAD_TOKEN;
  if (expectedToken && request.headers.get("x-demo-token") !== expectedToken) {
    return NextResponse.json({ detail: "Token demo tidak valid." }, { status: 401 });
  }
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File)) return NextResponse.json({ detail: "File wajib tersedia." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ detail: "File melebihi 20 MB." }, { status: 413 });

  const jwt = process.env.PINATA_JWT;
  if (jwt) {
    const pinData = new FormData();
    pinData.append("file", file, file.name);
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST", headers: { Authorization: `Bearer ${jwt}` }, body: pinData,
    });
    if (!response.ok) return NextResponse.json({ detail: "Pinata menolak penyimpanan." }, { status: 502 });
    const body = await response.json().catch(() => null) as { IpfsHash?: unknown } | null;
    if (!body || typeof body.IpfsHash !== "string" || !isCanonicalIpfsCid(body.IpfsHash)) {
      return NextResponse.json({ detail: "Pinata mengembalikan CID tidak valid." }, { status: 502 });
    }
    return NextResponse.json({ cid: body.IpfsHash, mode: "pinata" });
  }

  const digest = createHash("sha256").update(Buffer.from(await file.arrayBuffer())).digest("hex");
  return NextResponse.json({ cid: `demo-${digest}`, mode: "demo" });
}
