#!/usr/bin/env python3
"""
Fix double-frontmatter in ghcopilot-instr-* skills.

These skills have two --- blocks:
  Block 1: name, description, version, tags (vibe wrapper)
  Block 2: description, applyTo (original copilot instruction metadata)

This script merges them into a single spec-compliant frontmatter:
  - Keeps name from block 1
  - Uses better description (block 2 if longer/more specific, else block 1)
  - Moves version, tags, applyTo under metadata:
  - Adds license
"""

import os
import re
import sys
from pathlib import Path

SKILLS_DIR = Path(__file__).parent.parent / "skills"
LICENSE = "CC-BY-NC-SA-4.0"
DRY_RUN = "--dry-run" in sys.argv


def split_double_frontmatter(content: str):
    """Split content with potential double frontmatter into (block1, block2, body).
    Returns (block1_str, block2_str|None, body_str)."""
    if not content.startswith("---"):
        return None, None, content

    # Find end of first block
    end1 = content.find("---", 3)
    if end1 == -1:
        return None, None, content

    block1 = content[3:end1].strip()
    rest = content[end1 + 3:]

    # Check if rest starts with another --- block (after optional whitespace/newlines)
    rest_stripped = rest.lstrip("\n\r ")
    if rest_stripped.startswith("---"):
        end2 = rest_stripped.find("---", 3)
        if end2 != -1:
            block2 = rest_stripped[3:end2].strip()
            body = rest_stripped[end2 + 3:].lstrip("\n")
            return block1, block2, body

    return block1, None, rest.lstrip("\n")


def parse_simple_yaml(text: str) -> dict:
    """Parse simple single-level YAML into dict."""
    result = {}
    for line in text.split("\n"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"^([\w-]+)\s*:\s*(.*)", line)
        if m:
            key = m.group(1)
            val = m.group(2).strip()
            # Remove surrounding quotes
            if (val.startswith("'") and val.endswith("'")) or \
               (val.startswith('"') and val.endswith('"')):
                val = val[1:-1]
            result[key] = val
    return result


def fix_skill(skill_path: Path) -> bool:
    """Fix a single ghcopilot-instr SKILL.md. Returns True if modified."""
    content = skill_path.read_text(encoding="utf-8")
    block1, block2, body = split_double_frontmatter(content)

    if block1 is None:
        return False

    b1 = parse_simple_yaml(block1)
    b2 = parse_simple_yaml(block2) if block2 else {}

    name = b1.get("name", "")
    desc1 = b1.get("description", "")
    desc2 = b2.get("description", "")

    # Use the more specific description (block2 is usually better)
    description = desc2 if len(desc2) > len(desc1) else desc1

    # Build metadata
    metadata = {}
    if b1.get("version"):
        metadata["version"] = b1["version"]
    if b1.get("tags"):
        metadata["tags"] = b1["tags"]
    if b2.get("applyTo"):
        metadata["applyTo"] = b2["applyTo"]
    metadata["source"] = "awesome-copilot"

    # Build new frontmatter
    lines = [
        f"name: {name}",
        f"description: \"{description}\"",
        f"license: {LICENSE}",
        "metadata:",
    ]
    for k, v in metadata.items():
        if k == "tags":
            lines.append(f"  {k}: {v}")
        else:
            lines.append(f"  {k}: \"{v}\"")

    new_fm = "\n".join(lines)
    new_content = f"---\n{new_fm}\n---\n\n{body}"

    if not DRY_RUN:
        skill_path.write_text(new_content, encoding="utf-8")
    return True


def main():
    if DRY_RUN:
        print("DRY RUN — no files will be modified\n")

    fixed = 0
    errors = 0
    no_double = 0

    for skill_dir in sorted(SKILLS_DIR.iterdir()):
        if not skill_dir.is_dir():
            continue
        if not skill_dir.name.startswith("ghcopilot-instr-"):
            continue
        skill_file = skill_dir / "SKILL.md"
        if not skill_file.exists():
            continue
        try:
            content = skill_file.read_text(encoding="utf-8")
            _, block2, _ = split_double_frontmatter(content)
            if block2 is None:
                no_double += 1
                continue
            if fix_skill(skill_file):
                fixed += 1
                if DRY_RUN and fixed <= 5:
                    print(f"  WOULD FIX: {skill_dir.name}")
        except Exception as e:
            errors += 1
            print(f"  ERROR: {skill_dir.name}: {e}", file=sys.stderr)

    print(f"\nResults: {fixed} fixed, {no_double} no double-fm, {errors} errors")


if __name__ == "__main__":
    main()
