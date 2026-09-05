import crypto from "node:crypto";
import fs from "node:fs";

const mirrors = [
  ["services/event-indexer/migrations/001_initial.sql", "supabase/migrations/202608290001_gallery_initial.sql"],
  ["services/event-indexer/migrations/002_asset_chain_metadata.sql", "supabase/migrations/202608290002_gallery_chain_metadata.sql"],
  ["services/event-indexer/migrations/003_public_gallery_boundary.sql", "supabase/migrations/202608290003_gallery_public_boundary.sql"],
  ["services/event-indexer/migrations/004_versioned_license_terms.sql", "supabase/migrations/202608290004_gallery_license_terms.sql"],
  ["services/event-indexer/migrations/005_reorg_safe_indexing.sql", "supabase/migrations/202608290005_gallery_reorg_indexing.sql"],
];
const drift = mirrors.filter(([source, mirror]) => digest(source) !== digest(mirror));
if (drift.length) {
  console.error(`Migration drift detected:\n${drift.map(([a, b]) => `- ${a} != ${b}`).join("\n")}`);
  process.exit(1);
}
console.log(`Operational migration mirrors are synchronized (${mirrors.length} files).`);
function digest(file) { return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
