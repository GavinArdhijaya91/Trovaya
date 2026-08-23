import fs from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("Usage: pnpm protection:evidence <evidence.json>");
  process.exit(2);
}

const evidence = JSON.parse(fs.readFileSync(path, "utf8"));
const failures = [];
function requireValue(condition, message) { if (!condition) failures.push(message); }

requireValue(evidence.schemaVersion === 1, "schemaVersion must equal 1");
requireValue(evidence.license?.approved === true && evidence.license?.reference,
  "lawful method/license approval and reference are required");
requireValue(typeof evidence.method?.name === "string" && evidence.method.name !== "experimental_preview",
  "a genuine named protection method is required");
requireValue(typeof evidence.reproducibility?.commit === "string" && /^[0-9a-f]{40}$/.test(evidence.reproducibility.commit),
  "a full source commit SHA is required");
requireValue(typeof evidence.reproducibility?.configHash === "string" && /^0x[0-9a-f]{64}$/i.test(evidence.reproducibility.configHash),
  "a deterministic config hash is required");
requireValue(Number.isInteger(evidence.dataset?.sampleCount) && evidence.dataset.sampleCount >= 30,
  "dataset must contain at least 30 consented/licensed samples");
requireValue(Array.isArray(evidence.attacks?.namedModels) && evidence.attacks.namedModels.length >= 2,
  "at least two named model/version targets are required");
requireValue(Array.isArray(evidence.attacks?.transformations) && evidence.attacks.transformations.length >= 3,
  "at least three named post-processing transformations are required");
requireValue(Number.isFinite(evidence.quality?.meanPsnrDb) && evidence.quality.meanPsnrDb >= 30,
  "mean PSNR must meet the declared 30 dB minimum");
requireValue(Number.isFinite(evidence.quality?.meanSsim) && evidence.quality.meanSsim >= 0.95,
  "mean SSIM must meet the declared 0.95 minimum");
requireValue(Number.isFinite(evidence.effectiveness?.baselineSuccessRate)
  && Number.isFinite(evidence.effectiveness?.protectedSuccessRate)
  && evidence.effectiveness.protectedSuccessRate < evidence.effectiveness.baselineSuccessRate,
  "protected success rate must improve on the measured baseline");
requireValue(Number.isFinite(evidence.compute?.medianSecondsPerMegapixel) && evidence.compute.medianSecondsPerMegapixel > 0,
  "measured median compute cost is required");

if (failures.length) {
  for (const failure of failures) console.error(`FAIL  ${failure}`);
  process.exit(1);
}
console.log("PASS  protection evidence meets the minimum evaluation contract");
