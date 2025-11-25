
serve:
	cd site && uv run python -m http.server 8000

test:
	npm test

convert-texts:
	uv run scripts/convert_typing_texts.py
