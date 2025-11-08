"""
Script to scrape keyboard layout statistics from cyanophage.github.io playground.

Reads layouts from config/layouts.yml and languages from config/cyanophage.yml
Scrapes statistics for each layout in each language.

Outputs results to data.json for use by static site generator.

Usage: uv run scripts/scrape_stats.py
"""

import json
import yaml
import re
from playwright.sync_api import sync_playwright
from datetime import datetime


def load_layouts(yml_path: str = "config/layouts.yml") -> list[dict]:
    """Load layouts from YAML file."""
    with open(yml_path, 'r') as f:
        data = yaml.safe_load(f)
    return data.get('layouts', [])


def load_languages(yml_path: str = "config/cyanophage.yml") -> list[str]:
    """Load languages from YAML file."""
    with open(yml_path, 'r') as f:
        data = yaml.safe_load(f)
    return data.get('languages', [])


def scrape_layout_stats(url: str) -> dict:
    """
    Scrape statistics from a keyboard layout URL.
    
    Returns:
        dict with 'total_word_effort' and 'effort' keys
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            # Navigate to the page
            page.goto(url, wait_until='networkidle', timeout=30000)
            
            # Wait for the statistics to load
            # The page is dynamic, so we need to wait for specific elements
            page.wait_for_timeout(2000)  # Give it time to calculate stats
            
            # Calculate pinky off percentage using JavaScript
            pinky_off_pct = None
            try:
                pinky_off_pct = page.evaluate("""
                    () => {
                        if (typeof m_pinky_off !== 'undefined' && typeof m_input_length !== 'undefined') {
                            return (100 * m_pinky_off / m_input_length).toFixed(2) + '%';
                        }
                        return null;
                    }
                """)
            except Exception as e:
                print(f"Could not calculate pinky off: {e}")
            
            # Try to find the statistics on the page
            # This will need to be adjusted based on the actual HTML structure
            stats = {}
            
            if pinky_off_pct:
                stats['pinky_off'] = pinky_off_pct
            
            # Get all visible text from the page
            all_text = page.inner_text('body')
            
            # Parse the statistics from the text
            lines = all_text.split('\n')
            for i, line in enumerate(lines):
                line_stripped = line.strip()
                # Look for "Total Word Effort" followed by a number
                if line_stripped.startswith('Total Word Effort'):
                    # Extract the number from the same line
                    parts = line_stripped.split()
                    if len(parts) >= 4:  # "Total Word Effort 2070.6"
                        stats['total_word_effort'] = parts[3]
                # Look for "Effort" line (not "Total Word Effort")
                elif line_stripped.startswith('Effort') and 'Total' not in line_stripped:
                    # Extract the number from the same line
                    parts = line_stripped.split()
                    if len(parts) >= 2:  # "Effort 1258.15"
                        stats['effort'] = parts[1]
                # Look for "Same Finger Bigrams"
                elif 'Same Finger Bigrams' in line_stripped:
                    # Extract percentage
                    parts = line_stripped.split()
                    for part in parts:
                        if '%' in part:
                            stats['same_finger_bigrams'] = part
                            break
                # Look for "Skip Bigrams"
                elif line_stripped.startswith('Skip Bigrams'):
                    # Extract percentage
                    parts = line_stripped.split()
                    for part in parts:
                        if '%' in part:
                            stats['skip_bigrams'] = part
                            break
                # Look for "Lat Stretch Bigrams"
                elif 'Lat Stretch Bigrams' in line_stripped or 'Lateral Stretch' in line_stripped:
                    # Extract percentage
                    parts = line_stripped.split()
                    for part in parts:
                        if '%' in part:
                            stats['lat_stretch_bigrams'] = part
                            break
                # Look for "Scissors"
                elif line_stripped.startswith('Scissors') and '%' in line_stripped:
                    # Extract percentage
                    parts = line_stripped.split()
                    for part in parts:
                        if '%' in part:
                            stats['scissors'] = part
                            break
            
            # If we didn't find them, set to None
            if 'total_word_effort' not in stats:
                stats['total_word_effort'] = None
            if 'effort' not in stats:
                stats['effort'] = None
            if 'same_finger_bigrams' not in stats:
                stats['same_finger_bigrams'] = None
            if 'skip_bigrams' not in stats:
                stats['skip_bigrams'] = None
            if 'lat_stretch_bigrams' not in stats:
                stats['lat_stretch_bigrams'] = None
            if 'scissors' not in stats:
                stats['scissors'] = None
            if 'pinky_off' not in stats:
                stats['pinky_off'] = None
            
            browser.close()
            return stats
            
        except Exception as e:
            browser.close()
            return {
                'total_word_effort': f'Error: {str(e)}',
                'effort': f'Error: {str(e)}'
            }


def update_url_language(url: str, language: str) -> str:
    """Update the language parameter in a URL."""
    # Replace the lan parameter value
    return re.sub(r'(&lan=)[^&]+', f'\\1{language}', url)


def main():
    """Main function to scrape stats for all layouts."""
    # Load configurations
    layouts = load_layouts()
    languages = load_languages()
    
    print(f"Found {len(layouts)} layout(s) to scrape")
    print(f"Found {len(languages)} language(s) to scrape: {', '.join(languages)}\n")
    
    # Store results
    results = {
        'scraped_at': datetime.now().isoformat(),
        'languages': languages,
        'layouts': []
    }
    
    # Scrape each layout
    for layout in layouts:
        name = layout.get('name', 'Unknown')
        base_link = layout.get('link', '')
        website = layout.get('website')
        thumb = layout.get('thumb', False)
        year = layout.get('year')
        
        if not base_link:
            print(f"Skipping {name}: No link provided")
            continue
        
        print(f"\n{'='*60}")
        print(f"Scraping {name}")
        print(f"{'='*60}")
        
        # Create layout entry with metrics per language
        layout_data = {
            'name': name,
            'url': base_link,
            'thumb': thumb,
            'metrics': {}  # Will store metrics keyed by language
        }
        
        # Add optional fields if available
        if website:
            layout_data['website'] = website
        if year:
            layout_data['year'] = year
        
        # Scrape for each language
        for language in languages:
            # Update URL with current language
            url = update_url_language(base_link, language)
            
            print(f"\n  Language: {language}")
            print(f"  URL: {url}")
            
            stats = scrape_layout_stats(url)
            
            # Store metrics for this language
            layout_data['metrics'][language] = {
                'total_word_effort': stats.get('total_word_effort'),
                'effort': stats.get('effort'),
                'same_finger_bigrams': stats.get('same_finger_bigrams'),
                'skip_bigrams': stats.get('skip_bigrams'),
                'lat_stretch_bigrams': stats.get('lat_stretch_bigrams'),
                'scissors': stats.get('scissors'),
                'pinky_off': stats.get('pinky_off')
            }
            
            print(f"  Results:")
            print(f"    Total Word Effort: {stats.get('total_word_effort', 'N/A')}")
            print(f"    Effort: {stats.get('effort', 'N/A')}")
            print(f"    Same Finger Bigrams: {stats.get('same_finger_bigrams', 'N/A')}")
            print(f"    Skip Bigrams: {stats.get('skip_bigrams', 'N/A')}")
            print(f"    Lat Stretch Bigrams: {stats.get('lat_stretch_bigrams', 'N/A')}")
            print(f"    Scissors: {stats.get('scissors', 'N/A')}")
            print(f"    Pinky Off: {stats.get('pinky_off', 'N/A')}")
        
        results['layouts'].append(layout_data)
    
    # Save to JSON file
    output_file = 'site/data.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{'='*60}")
    print(f"✓ Saved results to {output_file}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
