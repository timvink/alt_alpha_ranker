
serve:
	cd site && uv run python -m http.server 8000

convert-texts:
	uv run scripts/convert_typing_texts.py
