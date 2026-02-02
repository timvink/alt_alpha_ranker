"""
Script to scrape keyboard layout statistics from cyanophage.github.io playground.

Reads layouts from config/layouts.yml and languages from config/languages.yml
Scrapes statistics for each layout in each language and keyboard mode.

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
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn, TimeElapsedColumn, TimeRemainingColumn
from rich.console import Console

console = Console()

# Keyboard modes to scrape
# Note: anglemod uses mode=iso in URL but requires clicking the anglemod button
MODES = ['ergo', 'ansi', 'iso', 'anglemod']


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
        'total_word_effort', 'effort', 'same_finger_bigrams', 'skip_bigrams_1u',
        'skip_bigrams_2u', 'lat_stretch_bigrams', 'scissors', 'pinky_off',
        'bigram_roll_in', 'bigram_roll_out', 'roll_in', 'roll_out', 'redirect',
        'weak_redirect', 'alt', 'alt_sfs'
    ]
    
    for field in metric_fields:
        if field not in metrics or not is_valid_metric_value(metrics[field]):
            return True
    
    return False


def needs_scraping(layout_data: dict, mode: str, language: str, full_refresh: bool) -> bool:
    """Determine if a layout/mode/language combination needs to be scraped."""
    if full_refresh:
        return True
    
    # Check if this layout has metrics
    if 'metrics' not in layout_data:
        return True
    
    # Check if this mode exists for the layout
    if mode not in layout_data['metrics']:
        return True
    
    # Check if this language exists for the mode
    if language not in layout_data['metrics'][mode]:
        return True
    
    # Check if the metrics have any invalid values
    return has_invalid_metrics(layout_data['metrics'][mode][language])


def update_url_language(url: str, language: str) -> str:
    """Update or add the language parameter in a URL."""
    # Check if &lan= already exists in the URL
    if '&lan=' in url:
        return re.sub(r'(&lan=)[^&]+', f'\\1{language}', url)
    # Check if ?lan= exists (language as first query param)
    elif '?lan=' in url:
        return re.sub(r'(\?lan=)[^&]+', f'\\1{language}', url)
    # No lan= parameter exists, add it
    elif '?' in url:
        return url + f'&lan={language}'
    else:
        return url + f'?lan={language}'


def update_url_mode(url: str, mode: str) -> str:
    """Update or add the mode parameter in a URL.
    
    For anglemod, we use mode=iso in the URL (anglemod button is clicked separately).
    """
    url_mode = 'iso' if mode == 'anglemod' else mode
    
    # Check if &mode= already exists in the URL
    if '&mode=' in url:
        return re.sub(r'(&mode=)[^&]+', f'\\1{url_mode}', url)
    # Check if ?mode= exists (mode as first query param - unlikely but handle it)
    elif '?mode=' in url:
        return re.sub(r'(\?mode=)[^&]+', f'\\1{url_mode}', url)
    # No mode= parameter exists, add it
    elif '?' in url:
        return url + f'&mode={url_mode}'
    else:
        return url + f'?mode={url_mode}'


def scrape_layout_stats(url: str, mode: str = 'ergo', silent: bool = False) -> dict:
    """
    Scrape statistics from a keyboard layout URL.
    
    Args:
        url: The cyanophage URL to scrape
        mode: The keyboard mode (ergo, ansi, iso, anglemod)
        silent: If True, suppress error messages
    
    Returns dict with metric keys and values, or None values on error.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            # Navigate to the page
            page.goto(url, wait_until='networkidle', timeout=30000)
            
            # Wait for initial calculations to complete
            page.wait_for_timeout(2000)
            
            # For anglemod, click the anglemod button (activateIso(true))
            if mode == 'anglemod':
                page.evaluate("activateIso(true)")
                # Wait for recalculation
                page.wait_for_timeout(1500)
            
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
            
            # Calculate skip bigrams percentages (both 1u and 2u)
            try:
                skip_bigrams = page.evaluate("""
                    () => {
                        if (typeof m_skip_bigram !== 'undefined' && typeof m_skip_bigram2 !== 'undefined' && typeof m_input_length !== 'undefined') {
                            let sum_1u = 0;
                            let sum_2u = 0;
                            for (var bigram in m_skip_bigram) {
                                sum_1u += m_skip_bigram[bigram] / m_input_length;
                            }
                            for (var bigram in m_skip_bigram2) {
                                sum_2u += m_skip_bigram2[bigram] / m_input_length;
                            }
                            return {
                                skip_bigrams_1u: (100 * sum_1u).toFixed(2) + '%',
                                skip_bigrams_2u: (100 * sum_2u).toFixed(2) + '%'
                            };
                        }
                        return null;
                    }
                """)
                if skip_bigrams:
                    stats['skip_bigrams_1u'] = skip_bigrams.get('skip_bigrams_1u')
                    stats['skip_bigrams_2u'] = skip_bigrams.get('skip_bigrams_2u')
            except Exception:
                stats['skip_bigrams_1u'] = None
                stats['skip_bigrams_2u'] = None
            
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
                    stats['alt'] = f"{trigram_percentages.get('alt', 0):.2f}%"
                    stats['alt_sfs'] = f"{trigram_percentages.get('alt sfs', 0):.2f}%"
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
                'total_word_effort', 'effort', 'same_finger_bigrams', 'skip_bigrams_1u',
                'skip_bigrams_2u', 'lat_stretch_bigrams', 'scissors', 'pinky_off',
                'bigram_roll_in', 'bigram_roll_out', 'roll_in', 'roll_out', 'redirect',
                'weak_redirect', 'alt', 'alt_sfs'
            ]
            for stat in default_stats:
                if stat not in stats:
                    stats[stat] = None
            
            browser.close()
            return stats
            
        except Exception as e:
            browser.close()
            # Return None for all stats on error
            if not silent:
                console.print(f"    [red]Error:[/red] {str(e)[:100]}")
            return {
                'total_word_effort': None,
                'effort': None,
                'same_finger_bigrams': None,
                'skip_bigrams_1u': None,
                'skip_bigrams_2u': None,
                'lat_stretch_bigrams': None,
                'scissors': None,
                'pinky_off': None,
                'bigram_roll_in': None,
                'bigram_roll_out': None,
                'roll_in': None,
                'roll_out': None,
                'redirect': None,
                'weak_redirect': None,
                'alt': None,
                'alt_sfs': None
            }



def save_results(results: dict, output_file: str = 'site/data.json', update_timestamp: bool = True):
    """Save results to JSON file."""
    if update_timestamp:
        results['scraped_at'] = datetime.now().isoformat()
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)


def main():
    """Main function to scrape stats for all layouts."""
    # Parse arguments
    parser = argparse.ArgumentParser(description='Scrape keyboard layout statistics')
    parser.add_argument('--full-refresh', action='store_true',
                        help='Re-scrape all layouts, modes, and languages')
    args = parser.parse_args()
    
    # Load configurations
    layouts = load_layouts()
    languages = load_languages()
    existing_data = load_existing_data()
    
    output_file = 'site/data.json'
    
    # Build lookup for existing layout data
    existing_layouts = {}
    if 'layouts' in existing_data:
        for layout in existing_data['layouts']:
            existing_layouts[layout['name']] = layout
    
    # First pass: prepare all layout entries and count what needs scraping
    layout_entries = {}  # Use dict for easy lookup by name
    scrape_tasks = []  # List of (layout_name, mode, language, base_link) tuples
    
    for layout in layouts:
        name = layout.get('name', 'Unknown')
        base_link = layout.get('link', '')
        website = layout.get('website')
        thumb = layout.get('thumb', False)
        year = layout.get('year')
        
        if not base_link:
            continue
        
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
        
        layout_entries[name] = layout_data
        
        # Check each mode and language combination
        for mode in MODES:
            # Initialize mode dict if it doesn't exist
            if mode not in layout_data['metrics']:
                layout_data['metrics'][mode] = {}
            
            for language in languages:
                if needs_scraping(layout_data, mode, language, args.full_refresh):
                    scrape_tasks.append((name, mode, language, base_link))
    
    # Calculate stats
    total_tasks = len(scrape_tasks)
    total_possible = len(layouts) * len(MODES) * len(languages)
    total_skipped = total_possible - total_tasks
    
    # Print summary
    console.print(f"\n[bold]Keyboard Layout Scraper[/bold]")
    console.print(f"  Layouts: {len(layouts)}")
    console.print(f"  Modes: {len(MODES)} ({', '.join(MODES)})")
    console.print(f"  Languages: {len(languages)} ({', '.join(languages)})")
    console.print(f"  Mode: {'[yellow]Full refresh[/yellow]' if args.full_refresh else '[green]Update missing/invalid only[/green]'}")
    console.print(f"  To scrape: [cyan]{total_tasks}[/cyan] | Already valid: [dim]{total_skipped}[/dim]\n")
    
    # Prepare results structure
    results = {
        'scraped_at': existing_data.get('scraped_at', datetime.now().isoformat()),
        'modes': MODES,
        'languages': languages,
        'layouts': list(layout_entries.values())
    }
    
    if total_tasks == 0:
        console.print("[green]✓ All layouts already have valid data. Nothing to scrape.[/green]")
        # Don't save when nothing changed - preserves existing timestamp
        return
    
    # Track progress
    scraped_count = 0
    errors = 0
    
    # Scrape with progress bar
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        TimeElapsedColumn(),
        TextColumn("•"),
        TimeRemainingColumn(),
        console=console,
        transient=False
    ) as progress:
        task = progress.add_task("Scraping layouts...", total=total_tasks)
        
        for layout_name, mode, language, base_link in scrape_tasks:
            # Update URL with mode and language
            url = update_url_mode(base_link, mode)
            url = update_url_language(url, language)
            
            # Update description to show current layout
            progress.update(task, description=f"[cyan]{layout_name}[/cyan] ({mode}/{language})")
            
            stats = scrape_layout_stats(url, mode=mode, silent=True)
            
            # Check for errors
            if stats.get('effort') is None:
                errors += 1
            
            # Store metrics in the layout entry (metrics.{mode}.{language})
            if mode not in layout_entries[layout_name]['metrics']:
                layout_entries[layout_name]['metrics'][mode] = {}
            layout_entries[layout_name]['metrics'][mode][language] = stats
            scraped_count += 1
            
            # Save progress after each scrape (don't update timestamp until final save)
            results['layouts'] = list(layout_entries.values())
            save_results(results, output_file, update_timestamp=False)
            
            progress.advance(task)
    
    # Final save with updated timestamp
    results['layouts'] = list(layout_entries.values())
    save_results(results, output_file, update_timestamp=True)
    
    # Print summary
    console.print(f"\n[bold green]✓ Complete![/bold green]")
    console.print(f"  Scraped: [cyan]{scraped_count}[/cyan]")
    console.print(f"  Skipped: [dim]{total_skipped}[/dim]")
    if errors > 0:
        console.print(f"  Errors: [red]{errors}[/red]")
    console.print(f"  Saved to: [blue]{output_file}[/blue]")


if __name__ == '__main__':
    main()
