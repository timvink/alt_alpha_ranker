When creating a new PR to add a new keyboard layout:
- Only Latin script layouts are in scope. Layouts for non-Latin scripts (e.g., Russian, Arabic, Chinese) are not supported.
- Just update the `config/layouts.yml` file with the new layout information. Insert the layout in alphabetical order by `name`.
- No need to update any other files, the stats will be auto-scraped using the scripts in the `scripts/` folder.

Using python:
- python scripts should live in `scripts/`. 
- python can be run using `uv run <path>`. 
- If you need to add a python dependency, update `pyproject.toml` or use `uv add <dep>`. 