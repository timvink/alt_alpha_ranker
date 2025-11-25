"""Download language files from MonkeyType repository."""

import urllib.request
import json
from pathlib import Path

import yaml

# Path to cyanophage config
CONFIG_PATH = Path(__file__).parent.parent / "config" / "cyanophage.yml"

# URL template for MonkeyType language files
URL_TEMPLATE = "https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/{lang}_1k.json"

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "site" / "static" / "languages"


def download_language(lang: str) -> None:
    """Download a language file from MonkeyType."""
    url = URL_TEMPLATE.format(lang=lang)
    output_path = OUTPUT_DIR / f"{lang}_1k.json"

    print(f"Downloading {lang}...")
    try:
        with urllib.request.urlopen(url) as response:
            data = response.read()
            # Validate it's valid JSON
            json.loads(data)

        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Write the file
        output_path.write_bytes(data)
        print(f"  Saved to {output_path}")
    except urllib.error.HTTPError as e:
        print(f"  Error downloading {lang}: {e}")
    except json.JSONDecodeError as e:
        print(f"  Error: Invalid JSON for {lang}: {e}")


def load_languages() -> list[str]:
    """Load languages from cyanophage config."""
    with open(CONFIG_PATH) as f:
        config = yaml.safe_load(f)
    return config.get("languages", [])


def main() -> None:
    """Download all language files."""
    languages = load_languages()
    print(f"Downloading {len(languages)} language(s) to {OUTPUT_DIR}\n")

    for lang in languages:
        download_language(lang)

    print("\nDone!")


if __name__ == "__main__":
    main()
