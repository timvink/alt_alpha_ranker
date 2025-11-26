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
    if (!currentWordSet || !currentWordSet.words.length) {
        currentText = 'the quick brown fox jumps over the lazy dog';
    } else {
        const words = currentWordSet.words;
        const selectedWords = [];
        const numWords = 50;
        
        // Randomly select 50 words (with replacement)
        for (let i = 0; i < numWords; i++) {
            const randomIndex = Math.floor(Math.random() * words.length);
            selectedWords.push(words[randomIndex].toLowerCase());
        }
        
        currentText = selectedWords.join(' ');
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
        // Don't capture keys when word set search is focused
        const wordSetSearch = document.getElementById('wordSetSearch');
        if (document.activeElement === wordSetSearch) {
            // Allow Escape to close dropdown
            if (e.key === 'Escape') {
                closeWordSetDropdown();
                hiddenInput.focus();
            }
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
        
        // Handle Enter key - restart if Tab was pressed first
        if (e.key === 'Enter' && tabPressed) {
            e.preventDefault();
            tabPressed = false;
            document.getElementById('tabKey')?.classList.remove('active');
            resetTyping();
            return;
        }
        
        // Any other key resets the tab state
        if (e.key !== 'Tab' && e.key !== 'Enter') {
            tabPressed = false;
            document.getElementById('tabKey')?.classList.remove('active');
        }
        
        // If not already focused and it's a printable key, focus the input
        // But not if word set dropdown is open
        if (document.activeElement !== hiddenInput && e.key.length === 1 && !isWordSetDropdownOpen()) {
            hiddenInput.focus();
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
    
    // Prevent the input from accumulating text
    hiddenInput.addEventListener('input', () => {
        hiddenInput.value = '';
    });
}

/**
 * Load layout data from URLs and create key mappings
 */
async function loadLayouts() {
    const knownLayoutName = document.getElementById('knownLayout').value;
    const targetLayoutName = document.getElementById('targetLayout').value;
    
    // Update hint text
    document.getElementById('knownLayoutName').textContent = knownLayoutName.toUpperCase();
    document.getElementById('targetLayoutName').textContent = targetLayoutName.charAt(0).toUpperCase() + targetLayoutName.slice(1);
    
    // Find layout data
    const knownLayoutData = layoutsData.find(l => l.name === knownLayoutName);
    const targetLayoutData = layoutsData.find(l => l.name === targetLayoutName);
    
    if (!knownLayoutData || !targetLayoutData) {
        console.error('Could not find layout data');
        return;
    }
    
    // Parse layouts from their cyanophage URLs
    // Use 'url' field from data.json
    knownLayout = cyanophageToKeyboard(knownLayoutData.url);
    targetLayout = cyanophageToKeyboard(targetLayoutData.url);
    
    // Translate the text and reset
    translateAndReset();
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
    
    // Start timer on first keystroke
    if (startTime === null) {
        startTime = Date.now();
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
    const typingContainer = document.getElementById('typingLine');
    const originalContainer = document.getElementById('originalLine');
    
    typingContainer.innerHTML = '';
    originalContainer.innerHTML = '';
    
    // Render the translated text (what keys to press)
    for (let i = 0; i < translatedText.length; i++) {
        const span = document.createElement('span');
        span.className = 'typing-char';
        span.textContent = translatedText[i];
        
        if (i < currentPosition) {
            // Check if this position was typed correctly
            if (typedChars[i] && !typedChars[i].isCorrect) {
                span.classList.add('typed-error');
            } else {
                span.classList.add('typed');
            }
        } else if (i === currentPosition) {
            span.classList.add('current');
        } else {
            span.classList.add('pending');
        }
        
        typingContainer.appendChild(span);
    }
    
    // Render the original text (what you're actually typing)
    for (let i = 0; i < currentText.length; i++) {
        const span = document.createElement('span');
        span.className = 'original-char';
        span.textContent = currentText[i];
        
        if (i < currentPosition) {
            // Check if this position was typed correctly
            if (typedChars[i] && !typedChars[i].isCorrect) {
                span.classList.add('typed-error');
            } else {
                span.classList.add('typed');
            }
        } else if (i === currentPosition) {
            span.classList.add('current');
        } else {
            span.classList.add('pending');
        }
        
        originalContainer.appendChild(span);
    }
    
    // Scroll both lines to keep current character visible
    const currentChar = typingContainer.querySelector('.current');
    if (currentChar) {
        const containerWidth = typingContainer.parentElement.offsetWidth;
        const charOffset = currentChar.offsetLeft;
        
        // Keep the current character roughly in the center-left
        const targetOffset = Math.max(0, charOffset - containerWidth * 0.3);
        typingContainer.style.transform = `translateX(-${targetOffset}px)`;
        originalContainer.style.transform = `translateX(-${targetOffset}px)`;
    }
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
    const total = translatedText.length || 1;
    const progress = Math.round((currentPosition / total) * 100);
    document.getElementById('progressStat').textContent = `${progress}%`;
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
}

/**
 * Reset typing to start fresh (generates new random words)
 */
function resetTyping() {
    currentPosition = 0;
    typedChars = [];
    isComplete = false;
    startTime = null;
    
    document.getElementById('completeMessage').classList.remove('show');
    
    // Generate new random words on reset
    if (currentWordSet && currentWordSet.words.length) {
        const words = currentWordSet.words;
        const selectedWords = [];
        const numWords = 50;
        
        for (let i = 0; i < numWords; i++) {
            const randomIndex = Math.floor(Math.random() * words.length);
            selectedWords.push(words[randomIndex].toLowerCase());
        }
        
        currentText = selectedWords.join(' ');
    }
    
    translateText();
    renderTypingLine();
    updateStats();
    
    // Focus the input
    document.getElementById('hiddenInput').focus();
}

// Export for global access
window.initTryLayout = initTryLayout;
window.resetTyping = resetTyping;
