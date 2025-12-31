#!/usr/bin/env python3
"""Fix ASCII diagram code blocks in markdown files.

This script:
1. Finds code blocks containing ASCII box-drawing characters
2. Adds 'text' language specifier if missing
3. Ensures consistent formatting
"""

import re
from pathlib import Path

# Box drawing characters that indicate ASCII diagrams
BOX_CHARS = set("┌┐└┘├┤┬┴┼─│╭╮╯╰═║╔╗╚╝╠╣╦╩╬▲▼◀▶●○■□◆◇★☆→←↑↓⟶⟵")

def has_box_chars(text: str) -> bool:
    """Check if text contains ASCII box drawing characters."""
    return any(c in BOX_CHARS for c in text)


def fix_code_blocks(content: str) -> tuple[str, int]:
    """Fix code blocks with ASCII diagrams.

    Returns:
        Tuple of (fixed_content, number_of_fixes)
    """
    fixes = 0

    # Pattern to match code blocks
    # Group 1: opening fence with optional language
    # Group 2: language (if any)
    # Group 3: content
    # Group 4: closing fence
    pattern = r'(```)([\w-]*)\n(.*?)\n(```)'

    def replace_block(match):
        nonlocal fixes
        fence_open = match.group(1)
        language = match.group(2)
        content = match.group(3)
        fence_close = match.group(4)

        # If no language and content has box chars, add 'text'
        if not language and has_box_chars(content):
            fixes += 1
            return f"{fence_open}text\n{content}\n{fence_close}"

        # If language is empty string and has box chars
        if language == "" and has_box_chars(content):
            fixes += 1
            return f"{fence_open}text\n{content}\n{fence_close}"

        return match.group(0)

    fixed_content = re.sub(pattern, replace_block, content, flags=re.DOTALL)
    return fixed_content, fixes


def process_file(file_path: Path) -> int:
    """Process a single markdown file.

    Returns:
        Number of fixes made
    """
    content = file_path.read_text(encoding='utf-8')
    fixed_content, fixes = fix_code_blocks(content)

    if fixes > 0:
        file_path.write_text(fixed_content, encoding='utf-8')
        print(f"  Fixed {fixes} diagram(s): {file_path}")

    return fixes


def main():
    """Process all markdown files in modes directory."""
    modes_dir = Path("modes")
    total_fixes = 0
    files_fixed = 0

    print("Fixing ASCII diagrams in markdown files...\n")

    for md_file in sorted(modes_dir.rglob("*.md")):
        fixes = process_file(md_file)
        if fixes > 0:
            total_fixes += fixes
            files_fixed += 1

    # Also process root markdown files
    for md_file in sorted(Path(".").glob("*.md")):
        fixes = process_file(md_file)
        if fixes > 0:
            total_fixes += fixes
            files_fixed += 1

    print(f"\nSummary:")
    print(f"  Files fixed: {files_fixed}")
    print(f"  Total diagrams fixed: {total_fixes}")


if __name__ == "__main__":
    main()
