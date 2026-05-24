#!/usr/bin/env python3
"""
Improve SKILL.md descriptions with 'Use when...' trigger keywords.

Per agentskills.io/skill-creation/optimizing-descriptions:
- Descriptions should say WHAT the skill does AND WHEN to use it
- Include trigger keywords that help agents identify relevant tasks
- Use imperative phrasing: "Use this skill when..."
- Max 1024 characters

This script appends a "Use when..." clause to descriptions that lack one,
derived from the skill's name, category, and existing description.
"""

import re
import sys
from pathlib import Path

SKILLS_DIR = Path(__file__).parent.parent / "skills"
DRY_RUN = "--dry-run" in sys.argv
MAX_DESC_LEN = 1024

# Category -> trigger phrase templates
CATEGORY_TRIGGERS = {
    "design-systems": "Use when building UI components, applying design tokens, or implementing visual styles for {name_hint}.",
    "engineer-personas": "Use when you want code review, architecture advice, or opinions in the style of {name_hint}.",
    "llm-training": "Use when fine-tuning, training, or adapting language models with {name_hint} techniques.",
    "rag-advanced": "Use when building or optimizing retrieval-augmented generation pipelines with {name_hint}.",
    "local-llm": "Use when deploying, running, or configuring local LLM inference with {name_hint}.",
    "model-authoring": "Use when creating, converting, or publishing model files with {name_hint}.",
    "data-platforms": "Use when working with {name_hint} for data processing, streaming, or analytics.",
    "vector-stores": "Use when implementing vector search, embeddings storage, or similarity queries with {name_hint}.",
    "edge-platforms": "Use when deploying to or building on {name_hint} edge/serverless platform.",
    "modern-web": "Use when building web applications with {name_hint}.",
    "cloud-infrastructure": "Use when architecting or managing cloud infrastructure with {name_hint}.",
    "infrastructure": "Use when configuring, deploying, or managing {name_hint} infrastructure.",
    "security": "Use when performing security analysis, auditing, or hardening with {name_hint}.",
    "testing": "Use when writing, running, or improving tests with {name_hint}.",
    "devops": "Use when automating CI/CD, deployments, or operations with {name_hint}.",
    "languages": "Use when writing, reviewing, or refactoring {name_hint} code.",
    "frameworks": "Use when building applications with the {name_hint} framework.",
    "database": "Use when designing, querying, or optimizing {name_hint} databases.",
    "documentation": "Use when generating, improving, or structuring documentation with {name_hint}.",
    "debugging": "Use when diagnosing, troubleshooting, or fixing bugs with {name_hint}.",
    "architecture": "Use when designing system architecture or making technical decisions about {name_hint}.",
    "mobile": "Use when developing mobile applications with {name_hint}.",
    "blockchain": "Use when building blockchain, DeFi, or Web3 applications with {name_hint}.",
    "game-development": "Use when developing games with {name_hint}.",
    "ai-frameworks": "Use when building AI applications with {name_hint}.",
    "multimodal-ai": "Use when working with multimodal AI (images, audio, video) using {name_hint}.",
    "llm-eval-ops": "Use when evaluating, monitoring, or observing LLM performance with {name_hint}.",
    "android-cli": "Use when using Android CLI tools for {name_hint}.",
    "android-platform": "Use when developing Android apps with {name_hint}.",
    "compliance": "Use when implementing or auditing {name_hint} compliance requirements.",
    "chaos-engineering": "Use when running chaos experiments or resilience testing with {name_hint}.",
    "project-structure": "Use when scaffolding, structuring, or architecting {name_hint} projects.",
    "react-best-practices": "Use when writing React components following {name_hint} patterns.",
    "performance": "Use when optimizing {name_hint} performance.",
}

# Prefix-based triggers for skills without category metadata
PREFIX_TRIGGERS = {
    "mythos-": "Use when performing defensive security research, vulnerability analysis, or coordinated disclosure involving {name_hint}.",
    "ghcopilot-instr-": "Use when writing or reviewing {name_hint} code and need idiomatic conventions and best practices.",
    "acd-": "Use when building UI with {name_hint} design aesthetic.",
    "rfc-": "Use when implementing or validating {name_hint} protocol compliance.",
    "ag-": "Use when building or configuring {name_hint} agent workflows.",
    "pi-": "Use when working with pi.dev {name_hint} features.",
    "cmods-": "Use when applying {name_hint} code modifications or tooling.",
    "ecc-": "Use when following {name_hint} coding patterns from the everything-claude-code collection.",
    "sci-": "Use when working on scientific or academic {name_hint} tasks.",
    "wg-": "Use when applying Project Glasswing {name_hint} security patterns.",
}

# Suffix-based triggers
SUFFIX_TRIGGERS = {
    "-expert": "Use when you need deep expertise in {name_hint}.",
    "-design": "Use when building UI with {name_hint} design language and visual style.",
    "-style": "Use when you want code review or advice channeling {name_hint}'s philosophy.",
    "-coding-standards": "Use when enforcing {name_hint} coding conventions and style rules.",
    "-project-architect": "Use when scaffolding or structuring a new {name_hint} project from scratch.",
    "-performance": "Use when diagnosing or optimizing {name_hint} performance issues.",
    "-developer": "Use when developing {name_hint} applications.",
    "-specialist": "Use when you need specialized {name_hint} knowledge.",
}


def extract_name_hint(name: str) -> str:
    """Extract a human-readable hint from the skill name."""
    # Remove common prefixes/suffixes
    hint = name
    for prefix in ["ghcopilot-instr-", "mythos-", "acd-", "ag-", "pi-", "cmods-", "ecc-", "sci-", "wg-"]:
        if hint.startswith(prefix):
            hint = hint[len(prefix):]
            break
    for suffix in ["-expert", "-design", "-style", "-coding-standards", "-project-architect", "-performance", "-developer", "-specialist"]:
        if hint.endswith(suffix):
            hint = hint[: -len(suffix)]
            break
    return hint.replace("-", " ").strip()


def already_has_trigger(desc: str) -> bool:
    """Check if description already has trigger keywords."""
    lower = desc.lower()
    return any(phrase in lower for phrase in [
        "use when", "use this skill when", "use this when",
        "activate when", "triggers when", "applies when",
        "use for", "use this skill for",
    ])


def get_trigger_clause(name: str, category: str, desc: str) -> str | None:
    """Generate a trigger clause for the skill."""
    name_hint = extract_name_hint(name)
    if not name_hint:
        name_hint = name

    # Try category first
    if category and category in CATEGORY_TRIGGERS:
        return CATEGORY_TRIGGERS[category].format(name_hint=name_hint)

    # Try prefix
    for prefix, template in PREFIX_TRIGGERS.items():
        if name.startswith(prefix):
            return template.format(name_hint=name_hint)

    # Try suffix
    for suffix, template in SUFFIX_TRIGGERS.items():
        if name.endswith(suffix):
            return template.format(name_hint=name_hint)

    # Generic fallback
    return f"Use when you need help with {name_hint}."


def parse_frontmatter(content: str):
    """Extract frontmatter string and body."""
    if not content.startswith("---"):
        return None, content
    end = content.find("---", 3)
    if end == -1:
        return None, content
    return content[3:end].strip(), content[end + 3:]


def get_field(fm_str: str, field: str) -> str:
    """Extract a field value from frontmatter string."""
    for line in fm_str.split("\n"):
        m = re.match(rf'^{field}\s*:\s*(.*)', line)
        if m:
            val = m.group(1).strip()
            if (val.startswith('"') and val.endswith('"')) or \
               (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
            return val
    return ""


def get_metadata_field(fm_str: str, field: str) -> str:
    """Extract a field from under metadata: block."""
    in_metadata = False
    for line in fm_str.split("\n"):
        if line.strip() == "metadata:":
            in_metadata = True
            continue
        if in_metadata:
            if not line.startswith("  "):
                in_metadata = False
                continue
            m = re.match(rf'^\s+{field}\s*:\s*(.*)', line)
            if m:
                val = m.group(1).strip()
                if (val.startswith('"') and val.endswith('"')) or \
                   (val.startswith("'") and val.endswith("'")):
                    val = val[1:-1]
                return val
    return ""


def update_description(fm_str: str, new_desc: str) -> str:
    """Replace the description field in frontmatter."""
    lines = fm_str.split("\n")
    new_lines = []
    for line in lines:
        if re.match(r'^description\s*:', line):
            # Handle quoted descriptions
            if '"' in new_desc or "'" in new_desc:
                escaped = new_desc.replace('"', '\\"')
                new_lines.append(f'description: "{escaped}"')
            else:
                new_lines.append(f"description: {new_desc}")
        else:
            new_lines.append(line)
    return "\n".join(new_lines)


def fix_skill(skill_path: Path) -> bool:
    """Improve description for a single skill. Returns True if modified."""
    content = skill_path.read_text(encoding="utf-8")
    fm_str, body = parse_frontmatter(content)
    if fm_str is None:
        return False

    name = get_field(fm_str, "name")
    desc = get_field(fm_str, "description")
    category = get_metadata_field(fm_str, "category") or get_field(fm_str, "category")

    if not name or not desc:
        return False

    # Skip if already has trigger keywords
    if already_has_trigger(desc):
        return False

    trigger = get_trigger_clause(name, category, desc)
    if not trigger:
        return False

    # Append trigger clause
    new_desc = f"{desc.rstrip('.')}. {trigger}"

    # Enforce max length
    if len(new_desc) > MAX_DESC_LEN:
        # Truncate original desc to fit
        available = MAX_DESC_LEN - len(trigger) - 2
        if available < 50:
            return False  # Can't fit meaningfully
        new_desc = f"{desc[:available].rstrip('.')}. {trigger}"

    if len(new_desc) > MAX_DESC_LEN:
        return False

    new_fm = update_description(fm_str, new_desc)
    new_content = f"---\n{new_fm}\n---{body}"

    if not DRY_RUN:
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
        skill_file = skill_dir / "SKILL.md"
        if not skill_file.exists():
            continue
        try:
            if fix_skill(skill_file):
                fixed += 1
                if DRY_RUN and fixed <= 10:
                    name = skill_dir.name
                    content = skill_file.read_text()
                    fm, _ = parse_frontmatter(content)
                    desc = get_field(fm, "description") if fm else ""
                    print(f"  {name}:")
                    print(f"    → {desc[:120]}...")
                    print()
            else:
                skipped += 1
        except Exception as e:
            errors += 1
            print(f"  ERROR: {skill_dir.name}: {e}", file=sys.stderr)

    print(f"\nResults: {fixed} improved, {skipped} skipped (already has triggers), {errors} errors")


if __name__ == "__main__":
    main()
