import { NextResponse } from "next/server";
import { parsePublicAssets, PUBLIC_ASSET_FIELDS } from "@/lib/public-assets";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { detail: "Galeri publik belum dikonfigurasi." },
      { status: 503 },
    );
  }

  const query = new URLSearchParams({
    select: PUBLIC_ASSET_FIELDS.join(","),
    order: "created_at.desc",
    limit: "50",
  });
  const response = await fetch(`${url}/rest/v1/public_gallery_assets?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store",
  });
  if (!response.ok) return NextResponse.json({ detail: "Data karya belum dapat dimuat." }, { status: 502 });

  try {
    return NextResponse.json({ assets: parsePublicAssets(await response.json()) });
  } catch {
    return NextResponse.json({ detail: "Format data galeri tidak valid." }, { status: 502 });
  }
}
