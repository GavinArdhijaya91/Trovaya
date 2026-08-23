import { keccak256, toBytes, type Hex } from "viem";

export interface LicenseTermsInput {
  durationDays: number;
  territory: string;
  permittedUse: string;
  exclusive: boolean;
  sublicensingAllowed: boolean;
  allowAITraining: boolean;
}

export interface VersionedLicenseTerms extends LicenseTermsInput {
  schema: "trovaya-commercial-license";
  version: 1;
  licenseType: "commercial";
}

export function createLicenseTerms(input: LicenseTermsInput): {
  document: VersionedLicenseTerms;
  json: string;
  hash: Hex;
} {
  const document: VersionedLicenseTerms = {
    schema: "trovaya-commercial-license",
    version: 1,
    licenseType: "commercial",
    durationDays: input.durationDays,
    territory: input.territory.trim(),
    permittedUse: input.permittedUse.trim(),
    exclusive: input.exclusive,
    sublicensingAllowed: input.sublicensingAllowed,
    allowAITraining: input.allowAITraining,
  };
  if (!Number.isInteger(document.durationDays) || document.durationDays < 1 || document.durationDays > 3650) {
    throw new Error("Durasi lisensi harus 1 sampai 3650 hari.");
  }
  if (!document.territory || !document.permittedUse) throw new Error("Wilayah dan penggunaan lisensi wajib diisi.");
  const json = JSON.stringify(document);
  return { document, json, hash: keccak256(toBytes(json)) };
}

export function verifyLicenseTermsJson(json: string, expectedHash: string): VersionedLicenseTerms {
  if (keccak256(toBytes(json)).toLowerCase() !== expectedHash.toLowerCase()) {
    throw new Error("Hash dokumen lisensi tidak cocok dengan catatan on-chain.");
  }
  const value = JSON.parse(json) as Partial<VersionedLicenseTerms>;
  if (value.schema !== "trovaya-commercial-license" || value.version !== 1
      || value.licenseType !== "commercial" || !Number.isInteger(value.durationDays)
      || typeof value.territory !== "string" || typeof value.permittedUse !== "string"
      || typeof value.exclusive !== "boolean" || typeof value.sublicensingAllowed !== "boolean"
      || typeof value.allowAITraining !== "boolean") {
    throw new Error("Dokumen lisensi tidak mengikuti schema Trovaya v1.");
  }
  return value as VersionedLicenseTerms;
}
