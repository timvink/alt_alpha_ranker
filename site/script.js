import { calculateScores as calculateLayoutScores } from './layout-scores.js';

let layoutsData = [];
let allLanguages = [];
let currentSort = { column: null, direction: 'asc' };
let currentThumbFilter = 'all';
let pinnedLayouts = new Set();
let starredLayouts = new Set();

// Expose currentLanguage globally for accordion to access
window.currentLanguage = 'english';

// Score weights (0-100 for each metric)
let scoreWeights = {
    sfb: 50,
    sfs: 50,
    lsb: 50,
    scissors: 50,
    rolls: 50,
    alternation: 50,
    redirect: 50,
    pinky: 50
};

// Presets for score weights
const weightPresets = {
    'balanced': { sfb: 50, sfs: 50, lsb: 50, scissors: 50, rolls: 50, alternation: 50, redirect: 50, pinky: 50 },
    'low-pinky': { sfb: 50, sfs: 50, lsb: 50, scissors: 50, rolls: 50, alternation: 50, redirect: 50, pinky: 100 },
    'comfort': { sfb: 80, sfs: 40, lsb: 80, scissors: 100, rolls: 30, alternation: 30, redirect: 40, pinky: 80 }
};

// URL Parameter handling for shareable links
function getUrlParams() {
    return new URLSearchParams(window.location.search);
}

function updateUrlParams() {
    const params = new URLSearchParams();
    
    // Add language (only if not default)
    if (window.currentLanguage && window.currentLanguage !== 'english') {
        params.set('lang', window.currentLanguage);
    }
    
    // Add search filter (only if not empty)
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim()) {
        params.set('search', searchInput.value.trim());
    }
    
    // Add weights - check if it matches a preset
    let activePreset = null;
    for (const [presetName, presetWeights] of Object.entries(weightPresets)) {
        const isMatch = Object.keys(presetWeights).every(key => 
            scoreWeights[key] === presetWeights[key]
        );
        if (isMatch) {
            activePreset = presetName;
            break;
        }
    }
    
    if (activePreset && activePreset !== 'balanced') {
        // Use preset name if it matches (skip balanced as it's default)
        params.set('preset', activePreset);
    } else if (!activePreset) {
        // Use custom weights if no preset matches
        const weightStr = Object.entries(scoreWeights)
            .map(([k, v]) => `${k}:${v}`)
            .join(',');
        params.set('weights', weightStr);
    }
    
    // Add highlighted (starred) layouts
    if (starredLayouts.size > 0) {
        params.set('highlight', [...starredLayouts].join(','));
    }
    
    // Add pinned layouts
    if (pinnedLayouts.size > 0) {
        params.set('pinned', [...pinnedLayouts].join(','));
    }
    
    // Update URL without reloading the page
    const newUrl = params.toString() 
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
}

function loadFromUrlParams() {
    const params = getUrlParams();
    
    // Load language
    const lang = params.get('lang');
    if (lang) {
        window.currentLanguage = lang;
    }
    
    // Load search filter
    const search = params.get('search');
    if (search) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = search;
        }
    }
    
    // Load weights - either from preset or custom weights
    const preset = params.get('preset');
    const weights = params.get('weights');
    
    if (preset && weightPresets[preset]) {
        scoreWeights = { ...weightPresets[preset] };
    } else if (weights) {
        // Parse custom weights string like "sfb:50,sfs:60,..."
        const customWeights = {};
        weights.split(',').forEach(pair => {
            const [key, value] = pair.split(':');
            if (key && value !== undefined) {
                const numValue = parseInt(value, 10);
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                    customWeights[key] = numValue;
                }
            }
        });
        // Merge with balanced preset to ensure all keys exist
        scoreWeights = { ...weightPresets['balanced'], ...customWeights };
    }
    
    // Load highlighted (starred) layouts
    const highlight = params.get('highlight');
    if (highlight) {
        starredLayouts = new Set(highlight.split(',').map(s => s.trim()).filter(Boolean));
    }
    
    // Load pinned layouts
    const pinned = params.get('pinned');
    if (pinned) {
        pinnedLayouts = new Set(pinned.split(',').map(s => s.trim()).filter(Boolean));
    }
    
    return {
        hasUrlParams: params.toString().length > 0,
        lang,
        search,
        preset,
        weights,
        highlight,
        pinned
    };
}

// Load score weights from localStorage
function loadScoreWeights() {
    const saved = localStorage.getItem('scoreWeights');
    if (saved) {
        const savedWeights = JSON.parse(saved);
        // Merge with balanced preset to ensure all keys exist (handles new metrics like alternation)
        scoreWeights = { ...weightPresets['balanced'], ...savedWeights };
    } else {
        // Default to 'balanced' preset if no saved weights
        scoreWeights = { ...weightPresets['balanced'] };
    }
}

// Save score weights to localStorage
function saveScoreWeights() {
    localStorage.setItem('scoreWeights', JSON.stringify(scoreWeights));
}

// Save selected preset name to localStorage (for UI state only)
function saveSelectedPreset(presetName) {
    if (presetName) {
        localStorage.setItem('selectedPreset', presetName);
    } else {
        localStorage.removeItem('selectedPreset');
    }
}

// Global scores cache - recalculated when weights change or language changes
let cachedScores = {};

// Recalculate and cache scores for all layouts using the layout-scores module
function recalculateAllScores() {
    if (layoutsData.length > 0) {
        cachedScores = calculateLayoutScores(layoutsData, scoreWeights, window.currentLanguage);
    }
}

// Load pinned layouts from localStorage
function loadPinnedLayouts() {
    const saved = localStorage.getItem('pinnedLayouts');
    if (saved) {
        pinnedLayouts = new Set(JSON.parse(saved));
    }
}

// Save pinned layouts to localStorage
function savePinnedLayouts() {
    localStorage.setItem('pinnedLayouts', JSON.stringify([...pinnedLayouts]));
}

// Load starred layouts from localStorage
function loadStarredLayouts() {
    const saved = localStorage.getItem('starredLayouts');
    if (saved) {
        starredLayouts = new Set(JSON.parse(saved));
    }
}

// Save starred layouts to localStorage
function saveStarredLayouts() {
    localStorage.setItem('starredLayouts', JSON.stringify([...starredLayouts]));
}

// Setup weight controls
function setupWeightControls() {
    const weightInputs = ['sfb', 'sfs', 'lsb', 'scissors', 'rolls', 'alternation', 'redirect', 'pinky'];
    
    weightInputs.forEach(metric => {
        const slider = document.getElementById(`weight-${metric}`);
        const valueInput = document.getElementById(`weight-${metric}-value`);
        
        if (slider && valueInput) {
            // Set initial values from stored weights
            slider.value = scoreWeights[metric];
            valueInput.value = scoreWeights[metric];
            
            // Sync slider and number input
            slider.addEventListener('input', () => {
                valueInput.value = slider.value;
                scoreWeights[metric] = parseInt(slider.value);
                saveScoreWeights();
                updateActivePreset();
                updateUrlParams();
                recalculateAndRender();
            });
            
            valueInput.addEventListener('input', () => {
                let val = parseInt(valueInput.value) || 0;
                val = Math.max(0, Math.min(100, val));
                valueInput.value = val;
                slider.value = val;
                scoreWeights[metric] = val;
                saveScoreWeights();
                updateActivePreset();
                updateUrlParams();
                recalculateAndRender();
            });
        }
    });
    
    // Setup preset buttons (including the Custom button)
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            const customPanel = document.getElementById('customWeightsPanel');
            
            if (preset === 'custom') {
                // Custom button: open the customize panel
                if (customPanel) {
                    customPanel.open = true;
                }
                // Mark Custom as active
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                saveSelectedPreset('custom');
            } else if (weightPresets[preset]) {
                // Regular preset: apply the preset weights
                scoreWeights = { ...weightPresets[preset] };
                saveScoreWeights();
                updateWeightUI();
                updateActivePreset();
                updateUrlParams();
                recalculateAndRender();
            }
        });
    });
}

// Update weight UI from scoreWeights
function updateWeightUI() {
    const weightInputs = ['sfb', 'sfs', 'lsb', 'scissors', 'rolls', 'alternation', 'redirect', 'pinky'];
    weightInputs.forEach(metric => {
        const slider = document.getElementById(`weight-${metric}`);
        const valueInput = document.getElementById(`weight-${metric}-value`);
        if (slider && valueInput) {
            slider.value = scoreWeights[metric];
            valueInput.value = scoreWeights[metric];
        }
    });
}

// Check which preset is active (if any) and update UI
function updateActivePreset() {
    let activePreset = null;
    document.querySelectorAll('.preset-btn').forEach(btn => {
        const preset = btn.dataset.preset;
        
        // Skip the custom button in matching logic
        if (preset === 'custom') {
            return;
        }
        
        const presetWeights = weightPresets[preset];
        const isActive = Object.keys(presetWeights).every(key => 
            scoreWeights[key] === presetWeights[key]
        );
        btn.classList.toggle('active', isActive);
        if (isActive) {
            activePreset = preset;
        }
    });
    
    // Handle the Custom button
    const customBtn = document.querySelector('.preset-btn[data-preset="custom"]');
    if (customBtn) {
        if (activePreset) {
            // A preset is active, so Custom is not active
            customBtn.classList.remove('active');
        } else {
            // No preset matches, so Custom should be active
            customBtn.classList.add('active');
            activePreset = 'custom';
        }
    }
    
    // Save the active preset (or null if custom weights)
    saveSelectedPreset(activePreset);
}

// Recalculate scores and re-render
function recalculateAndRender() {
    recalculateAllScores();
    const filtered = getFilteredData();
    const sorted = sortData(filtered);
    renderTable(sorted);
}

// Toggle pin status for a layout
function togglePin(layoutName) {
    if (pinnedLayouts.has(layoutName)) {
        pinnedLayouts.delete(layoutName);
    } else {
        pinnedLayouts.add(layoutName);
    }
    savePinnedLayouts();
    updateUrlParams();
    
    // Re-render with current filters and sort
    const filtered = getFilteredData();
    const sorted = sortData(filtered);
    renderTable(sorted);
}

// Toggle star status for a layout
function toggleStar(layoutName) {
    if (starredLayouts.has(layoutName)) {
        starredLayouts.delete(layoutName);
    } else {
        starredLayouts.add(layoutName);
    }
    saveStarredLayouts();
    updateUrlParams();
    
    // Re-render with current filters and sort
    const filtered = getFilteredData();
    const sorted = sortData(filtered);
    renderTable(sorted);
}

// Dark mode toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference or system preference
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Apply dark mode if saved as dark, or if no saved preference and system prefers dark
if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    body.classList.add('dark-mode');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Populate language dropdown
function populateLanguageDropdown(languages) {
    // Sort languages with English first
    const sortedLanguages = [...languages].sort((a, b) => {
        if (a === 'english') return -1;
        if (b === 'english') return 1;
        return a.localeCompare(b);
    });
    
    const select = document.getElementById('languageSelect');
    select.innerHTML = sortedLanguages.map(lang => {
        const displayName = lang.charAt(0).toUpperCase() + lang.slice(1);
        return `<option value="${lang}">${displayName}</option>`;
    }).join('');
    
    // Set saved language or default to english
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'english';
    if (languages.includes(savedLanguage)) {
        window.currentLanguage = savedLanguage;
        select.value = savedLanguage;
    }
    
    // Update try-layout link with initial language
    updateTryLayoutLink();
}

// Language filter functionality
function setupLanguageFilter() {
    document.getElementById('languageSelect').addEventListener('change', (e) => {
        window.currentLanguage = e.target.value;
        localStorage.setItem('selectedLanguage', window.currentLanguage);
        
        // Update try-layout link with current language
        updateTryLayoutLink();
        
        // Refresh any open accordions to update the stats URL
        if (window.keyboardAccordion) {
            window.keyboardAccordion.refreshAllOpen();
        }
        
        // Recalculate scores for new language and re-render
        recalculateAllScores();
        const filtered = getFilteredData();
        const sorted = sortData(filtered);
        renderTable(sorted);
        
        // Update URL params
        updateUrlParams();
    });
}

// Update the try-layout link to include current language
function updateTryLayoutLink() {
    const link = document.getElementById('tryLayoutLink');
    if (link) {
        const params = window.currentLanguage !== 'english' ? `?wordset=${window.currentLanguage}` : '';
        link.href = `try-layout.html${params}`;
    }
}

// Update cyanophage URL to use current language
function updateCyanophageUrl(url) {
    if (!url) return url;
    try {
        const urlObj = new URL(url);
        urlObj.searchParams.set('lan', window.currentLanguage);
        const result = urlObj.toString();
        return result;
    } catch (e) {
        console.error('Error updating cyanophage URL:', e);
        // If URL parsing fails, try simple string replacement
        if (url.includes('&lan=')) {
            return url.replace(/&lan=[^&]+/, `&lan=${window.currentLanguage}`);
        } else if (url.includes('?')) {
            return url + `&lan=${window.currentLanguage}`;
        }
        return url;
    }
}

// Get metrics for current language
function getMetrics(layout) {
    return layout.metrics?.[window.currentLanguage] || {};
}

// Filter and render data
function getFilteredData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = layoutsData.filter(layout => {
        // Apply search filter
        const matchesSearch = layout.name.toLowerCase().includes(searchTerm);
        
        // Apply thumb filter
        const matchesThumb = currentThumbFilter === 'all' || 
                             layout.thumb.toString() === currentThumbFilter;
        
        return matchesSearch && matchesThumb;
    });
    
    return filtered;
}

// Update search placeholder with count
function updateSearchPlaceholder() {
    const filtered = layoutsData.filter(layout => {
        // Apply thumb filter only (not search)
        const matchesThumb = currentThumbFilter === 'all' || 
                             layout.thumb.toString() === currentThumbFilter;
        return matchesThumb;
    });
    
    const count = filtered.length;
    document.getElementById('searchInput').placeholder = 
        `🔍 Search ${count} layout${count !== 1 ? 's' : ''}...`;
}

// Fetch and display data
async function loadData() {
    try {
        // First, check for URL parameters (they take priority)
        const urlState = loadFromUrlParams();
        
        // Load pinned and starred layouts from localStorage (only if not in URL)
        if (!urlState.pinned) {
            loadPinnedLayouts();
        } else {
            // Save URL state to localStorage for persistence
            savePinnedLayouts();
        }
        if (!urlState.highlight) {
            loadStarredLayouts();
        } else {
            // Save URL state to localStorage for persistence
            saveStarredLayouts();
        }
        if (!urlState.preset && !urlState.weights) {
            loadScoreWeights();
        } else {
            // Save URL state to localStorage for persistence
            saveScoreWeights();
        }
        
        const response = await fetch('data.json');
        const data = await response.json();
        layoutsData = data.layouts;
        allLanguages = data.languages || ['english'];
        
        // Populate language dropdown
        populateLanguageDropdown(allLanguages);
        setupLanguageFilter();
        
        // If URL had a language param, override the default/saved language
        if (urlState.lang && allLanguages.includes(urlState.lang)) {
            window.currentLanguage = urlState.lang;
            document.getElementById('languageSelect').value = urlState.lang;
        }
        
        // Setup weight controls
        setupWeightControls();
        updateWeightUI();
        updateActivePreset();
        
        // Update last updated time in footer with relative time
        const date = new Date(data.scraped_at);
        const timeElement = document.getElementById('lastUpdatedTime');
        timeElement.setAttribute('datetime', date.toISOString());
        timeElement.textContent = timeago.format(date);
        
        // Update every minute
        setInterval(() => {
            timeElement.textContent = timeago.format(date);
        }, 60000);

        // Update search placeholder
        updateSearchPlaceholder();
        
        // Set default sort to Score descending (higher is better)
        currentSort = { column: 'score', direction: 'desc' };
        
        // Calculate scores for all layouts
        recalculateAllScores();
        
        // Initial render with default sort (apply search filter from URL if present)
        const filtered = getFilteredData();
        const sorted = sortData(filtered);
        renderTable(sorted);
        
        // Update UI to show sort indicator
        updateSortIndicators();
        
        // Initialize URL params (in case we loaded from localStorage)
        updateUrlParams();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('tableBody').innerHTML = 
            '<tr><td colspan="11" class="no-results">Error loading data. Please try again later.</td></tr>';
    }
}

// Render table with data
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="no-results">No layouts found matching your search.</td></tr>';
        return;
    }

    // Use cached scores (calculated from full dataset)
    const scores = cachedScores;

    // Find the index of the last pinned layout to add visual separator
    let lastPinnedIndex = -1;
    data.forEach((layout, index) => {
        if (pinnedLayouts.has(layout.name)) {
            lastPinnedIndex = index;
        }
    });

    tbody.innerHTML = data.map((layout, index) => {
        const metrics = getMetrics(layout);
        const yearSuffix = layout.year ? ` (${layout.year})` : '';
        const thumbIcon = layout.thumb ? '<span class="thumb-icon" title="Uses thumb keys"><i class="fa-regular fa-thumbs-up"></i><i class="fa-regular fa-thumbs-up" style="transform: scaleX(-1);"></i></span>' : '';
        
        const isPinned = pinnedLayouts.has(layout.name);
        const pinClass = isPinned ? 'pinned' : '';
        const pinIcon = isPinned ? '<i class="fa-solid fa-thumbtack" style="font-size: 0.75em;"></i>' : '<i class="fa-solid fa-map-pin" style="opacity: 0.8; font-size: 0.75em;"></i>';
        
        const isStarred = starredLayouts.has(layout.name);
        const starClass = isStarred ? 'starred' : '';
        const starIcon = isStarred ? '★' : '☆';
        
        const isLastPinned = index === lastPinnedIndex && lastPinnedIndex !== -1;
        const rowClasses = [isStarred ? 'starred' : '', isLastPinned ? 'last-pinned' : ''].filter(Boolean).join(' ');
        const rowClass = rowClasses;
        
        // Get the calculated score
        const score = scores[layout.name];
        const scoreDisplay = score !== undefined ? `${score.toFixed(1)}%` : 'N/A';
        
        // Calculate rolls in (inward rolls only - more comfortable than outward rolls)
        const calculateRolls = (metrics) => {
            const bigramRollIn = parseFloat((metrics.bigram_roll_in || '0').replace('%', '')) || 0;
            const rollIn = parseFloat((metrics.roll_in || '0').replace('%', '')) || 0;
            const sum = bigramRollIn + rollIn;
            return sum > 0 ? `${sum.toFixed(2)}%` : 'N/A';
        };
        
        // Calculate alternation (alt + alt_sfs - hand alternation LRL or RLR)
        const calculateAlternation = (metrics) => {
            const alt = parseFloat((metrics.alt || '0').replace('%', '')) || 0;
            const altSfs = parseFloat((metrics.alt_sfs || '0').replace('%', '')) || 0;
            const sum = alt + altSfs;
            return sum > 0 ? `${sum.toFixed(2)}%` : 'N/A';
        };
        
        return `
            <tr class="${rowClass}">
                <td class="pin-star-column">
                    <div class="pin-star-icons">
                        <span class="pin-icon ${pinClass}" data-layout="${layout.name}" title="${isPinned ? 'Unpin layout' : 'Pin layout to top'}">${pinIcon}</span>
                        <span class="star-icon ${starClass}" data-layout="${layout.name}" title="${isStarred ? 'Unstar layout' : 'Star layout for highlighting'}">${starIcon}</span>
                    </div>
                </td>
                <td class="layout-name">
                    ${layout.website 
                        ? `<a href="${layout.website}" target="_blank" rel="noopener noreferrer">${layout.name}${yearSuffix}</a>`
                        : `${layout.name}${yearSuffix}`
                    }
                    ${thumbIcon}
                </td>
                <td class="stat-value score-value">${scoreDisplay}</td>
                <td class="stat-value">${metrics.same_finger_bigrams || 'N/A'}</td>
                <td class="stat-value">${metrics.skip_bigrams_1u || 'N/A'}</td>
                <td class="stat-value">${metrics.lat_stretch_bigrams || 'N/A'}</td>
                <td class="stat-value">${metrics.scissors || 'N/A'}</td>
                <td class="stat-value">${calculateRolls(metrics)}</td>
                <td class="stat-value">${calculateAlternation(metrics)}</td>
                <td class="stat-value">${metrics.redirect || 'N/A'}</td>
                <td class="stat-value">${metrics.pinky_off || 'N/A'}</td>
            </tr>
        `;
    }).join('');
    
    // Add click handlers for pin icons
    document.querySelectorAll('.pin-icon').forEach(pin => {
        pin.addEventListener('click', (e) => {
            e.stopPropagation();
            const layoutName = pin.dataset.layout;
            togglePin(layoutName);
        });
    });
    
    // Add click handlers for star icons
    document.querySelectorAll('.star-icon').forEach(star => {
        star.addEventListener('click', (e) => {
            e.stopPropagation();
            const layoutName = star.dataset.layout;
            toggleStar(layoutName);
        });
    });
    
    // Add click handlers for table rows to toggle keyboard accordion
    document.querySelectorAll('#layoutTable tbody tr').forEach((row, index) => {
        row.addEventListener('click', (e) => {
            // Don't toggle accordion if clicking on links or icons
            if (e.target.closest('a') || e.target.closest('.pin-icon') || e.target.closest('.star-icon')) {
                return;
            }
            
            // Get the layout data for this row
            const layout = data[index];
            if (layout && window.keyboardAccordion) {
                window.keyboardAccordion.toggle(layout.name, layout.url, row, layout.thumb, layout.website);
            }
        });
    });
}

// Sort data based on current sort settings
function sortData(data) {
    // Separate pinned and unpinned layouts
    const pinned = data.filter(layout => pinnedLayouts.has(layout.name));
    const unpinned = data.filter(layout => !pinnedLayouts.has(layout.name));
    
    // Use cached scores (calculated from full dataset)
    const scores = cachedScores;
    
    // Sort function for a group
    const sortGroup = (group) => {
        if (!currentSort.column) {
            return group;
        }
        
        return [...group].sort((a, b) => {
            let aVal, bVal;
            
            // Get values from metrics for current language
            if (currentSort.column === 'name') {
                aVal = a[currentSort.column];
                bVal = b[currentSort.column];
            } else if (currentSort.column === 'starred') {
                // Sort by starred status (starred first when descending)
                aVal = starredLayouts.has(a.name) ? 1 : 0;
                bVal = starredLayouts.has(b.name) ? 1 : 0;
            } else if (currentSort.column === 'score') {
                // Sort by calculated score
                aVal = scores[a.name] || 0;
                bVal = scores[b.name] || 0;
            } else if (currentSort.column === 'rolls') {
                // Calculate rolls in for sorting (inward rolls only)
                const aMetrics = getMetrics(a);
                const bMetrics = getMetrics(b);
                
                const aRolls = (parseFloat((aMetrics.bigram_roll_in || '0').replace('%', '')) || 0) +
                               (parseFloat((aMetrics.roll_in || '0').replace('%', '')) || 0);
                
                const bRolls = (parseFloat((bMetrics.bigram_roll_in || '0').replace('%', '')) || 0) +
                               (parseFloat((bMetrics.roll_in || '0').replace('%', '')) || 0);
                
                aVal = aRolls;
                bVal = bRolls;
            } else if (currentSort.column === 'alternation') {
                // Calculate alternation for sorting (alt + alt_sfs)
                const aMetrics = getMetrics(a);
                const bMetrics = getMetrics(b);
                
                const aAlt = (parseFloat((aMetrics.alt || '0').replace('%', '')) || 0) +
                             (parseFloat((aMetrics.alt_sfs || '0').replace('%', '')) || 0);
                
                const bAlt = (parseFloat((bMetrics.alt || '0').replace('%', '')) || 0) +
                             (parseFloat((bMetrics.alt_sfs || '0').replace('%', '')) || 0);
                
                aVal = aAlt;
                bVal = bAlt;
            } else {
                const aMetrics = getMetrics(a);
                const bMetrics = getMetrics(b);
                aVal = aMetrics[currentSort.column];
                bVal = bMetrics[currentSort.column];
            }

            // Convert to numbers if numeric column
            if (currentSort.column === 'total_word_effort' || currentSort.column === 'effort') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            } else if (currentSort.column === 'same_finger_bigrams' || currentSort.column === 'skip_bigrams_1u' || 
                       currentSort.column === 'lat_stretch_bigrams' || currentSort.column === 'scissors' || 
                       currentSort.column === 'pinky_off' || currentSort.column === 'redirect') {
                // Remove % sign and convert to number
                aVal = parseFloat((aVal || '0').replace('%', '')) || 0;
                bVal = parseFloat((bVal || '0').replace('%', '')) || 0;
            } else if (currentSort.column !== 'rolls' && currentSort.column !== 'starred' && currentSort.column !== 'score') {
                // String comparison for name column
                aVal = (aVal || '').toString().toLowerCase();
                bVal = (bVal || '').toString().toLowerCase();
            }

            if (currentSort.direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    };
    
    // Sort both groups separately and concatenate
    return [...sortGroup(pinned), ...sortGroup(unpinned)];
}

// Update sort indicators in table headers
function updateSortIndicators() {
    document.querySelectorAll('th').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });
    
    if (currentSort.column) {
        const th = document.querySelector(`th[data-column="${currentSort.column}"]`);
        if (th) {
            th.classList.add(`sort-${currentSort.direction}`);
        }
    }
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    const filtered = getFilteredData();
    const sorted = sortData(filtered);
    renderTable(sorted);
    updateUrlParams();
});

// Thumb filter functionality
document.querySelectorAll('input[name="thumbFilter"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentThumbFilter = e.target.value;
        updateSearchPlaceholder();
        const filtered = getFilteredData();
        const sorted = sortData(filtered);
        renderTable(sorted);
    });
});

// Sort functionality
document.querySelectorAll('th[data-column]').forEach(th => {
    th.addEventListener('click', () => {
        const column = th.dataset.column;
        
        // Toggle sort direction
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc';
        }

        // Update UI
        updateSortIndicators();

        // Get filtered data first, then sort
        const filtered = getFilteredData();
        const sorted = sortData(filtered);
        renderTable(sorted);
    });
});

// Load data on page load
loadData();

// Add click handler for the "customize weights" link
document.querySelector('.score-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    const wrapper = document.getElementById('customWeightsPanel');
    const customBtn = document.querySelector('.preset-btn[data-preset="custom"]');
    if (wrapper) {
        wrapper.open = true;
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Also activate the Custom button
        if (customBtn) {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            customBtn.classList.add('active');
        }
    }
});

// Share button functionality
const shareBtn = document.getElementById('shareBtn');
const shareBtnOriginalHtml = '<i class="fa-solid fa-share-nodes"></i><span>Share</span>';

shareBtn?.addEventListener('click', async () => {
    try {
        // Make sure URL is up to date
        updateUrlParams();
        
        // Copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        
        // Show success state
        shareBtn.innerHTML = '<i class="fa-solid fa-check"></i><span>Copied!</span>';
        shareBtn.classList.add('copied');
        
        // Reset after 2 seconds
        setTimeout(() => {
            shareBtn.innerHTML = shareBtnOriginalHtml;
            shareBtn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy URL:', err);
        // Fallback: select the URL in a prompt
        prompt('Copy this link:', window.location.href);
    }
});
