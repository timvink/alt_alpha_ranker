/**
 * Try Layout - Interactive typing experience for testing keyboard layouts
 * 
 * This module allows users to experience what typing on a different keyboard layout
 * feels like, by mapping keys from their known layout to the target layout.
 * 
 * How the key mapping works:
 * - The user knows how to type on layout A (e.g., QWERTY)
 * - The user wants to experience layout B (e.g., Gallium)
 * - For each character in the sentence, we find where it is on layout B
 * - Then we find what key the user needs to press on layout A to hit that same physical position
 * - This simulates the finger movements of layout B using the user's layout A keyboard
 */

import { cyanophageToKeyboard } from './cyanophage.js';
import { renderKeyboardWithMapping } from './keyboard_visualization.js';

// State
let layoutsData = [];
let allLanguages = [];
let wordSets = [];         // Available word sets from languages folder
let currentWordSet = null; // Currently selected word set data
let knownLayout = null;    // KeyboardLayout object for the layout user knows
let targetLayout = null;   // KeyboardLayout object for the layout user wants to try

// Typing state
let currentText = '';
let translatedText = '';  // The text translated to what keys to press on known layout
let currentPosition = 0;
let typedChars = [];      // Array of {char, isCorrect} for each typed position
let isComplete = false;
let startTime = null;  // Track when typing started for WPM calculation

// Typing test mode settings
let testMode = 'words';  // 'time' or 'words'
let wordCount = 25;      // Number of words for 'words' mode
let timeLimit = 60;      // Seconds for 'time' mode
let timerInterval = null;  // Timer interval for countdown
let timeRemaining = 0;     // Remaining time in seconds
let includePunctuation = false;  // Whether to add punctuation
let includeNumbers = false;      // Whether to add numbers
let useCustomText = false;       // Whether to use custom text
let customText = '';             // User's custom text

/**
 * Get URL parameters
 */
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        known: params.get('known'),
        target: params.get('target'),
        wordset: params.get('wordset')
    };
}

/**
 * Update URL parameters without reloading the page
 */
function updateUrlParams() {
    const params = new URLSearchParams();
    
    const knownLayout = document.getElementById('knownLayout')?.value;
    const targetLayout = document.getElementById('targetLayout')?.value;
    const wordsetName = currentWordSet?.language;
    
    if (knownLayout && knownLayout !== 'qwerty') {
        params.set('known', knownLayout);
    }
    if (targetLayout && targetLayout !== 'gallium') {
        params.set('target', targetLayout);
    }
    if (wordsetName && wordsetName !== 'english') {
        params.set('wordset', wordsetName);
    }
    
    const newUrl = params.toString() 
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
    
    window.history.replaceState({}, '', newUrl);
}



/**
 * Initialize the try layout page
 */
async function initTryLayout() {
    try {
        // Get URL parameters
        const urlParams = getUrlParams();
        
        // Load layouts data
        const dataResponse = await fetch('data.json');
        const data = await dataResponse.json();
        layoutsData = data.layouts;
        allLanguages = data.languages || ['english'];
        
        // Load available word sets
        await loadWordSets();
        
        // Populate layout dropdowns
        populateLayoutDropdowns();
        
        // Apply URL parameters to dropdowns
        if (urlParams.known) {
            const knownSelect = document.getElementById('knownLayout');
            if ([...knownSelect.options].some(o => o.value === urlParams.known)) {
                knownSelect.value = urlParams.known;
            }
        }
        if (urlParams.target) {
            const targetSelect = document.getElementById('targetLayout');
            if ([...targetSelect.options].some(o => o.value === urlParams.target)) {
                targetSelect.value = urlParams.target;
            }
        }
        
        // Set up event listeners
        setupEventListeners();
        setupWordSetSelector();
        setupTypingSettings();
        
        // Load initial layouts
        await loadLayouts();
        
        // Find and select the word set from URL or default to english
        let wordSetToSelect = wordSets[0]; // default to first (english)
        if (urlParams.wordset) {
            const matchingWordSet = wordSets.find(ws => ws.language === urlParams.wordset);
            if (matchingWordSet) {
                wordSetToSelect = matchingWordSet;
            }
        }
        
        if (wordSetToSelect) {
            await selectWordSet(wordSetToSelect);
        }
        
        // Focus the typing area immediately
        document.getElementById('hiddenInput').focus();
        
    } catch (error) {
        console.error('Error initializing try layout:', error);
    }
}

/**
 * Load available word sets metadata (does not fetch the actual word data)
 */
async function loadWordSets() {
    // Define word sets with metadata only - actual words are loaded lazily
    const languages = [
        'english',
        'dutch',
        'french',
        'german',
        'italian',
        'portuguese',
        'spanish'
    ];
    
    wordSets = languages.map(language => ({
        file: `${language}_1k.json`,
        name: `${language}_1k`,
        displayName: `${language} 1k`,
        language: language,
        words: null  // Words are loaded lazily when selected
    }));
    
    // Populate the word set dropdown
    populateWordSetDropdown();
}

/**
 * Populate the word set dropdown with available sets
 */
function populateWordSetDropdown() {
    const list = document.getElementById('wordSetList');
    list.innerHTML = '';
    
    wordSets.forEach((ws, index) => {
        const item = document.createElement('div');
        item.className = 'word-set-item';
        item.dataset.index = index;
        item.innerHTML = `
            <span class="word-set-item-name">${ws.displayName}</span>
            <span class="word-set-item-count">1k words</span>
        `;
        item.addEventListener('click', () => selectWordSet(ws));
        list.appendChild(item);
    });
}

/**
 * Select a word set and generate random words
 */
async function selectWordSet(ws) {
    // Lazily load words if not already loaded
    if (!ws.words) {
        try {
            const response = await fetch(`static/languages/${ws.file}`);
            if (response.ok) {
                const data = await response.json();
                ws.words = data.words || [];
            } else {
                console.warn(`Could not load word set: ${ws.file}`);
                ws.words = [];
            }
        } catch (e) {
            console.warn(`Could not load word set: ${ws.file}`, e);
            ws.words = [];
        }
    }
    
    currentWordSet = ws;
    
    // Update the selector display
    document.getElementById('wordSetName').textContent = ws.displayName;
    
    // Update selected state in dropdown
    document.querySelectorAll('.word-set-item').forEach((item, idx) => {
        item.classList.toggle('selected', wordSets[idx] === ws);
    });
    
    // Close dropdown
    closeWordSetDropdown();
    
    // Re-render keyboard with updated stats URL (based on new language)
    renderKeyboardWithLayoutInfo();
    
    // Generate new text from random words
    generateRandomText();
    
    // Update URL
    updateUrlParams();
    
    // Focus typing area
    document.getElementById('hiddenInput').focus();
}

/**
 * Generate random text from current word set
 */
function generateRandomText() {
    // If using custom text, use it directly
    if (useCustomText && customText.trim()) {
        currentText = customText.trim();
    } else {
        // For time mode, generate more words than needed (user might type fast)
        // 200 wpm * 2 minutes = 400 words max needed
        const numWords = testMode === 'time' ? 400 : wordCount;
        
        if (!currentWordSet || !currentWordSet.words.length) {
            currentText = 'the quick brown fox jumps over the lazy dog';
        } else {
            const words = currentWordSet.words;
            let selectedWords = [];
            
            // Randomly select words (with replacement)
            for (let i = 0; i < numWords; i++) {
                const randomIndex = Math.floor(Math.random() * words.length);
                selectedWords.push(words[randomIndex].toLowerCase());
            }
            
            // Apply punctuation if enabled
            if (includePunctuation) {
                selectedWords = applyPunctuation(selectedWords);
            }
            
            // Apply numbers if enabled
            if (includeNumbers) {
                selectedWords = applyNumbers(selectedWords);
            }
            
            currentText = selectedWords.join(' ');
        }
    }
    
    // Reset typing state without recursion
    currentPosition = 0;
    typedChars = [];
    isComplete = false;
    startTime = null;
    
    document.getElementById('completeMessage')?.classList.remove('show');
    
    translateText();
    renderTypingLine();
    updateStats();
    
    // Focus the input
    document.getElementById('hiddenInput')?.focus();
}

/**
 * Apply punctuation to words array
 * Adds periods, commas, semicolons, question marks, quoted phrases, parentheses, and hyphens
 */
function applyPunctuation(words) {
    const result = [];
    let wordsUntilSentenceEnd = randomInt(3, 10);
    let wordsUntilComma = randomInt(4, 8);
    let wordsUntilQuote = randomInt(8, 20);
    let wordsUntilParens = randomInt(15, 30);
    let wordsUntilHyphen = randomInt(10, 20);
    let inQuote = false;
    let quoteWordsRemaining = 0;
    let inParens = false;
    let parensWordsRemaining = 0;
    let isStartOfSentence = true;
    
    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        
        // Capitalize first letter if start of sentence
        if (isStartOfSentence) {
            word = word.charAt(0).toUpperCase() + word.slice(1);
            isStartOfSentence = false;
        }
        
        // Handle quote start (not inside parens)
        if (!inQuote && !inParens && wordsUntilQuote <= 0 && i < words.length - 2) {
            word = '"' + word;
            inQuote = true;
            quoteWordsRemaining = randomInt(1, 5);
            wordsUntilQuote = randomInt(12, 25);
        }
        
        // Handle quote end
        if (inQuote) {
            quoteWordsRemaining--;
            if (quoteWordsRemaining <= 0) {
                word = word + '"';
                inQuote = false;
            }
        }
        
        // Handle parentheses start (not inside quote)
        if (!inParens && !inQuote && wordsUntilParens <= 0 && i < words.length - 2) {
            word = '(' + word;
            inParens = true;
            parensWordsRemaining = randomInt(1, 3);
            wordsUntilParens = randomInt(20, 40);
        }
        
        // Handle parentheses end
        if (inParens) {
            parensWordsRemaining--;
            if (parensWordsRemaining <= 0) {
                word = word + ')';
                inParens = false;
            }
        }
        
        // Decrement counters
        wordsUntilSentenceEnd--;
        wordsUntilComma--;
        wordsUntilQuote--;
        wordsUntilParens--;
        wordsUntilHyphen--;
        
        // Add hyphen occasionally (combine with next word)
        if (wordsUntilHyphen <= 0 && i < words.length - 1 && !inQuote && !inParens) {
            word = word + '-' + words[i + 1];
            i++; // Skip the next word since we combined it
            wordsUntilHyphen = randomInt(12, 25);
        }
        
        // Add sentence-ending punctuation
        if (wordsUntilSentenceEnd <= 0 && !inQuote && !inParens) {
            // Randomly choose sentence-ending punctuation
            const rand = Math.random();
            if (rand < 0.1) {
                word = word + '?';
            } else if (rand < 0.15) {
                word = word + ';';
            } else {
                word = word + '.';
            }
            wordsUntilSentenceEnd = randomInt(3, 10);
            wordsUntilComma = randomInt(4, 8); // Reset comma counter too
            isStartOfSentence = true;
        } else if (wordsUntilComma <= 0 && !inQuote && !inParens) {
            // Add comma
            word = word + ',';
            wordsUntilComma = randomInt(4, 8);
        }
        
        result.push(word);
    }
    
    // Close any unclosed quote or parens
    if (inQuote && result.length > 0) {
        result[result.length - 1] = result[result.length - 1] + '"';
    }
    if (inParens && result.length > 0) {
        result[result.length - 1] = result[result.length - 1] + ')';
    }
    
    return result;
}

/**
 * Apply numbers to words array
 * Inserts 1-4 digit random numbers every 2-10 words
 */
function applyNumbers(words) {
    const result = [];
    let wordsUntilNumber = randomInt(2, 10);
    
    for (let i = 0; i < words.length; i++) {
        result.push(words[i]);
        wordsUntilNumber--;
        
        if (wordsUntilNumber <= 0) {
            // Generate a random 1-4 digit number
            const digits = randomInt(1, 4);
            let num;
            if (digits === 1) {
                num = randomInt(0, 9);
            } else if (digits === 2) {
                num = randomInt(10, 99);
            } else if (digits === 3) {
                num = randomInt(100, 999);
            } else {
                num = randomInt(1000, 9999);
            }
            result.push(num.toString());
            wordsUntilNumber = randomInt(2, 10);
        }
    }
    
    return result;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Close the word set dropdown
 */
function closeWordSetDropdown() {
    document.getElementById('wordSetDropdown').classList.remove('show');
    document.getElementById('wordSetSelector').classList.remove('active');
}

/**
 * Check if word set dropdown is open
 */
function isWordSetDropdownOpen() {
    return document.getElementById('wordSetDropdown').classList.contains('show');
}

/**
 * Set up word set selector event listeners
 */
function setupWordSetSelector() {
    const selector = document.getElementById('wordSetSelector');
    const dropdown = document.getElementById('wordSetDropdown');
    const search = document.getElementById('wordSetSearch');
    
    // Toggle dropdown on selector click
    selector.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('show');
        dropdown.classList.toggle('show');
        selector.classList.toggle('active');
        
        if (!isOpen) {
            search.value = '';
            filterWordSets('');
            search.focus();
        }
    });
    
    // Filter word sets on search input
    search.addEventListener('input', (e) => {
        filterWordSets(e.target.value);
    });
    
    // Prevent dropdown from closing when clicking inside
    dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        closeWordSetDropdown();
    });
}

/**
 * Filter word sets based on search query
 */
function filterWordSets(query) {
    const items = document.querySelectorAll('.word-set-item');
    const lowerQuery = query.toLowerCase();
    
    items.forEach((item, index) => {
        const ws = wordSets[index];
        const matches = ws.displayName.toLowerCase().includes(lowerQuery) ||
                        ws.language.toLowerCase().includes(lowerQuery);
        item.style.display = matches ? 'flex' : 'none';
    });
}

/**
 * Populate the layout dropdowns with available layouts
 */
function populateLayoutDropdowns() {
    const knownSelect = document.getElementById('knownLayout');
    const targetSelect = document.getElementById('targetLayout');
    
    // Clear existing options
    knownSelect.innerHTML = '';
    targetSelect.innerHTML = '';
    
    // Add layout options
    layoutsData.forEach(layout => {
        const knownOption = document.createElement('option');
        knownOption.value = layout.name;
        knownOption.textContent = layout.name;
        if (layout.name === 'qwerty') knownOption.selected = true;
        knownSelect.appendChild(knownOption);
        
        const targetOption = document.createElement('option');
        targetOption.value = layout.name;
        targetOption.textContent = layout.name;
        if (layout.name === 'gallium') targetOption.selected = true;
        targetSelect.appendChild(targetOption);
    });
    
    // Set up the searchable dropdowns
    setupLayoutDropdown('known');
    setupLayoutDropdown('target');
}

/**
 * Set up a searchable layout dropdown
 */
function setupLayoutDropdown(type) {
    const wrapper = document.getElementById(`${type}LayoutWrapper`);
    const trigger = document.getElementById(`${type}LayoutTrigger`);
    const dropdown = document.getElementById(`${type}LayoutDropdown`);
    const search = document.getElementById(`${type}LayoutSearch`);
    const list = document.getElementById(`${type}LayoutList`);
    const select = document.getElementById(`${type}Layout`);
    const nameSpan = document.getElementById(`${type}LayoutName`);
    const scrollHint = document.getElementById(`${type}LayoutScrollHint`);
    
    // Suggested layouts for "known" dropdown (common layouts users already know)
    const suggestedLayouts = ['qwerty', 'dvorak', 'colemak', 'colemak-dh'];
    
    // Update the placeholder with layout count
    function updatePlaceholder(count) {
        search.placeholder = `Search ${count} layouts...`;
    }
    
    // Update scroll hint visibility based on whether list is scrollable
    function updateScrollHint() {
        if (scrollHint) {
            const isScrollable = list.scrollHeight > list.clientHeight;
            const isAtBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 5;
            scrollHint.style.display = isScrollable && !isAtBottom ? 'block' : 'none';
        }
    }
    
    // Create a layout item element
    function createLayoutItem(layout) {
        const item = document.createElement('div');
        item.className = 'layout-item';
        if (layout.name === select.value) {
            item.classList.add('selected');
        }
        item.innerHTML = `<span class="layout-item-name">${layout.name}</span>`;
        item.addEventListener('click', () => selectLayout(type, layout.name));
        return item;
    }
    
    // Populate the list
    function populateList(filter = '') {
        list.innerHTML = '';
        const filterLower = filter.toLowerCase();
        
        // For "known" layout type, show suggested layouts at the top when not filtering
        if (type === 'known' && !filter) {
            // Add suggested section label
            const suggestedLabel = document.createElement('div');
            suggestedLabel.className = 'layout-section-label';
            suggestedLabel.textContent = 'Suggested';
            list.appendChild(suggestedLabel);
            
            // Add suggested layouts
            suggestedLayouts.forEach(name => {
                const layout = layoutsData.find(l => l.name === name);
                if (layout) {
                    list.appendChild(createLayoutItem(layout));
                }
            });
            
            // Add divider
            const divider = document.createElement('div');
            divider.className = 'layout-section-divider';
            list.appendChild(divider);
            
            // Add "All layouts" label
            const allLabel = document.createElement('div');
            allLabel.className = 'layout-section-label';
            allLabel.textContent = 'All layouts';
            list.appendChild(allLabel);
            
            // Add remaining layouts (excluding suggested ones)
            layoutsData
                .filter(layout => !suggestedLayouts.includes(layout.name))
                .forEach(layout => {
                    list.appendChild(createLayoutItem(layout));
                });
        } else {
            // Standard filtering for target dropdown or when searching
            const filteredLayouts = layoutsData.filter(layout => 
                layout.name.toLowerCase().includes(filterLower)
            );
            
            filteredLayouts.forEach(layout => {
                list.appendChild(createLayoutItem(layout));
            });
        }
        
        // Update placeholder with total count (not filtered count)
        updatePlaceholder(layoutsData.length);
        
        // Update scroll hint after DOM updates
        requestAnimationFrame(() => updateScrollHint());
    }
    
    // Select a layout
    function selectLayout(type, name) {
        select.value = name;
        nameSpan.textContent = name;
        closeDropdown();
        
        // Trigger change event
        select.dispatchEvent(new Event('change'));
    }
    
    // Open dropdown
    function openDropdown() {
        wrapper.classList.add('open');
        dropdown.classList.add('show');
        search.value = '';
        populateList();
        list.scrollTop = 0;
        search.focus();
    }
    
    // Close dropdown
    function closeDropdown() {
        wrapper.classList.remove('open');
        dropdown.classList.remove('show');
    }
    
    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdown.classList.contains('show')) {
            closeDropdown();
        } else {
            // Close other dropdowns first
            document.querySelectorAll('.layout-dropdown.show').forEach(d => {
                d.classList.remove('show');
                d.closest('.layout-select-wrapper')?.classList.remove('open');
            });
            openDropdown();
        }
    });
    
    // Filter on search
    search.addEventListener('input', () => {
        populateList(search.value);
    });
    
    // Update scroll hint on scroll
    list.addEventListener('scroll', () => {
        updateScrollHint();
    });
    
    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            closeDropdown();
        }
    });
    
    // Handle keyboard navigation
    search.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDropdown();
            document.getElementById('hiddenInput').focus();
        } else if (e.key === 'Enter') {
            const firstItem = list.querySelector('.layout-item');
            if (firstItem) {
                firstItem.click();
            }
        }
    });
    
    // Initial population
    populateList();
}

/**
 * Set the current text to type and translate it
 */
function setCurrentText(text) {
    currentText = text;
    translateAndReset();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Layout changes
    document.getElementById('knownLayout').addEventListener('change', async () => {
        await loadLayouts();
        updateUrlParams();
    });
    
    document.getElementById('targetLayout').addEventListener('change', async () => {
        await loadLayouts();
        updateUrlParams();
    });
    
    // Typing input
    const hiddenInput = document.getElementById('hiddenInput');
    const typingArea = document.getElementById('typingArea');
    
    // Focus management
    typingArea.addEventListener('click', () => {
        hiddenInput.focus();
    });
    
    // Track if Tab was pressed for tab+enter restart combo
    let tabPressed = false;
    
    document.addEventListener('keydown', (e) => {
        // Always handle key highlighting for visual feedback (do this first)
        if (e.key.length === 1) {
            highlightKey(e.key);
        }
        
        // Don't capture keys when word set search, layout search, or custom text input is focused
        const wordSetSearch = document.getElementById('wordSetSearch');
        const knownLayoutSearch = document.getElementById('knownLayoutSearch');
        const targetLayoutSearch = document.getElementById('targetLayoutSearch');
        const customTextInput = document.getElementById('customTextInput');
        if (document.activeElement === wordSetSearch || 
            document.activeElement === knownLayoutSearch || 
            document.activeElement === targetLayoutSearch ||
            document.activeElement === customTextInput) {
            // Allow Escape to close dropdown
            if (e.key === 'Escape') {
                closeWordSetDropdown();
                document.querySelectorAll('.layout-dropdown.show').forEach(d => {
                    d.classList.remove('show');
                    d.closest('.layout-select-wrapper')?.classList.remove('open');
                });
                hiddenInput.focus();
            }
            return;
        }
        
        // Handle Escape key - exit focus mode without resetting
        if (e.key === 'Escape') {
            e.preventDefault();
            exitFocusMode();
            return;
        }
        
        // Handle Tab key - prepare for restart
        if (e.key === 'Tab') {
            e.preventDefault();
            tabPressed = true;
            // Visual feedback that tab was pressed
            document.getElementById('tabKey')?.classList.add('active');
            return;
        }
        
        // Handle Enter key - restart if Tab was pressed first, or if test is complete
        if (e.key === 'Enter') {
            if (tabPressed || isComplete) {
                e.preventDefault();
                tabPressed = false;
                document.getElementById('tabKey')?.classList.remove('active');
                resetTyping();
                return;
            }
        }
        
        // Any other key resets the tab state
        if (e.key !== 'Tab' && e.key !== 'Enter') {
            tabPressed = false;
            document.getElementById('tabKey')?.classList.remove('active');
        }
        
        // If not already focused and it's a printable key, focus the input
        // But not if word set dropdown is open or layout dropdown is open
        const layoutDropdownOpen = document.querySelector('.layout-dropdown.show');
        if (document.activeElement !== hiddenInput && e.key.length === 1 && !isWordSetDropdownOpen() && !layoutDropdownOpen) {
            hiddenInput.focus();
        }
    });
    
    // Handle keyup for unhighlighting
    document.addEventListener('keyup', (e) => {
        if (e.key.length === 1) {
            unhighlightKey(e.key);
        }
    });
    
    // Also listen for actual character input (handles home row mods where char is sent on release)
    // This uses beforeinput to catch the character being typed
    hiddenInput.addEventListener('beforeinput', (e) => {
        if (e.data && e.data.length === 1) {
            // Trigger highlight for the actual character being input
            highlightKey(e.data);
        }
    });
    
    hiddenInput.addEventListener('focus', () => {
        typingArea.classList.add('focused');
    });
    
    hiddenInput.addEventListener('blur', () => {
        typingArea.classList.remove('focused');
    });
    
    // Handle keyboard input directly
    hiddenInput.addEventListener('keydown', handleKeyInput);
    
    // Prevent the input from accumulating text and trigger highlight on input
    hiddenInput.addEventListener('input', (e) => {
        // Also highlight on input event as backup (some browsers may not support beforeinput)
        if (e.data && e.data.length === 1) {
            highlightKey(e.data);
        }
        hiddenInput.value = '';
    });
}

/**
 * Load layout data from URLs and create key mappings
 */
async function loadLayouts() {
    const knownLayoutName = document.getElementById('knownLayout').value;
    const targetLayoutName = document.getElementById('targetLayout').value;
    
    // Update display names in header
    document.getElementById('knownLayoutName').textContent = knownLayoutName;
    document.getElementById('targetLayoutName').textContent = targetLayoutName;
    
    // Find layout data
    const knownLayoutData = layoutsData.find(l => l.name === knownLayoutName);
    const targetLayoutData = layoutsData.find(l => l.name === targetLayoutName);
    
    if (!knownLayoutData || !targetLayoutData) {
        console.error('Could not find layout data');
        return;
    }
    
    // Store the target layout data for use in re-rendering
    window.currentTargetLayoutData = targetLayoutData;
    
    // Parse layouts from their cyanophage URLs
    // Use 'url' field from data.json
    knownLayout = cyanophageToKeyboard(knownLayoutData.url);
    targetLayout = cyanophageToKeyboard(targetLayoutData.url);
    
    // Render keyboard visualization with target layout and known layout mapping
    renderKeyboardWithLayoutInfo();
    
    // Translate the text and reset
    translateAndReset();
}

/**
 * Update cyanophage URL to use the current word set language
 */
function updateCyanophageUrl(url) {
    if (!url) return url;
    const language = currentWordSet?.language || 'english';
    try {
        const urlObj = new URL(url);
        urlObj.searchParams.set('lan', language);
        return urlObj.toString();
    } catch (e) {
        // If URL parsing fails, try simple string replacement
        if (url.includes('&lan=')) {
            return url.replace(/&lan=[^&]+/, `&lan=${language}`);
        } else if (url.includes('?')) {
            return url + `&lan=${language}`;
        }
        return url;
    }
}

/**
 * Render the keyboard with layout info panel
 */
function renderKeyboardWithLayoutInfo() {
    const keyboardSvg = document.getElementById('layoutKeyboardSvg');
    if (!keyboardSvg || !targetLayout || !knownLayout) return;
    
    const targetLayoutData = window.currentTargetLayoutData;
    if (!targetLayoutData) return;
    
    // Build layout info for the left panel
    const layoutInfo = {
        name: targetLayoutData.name,
        statsUrl: updateCyanophageUrl(targetLayoutData.url),
        website: targetLayoutData.website || null
    };
    
    renderKeyboardWithMapping(targetLayout, knownLayout, keyboardSvg, { layoutInfo });
}

/**
 * Translate the current text to what keys to press on the known layout
 * 
 * For each character in the original text:
 * 1. Find which physical key position that character is on in the TARGET layout
 * 2. Find what character is on that same physical position in the KNOWN layout
 * 3. That's the key the user needs to press
 * 
 * Example: If typing "the" in Gallium:
 * - 't' in Gallium is at position X
 * - Position X in QWERTY has key 'y'
 * - So user presses 'y' to type 't'
 */
function translateText() {
    if (!knownLayout || !targetLayout || !currentText) {
        translatedText = currentText;
        return;
    }
    
    const knownFlat = knownLayout.toFlatArray();
    const targetFlat = targetLayout.toFlatArray();
    const knownHasThumbs = knownLayout.hasThumbKeys();
    
    // Build a map: character in target layout -> physical position
    const targetCharToPosition = {};
    for (let i = 0; i < 40; i++) {
        const char = targetFlat[i].toLowerCase();
        if (char && char !== ' ') {
            targetCharToPosition[char] = i;
        }
    }
    
    // Build a map: physical position -> character in known layout
    const positionToKnownChar = {};
    for (let i = 0; i < 40; i++) {
        const char = knownFlat[i].toLowerCase();
        if (char && char !== ' ') {
            positionToKnownChar[i] = char;
        }
    }
    
    // Translate each character
    let result = '';
    for (const char of currentText) {
        const lowerChar = char.toLowerCase();
        
        // Find position of this character in target layout
        const position = targetCharToPosition[lowerChar];
        
        if (position !== undefined) {
            // Find what key is at that position in known layout
            const knownChar = positionToKnownChar[position];
            if (knownChar) {
                // Preserve case
                result += char === char.toUpperCase() ? knownChar.toUpperCase() : knownChar;
            } else if (position >= 36 && !knownHasThumbs) {
                // Target layout has a thumb key, but known layout doesn't have thumb keys
                // User should press space for this character
                result += ' ';
            } else {
                // Position exists but no key in known layout (shouldn't happen often)
                result += char;
            }
        } else {
            // Character not found in target layout (space, punctuation, etc.)
            // Keep it as-is
            result += char;
        }
    }
    
    translatedText = result;
}

/**
 * Translate the text and reset typing state
 */
function translateAndReset() {
    translateText();
    resetTyping();
}

// Track highlight timeouts to ensure minimum display duration
const highlightTimeouts = new Map();
const MIN_HIGHLIGHT_DURATION = 75 ; // milliseconds

/**
 * Highlight a key on the keyboard visualization
 * @param {string} char - The character to highlight (on the known layout)
 */
function highlightKey(char) {
    if (!knownLayout) return;
    
    const knownFlat = knownLayout.toFlatArray();
    const charLower = char.toLowerCase();
    const knownHasThumbs = knownLayout.hasThumbKeys();
    
    // Find the position of this character in the known layout (check all 40 positions)
    let position = -1;
    for (let i = 0; i < 40; i++) {
        if (knownFlat[i] && knownFlat[i].toLowerCase() === charLower) {
            position = i;
            break;
        }
    }
    
    // Handle space key
    if (char === ' ') {
        if (knownHasThumbs) {
            // If known layout has thumbs, highlight all thumb keys for space
            for (let i = 36; i < 40; i++) {
                applyHighlight(i, charLower);
            }
        }
        // If no thumbs, space is not on the keyboard visualization
        return;
    }
    
    if (position >= 0) {
        applyHighlight(position, charLower);
    }
}

/**
 * Apply highlight to a specific key position
 */
function applyHighlight(position, charKey) {
    const keyGroup = document.querySelector(`#key-group-${position}`);
    if (!keyGroup) return;
    
    // Clear any existing timeout for this key
    const timeoutKey = `${position}-${charKey}`;
    if (highlightTimeouts.has(timeoutKey)) {
        clearTimeout(highlightTimeouts.get(timeoutKey));
        highlightTimeouts.delete(timeoutKey);
    }
    
    // Add pressed class
    keyGroup.classList.add('pressed');
    
    // Track when this highlight was applied
    keyGroup.dataset.highlightTime = Date.now();
}

/**
 * Remove highlight from a key on the keyboard visualization
 * @param {string} char - The character to unhighlight (on the known layout)
 */
function unhighlightKey(char) {
    if (!knownLayout) return;
    
    const knownFlat = knownLayout.toFlatArray();
    const charLower = char.toLowerCase();
    const knownHasThumbs = knownLayout.hasThumbKeys();
    
    // Find the position of this character in the known layout (check all 40 positions)
    let position = -1;
    for (let i = 0; i < 40; i++) {
        if (knownFlat[i] && knownFlat[i].toLowerCase() === charLower) {
            position = i;
            break;
        }
    }
    
    // Handle space key
    if (char === ' ') {
        if (knownHasThumbs) {
            // If known layout has thumbs, unhighlight all thumb keys
            for (let i = 36; i < 40; i++) {
                scheduleUnhighlight(i, charLower);
            }
        }
        return;
    }
    
    if (position >= 0) {
        scheduleUnhighlight(position, charLower);
    }
}

/**
 * Schedule unhighlight with minimum duration
 */
function scheduleUnhighlight(position, charKey) {
    const keyGroup = document.querySelector(`#key-group-${position}`);
    if (!keyGroup) return;
    
    const highlightTime = parseInt(keyGroup.dataset.highlightTime || '0');
    const elapsed = Date.now() - highlightTime;
    const remaining = Math.max(0, MIN_HIGHLIGHT_DURATION - elapsed);
    
    const timeoutKey = `${position}-${charKey}`;
    
    // Clear any existing timeout
    if (highlightTimeouts.has(timeoutKey)) {
        clearTimeout(highlightTimeouts.get(timeoutKey));
    }
    
    // Schedule the unhighlight
    const timeout = setTimeout(() => {
        keyGroup.classList.remove('pressed');
        highlightTimeouts.delete(timeoutKey);
    }, remaining);
    
    highlightTimeouts.set(timeoutKey, timeout);
}

/**
 * Remove all key highlights
 */
function clearAllHighlights() {
    document.querySelectorAll('.key.pressed').forEach(el => el.classList.remove('pressed'));
}

/**
 * Handle keyboard input
 */
function handleKeyInput(e) {
    if (isComplete) return;
    
    // Handle backspace
    if (e.key === 'Backspace') {
        e.preventDefault();
        if (currentPosition > 0) {
            currentPosition--;
            typedChars.pop();  // Remove the last typed character
            renderTypingLine();
            updateStats();
        }
        return;
    }
    
    // Ignore modifier keys and special keys
    if (e.key.length !== 1) return;
    
    e.preventDefault();
    
    // Start timer on first keystroke and enter focus mode
    if (startTime === null) {
        startTime = Date.now();
        enterFocusMode();
        if (testMode === 'time') {
            startCountdown();
        }
    }
    
    const pressedKey = e.key;
    const expectedChar = translatedText[currentPosition];
    
    if (!expectedChar) return;
    
    // Check if the pressed key matches (case-insensitive for letters)
    const isCorrect = pressedKey.toLowerCase() === expectedChar.toLowerCase();
    
    // Store what was typed and whether it was correct
    typedChars.push({ char: pressedKey, isCorrect });
    currentPosition++;
    
    if (currentPosition >= translatedText.length) {
        isComplete = true;
        showComplete();
    }
    
    renderTypingLine();
    updateStats();
}

/**
 * Render the typing line with current state
 * Shows the TRANSLATED text (what keys to press on known layout)
 * Also renders the original text below for reference
 */
function renderTypingLine() {
    const display = document.getElementById('typingDisplay');
    display.innerHTML = '';
    
    // Split text into words (keeping spaces with the preceding word)
    const words = splitIntoWords(translatedText);
    
    // Calculate how many characters fit per line (approximate)
    const containerWidth = display.offsetWidth || 800;
    const charWidth = 0.6 * 1.35 * 16; // Approximate char width in pixels
    const charsPerLine = Math.floor((containerWidth - 20) / charWidth);
    
    // Group words into lines
    const lines = groupWordsIntoLines(words, charsPerLine);
    
    // Determine which line has the current position
    let charsSoFar = 0;
    let currentLineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].reduce((sum, w) => sum + w.length, 0);
        if (charsSoFar + lineLength > currentPosition) {
            currentLineIndex = i;
            break;
        }
        charsSoFar += lineLength;
        if (i === lines.length - 1) currentLineIndex = i;
    }
    
    // Show 3 lines starting from the current line (or earlier)
    const startLine = Math.max(0, currentLineIndex);
    const endLine = Math.min(lines.length, startLine + 3);
    
    let globalCharIndex = 0;
    // Skip chars before startLine
    for (let i = 0; i < startLine; i++) {
        globalCharIndex += lines[i].reduce((sum, w) => sum + w.length, 0);
    }
    
    // Render 3 row pairs
    for (let lineIdx = startLine; lineIdx < endLine; lineIdx++) {
        const rowPair = document.createElement('div');
        rowPair.className = 'typing-row-pair';
        
        // Type row
        const typeRow = document.createElement('div');
        typeRow.className = 'typing-row type-row';
        const typeContainer = document.createElement('div');
        typeContainer.className = 'typing-line-container';
        const typeLine = document.createElement('div');
        typeLine.className = 'typing-line';
        
        // Output row
        const outputRow = document.createElement('div');
        outputRow.className = 'typing-row output-row';
        const outputContainer = document.createElement('div');
        outputContainer.className = 'typing-line-container';
        const outputLine = document.createElement('div');
        outputLine.className = 'original-line';
        
        // Render words for this line
        const lineWords = lines[lineIdx] || [];
        
        let lineCharIndex = globalCharIndex;
        
        for (let wordIdx = 0; wordIdx < lineWords.length; wordIdx++) {
            const word = lineWords[wordIdx];
            
            // Create word group for type line
            const typeWordGroup = document.createElement('span');
            typeWordGroup.className = 'word-group';
            
            // Create word group for output line
            const outputWordGroup = document.createElement('span');
            outputWordGroup.className = 'word-group';
            
            for (let charIdx = 0; charIdx < word.length; charIdx++) {
                const globalIdx = lineCharIndex + charIdx;
                
                // Type char
                const typeSpan = document.createElement('span');
                typeSpan.className = 'typing-char';
                typeSpan.textContent = word[charIdx];
                
                if (globalIdx < currentPosition) {
                    if (typedChars[globalIdx] && !typedChars[globalIdx].isCorrect) {
                        typeSpan.classList.add('typed-error');
                    } else {
                        typeSpan.classList.add('typed');
                    }
                } else if (globalIdx === currentPosition) {
                    // Use blinking cursor when typing hasn't started, non-blinking when active
                    if (startTime === null) {
                        typeSpan.classList.add('cursor');
                    } else {
                        typeSpan.classList.add('cursor-active');
                    }
                    typeSpan.classList.add('pending');
                } else {
                    typeSpan.classList.add('pending');
                }
                
                typeWordGroup.appendChild(typeSpan);
                
                // Output char - use globalIdx to get character from original text directly
                const outputSpan = document.createElement('span');
                outputSpan.className = 'original-char';
                outputSpan.textContent = currentText[globalIdx] || '';
                
                if (globalIdx < currentPosition) {
                    if (typedChars[globalIdx] && !typedChars[globalIdx].isCorrect) {
                        outputSpan.classList.add('typed-error');
                    } else {
                        outputSpan.classList.add('typed');
                    }
                } else if (globalIdx === currentPosition) {
                    // Use lighter cursor in output row - blinking before typing, non-blinking during
                    if (startTime === null) {
                        outputSpan.classList.add('cursor');
                    } else {
                        outputSpan.classList.add('cursor-active');
                    }
                    outputSpan.classList.add('pending');
                } else {
                    outputSpan.classList.add('pending');
                }
                
                outputWordGroup.appendChild(outputSpan);
            }
            
            typeLine.appendChild(typeWordGroup);
            outputLine.appendChild(outputWordGroup);
            
            lineCharIndex += word.length;
        }
        
        globalCharIndex = lineCharIndex;
        
        typeContainer.appendChild(typeLine);
        typeRow.appendChild(typeContainer);
        outputContainer.appendChild(outputLine);
        outputRow.appendChild(outputContainer);
        
        rowPair.appendChild(typeRow);
        rowPair.appendChild(outputRow);
        display.appendChild(rowPair);
    }
}

/**
 * Split text into words (space is attached to preceding word)
 */
function splitIntoWords(text) {
    const words = [];
    let currentWord = '';
    
    for (let i = 0; i < text.length; i++) {
        currentWord += text[i];
        if (text[i] === ' ') {
            words.push(currentWord);
            currentWord = '';
        }
    }
    
    if (currentWord) {
        words.push(currentWord);
    }
    
    return words;
}

/**
 * Group words into lines based on approximate character width
 */
function groupWordsIntoLines(words, charsPerLine) {
    const lines = [];
    let currentLine = [];
    let currentLineLength = 0;
    
    for (const word of words) {
        if (currentLineLength + word.length > charsPerLine && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = [];
            currentLineLength = 0;
        }
        currentLine.push(word);
        currentLineLength += word.length;
    }
    
    if (currentLine.length > 0) {
        lines.push(currentLine);
    }
    
    return lines;
}

/**
 * Get the current error count (number of incorrectly typed characters)
 */
function getErrorCount() {
    return typedChars.filter(tc => !tc.isCorrect).length;
}

/**
 * Update statistics display
 */
function updateStats() {
    const progressLabel = document.getElementById('progressLabel');
    
    // Update progress based on mode
    if (useCustomText && customText.trim()) {
        // For custom text mode, show characters typed / total characters
        progressLabel.textContent = 'chars';
        document.getElementById('progressStat').textContent = `${currentPosition}/${currentText.length}`;
    } else if (testMode === 'time') {
        // For time mode, show countdown
        progressLabel.textContent = 'time';
        if (startTime === null) {
            document.getElementById('progressStat').textContent = `${timeLimit}s`;
        } else {
            document.getElementById('progressStat').textContent = `${timeRemaining}s`;
        }
    } else {
        // For words mode, show x / y words typed
        progressLabel.textContent = 'words';
        const wordsTyped = currentPosition === 0 ? 0 : 
            currentText.slice(0, currentPosition).split(' ').filter(w => w).length + 
            (currentText[currentPosition - 1] === ' ' ? 0 : 0);
        // Count completed words (space-separated)
        const typedText = currentText.slice(0, currentPosition);
        const completedWords = typedText.split(' ').filter((w, i, arr) => {
            // Only count if followed by a space (fully typed) or at the end
            return w && (i < arr.length - 1 || currentPosition >= currentText.length);
        }).length;
        document.getElementById('progressStat').textContent = `${completedWords}/${wordCount}`;
    }
    
    document.getElementById('errorsStat').textContent = getErrorCount();
    
    // Calculate WPM (words = characters / 5, standard typing test convention)
    let wpm = 0;
    if (startTime && currentPosition > 0) {
        const elapsedMinutes = (Date.now() - startTime) / 60000;
        if (elapsedMinutes > 0) {
            const words = currentPosition / 5;
            wpm = Math.round(words / elapsedMinutes);
        }
    }
    document.getElementById('wpmStat').textContent = wpm;
}

/**
 * Show completion message
 */
function showComplete() {
    document.getElementById('completeMessage').classList.add('show');
    exitFocusMode();
}

/**
 * Enter focus mode - hide distracting elements
 */
function enterFocusMode() {
    document.body.classList.add('focus-mode');
}

/**
 * Exit focus mode - show all elements
 */
function exitFocusMode() {
    document.body.classList.remove('focus-mode');
}

/**
 * Reset typing to start fresh (generates new random words)
 */
function resetTyping() {
    // Stop any running timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Exit focus mode
    exitFocusMode();
    
    currentPosition = 0;
    typedChars = [];
    isComplete = false;
    startTime = null;
    timeRemaining = timeLimit;
    
    document.getElementById('completeMessage').classList.remove('show');
    
    // Generate text (handles both custom text and random words)
    // If using custom text, use it directly; otherwise generate random words
    if (useCustomText && customText.trim()) {
        currentText = customText.trim();
    } else if (currentWordSet && currentWordSet.words.length) {
        const words = currentWordSet.words;
        let selectedWords = [];
        const numWords = testMode === 'time' ? 400 : wordCount;
        
        for (let i = 0; i < numWords; i++) {
            const randomIndex = Math.floor(Math.random() * words.length);
            selectedWords.push(words[randomIndex].toLowerCase());
        }
        
        // Apply punctuation if enabled
        if (includePunctuation) {
            selectedWords = applyPunctuation(selectedWords);
        }
        
        // Apply numbers if enabled
        if (includeNumbers) {
            selectedWords = applyNumbers(selectedWords);
        }
        
        currentText = selectedWords.join(' ');
    }
    
    translateText();
    renderTypingLine();
    updateStats();
    
    // Focus the input
    document.getElementById('hiddenInput').focus();
}

/**
 * Start the countdown timer for time mode
 */
function startCountdown() {
    timeRemaining = timeLimit;
    updateStats();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateStats();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            isComplete = true;
            showComplete();
        }
    }, 1000);
}

/**
 * Set up the typing settings bar
 */
function setupTypingSettings() {
    const timeModeBtn = document.getElementById('timeModeBtn');
    const wordsModeBtn = document.getElementById('wordsModeBtn');
    const punctuationBtn = document.getElementById('punctuationBtn');
    const numbersBtn = document.getElementById('numbersBtn');
    const customTextBtn = document.getElementById('customTextBtn');
    const customTextContainer = document.getElementById('customTextContainer');
    const customTextInput = document.getElementById('customTextInput');
    const applyCustomTextBtn = document.getElementById('applyCustomTextBtn');
    const clearCustomTextBtn = document.getElementById('clearCustomTextBtn');
    
    // Punctuation toggle
    punctuationBtn.addEventListener('click', () => {
        includePunctuation = !includePunctuation;
        punctuationBtn.classList.toggle('active', includePunctuation);
        resetTyping();
    });
    
    // Numbers toggle
    numbersBtn.addEventListener('click', () => {
        includeNumbers = !includeNumbers;
        numbersBtn.classList.toggle('active', includeNumbers);
        resetTyping();
    });
    
    // Custom text toggle
    customTextBtn.addEventListener('click', () => {
        const isActive = customTextBtn.classList.contains('active');
        if (isActive) {
            // Deactivate custom text mode
            useCustomText = false;
            customTextBtn.classList.remove('active');
            customTextContainer.classList.remove('show');
            // Re-enable punctuation and numbers buttons
            punctuationBtn.disabled = false;
            numbersBtn.disabled = false;
            punctuationBtn.style.opacity = '1';
            numbersBtn.style.opacity = '1';
            // Show mode buttons and options
            document.querySelectorAll('.settings-divider').forEach(d => d.style.display = '');
            timeModeBtn.parentElement.style.display = '';
            document.getElementById('optionsGroup').style.display = '';
            // Show word set selector
            document.querySelector('.word-set-card').style.display = '';
            resetTyping();
        } else {
            // Activate custom text mode - show input
            customTextBtn.classList.add('active');
            customTextContainer.classList.add('show');
            customTextInput.focus();
            // Disable punctuation and numbers buttons in custom mode
            punctuationBtn.disabled = true;
            numbersBtn.disabled = true;
            punctuationBtn.style.opacity = '0.5';
            numbersBtn.style.opacity = '0.5';
            // Hide mode buttons and options (not relevant for custom text)
            document.querySelectorAll('.settings-divider').forEach(d => d.style.display = 'none');
            timeModeBtn.parentElement.style.display = 'none';
            document.getElementById('optionsGroup').style.display = 'none';
            // Hide word set selector
            document.querySelector('.word-set-card').style.display = 'none';
        }
    });
    
    // Apply custom text
    applyCustomTextBtn.addEventListener('click', () => {
        const text = customTextInput.value.trim();
        if (text) {
            customText = text;
            useCustomText = true;
            resetTyping();
            document.getElementById('hiddenInput').focus();
        }
    });
    
    // Clear custom text
    clearCustomTextBtn.addEventListener('click', () => {
        customTextInput.value = '';
        customText = '';
        customTextInput.focus();
    });
    
    // Allow Enter to apply custom text (Shift+Enter for newline)
    customTextInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            applyCustomTextBtn.click();
        }
    });
    
    // Mode button click handlers
    timeModeBtn.addEventListener('click', () => {
        if (testMode === 'time') return;
        testMode = 'time';
        timeModeBtn.classList.add('active');
        wordsModeBtn.classList.remove('active');
        updateOptionsDisplay();
        resetTyping();
    });
    
    wordsModeBtn.addEventListener('click', () => {
        if (testMode === 'words') return;
        testMode = 'words';
        wordsModeBtn.classList.add('active');
        timeModeBtn.classList.remove('active');
        updateOptionsDisplay();
        resetTyping();
    });
    
    // Initialize options display
    updateOptionsDisplay();
}

/**
 * Update the options buttons based on current mode
 */
function updateOptionsDisplay() {
    const optionsGroup = document.getElementById('optionsGroup');
    const progressLabel = document.getElementById('progressLabel');
    optionsGroup.innerHTML = '';
    
    if (testMode === 'time') {
        progressLabel.textContent = 'time';
        const timeOptions = [15, 30, 60, 120];
        timeOptions.forEach(seconds => {
            const btn = document.createElement('button');
            btn.className = 'option-btn' + (seconds === timeLimit ? ' active' : '');
            btn.textContent = seconds;
            btn.addEventListener('click', () => {
                timeLimit = seconds;
                timeRemaining = seconds;
                document.querySelectorAll('#optionsGroup .option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                resetTyping();
            });
            optionsGroup.appendChild(btn);
        });
    } else {
        progressLabel.textContent = 'words';
        const wordOptions = [10, 25, 50, 100];
        wordOptions.forEach(count => {
            const btn = document.createElement('button');
            btn.className = 'option-btn' + (count === wordCount ? ' active' : '');
            btn.textContent = count;
            btn.addEventListener('click', () => {
                wordCount = count;
                document.querySelectorAll('#optionsGroup .option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                resetTyping();
            });
            optionsGroup.appendChild(btn);
        });
    }
}

// Export for global access
window.initTryLayout = initTryLayout;
window.resetTyping = resetTyping;
