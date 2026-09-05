from .models import AssetReviewRequest, ReviewFlag


def build_evidence(request: AssetReviewRequest) -> list[str]:
    evidence: list[str] = []
    if request.metadata_hash_verified:
        evidence.append("Hash metadata cocok dengan referensi yang diberikan.")
    if request.persistence_mode == "pinata":
        evidence.append("Asset memiliki mode persistensi Pinata.")
    if request.public_preview_cid:
        evidence.append("Preview publik memiliki referensi konten.")
    if request.encrypted_vault_cid:
        evidence.append("Original terenkripsi memiliki referensi vault.")
    if request.license_terms_cid:
        evidence.append("Dokumen terms lisensi memiliki referensi konten.")
    if request.license.terms_hash_verified:
        evidence.append("Hash terms lisensi cocok dengan catatan yang diberikan.")
    if request.license.duration_days:
        evidence.append(f"Durasi lisensi tercatat {request.license.duration_days} hari.")
    if request.original_resolution:
        evidence.append(
            f"Resolusi original tercatat {request.original_resolution.width}x{request.original_resolution.height} piksel."
        )
    if request.license.allow_ai_training is not None:
        consent = "diizinkan" if request.license.allow_ai_training else "tidak diizinkan"
        evidence.append(f"Consent pelatihan AI tercatat: {consent}.")
    return evidence


def build_flags(request: AssetReviewRequest) -> list[ReviewFlag]:
    flags: list[ReviewFlag] = []
    if request.preview_protection == "experimental":
        flags.append(ReviewFlag(code="EXPERIMENTAL_PROTECTION", severity="info", message="Protected preview masih eksperimental dan tidak membuktikan pencegahan scraping."))
    elif request.preview_protection == "unknown":
        flags.append(ReviewFlag(code="UNKNOWN_PROTECTION", severity="warning", message="Status metode perlindungan preview belum tersedia."))
    if request.creator_identity != "verified":
        flags.append(ReviewFlag(code="IDENTITY_NOT_VERIFIED", severity="warning", message="Identitas creator belum diverifikasi oleh issuer independen."))
    if request.persistence_mode != "pinata":
        flags.append(ReviewFlag(code="PERSISTENCE_UNCONFIRMED", severity="warning", message="Persistensi asset belum dibuktikan sebagai pinning IPFS nyata."))
    if request.metadata_hash_verified is not True:
        flags.append(ReviewFlag(code="METADATA_HASH_UNVERIFIED", severity="warning", message="Hash metadata belum diverifikasi."))
    if request.license.terms_hash_verified is not True:
        flags.append(ReviewFlag(code="LICENSE_TERMS_UNVERIFIED", severity="warning", message="Hash terms lisensi belum diverifikasi."))
    if request.license.allow_ai_training is False:
        flags.append(ReviewFlag(code="AI_TRAINING_NOT_ALLOWED", severity="info", message="Terms mencatat bahwa pelatihan AI tidak diizinkan."))
    return flags


def rules_review(request: AssetReviewRequest) -> tuple[list[str], list[ReviewFlag]]:
    return build_evidence(request), build_flags(request)
