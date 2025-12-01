"""
Script to scrape keyboard layout statistics from cyanophage.github.io playground.

Reads layouts from config/layouts.yml and languages from config/languages.yml
Scrapes statistics for each layout in each language.

Outputs results to data.json for use by static site generator.

By default, only re-scrapes entries with missing/invalid data.
Use --full-refresh to re-scrape all layouts.

Usage: 
    # Update missing/invalid layouts only
    uv run scripts/scrape_stats.py              
    # Refresh all layouts
    uv run scripts/scrape_stats.py --full-refresh  
"""

import json
import yaml
import re
import argparse
from pathlib import Path
from playwright.sync_api import sync_playwright
from datetime import datetime


def load_layouts(yml_path: str = "config/layouts.yml") -> list[dict]:
    """Load layouts from YAML file."""
    with open(yml_path) as f:
        data = yaml.safe_load(f)
    return data.get('layouts', [])


def load_languages(yml_path: str = "config/languages.yml") -> list[str]:
    """Load languages from YAML file."""
    with open(yml_path) as f:
        data = yaml.safe_load(f)
    return data.get('languages', [])


def load_existing_data(json_path: str = "site/data.json") -> dict:
    """Load existing data from JSON file if it exists."""
    path = Path(json_path)
    if not path.exists():
        return {}
    
    try:
        with open(json_path) as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}


def is_valid_metric_value(value) -> bool:
    """Check if a metric value is valid (not None, not 'N/A', not an error string)."""
    if value is None:
        return False
    if not isinstance(value, str):
        return False
    if value == 'N/A':
        return False
    # Check for error messages
    if value.startswith('Error:'):
        return False
    # Valid values should be numeric strings or percentages
    # Allow formats like "1234.56" or "12.34%"
    cleaned = value.rstrip('%')
    try:
        float(cleaned)
        return True
    except ValueError:
        return False


def has_invalid_metrics(metrics: dict) -> bool:
    """Check if any metric in a language's metrics dict has invalid values."""
    if not metrics:
        return True
    
    # Check all metric fields
    metric_fields = [
        'total_word_effort', 'effort', 'same_finger_bigrams', 'skip_bigrams',
        'lat_stretch_bigrams', 'scissors', 'pinky_off', 'bigram_roll_in',
        'bigram_roll_out', 'roll_in', 'roll_out', 'redirect', 'weak_redirect'
    ]
    
    for field in metric_fields:
        if field not in metrics or not is_valid_metric_value(metrics[field]):
            return True
    
    return False


def needs_scraping(layout_data: dict, language: str, full_refresh: bool) -> bool:
    """Determine if a layout/language combination needs to be scraped."""
    if full_refresh:
        return True
    
    # Check if this layout exists in the data
    if 'metrics' not in layout_data:
        return True
    
    # Check if this language exists for the layout
    if language not in layout_data['metrics']:
        return True
    
    # Check if the metrics have any invalid values
    return has_invalid_metrics(layout_data['metrics'][language])


def update_url_language(url: str, language: str) -> str:
    """Update the language parameter in a URL."""
    return re.sub(r'(&lan=)[^&]+', f'\\1{language}', url)


def scrape_layout_stats(url: str) -> dict:
    """
    Scrape statistics from a keyboard layout URL.
    
    Returns dict with metric keys and values, or None values on error.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            # Navigate to the page
            page.goto(url, wait_until='networkidle', timeout=30000)
            
            # Wait for calculations to complete
            page.wait_for_timeout(2000)
            
            stats = {}
            
            # Calculate pinky off percentage
            try:
                pinky_off_pct = page.evaluate("""
                    () => {
                        if (typeof m_pinky_off !== 'undefined' && typeof m_input_length !== 'undefined') {
                            return (100 * m_pinky_off / m_input_length).toFixed(2) + '%';
                        }
                        return null;
                    }
                """)
                stats['pinky_off'] = pinky_off_pct
            except Exception:
                stats['pinky_off'] = None
            
            # Calculate trigram percentages
            try:
                trigram_percentages = page.evaluate("""
                    () => {
                        if (typeof m_trigram_count !== 'undefined') {
                            const total_sum = Object.values(m_trigram_count).reduce((sum, value) => sum + value, 0);
                            const m_trigram_percentage = Object.entries(m_trigram_count).reduce((acc, [key, value]) => {
                                acc[key] = Math.round((value / total_sum) * 10000) / 100; 
                                return acc;
                            }, {});
                            return m_trigram_percentage;
                        }
                        return null;
                    }
                """)
                
                if trigram_percentages:
                    stats['bigram_roll_in'] = f"{trigram_percentages.get('bigram roll in', 0):.2f}%"
                    stats['bigram_roll_out'] = f"{trigram_percentages.get('bigram roll out', 0):.2f}%"
                    stats['roll_in'] = f"{trigram_percentages.get('roll in', 0):.2f}%"
                    stats['roll_out'] = f"{trigram_percentages.get('roll out', 0):.2f}%"
                    stats['redirect'] = f"{trigram_percentages.get('redirect', 0):.2f}%"
                    stats['weak_redirect'] = f"{trigram_percentages.get('weak redirect', 0):.2f}%"
            except Exception:
                pass
            
            # Parse text-based statistics
            all_text = page.inner_text('body')
            lines = all_text.split('\n')
            
            for line in lines:
                line_stripped = line.strip()
                parts = line_stripped.split()
                
                if line_stripped.startswith('Total Word Effort') and len(parts) >= 4:
                    stats['total_word_effort'] = parts[3]
                elif line_stripped.startswith('Effort') and 'Total' not in line_stripped and len(parts) >= 2:
                    stats['effort'] = parts[1]
                elif 'Same Finger Bigrams' in line_stripped:
                    for part in parts:
                        if '%' in part:
                            stats['same_finger_bigrams'] = part
                            break
                elif line_stripped.startswith('Skip Bigrams'):
                    for part in parts:
                        if '%' in part:
                            stats['skip_bigrams'] = part
                            break
                elif 'Lat Stretch Bigrams' in line_stripped or 'Lateral Stretch' in line_stripped:
                    for part in parts:
                        if '%' in part:
                            stats['lat_stretch_bigrams'] = part
                            break
                elif line_stripped.startswith('Scissors') and '%' in line_stripped:
                    for part in parts:
                        if '%' in part:
                            stats['scissors'] = part
                            break
            
            # Set None for missing stats
            default_stats = [
                'total_word_effort', 'effort', 'same_finger_bigrams', 'skip_bigrams',
                'lat_stretch_bigrams', 'scissors', 'pinky_off', 'bigram_roll_in',
                'bigram_roll_out', 'roll_in', 'roll_out', 'redirect', 'weak_redirect'
            ]
            for stat in default_stats:
                if stat not in stats:
                    stats[stat] = None
            
            browser.close()
            return stats
            
        except Exception as e:
            browser.close()
            # Return None for all stats on error
            print(f"    Error: {str(e)[:100]}")
            return {
                'total_word_effort': None,
                'effort': None,
                'same_finger_bigrams': None,
                'skip_bigrams': None,
                'lat_stretch_bigrams': None,
                'scissors': None,
                'pinky_off': None,
                'bigram_roll_in': None,
                'bigram_roll_out': None,
                'roll_in': None,
                'roll_out': None,
                'redirect': None,
                'weak_redirect': None
            }



def main():
    """Main function to scrape stats for all layouts."""
    # Parse arguments
    parser = argparse.ArgumentParser(description='Scrape keyboard layout statistics')
    parser.add_argument('--full-refresh', action='store_true',
                        help='Re-scrape all layouts and languages')
    args = parser.parse_args()
    
    # Load configurations
    layouts = load_layouts()
    languages = load_languages()
    existing_data = load_existing_data()
    
    print(f"Found {len(layouts)} layout(s)")
    print(f"Found {len(languages)} language(s): {', '.join(languages)}")
    print(f"Mode: {'Full refresh' if args.full_refresh else 'Update missing/invalid only'}\n")
    
    # Initialize results structure - preserve existing scraped_at by default
    results = {
        'scraped_at': existing_data.get('scraped_at', datetime.now().isoformat()),
        'languages': languages,
        'layouts': []
    }
    
    # Build lookup for existing layout data
    existing_layouts = {}
    if 'layouts' in existing_data:
        for layout in existing_data['layouts']:
            existing_layouts[layout['name']] = layout
    
    # Track statistics
    total_scraped = 0
    total_skipped = 0
    
    # Process each layout
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
        print(f"Layout: {name}")
        print(f"{'='*60}")
        
        # Get existing data for this layout or create new entry
        existing_layout = existing_layouts.get(name, {})
        
        # Create layout entry
        layout_data = {
            'name': name,
            'url': base_link,
            'thumb': thumb,
            'metrics': existing_layout.get('metrics', {})
        }
        
        # Add optional fields
        if website:
            layout_data['website'] = website
        if year:
            layout_data['year'] = year
        
        # Process each language
        for language in languages:
            if needs_scraping(layout_data, language, args.full_refresh):
                url = update_url_language(base_link, language)
                
                print(f"  Scraping {language}...")
                stats = scrape_layout_stats(url)
                
                # Store metrics
                layout_data['metrics'][language] = stats
                total_scraped += 1
                
                # Show key results
                effort = stats.get('effort', 'N/A')
                sfb = stats.get('same_finger_bigrams', 'N/A')
                print(f"    Effort: {effort}, SFB: {sfb}")
            else:
                print(f"  Skipping {language} (valid data exists)")
                total_skipped += 1
        
        results['layouts'].append(layout_data)
    
    # Only update scraped_at if we actually scraped something
    if total_scraped > 0:
        results['scraped_at'] = datetime.now().isoformat()
    
    # Save results
    output_file = 'site/data.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{'='*60}")
    print(f"✓ Saved results to {output_file}")
    print(f"  Scraped: {total_scraped}")
    print(f"  Skipped: {total_skipped}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
