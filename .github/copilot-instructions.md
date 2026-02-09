When creating a new PR to add a new keyboard layout:
- Only Latin script layouts are in scope. Layouts for non-Latin scripts (e.g., Russian, Arabic, Chinese) are not supported.
- Only 'normal' layouts are in scope, so no magic layouts or multiple layers (e.g., Dvorak with a separate layer for numbers and symbols) are supported.
- Add a new file in `config/layouts/` directory. The filename should be `<new_layout_name>.json` (only use hyphens and alphanumeric characters). The actual filename used is in the `name:` field of the file, so the filename can be different from the layout name. The file should follow the same structure as the existing files in that directory. Make sure to check if the layout is part of a family of layouts (e.g. `enthium` which has many versions)
- No need to update any other files, the stats will be auto-scraped using the scripts in the `scripts/` folder.

Using python:
- python scripts should live in `scripts/`. 
- python can be run using `uv run <path>`. 
- If you need to add a python dependency, update `pyproject.toml` or use `uv add <dep>`. 