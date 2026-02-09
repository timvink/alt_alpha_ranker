When creating a new PR to add a new keyboard layout:
- Only Latin script layouts are in scope. Layouts for non-Latin scripts (e.g., Russian, Arabic, Chinese) are not supported.
- Only 'normal' layouts are in scope, so no magic layouts or multiple layers (e.g., Dvorak with a separate layer for numbers and symbols) are supported.
- Just update the `config/layouts/` directory with the new layout information.
- No need to update any other files, the stats will be auto-scraped using the scripts in the `scripts/` folder.

Using python:
- python scripts should live in `scripts/`. 
- python can be run using `uv run <path>`. 
- If you need to add a python dependency, update `pyproject.toml` or use `uv add <dep>`. 