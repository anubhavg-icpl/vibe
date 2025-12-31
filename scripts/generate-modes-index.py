#!/usr/bin/env python3
"""
Generate modes-index.json from all markdown mode files.

Usage:
    python scripts/generate-modes-index.py

    # Or make executable and run directly
    chmod +x scripts/generate-modes-index.py
    ./scripts/generate-modes-index.py
"""

import os
import json
import re
import sys
from datetime import datetime
from pathlib import Path


# Category display names mapping
CATEGORY_TITLES = {
    'ai-ml': 'AI & Machine Learning',
    'analysis': 'Analysis',
    'architecture': 'Architecture',
    'backend': 'Backend Development',
    'blockchain': 'Blockchain',
    'cloud-infrastructure': 'Cloud Infrastructure',
    'creative': 'Creative',
    'database': 'Database',
    'debugging': 'Debugging',
    'design-ux': 'Design & UX',
    'devops': 'DevOps',
    'documentation': 'Documentation',
    'emerging-tech': 'Emerging Tech',
    'enterprise': 'Enterprise',
    'frontend': 'Frontend Development',
    'game-development': 'Game Development',
    'learning': 'Learning',
    'mobile': 'Mobile Development',
    'output-formats': 'Output Formats',
    'planning': 'Planning',
    'refactoring': 'Refactoring',
    'rfc': 'RFC Standards',
    'security': 'Security',
    'testing': 'Testing',
    'ui-ux': 'UI/UX',
}

# Featured modes configuration
FEATURED_MODES = [
    {
        "slug": "son-of-anubhav-mode",
        "title": "Son of Anubhav",
        "description": "Ultimate code reviewer with high standards. Named after the legendary developer Anubhav, this mode ensures your code meets the highest quality standards.",
        "path": ["featured", "son-of-anubhav-mode"],
        "badge": "Golden Reviewer"
    }
]


def extract_frontmatter(file_path: str) -> dict | None:
    """Extract title and description from markdown frontmatter."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check for YAML frontmatter
        if content.startswith('---'):
            end = content.find('---', 3)
            if end != -1:
                frontmatter = content[3:end]
                title = None
                description = None
                tags = []
                rfc = None

                for line in frontmatter.split('\n'):
                    line = line.strip()
                    if line.startswith('title:'):
                        title = line.replace('title:', '').strip().strip('"').strip("'")
                    elif line.startswith('description:'):
                        description = line.replace('description:', '').strip().strip('"').strip("'")
                    elif line.startswith('tags:'):
                        # Simple tag parsing (comma-separated or YAML list)
                        tags_str = line.replace('tags:', '').strip()
                        if tags_str.startswith('['):
                            tags = [t.strip().strip('"').strip("'") for t in tags_str.strip('[]').split(',')]
                        else:
                            tags = [t.strip() for t in tags_str.split(',') if t.strip()]
                    elif line.startswith('rfc:'):
                        rfc_str = line.replace('rfc:', '').strip()
                        try:
                            rfc = int(rfc_str)
                        except ValueError:
                            pass

                if title:
                    result = {'title': title, 'description': description or ''}
                    if tags:
                        result['tags'] = tags
                    if rfc:
                        result['rfc'] = rfc
                    return result

        # Fallback: extract from filename
        filename = os.path.basename(file_path).replace('.md', '')
        title = filename.replace('-mode', '').replace('-', ' ').title()
        return {'title': title, 'description': ''}
    except Exception as e:
        print(f"Warning: Could not parse {file_path}: {e}", file=sys.stderr)
        return None


def get_category_title(category_name: str) -> str:
    """Convert category folder name to display title."""
    return CATEGORY_TITLES.get(category_name, category_name.replace('-', ' ').title())


def generate_index(modes_dir: str = 'modes') -> dict:
    """Generate the complete modes index."""
    categories = []
    total_modes = 0

    # Get script directory and resolve modes path
    script_dir = Path(__file__).parent.parent
    modes_path = script_dir / modes_dir

    if not modes_path.exists():
        print(f"Error: Modes directory not found: {modes_path}", file=sys.stderr)
        sys.exit(1)

    # Get all category directories
    for category_name in sorted(os.listdir(modes_path)):
        category_path = modes_path / category_name
        if not category_path.is_dir():
            continue

        # Skip hidden directories
        if category_name.startswith('.'):
            continue

        modes = []

        # Process all markdown files in category
        for filename in sorted(os.listdir(category_path)):
            if not filename.endswith('.md'):
                continue

            file_path = category_path / filename
            frontmatter = extract_frontmatter(str(file_path))

            if frontmatter:
                slug = filename.replace('.md', '')
                mode = {
                    'slug': slug,
                    'title': frontmatter['title'],
                    'description': frontmatter['description'],
                    'path': [category_name, slug]
                }

                # Add optional fields if present
                if 'tags' in frontmatter:
                    mode['tags'] = frontmatter['tags']
                if 'rfc' in frontmatter:
                    mode['rfc'] = frontmatter['rfc']

                modes.append(mode)
                total_modes += 1

        if modes:
            categories.append({
                'name': category_name,
                'title': get_category_title(category_name),
                'modes': modes
            })

    index = {
        '$schema': './modes-index.schema.json',
        'generatedAt': datetime.utcnow().isoformat() + 'Z',
        'totalModes': total_modes,
        'categories': categories,
        'featured': FEATURED_MODES
    }

    return index


def main():
    """Main entry point."""
    # Resolve paths
    script_dir = Path(__file__).parent.parent
    output_path = script_dir / 'modes-index.json'

    # Generate index
    print("Generating modes index...")
    index = generate_index()

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2)

    print(f"Generated {output_path}")
    print(f"  Total modes: {index['totalModes']}")
    print(f"  Categories: {len(index['categories'])}")

    # Print category summary
    print("\nCategories:")
    for cat in index['categories']:
        print(f"  - {cat['title']}: {len(cat['modes'])} modes")


if __name__ == '__main__':
    main()
