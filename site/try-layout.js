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
    
    // Render keyboard visualization with target layout and known layout mapping
    const keyboardSvg = document.getElementById('layoutKeyboardSvg');
    if (keyboardSvg) {
        renderKeyboardWithMapping(targetLayout, knownLayout, keyboardSvg);
    }
    
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
    const originalWords = splitIntoWords(currentText);
    
    // Calculate how many characters fit per line (approximate)
    const containerWidth = display.offsetWidth || 800;
    const charWidth = 0.6 * 1.35 * 16; // Approximate char width in pixels
    const charsPerLine = Math.floor((containerWidth - 20) / charWidth);
    
    // Group words into lines
    const lines = groupWordsIntoLines(words, charsPerLine);
    const originalLines = groupWordsIntoLines(originalWords, charsPerLine);
    
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
        const origLineWords = originalLines[lineIdx] || [];
        
        let lineCharIndex = globalCharIndex;
        
        for (let wordIdx = 0; wordIdx < lineWords.length; wordIdx++) {
            const word = lineWords[wordIdx];
            const origWord = origLineWords[wordIdx] || word;
            
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
                    typeSpan.classList.add('current');
                } else {
                    typeSpan.classList.add('pending');
                }
                
                typeWordGroup.appendChild(typeSpan);
                
                // Output char
                const outputSpan = document.createElement('span');
                outputSpan.className = 'original-char';
                outputSpan.textContent = origWord[charIdx] || '';
                
                if (globalIdx < currentPosition) {
                    if (typedChars[globalIdx] && !typedChars[globalIdx].isCorrect) {
                        outputSpan.classList.add('typed-error');
                    } else {
                        outputSpan.classList.add('typed');
                    }
                } else if (globalIdx === currentPosition) {
                    outputSpan.classList.add('current');
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
    // Update progress based on mode
    if (testMode === 'time') {
        // For time mode, show countdown
        if (startTime === null) {
            document.getElementById('progressStat').textContent = `${timeLimit}s`;
        } else {
            document.getElementById('progressStat').textContent = `${timeRemaining}s`;
        }
    } else {
        // For words mode, show x / y words typed
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
    
    // Generate new random words on reset
    if (currentWordSet && currentWordSet.words.length) {
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
