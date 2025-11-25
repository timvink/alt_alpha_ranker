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

// State
let layoutsData = [];
let allLanguages = [];
let typingTexts = {};
let knownLayout = null;   // KeyboardLayout object for the layout user knows
let targetLayout = null;  // KeyboardLayout object for the layout user wants to try

// Typing state
let currentText = '';
let translatedText = '';  // The text translated to what keys to press on known layout
let currentPosition = 0;
let errorCount = 0;
let isComplete = false;

/**
 * Initialize the try layout page
 */
async function initTryLayout() {
    try {
        // Load layouts and texts in parallel
        const [dataResponse, textsResponse] = await Promise.all([
            fetch('data.json'),
            fetch('typing_texts.json')
        ]);
        
        const data = await dataResponse.json();
        layoutsData = data.layouts;
        allLanguages = data.languages || ['english'];
        typingTexts = await textsResponse.json();
        
        // Populate dropdowns
        populateLayoutDropdowns();
        populateLanguageDropdown();
        populateTextDropdown();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load initial layouts and start
        await loadLayouts();
        
        // Focus the typing area immediately
        document.getElementById('hiddenInput').focus();
        
    } catch (error) {
        console.error('Error initializing try layout:', error);
    }
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
 * Populate the language dropdown from data.json languages
 */
function populateLanguageDropdown() {
    const languageFlags = {
        'dutch': '🇳🇱',
        'english': '🇬🇧',
        'french': '🇫🇷',
        'german': '🇩🇪',
        'spanish': '🇪🇸',
        'italian': '🇮🇹',
        'portuguese': '🇵🇹'
    };
    
    const select = document.getElementById('language');
    select.innerHTML = '';
    
    // Use languages from data.json (which comes from cyanophage.yml)
    allLanguages.forEach(lang => {
        // Only add if we have typing texts for this language
        if (typingTexts.texts && typingTexts.texts[lang]) {
            const option = document.createElement('option');
            option.value = lang;
            const flag = languageFlags[lang] || '🌐';
            option.textContent = `${flag} ${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
            if (lang === 'english') option.selected = true;
            select.appendChild(option);
        }
    });
}

/**
 * Populate the text selection dropdown based on current language
 */
function populateTextDropdown() {
    const select = document.getElementById('textSelect');
    const language = document.getElementById('language').value;
    
    select.innerHTML = '';
    
    const texts = typingTexts.texts?.[language] || [];
    
    texts.forEach((textObj, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = textObj.preview;
        select.appendChild(option);
    });
    
    // Update current text
    if (texts.length > 0) {
        setCurrentText(texts[0].text);
    }
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
    });
    
    document.getElementById('targetLayout').addEventListener('change', async () => {
        await loadLayouts();
    });
    
    // Language change - update text dropdown
    document.getElementById('language').addEventListener('change', () => {
        populateTextDropdown();
    });
    
    // Text selection change
    document.getElementById('textSelect').addEventListener('change', (e) => {
        const language = document.getElementById('language').value;
        const texts = typingTexts.texts?.[language] || [];
        const index = parseInt(e.target.value, 10);
        if (texts[index]) {
            setCurrentText(texts[index].text);
        }
    });
    
    // Typing input
    const hiddenInput = document.getElementById('hiddenInput');
    const typingArea = document.getElementById('typingArea');
    
    // Focus management
    typingArea.addEventListener('click', () => {
        hiddenInput.focus();
    });
    
    document.addEventListener('keydown', (e) => {
        // If not already focused and it's a printable key, focus the input
        if (document.activeElement !== hiddenInput && e.key.length === 1) {
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
            renderTypingLine();
            updateStats();
        }
        return;
    }
    
    // Ignore modifier keys and special keys
    if (e.key.length !== 1) return;
    
    e.preventDefault();
    
    const pressedKey = e.key;
    const expectedChar = translatedText[currentPosition];
    
    if (!expectedChar) return;
    
    // Check if the pressed key matches (case-insensitive for letters)
    const isCorrect = pressedKey.toLowerCase() === expectedChar.toLowerCase();
    
    if (isCorrect) {
        currentPosition++;
        
        if (currentPosition >= translatedText.length) {
            isComplete = true;
            showComplete();
        }
        
        renderTypingLine();
        updateStats();
    } else {
        // Show error feedback
        errorCount++;
        showError();
        updateStats();
    }
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
            span.classList.add('typed');
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
            span.classList.add('typed');
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
 * Show error feedback
 */
function showError() {
    const currentCharEl = document.querySelector('.typing-char.current');
    if (currentCharEl) {
        currentCharEl.classList.add('error');
        setTimeout(() => {
            currentCharEl.classList.remove('error');
        }, 200);
    }
}

/**
 * Update statistics display
 */
function updateStats() {
    const total = translatedText.length || 1;
    const progress = Math.round((currentPosition / total) * 100);
    document.getElementById('progressStat').textContent = `${progress}%`;
    document.getElementById('errorsStat').textContent = errorCount;
}

/**
 * Show completion message
 */
function showComplete() {
    document.getElementById('completeMessage').classList.add('show');
}

/**
 * Reset typing to start fresh
 */
function resetTyping() {
    currentPosition = 0;
    errorCount = 0;
    isComplete = false;
    
    document.getElementById('completeMessage').classList.remove('show');
    
    renderTypingLine();
    updateStats();
    
    // Focus the input
    document.getElementById('hiddenInput').focus();
}

// Export for global access
window.initTryLayout = initTryLayout;
window.resetTyping = resetTyping;
