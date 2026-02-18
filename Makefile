
serve:
	cd site && uv run python -m http.server 8000

test:
	npm test

scrape:
	uv run scripts/scrape_stats.py