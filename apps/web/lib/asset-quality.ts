export const ASSET_QUALITY_POLICY = {
  version: 1,
  acceptedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  maxBytes: 15 * 1024 * 1024,
  minWidth: 512,
  minHeight: 512,
  maxWidth: 8192,
  maxHeight: 8192,
  minAspectRatio: 0.5,
  maxAspectRatio: 2,
} as const;

export type AssetQualityTier = "entry" | "standard" | "high";

export interface AssetQualityMetadata {
  policyVersion: number;
  originalFileName: string;
  fileExtension: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  aspectRatio: number;
  megapixels: number;
  tier: AssetQualityTier;
}

export async function inspectAssetFile(file: File): Promise<AssetQualityMetadata> {
  validateFileEnvelope(file);
  const { width, height } = await readImageDimensions(file);
  const aspectRatio = Number((width / height).toFixed(4));
  if (width < ASSET_QUALITY_POLICY.minWidth || height < ASSET_QUALITY_POLICY.minHeight) {
    throw new Error(`Resolusi minimum adalah ${ASSET_QUALITY_POLICY.minWidth}x${ASSET_QUALITY_POLICY.minHeight} piksel.`);
  }
  if (width > ASSET_QUALITY_POLICY.maxWidth || height > ASSET_QUALITY_POLICY.maxHeight) {
    throw new Error(`Resolusi maksimum adalah ${ASSET_QUALITY_POLICY.maxWidth}x${ASSET_QUALITY_POLICY.maxHeight} piksel per sisi.`);
  }
  if (aspectRatio < ASSET_QUALITY_POLICY.minAspectRatio || aspectRatio > ASSET_QUALITY_POLICY.maxAspectRatio) {
    throw new Error(`Rasio karya harus berada antara ${ASSET_QUALITY_POLICY.minAspectRatio}:1 dan ${ASSET_QUALITY_POLICY.maxAspectRatio}:1.`);
  }
  const megapixels = Number(((width * height) / 1_000_000).toFixed(2));
  return {
    policyVersion: ASSET_QUALITY_POLICY.version,
    originalFileName: file.name,
    fileExtension: extensionOf(file.name),
    mimeType: file.type,
    sizeBytes: file.size,
    width,
    height,
    aspectRatio,
    megapixels,
    tier: megapixels >= 8 ? "high" : megapixels >= 2 ? "standard" : "entry",
  };
}

function validateFileEnvelope(file: File): void {
  if (!(ASSET_QUALITY_POLICY.acceptedMimeTypes as readonly string[]).includes(file.type)) {
    throw new Error("Format karya harus PNG, JPG, atau WebP.");
  }
  if (file.size > ASSET_QUALITY_POLICY.maxBytes) {
    throw new Error("Ukuran karya maksimum adalah 15 MiB.");
  }
}

function extensionOf(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] === "jpeg" ? "jpg" : match?.[1] ?? "bin";
}

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Dimensi gambar tidak dapat dibaca."));
    };
    image.src = objectUrl;
  });
}