import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const candidates = [
  process.env.TROVAYA_PYTHON,
  process.platform === "win32" ? path.resolve(".venv/Scripts/python.exe") : path.resolve(".venv/bin/python"),
  process.platform === "win32" && process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, "Python/bin/python.exe")
    : undefined,
  "python3",
  "python",
].filter(Boolean);

for (const executable of candidates) {
  if (String(executable).includes(path.sep) && !existsSync(executable)) continue;
  const result = spawnSync(executable, process.argv.slice(2), { stdio: "inherit", shell: false });
  if (!result.error) process.exit(result.status ?? 1);
}

console.error("Python 3.11+ tidak ditemukan. Buat .venv atau set TROVAYA_PYTHON.");
process.exit(1);
