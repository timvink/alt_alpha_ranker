When creating a new PR to close an "Add new layout" issue:

## Scope

- Only Latin script layouts are in scope. Layouts for non-Latin scripts (e.g., Russian, Arabic, Chinese) are not supported.
- Only 'normal' layouts are in scope, so no magic layouts or multiple symbol layers.

## How to add a layout

1. The issue body contains a YAML code block and a suggested config filename (e.g. `config/layouts/my-layout.yml`).
2. Create a new file at that path under `config/layouts/`. The filename should only use lowercase alphanumeric characters and hyphens, with a `.yml` extension.
3. Paste the YAML content from the issue into the file. The file should look like this:

```yaml
name: example-layout
link: https://cyanophage.github.io/playground.html?layout=...
thumb: false
year: 2024
website: https://example.com
```

4. Check if the layout belongs to a family of layouts (e.g. `semimak` has many versions like `semimak-jqc`). If it does, add a `family` field. If unsure, omit it.
5. No need to update any other files. The stats will be auto-scraped when the config file is pushed to main.

## Using python

- Python scripts live in `scripts/`.
- Run with `uv run <path>`.
- Add dependencies with `uv add <dep>` or update `pyproject.toml`.
