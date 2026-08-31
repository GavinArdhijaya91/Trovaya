import { NextResponse } from "next/server";

export function GET() {
  const galleryConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  const poisonConfigured = Boolean(process.env.NEXT_PUBLIC_POISON_ENGINE_URL);
  return NextResponse.json({
    status: "ready",
    service: "trovaya-web",
    integrations: { gallery: galleryConfigured ? "configured" : "optional", poisonEngine: poisonConfigured ? "configured" : "default" },
  });
}
