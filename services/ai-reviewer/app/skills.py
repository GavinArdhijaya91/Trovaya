from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import AssetReviewRequest


@dataclass
class SkillDefinition:
    id: str
    title: str
    description: str
    system_prompt_extra: str
    flags_extra: list[dict[str, str]] = field(default_factory=list)
    evidence_boost: list[str] = field(default_factory=list)


BUILTIN_SKILLS: dict[str, SkillDefinition] = {
    "ai_dataset_buyer": SkillDefinition(
        id="ai_dataset_buyer",
        title="AI Dataset Buyer Diligence",
        description="Pemeriksaan kelayakan lisensi untuk pembeli dataset dan pengembang model AI.",
        system_prompt_extra=(
            "Konteks Audit: Evaluasi kepatuhan dataset pelatihan AI. "
            "Soroti apakah izin pelatihan AI terkonfirmasi on-chain dan apakah storage berada pada pinning IPFS permanen. "
            "Jelaskan bahwa lisensi mengizinkan ekstraksi komersial atau pelatihan sesuai terms tercatat."
        ),
        evidence_boost=["Izin pelatihan AI terkonfirmasi dalam terms lisensi."],
        flags_extra=[],
    ),
    "ai_protected_asset": SkillDefinition(
        id="ai_protected_asset",
        title="Protected Anti-Scraping Audit",
        description="Audit perlindungan karya dari scraping dan pelatihan model AI tanpa izin.",
        system_prompt_extra=(
            "Konteks Audit: Karya dilindungi secara eksplisit dari pelatihan AI machine learning. "
            "Soroti bahwa preview publik berstatus eksperimental dan kreator melarang AI training on-chain. "
            "Tekankan bahwa pembeli harus menghormati klausul non-training."
        ),
        evidence_boost=["Klausul proteksi AI training tersemat dalam metadata hash."],
        flags_extra=[],
    ),
    "incomplete_license": SkillDefinition(
        id="incomplete_license",
        title="Incomplete License Terms Audit",
        description="Pemeriksaan khusus bila hash terms lisensi belum diverifikasi.",
        system_prompt_extra=(
            "Konteks Audit: Dokumen terms lisensi belum diverifikasi kesesuaian hash-nya dengan catatan on-chain. "
            "Peringatkan pembeli agar memverifikasi klausul kontrak dan durasi secara mandiri sebelum transaksi."
        ),
        evidence_boost=[],
        flags_extra=[
            {
                "code": "TERMS_DILIGENCE_REQUIRED",
                "severity": "warning",
                "message": "Dokumen lisensi memerlukan verifikasi manual sebelum hak komersial dapat dipastikan.",
            }
        ],
    ),
    "unverified_persistence": SkillDefinition(
        id="unverified_persistence",
        title="Decentralized Persistence Diligence",
        description="Audit penyimpanan saat asset belum menggunakan Pinata IPFS terverifikasi.",
        system_prompt_extra=(
            "Konteks Audit: Persistensi konten berada pada mode demo atau penyimpanan yang belum dibuktikan via Pinata dedicated gateway. "
            "Ingatkan risiko ketersediaan data jangka panjang di jaringan publik."
        ),
        evidence_boost=[],
        flags_extra=[
            {
                "code": "PERSISTENCE_UNVERIFIED_NOTICE",
                "severity": "warning",
                "message": "Konten belum dibuktikan permanen di gateway IPFS resmi.",
            }
        ],
    ),
    "general_provenance": SkillDefinition(
        id="general_provenance",
        title="General Provenance & Licensing Audit",
        description="Pemeriksaan standar integritas hash, preview publik, dan catatan provenance kreator.",
        system_prompt_extra=(
            "Konteks Audit: Audit standar provenance Trovaya Protocol. "
            "Rangkum keseimbangan antara preview publik derivatif, integritas hash metadata, dan kejelasan lisensi."
        ),
        evidence_boost=[],
        flags_extra=[],
    ),
}


def load_yaml_skills(directory: str) -> dict[str, SkillDefinition]:
    """Optional loader if PyYAML is installed and YAML files exist in directory."""
    skills = dict(BUILTIN_SKILLS)
    if not os.path.isdir(directory):
        return skills

    try:
        import yaml  # type: ignore
    except ImportError:
        return skills

    for filename in os.listdir(directory):
        if not (filename.endswith(".yaml") or filename.endswith(".yml")):
            continue
        filepath = os.path.join(directory, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as file:
                data = yaml.safe_load(file)
            if isinstance(data, dict) and "id" in data:
                skill_id = str(data["id"])
                skills[skill_id] = SkillDefinition(
                    id=skill_id,
                    title=str(data.get("title", skill_id)),
                    description=str(data.get("description", "")),
                    system_prompt_extra=str(data.get("system_prompt_extra", "")),
                    flags_extra=list(data.get("flags_extra", [])),
                    evidence_boost=list(data.get("evidence_boost", [])),
                )
        except Exception:
            continue

    return skills


def select_skill(request: AssetReviewRequest, skills_dir: str | None = None) -> SkillDefinition:
    """Select the best matching skill based on protocol signals or explicit category."""
    all_skills = load_yaml_skills(skills_dir) if skills_dir else BUILTIN_SKILLS

    # 1. Explicit match if gallery_category was provided
    if request.gallery_category:
        norm = request.gallery_category.strip().lower()
        if norm in all_skills:
            return all_skills[norm]
        for key, val in all_skills.items():
            if norm in key or norm in val.title.lower():
                return val

    # 2. Protocol signal-based automatic selection
    if request.persistence_mode != "pinata":
        return all_skills.get("unverified_persistence", BUILTIN_SKILLS["unverified_persistence"])

    if request.license.terms_hash_verified is False:
        return all_skills.get("incomplete_license", BUILTIN_SKILLS["incomplete_license"])

    if request.license.allow_ai_training is True:
        return all_skills.get("ai_dataset_buyer", BUILTIN_SKILLS["ai_dataset_buyer"])

    if request.license.allow_ai_training is False:
        return all_skills.get("ai_protected_asset", BUILTIN_SKILLS["ai_protected_asset"])

    return all_skills.get("general_provenance", BUILTIN_SKILLS["general_provenance"])
