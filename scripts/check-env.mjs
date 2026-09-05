import fs from "node:fs";
import path from "node:path";
import { configSchemas } from "./config-schema.mjs";

const runtime = process.argv.includes("--runtime");
const requested = process.argv.find((arg) => arg.startsWith("--service="))?.split("=")[1];
const selected = requested ? { [requested]: configSchemas[requested] } : configSchemas;
if (requested && !selected[requested]) fail(`unknown service ${requested}`);

const errors = [];
for (const [service, schema] of Object.entries(selected)) {
  const example = parseEnv(fs.readFileSync(path.resolve(schema.example), "utf8"));
  const expected = Object.keys(schema.keys);
  const missingExample = expected.filter((key) => !(key in example));
  const unknownExample = Object.keys(example).filter((key) => !(key in schema.keys));
  if (missingExample.length) errors.push(`${service}: example missing ${missingExample.join(", ")}`);
  if (unknownExample.length) errors.push(`${service}: undocumented keys ${unknownExample.join(", ")}`);

  const values = runtime ? process.env : example;
  for (const [key, rule] of Object.entries(schema.keys)) {
    const value = values[key] || rule.default || "";
    if (runtime && rule.requiredInRuntime && !value) errors.push(`${service}: ${key} is required`);
    if (value && !valid(rule.type, value)) errors.push(`${service}: ${key} must be ${rule.type}`);
    if (key.startsWith("NEXT_PUBLIC_") && rule.secret) errors.push(`${service}: ${key} cannot be public and secret`);
  }
  for (const group of schema.groups ?? []) {
    const configured = group.filter((key) => Boolean(values[key]));
    if (configured.length && configured.length !== group.length) {
      errors.push(`${service}: configure all or none of ${group.join(", ")}`);
    }
  }
}

if (errors.length) fail(errors.join("\n"));
console.log(`Environment schemas valid (${Object.keys(selected).join(", ")}${runtime ? ", runtime values" : ", examples"}).`);

function parseEnv(source) {
  return Object.fromEntries(source.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    return match ? [[match[1], match[2]]] : [];
  }));
}
function valid(type, value) {
  if (type === "string") return value.trim().length > 0;
  if (type === "positiveInteger") return /^\d+$/.test(value) && BigInt(value) > 0n;
  if (type === "nonNegativeInteger") return /^\d+$/.test(value);
  if (type === "address") return /^0x[0-9a-fA-F]{40}$/.test(value);
  if (type === "privateKey") return /^0x[0-9a-fA-F]{64}$/.test(value);
  if (type === "walletConnect") return /^[0-9a-fA-F]{32}$/.test(value);
  if (type === "base64Key32") { try { return Buffer.from(value, "base64").length === 32; } catch { return false; } }
  if (type === "host") return value === "0.0.0.0" || value === "localhost" || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value);
  if (type === "urlList") return value.split(",").every((item) => valid("url", item.trim()));
  if (type === "postgresUrl") return /^postgres(?:ql)?:\/\//.test(value);
  if (type === "url") { try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol); } catch { return false; } }
  return false;
}
function fail(message) { console.error(message); process.exit(1); }
