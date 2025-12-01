#!/usr/bin/env python3
"""
Sort layouts in layouts.yml alphabetically by name.

Run using:

uv run scripts/sort_layouts.py
"""

import yaml
from pathlib import Path


def sort_layouts():
    config_path = Path(__file__).parent.parent / "config" / "layouts.yml"
    
    with open(config_path, "r") as f:
        data = yaml.safe_load(f)
    
    # Sort layouts alphabetically by name (case-insensitive)
    data["layouts"] = sorted(data["layouts"], key=lambda x: x["name"].lower())
    
    with open(config_path, "w") as f:
        # Write header comments
        f.write("# Generated layouts with properly encoded URLs\n")
        f.write("# Set thumb values manually based on actual thumb key usage in layouts\n\n")
        
        # Dump the data
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)


if __name__ == "__main__":
    sort_layouts()
    print("Layouts sorted alphabetically by name.")