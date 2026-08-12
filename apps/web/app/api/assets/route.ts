import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ assets: [] });
  const response = await fetch(`${url}/rest/v1/ip_assets?select=*&order=created_at.desc&limit=50`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store",
  });
  if (!response.ok) return NextResponse.json({ detail: "Data karya belum dapat dimuat." }, { status: 502 });
  return NextResponse.json({ assets: await response.json() });
}
