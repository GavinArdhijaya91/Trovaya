import { spawn } from "node:child_process";
import process from "node:process";

const host = process.env.TROVAYA_UVICORN_HOST ?? "0.0.0.0";
const port = integer("TROVAYA_UVICORN_PORT", 8000, 1, 65535);
const workers = integer("TROVAYA_UVICORN_WORKERS", 1, 1, 64);
const child = spawn(process.execPath, ["scripts/python.mjs", "-m", "uvicorn", "app.main:app", "--host", host, "--port", String(port), "--workers", String(workers)], { stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => child.kill(signal));
child.once("exit", (code, signal) => { process.exitCode = signal ? 1 : (code ?? 1); });
function integer(name, fallback, minimum, maximum) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new Error(`${name} must be an integer from ${minimum} to ${maximum}`);
  return value;
}
