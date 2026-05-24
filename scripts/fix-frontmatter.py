#!/usr/bin/env python3
"""
Bulk fix SKILL.md frontmatter to align with agentskills.io spec.

Moves non-standard top-level fields (risk, source, kind, category, tags, version)
under metadata: and adds license field.

Skips ghcopilot-instr-* skills (handled by fix-double-frontmatter.py).
"""

import os
import re
import sys
from pathlib import Path

SKILLS_DIR = Path(__file__).parent.parent / "skills"
LICENSE = "CC-BY-NC-SA-4.0"
NON_STANDARD_FIELDS = {"risk", "source", "kind", "category", "tags", "version", "date_added"}
DRY_RUN = "--dry-run" in sys.argv


def parse_frontmatter(content: str):
    """Extract frontmatter and body from SKILL.md content."""
    if not content.startswith("---"):
        return None, content
    end = content.find("---", 3)
    if end == -1:
        return None, content
    fm_str = content[3:end].strip()
    body = content[end + 3:].lstrip("\n")
    return fm_str, body


def parse_yaml_simple(fm_str: str) -> list[tuple[str, str]]:
    """Parse YAML frontmatter preserving order. Returns list of (key, raw_value) pairs."""
    entries = []
    lines = fm_str.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip() or line.startswith("#"):
            i += 1
            continue
        match = re.match(r'^(\w[\w-]*)\s*:\s*(.*)', line)
        if match:
            key = match.group(1)
            val = match.group(2)
            # Check for multi-line (indented continuation)
            collected = [val]
            i += 1
            while i < len(lines) and lines[i].startswith("  "):
                collected.append(lines[i])
                i += 1
            entries.append((key, "\n".join(collected)))
        else:
            i += 1
    return entries


def rebuild_frontmatter(entries: list[tuple[str, str]], metadata_entries: list[tuple[str, str]]) -> str:
    """Rebuild YAML frontmatter string."""
    lines = []
    for key, val in entries:
        if val and "\n" in val and val.split("\n")[1].startswith("  "):
            lines.append(f"{key}: {val}")
        else:
            lines.append(f"{key}: {val}")

    if metadata_entries:
        lines.append("metadata:")
        for key, val in metadata_entries:
            if val.startswith("[") or val.startswith("{"):
                lines.append(f"  {key}: {val}")
            elif "\n" in val:
                lines.append(f"  {key}:")
                for subline in val.split("\n")[1:]:
                    lines.append(f"  {subline}")
            else:
                lines.append(f"  {key}: {val}")

    return "\n".join(lines)


def fix_skill(skill_path: Path) -> bool:
    """Fix a single SKILL.md. Returns True if modified."""
    content = skill_path.read_text(encoding="utf-8")
    fm_str, body = parse_frontmatter(content)
    if fm_str is None:
        return False

    entries = parse_yaml_simple(fm_str)
    if not entries:
        return False

    # Check if already has metadata block
    has_metadata = any(k == "metadata" for k, _ in entries)
    has_license = any(k == "license" for k, _ in entries)

    # Separate standard vs non-standard fields
    standard = []
    non_standard = []
    existing_metadata = []

    for key, val in entries:
        if key == "metadata":
            # Parse existing metadata sub-entries
            if val.strip() == "":
                continue
            # Multi-line metadata
            sub_lines = val.split("\n")
            for sl in sub_lines:
                sl = sl.strip()
                if not sl:
                    continue
                sm = re.match(r'^(\w[\w-]*)\s*:\s*(.*)', sl)
                if sm:
                    existing_metadata.append((sm.group(1), sm.group(2)))
        elif key in NON_STANDARD_FIELDS:
            non_standard.append((key, val))
        else:
            standard.append((key, val))

    # Nothing to fix
    if not non_standard and has_license:
        return False

    # Add license if missing
    if not has_license:
        # Insert after description
        insert_idx = 1
        for i, (k, _) in enumerate(standard):
            if k == "description":
                insert_idx = i + 1
                break
        standard.insert(insert_idx, ("license", LICENSE))

    # Merge non-standard into metadata
    all_metadata = existing_metadata + non_standard

    new_fm = rebuild_frontmatter(standard, all_metadata)
    new_content = f"---\n{new_fm}\n---\n\n{body}"

    if DRY_RUN:
        return True

    skill_path.write_text(new_content, encoding="utf-8")
    return True


def main():
    if DRY_RUN:
        print("DRY RUN — no files will be modified\n")

    fixed = 0
    skipped = 0
    errors = 0

    for skill_dir in sorted(SKILLS_DIR.iterdir()):
        if not skill_dir.is_dir():
            continue
        # Skip ghcopilot-instr-* (handled separately)
        if skill_dir.name.startswith("ghcopilot-instr-"):
            skipped += 1
            continue
        skill_file = skill_dir / "SKILL.md"
        if not skill_file.exists():
            continue
        try:
            if fix_skill(skill_file):
                fixed += 1
                if DRY_RUN and fixed <= 5:
                    print(f"  WOULD FIX: {skill_dir.name}")
        except Exception as e:
            errors += 1
            print(f"  ERROR: {skill_dir.name}: {e}", file=sys.stderr)

    print(f"\nResults: {fixed} fixed, {skipped} skipped (ghcopilot), {errors} errors")


if __name__ == "__main__":
    main()
