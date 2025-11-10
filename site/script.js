let layoutsData = [];
let allLanguages = [];
let currentSort = { column: null, direction: 'asc' };
let currentThumbFilter = 'all';
let currentLanguage = 'english';
let pinnedLayouts = new Set();
let starredLayouts = new Set();

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

// Toggle pin status for a layout
function togglePin(layoutName) {
    if (pinnedLayouts.has(layoutName)) {
        pinnedLayouts.delete(layoutName);
    } else {
        pinnedLayouts.add(layoutName);
    }
    savePinnedLayouts();
    
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
    const languageFlags = {
        'dutch': '🇳🇱',
        'english': '🇬🇧',
        'french': '🇫🇷',
        'german': '🇩🇪',
        'spanish': '🇪🇸'
    };
    
    // Sort languages with English first
    const sortedLanguages = [...languages].sort((a, b) => {
        if (a === 'english') return -1;
        if (b === 'english') return 1;
        return a.localeCompare(b);
    });
    
    const select = document.getElementById('languageSelect');
    select.innerHTML = sortedLanguages.map(lang => {
        const flag = languageFlags[lang] || '🌐';
        const displayName = lang.charAt(0).toUpperCase() + lang.slice(1);
        return `<option value="${lang}">${flag} ${displayName}</option>`;
    }).join('');
    
    // Set saved language or default to english
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'english';
    if (languages.includes(savedLanguage)) {
        currentLanguage = savedLanguage;
        select.value = savedLanguage;
    }
}

// Language filter functionality
function setupLanguageFilter() {
    document.getElementById('languageSelect').addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        localStorage.setItem('selectedLanguage', currentLanguage);
        
        // Re-render with new language and apply current sort
        const filtered = getFilteredData();
        const sorted = sortData(filtered);
        renderTable(sorted);
    });
}

// Get metrics for current language
function getMetrics(layout) {
    return layout.metrics?.[currentLanguage] || {};
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
        // Load pinned and starred layouts from localStorage
        loadPinnedLayouts();
        loadStarredLayouts();
        
        const response = await fetch('data.json');
        const data = await response.json();
        layoutsData = data.layouts;
        allLanguages = data.languages || ['english'];
        
        // Populate language dropdown
        populateLanguageDropdown(allLanguages);
        setupLanguageFilter();
        
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
        
        // Set default sort to effort ascending
        currentSort = { column: 'effort', direction: 'asc' };
        
        // Initial render with default sort
        const sorted = sortData(layoutsData);
        renderTable(sorted);
        
        // Update UI to show sort indicator
        updateSortIndicators();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('tableBody').innerHTML = 
            '<tr><td colspan="10" class="no-results">Error loading data. Please try again later.</td></tr>';
    }
}

// Render table with data
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="no-results">No layouts found matching your search.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(layout => {
        const metrics = getMetrics(layout);
        const yearSuffix = layout.year ? ` (${layout.year})` : '';
        const thumbIcon = layout.thumb ? '<span class="thumb-icon" title="Uses thumb keys"><i class="fa-regular fa-thumbs-up"></i></span>' : '';
        
        const isPinned = pinnedLayouts.has(layout.name);
        const pinClass = isPinned ? 'pinned' : '';
        const pinIcon = isPinned ? '<i class="fa-solid fa-thumbtack" style="font-size: 0.75em;"></i>' : '<i class="fa-solid fa-map-pin" style="opacity: 0.8; font-size: 0.75em;"></i>';
        
        const isStarred = starredLayouts.has(layout.name);
        const starClass = isStarred ? 'starred' : '';
        const starIcon = isStarred ? '★' : '☆';
        
        const rowClass = isStarred ? 'starred' : '';
        
        // Calculate rolls sum (bigram roll in + bigram roll out + roll in + roll out)
        const calculateRolls = (metrics) => {
            const bigramRollIn = parseFloat((metrics.bigram_roll_in || '0').replace('%', '')) || 0;
            const bigramRollOut = parseFloat((metrics.bigram_roll_out || '0').replace('%', '')) || 0;
            const rollIn = parseFloat((metrics.roll_in || '0').replace('%', '')) || 0;
            const rollOut = parseFloat((metrics.roll_out || '0').replace('%', '')) || 0;
            const sum = bigramRollIn + bigramRollOut + rollIn + rollOut;
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
                    <a href="${layout.url}" target="_blank" rel="noopener noreferrer" class="external-link-icon" title="Analyze in playground"><i class="fa-solid fa-square-poll-vertical"></i></a>
                    ${thumbIcon}
                </td>
                <td class="stat-value">${metrics.total_word_effort || 'N/A'}</td>
                <td class="stat-value">${metrics.effort || 'N/A'}</td>
                <td class="stat-value">${metrics.same_finger_bigrams || 'N/A'}</td>
                <td class="stat-value">${metrics.skip_bigrams || 'N/A'}</td>
                <td class="stat-value">${metrics.lat_stretch_bigrams || 'N/A'}</td>
                <td class="stat-value">${metrics.scissors || 'N/A'}</td>
                <td class="stat-value">${calculateRolls(metrics)}</td>
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
                window.keyboardAccordion.toggle(layout.name, layout.url, row);
            }
        });
    });
}

// Sort data based on current sort settings
function sortData(data) {
    // Separate pinned and unpinned layouts
    const pinned = data.filter(layout => pinnedLayouts.has(layout.name));
    const unpinned = data.filter(layout => !pinnedLayouts.has(layout.name));
    
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
            } else if (currentSort.column === 'rolls') {
                // Calculate rolls sum for sorting
                const aMetrics = getMetrics(a);
                const bMetrics = getMetrics(b);
                
                const aRolls = (parseFloat((aMetrics.bigram_roll_in || '0').replace('%', '')) || 0) +
                               (parseFloat((aMetrics.bigram_roll_out || '0').replace('%', '')) || 0) +
                               (parseFloat((aMetrics.roll_in || '0').replace('%', '')) || 0) +
                               (parseFloat((aMetrics.roll_out || '0').replace('%', '')) || 0);
                
                const bRolls = (parseFloat((bMetrics.bigram_roll_in || '0').replace('%', '')) || 0) +
                               (parseFloat((bMetrics.bigram_roll_out || '0').replace('%', '')) || 0) +
                               (parseFloat((bMetrics.roll_in || '0').replace('%', '')) || 0) +
                               (parseFloat((bMetrics.roll_out || '0').replace('%', '')) || 0);
                
                aVal = aRolls;
                bVal = bRolls;
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
            } else if (currentSort.column === 'same_finger_bigrams' || currentSort.column === 'skip_bigrams' || 
                       currentSort.column === 'lat_stretch_bigrams' || currentSort.column === 'scissors' || 
                       currentSort.column === 'pinky_off' || currentSort.column === 'redirect') {
                // Remove % sign and convert to number
                aVal = parseFloat((aVal || '0').replace('%', '')) || 0;
                bVal = parseFloat((bVal || '0').replace('%', '')) || 0;
            } else if (currentSort.column !== 'rolls' && currentSort.column !== 'starred') {
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
