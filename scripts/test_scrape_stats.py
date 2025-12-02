"""
Integration tests for scrape_stats.py

Tests the scraper against the live cyanophage.github.io playground.

Run using:  

uv run scripts/test_scrape_stats.py
"""

import pytest
from scrape_stats import scrape_layout_stats


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


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
