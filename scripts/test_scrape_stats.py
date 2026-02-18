"""
Integration tests for scrape_stats.py

Tests the scraper against the live cyanophage.github.io playground.

Run using:  

uv run scripts/test_scrape_stats.py
"""

import glob
import os

import pytest
import yaml

from scrape_stats import scrape_layout_stats, update_url_language, update_url_mode

LAYOUTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'config', 'layouts')


def test_update_url_language_with_existing_lan():
    """Test that update_url_language replaces existing &lan= parameter."""
    url = "https://cyanophage.github.io/playground.html?layout=abc&mode=ergo&lan=english"
    result = update_url_language(url, "french")
    assert result == "https://cyanophage.github.io/playground.html?layout=abc&mode=ergo&lan=french"


def test_update_url_language_without_lan():
    """Test that update_url_language adds lan= when missing."""
    url = "https://cyanophage.github.io/playground.html?layout=abc&mode=ergo"
    result = update_url_language(url, "french")
    assert result == "https://cyanophage.github.io/playground.html?layout=abc&mode=ergo&lan=french"


def test_update_url_language_with_lan_as_first_param():
    """Test that update_url_language handles lan= as first query parameter."""
    url = "https://cyanophage.github.io/playground.html?lan=english&layout=abc"
    result = update_url_language(url, "german")
    assert result == "https://cyanophage.github.io/playground.html?lan=german&layout=abc"


def test_update_url_language_no_query_params():
    """Test that update_url_language adds lan= when no query params exist."""
    url = "https://cyanophage.github.io/playground.html"
    result = update_url_language(url, "spanish")
    assert result == "https://cyanophage.github.io/playground.html?lan=spanish"


def test_update_url_mode_with_existing_mode():
    """Test that update_url_mode replaces existing &mode= parameter."""
    url = "https://cyanophage.github.io/playground.html?layout=abc&mode=ergo"
    result = update_url_mode(url, "iso")
    assert result == "https://cyanophage.github.io/playground.html?layout=abc&mode=iso"


def test_update_url_mode_without_mode():
    """Test that update_url_mode adds mode= when missing."""
    url = "https://cyanophage.github.io/playground.html?layout=abc"
    result = update_url_mode(url, "ansi")
    assert result == "https://cyanophage.github.io/playground.html?layout=abc&mode=ansi"


def test_update_url_mode_anglemod_uses_iso():
    """Test that anglemod mode uses iso in the URL (anglemod is activated via JS)."""
    url = "https://cyanophage.github.io/playground.html?layout=abc&mode=ergo"
    result = update_url_mode(url, "anglemod")
    assert result == "https://cyanophage.github.io/playground.html?layout=abc&mode=iso"


def test_layout_website_urls_are_valid():
    """Test that every layout with a 'website' entry has a valid URL starting with https or www."""
    layout_files = glob.glob(os.path.join(LAYOUTS_DIR, '*.yml'))
    assert len(layout_files) > 0, "No layout files found"

    invalid = []
    for path in sorted(layout_files):
        with open(path) as f:
            data = yaml.safe_load(f)
        if data and data.get('website'):
            url = data['website'].strip()
            if not (url.startswith('https://') or url.startswith('http://') or url.startswith('www.')):
                invalid.append((os.path.basename(path), url))

    assert invalid == [], f"Layouts with invalid website URLs: {invalid}"


@pytest.mark.integration
def test_scrape_layout_stats_skip_bigrams():
    """
    Test that skip_bigrams_1u and skip_bigrams_2u are correctly scraped.
    
    Uses this layout: https://cyanophage.github.io/playground.html?layout=bldwz%27fouj%3Bnrtsgyhaei%2Cqxmcvkp.-%2F%5C%5E&mode=ergo&lan=english&thumb=l
    
    Expected values:
    - skip_bigrams_1u: 2.73%
    - skip_bigrams_2u: 0.24%
    """
    url = "https://cyanophage.github.io/playground.html?layout=bldwz%27fouj%3Bnrtsgyhaei%2Cqxmcvkp.-%2F%5C%5E&mode=ergo&lan=english&thumb=l"
    
    stats = scrape_layout_stats(url)
    
    # Check skip_bigrams_1u
    assert stats['skip_bigrams_1u'] is not None, "skip_bigrams_1u should not be None"
    assert stats['skip_bigrams_1u'] == '2.73%', f"Expected skip_bigrams_1u to be '2.73%', got '{stats['skip_bigrams_1u']}'"
    
    # Check skip_bigrams_2u
    assert stats['skip_bigrams_2u'] is not None, "skip_bigrams_2u should not be None"
    assert stats['skip_bigrams_2u'] == '0.24%', f"Expected skip_bigrams_2u to be '0.24%', got '{stats['skip_bigrams_2u']}'"


@pytest.mark.integration
def test_scrape_layout_stats_alt():
    """
    Test that alt and alt_sfs are correctly scraped.
    
    Uses QWERTY layout: https://cyanophage.github.io/playground.html?layout=qwertyuiop-asdfghjkl%3B%27zxcvbnm%2C.%2F%5C%5E&mode=ergo&lan=english&thumb=l
    
    Expected values:
    - alt: 21.38%
    - alt_sfs: 5.42%
    """
    url = "https://cyanophage.github.io/playground.html?layout=qwertyuiop-asdfghjkl%3B%27zxcvbnm%2C.%2F%5C%5E&mode=ergo&lan=english&thumb=l"
    
    stats = scrape_layout_stats(url)
    
    # Check alt
    assert stats['alt'] is not None, "alt should not be None"
    assert stats['alt'] == '21.38%', f"Expected alt to be '21.38%', got '{stats['alt']}'"
    
    # Check alt_sfs
    assert stats['alt_sfs'] is not None, "alt_sfs should not be None"
    assert stats['alt_sfs'] == '5.42%', f"Expected alt_sfs to be '5.42%', got '{stats['alt_sfs']}'"


@pytest.mark.integration
def test_scrape_layout_stats_all_metrics():
    """
    Test that all expected metrics are returned by the scraper.
    """
    url = "https://cyanophage.github.io/playground.html?layout=bldwz%27fouj%3Bnrtsgyhaei%2Cqxmcvkp.-%2F%5C%5E&mode=ergo&lan=english&thumb=l"
    
    stats = scrape_layout_stats(url)
    
    expected_metrics = [
        'total_word_effort', 'effort', 'same_finger_bigrams', 'skip_bigrams_1u',
        'skip_bigrams_2u', 'lat_stretch_bigrams', 'scissors', 'pinky_off',
        'bigram_roll_in', 'bigram_roll_out', 'roll_in', 'roll_out', 'redirect',
        'weak_redirect', 'alt', 'alt_sfs'
    ]
    
    for metric in expected_metrics:
        assert metric in stats, f"Missing metric: {metric}"
        assert stats[metric] is not None, f"Metric {metric} should not be None"
        # Verify it's a valid value (numeric or percentage)
        value = stats[metric]
        assert isinstance(value, str), f"Metric {metric} should be a string"
        if '%' in value:
            # Should be a valid percentage
            cleaned = value.rstrip('%')
            float(cleaned)  # Should not raise
        else:
            # Should be a valid number
            float(value)


@pytest.mark.integration
def test_scrape_layout_stats_iso_vs_anglemod():
    """
    Test that iso and anglemod modes produce different SFB stats.
    
    Uses this layout: https://cyanophage.github.io/playground.html?layout=qwmbzjfou%3B-nrstgyheia%27xlcdvkp%2C.%2F%5C%5E
    
    Expected values:
    - iso mode: same_finger_bigrams = 0.86%
    - anglemod mode: same_finger_bigrams = 1.12%
    """
    url = "https://cyanophage.github.io/playground.html?layout=qwmbzjfou%3B-nrstgyheia%27xlcdvkp%2C.%2F%5C%5E&mode=iso&lan=english"
    
    # Test ISO mode
    stats_iso = scrape_layout_stats(url, mode='iso')
    assert stats_iso['same_finger_bigrams'] == '0.86%', f"Expected ISO SFB to be '0.86%', got '{stats_iso['same_finger_bigrams']}'"
    
    # Test anglemod mode (same URL but different mode triggers the anglemod button)
    stats_anglemod = scrape_layout_stats(url, mode='anglemod')
    assert stats_anglemod['same_finger_bigrams'] == '1.12%', f"Expected anglemod SFB to be '1.12%', got '{stats_anglemod['same_finger_bigrams']}'"


@pytest.mark.integration
def test_scrape_layout_stats_english_vs_dutch():
    """
    Test that different languages produce different SFB stats for the same layout.
    
    Uses this layout: https://cyanophage.github.io/playground.html?layout=bldcvjfou%2C-nrtsgyhaei%2Fxqmwzkp%27%3B.%5C%5Eback&mode=iso&thumb=l
    
    Expected values:
    - english: same_finger_bigrams = 0.64%
    - dutch: same_finger_bigrams = 1.18%
    """
    base_url = "https://cyanophage.github.io/playground.html?layout=bldcvjfou%2C-nrtsgyhaei%2Fxqmwzkp%27%3B.%5C%5Eback&mode=iso&thumb=l"
    
    # Test English
    url_english = update_url_language(base_url, 'english')
    stats_english = scrape_layout_stats(url_english, mode='iso', language='english')
    assert stats_english['same_finger_bigrams'] == '0.64%', f"Expected English SFB to be '0.64%', got '{stats_english['same_finger_bigrams']}'"
    
    # Test Dutch
    url_dutch = update_url_language(base_url, 'dutch')
    stats_dutch = scrape_layout_stats(url_dutch, mode='iso', language='dutch')
    assert stats_dutch['same_finger_bigrams'] == '1.18%', f"Expected Dutch SFB to be '1.18%', got '{stats_dutch['same_finger_bigrams']}'"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
