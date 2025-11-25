"""
Script to convert typing_texts.yml to JSON for the browser.

Usage: uv run scripts/convert_typing_texts.py
"""

import json
import yaml
from pathlib import Path


def main():
    # Load typing texts from YAML
    yml_path = Path("config/typing_texts.yml")
    json_path = Path("site/typing_texts.json")
    
    with open(yml_path) as f:
        data = yaml.safe_load(f)
    
    # Write to JSON
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Converted {yml_path} to {json_path}")
    
    # Print summary
    for lang, texts in data.get('texts', {}).items():
        print(f"  {lang}: {len(texts)} texts")


if __name__ == "__main__":
    main()
