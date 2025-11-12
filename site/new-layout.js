/**
 * New Layout Generator
 * Converts keyboard layout text input to Cyanophage URL format
 */

// Key mapping for Cyanophage URL encoding
// This maps the visual layout positions to the Cyanophage string positions
const CYANOPHAGE_KEY_MAP = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
    24, 12
];

/**
 * Generic keyboard layout data structure
 * Represents a split keyboard with 3x6 keys per hand plus thumb keys
 */
class KeyboardLayout {
    constructor() {
        // Left hand: 3 rows × 6 columns (indexes 0-17)
        this.leftHand = {
            rows: [
                Array(6).fill(' '),  // Top row
                Array(6).fill(' '),  // Home row
                Array(6).fill(' ')   // Bottom row
            ],
            thumbInner: ' ',  // Inner thumb key
            thumbOuter: ' '   // Outer thumb key
        };
        
        // Right hand: 3 rows × 6 columns (indexes 0-17)
        this.rightHand = {
            rows: [
                Array(6).fill(' '),  // Top row
                Array(6).fill(' '),  // Home row
                Array(6).fill(' ')   // Bottom row
            ],
            thumbOuter: ' ',  // Outer thumb key
            thumbInner: ' '   // Inner thumb key
        };
    }
    
    /**
     * Set a key on the left hand
     */
    setLeftKey(row, col, char) {
        if (row >= 0 && row < 3 && col >= 0 && col < 6) {
            this.leftHand.rows[row][col] = char;
        }
    }
    
    /**
     * Set a key on the right hand
     */
    setRightKey(row, col, char) {
        if (row >= 0 && row < 3 && col >= 0 && col < 6) {
            this.rightHand.rows[row][col] = char;
        }
    }
    
    /**
     * Get all keys as a flat array in physical keyboard order (for visualization)
     * Returns 40 positions matching the physical keyboard layout:
     *   0-5: Left hand top row
     *   6-11: Right hand top row
     *   12-17: Left hand home row
     *   18-23: Right hand home row
     *   24-29: Left hand bottom row
     *   30-35: Right hand bottom row
     *   36-39: Thumb keys (left inner, left outer, right outer, right inner)
     */
    toFlatArray() {
        const result = Array(40).fill(' ');
        
        // Left hand top row (physical positions 0-5)
        for (let col = 0; col < 6; col++) {
            result[col] = this.leftHand.rows[0][col];
        }
        
        // Right hand top row (physical positions 6-11)
        for (let col = 0; col < 6; col++) {
            result[6 + col] = this.rightHand.rows[0][col];
        }
        
        // Left hand home row (physical positions 12-17)
        for (let col = 0; col < 6; col++) {
            result[12 + col] = this.leftHand.rows[1][col];
        }
        
        // Right hand home row (physical positions 18-23)
        for (let col = 0; col < 6; col++) {
            result[18 + col] = this.rightHand.rows[1][col];
        }
        
        // Left hand bottom row (physical positions 24-29)
        for (let col = 0; col < 6; col++) {
            result[24 + col] = this.leftHand.rows[2][col];
        }
        
        // Right hand bottom row (physical positions 30-35)
        for (let col = 0; col < 6; col++) {
            result[30 + col] = this.rightHand.rows[2][col];
        }
        
        // Thumb keys (positions 36-39)
        result[36] = this.leftHand.thumbInner;
        result[37] = this.leftHand.thumbOuter;
        result[38] = this.rightHand.thumbOuter;
        result[39] = this.rightHand.thumbInner;
        
        return result;
    }
    
    /**
     * Pretty print for console
     */
    toString() {
        const leftRows = this.leftHand.rows.map(row => row.join(' ')).join('\n');
        const rightRows = this.rightHand.rows.map(row => row.join(' ')).join('\n');
        const leftThumbs = `Thumbs: [${this.leftHand.thumbInner}] [${this.leftHand.thumbOuter}]`;
        const rightThumbs = `Thumbs: [${this.rightHand.thumbOuter}] [${this.rightHand.thumbInner}]`;
        
        return `Left Hand:\n${leftRows}\n${leftThumbs}\n\nRight Hand:\n${rightRows}\n${rightThumbs}`;
    }
}

/**
 * Parses the layout text input into a KeyboardLayout data structure.
 * 
 * Expected format (with or without spaces):
 *   Each row can have 4-10 keys total (split between left and right hand, max 5 per hand)
 *   Keys are aligned from the inside (middle) towards the outside (pinky)
 *   
 *   Left hand: right-aligned in 5 columns (4-5 keys, columns 1-5, position 0 unused)
 *   Right hand: left-aligned in 5 columns (4-5 keys, columns 0-4, position 5 unused)
 * 
 * Physical layout uses 6 columns per hand but only inner 5 are typically used.
 * 
 * Examples:
 *   b l d w z ' f o u j ;      (5+6)
 *   n r t s g y h a e i ,      (5+6) 
 *   q x m c v k p . - /        (5+5)
 * 
 * For thumb rows, spacing matters:
 *   Leading spaces determine which hand the thumb belongs to
 *   More spaces = right hand thumb
 * 
 * @param {string} inputText - The raw text input from the user
 * @returns {Object} - { layout: KeyboardLayout|null, error: string|null }
 */
function parseLayoutInput(inputText) {
    // Keep original lines with spacing for thumb detection
    const originalLines = inputText.split('\n');
    
    // Split into lines and clean up for main parsing
    const lines = inputText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (lines.length < 3) {
        return { layout: null, error: 'Please provide at least 3 rows of keys' };
    }

    const layout = new KeyboardLayout();
    
    // Process first 3 rows (main keyboard)
    for (let rowIndex = 0; rowIndex < 3 && rowIndex < lines.length; rowIndex++) {
        const line = lines[rowIndex];
        
        // Remove all spaces to get raw characters
        const chars = line.replace(/\s+/g, '').split('').filter(c => c.length > 0);
        
        if (chars.length < 2) {
            return {
                layout: null,
                error: `Row ${rowIndex + 1} has only ${chars.length} key(s), expected at least 2`
            };
        }
        
        if (chars.length > 12) {
            return {
                layout: null,
                error: `Row ${rowIndex + 1} has ${chars.length} keys, maximum is 12 (6 per hand)`
            };
        }
        
        // Split the row - find the midpoint
        const midpoint = Math.floor(chars.length / 2);
        
        const leftKeys = chars.slice(0, midpoint);
        const rightKeys = chars.slice(midpoint);
        
        // Left hand: right-align in columns 1-5 (position 0 is typically unused)
        // If we have 5 keys, they go in columns 1-5
        // If we have 4 keys, they go in columns 2-5, etc.
        const leftStartCol = 6 - leftKeys.length;
        for (let i = 0; i < leftKeys.length && leftStartCol + i < 6; i++) {
            layout.setLeftKey(rowIndex, leftStartCol + i, leftKeys[i]);
        }
        
        // Right hand: left-align in columns 0-4 (position 5 is typically unused)
        // Keys fill from column 0 onwards, up to max 5 keys
        for (let i = 0; i < rightKeys.length && i < 5; i++) {
            layout.setRightKey(rowIndex, i, rightKeys[i]);
        }
        
        // If right hand has a 6th key, it might be in position 5 (outermost)
        if (rightKeys.length > 5) {
            layout.setRightKey(rowIndex, 5, rightKeys[5]);
        }
    }
    
    // Process optional 4th row (thumb keys)
    if (lines.length > 3) {
        const thumbLine = lines[3];
        
        // For thumb row, preserve spacing to determine hand assignment
        // Find the original 4th line (accounting for empty lines)
        let originalThumbLine = '';
        let nonEmptyCount = 0;
        for (let i = 0; i < originalLines.length; i++) {
            const trimmed = originalLines[i].trim();
            if (trimmed.length > 0) {
                nonEmptyCount++;
                if (nonEmptyCount === 4) {
                    originalThumbLine = originalLines[i];
                    break;
                }
            }
        }
        
        // Get all thumb characters (only support 1 alpha key)
        const thumbChars = thumbLine.replace(/\s+/g, '').split('').filter(c => c.length > 0);
        
        if (thumbChars.length > 1) {
            return {
                layout: null,
                error: 'Only 1 alpha key is supported on the thumb row'
            };
        }
        
        if (thumbChars.length > 0 && originalThumbLine) {
            // Calculate the midpoint based on the first row's layout
            // Find where the gap between hands is in the original first row
            let originalFirstRow = '';
            for (let i = 0; i < originalLines.length; i++) {
                const trimmed = originalLines[i].trim();
                if (trimmed.length > 0) {
                    originalFirstRow = originalLines[i];
                    break;
                }
            }
            
            if (originalFirstRow) {
                // Find the position of the first character on the first row
                const firstRowStart = originalFirstRow.search(/\S/);
                // Get all characters from first row
                const firstRowChars = originalFirstRow.replace(/\s+/g, '').split('');
                const midpoint = Math.floor(firstRowChars.length / 2);
                
                // Find positions of each character in the original first row
                let charPositions = [];
                let charIndex = 0;
                for (let i = 0; i < originalFirstRow.length; i++) {
                    if (originalFirstRow[i] !== ' ' && originalFirstRow[i] !== '\t') {
                        charPositions.push(i);
                        charIndex++;
                    }
                }
                
                // The gap should be between the midpoint-1 and midpoint character
                const gapPosition = charPositions.length > 0 ? 
                    (charPositions[midpoint - 1] + charPositions[midpoint]) / 2 : 
                    originalFirstRow.length / 2;
                
                // Find where the first thumb character appears in the original thumb line
                const firstCharPos = originalThumbLine.indexOf(thumbChars[0]);
                
                // If thumb char is after the gap, it's right thumb
                const isRightThumb = firstCharPos > gapPosition;
                
                if (isRightThumb) {
                    // Thumb on right side (outer position only)
                    layout.rightHand.thumbOuter = thumbChars[0];
                } else {
                    // Thumb on left side (outer position only)
                    layout.leftHand.thumbOuter = thumbChars[0];
                }
            }
        }
    }

    console.log('Parsed Keyboard Layout:');
    console.log(layout.toString());
    console.log('\nFlat array representation:', layout.toFlatArray());

    return { layout, error: null };
}

/**
 * Converts a KeyboardLayout data structure into the Cyanophage URL format.
 * 
 * Cyanophage uses a specific encoding via KEY_MAP that maps string positions
 * to physical keyboard positions. We need to reverse this mapping.
 * 
 * String encoding positions:
 *   0-31: Mapped through KEY_MAP to physical positions
 *   32: Mapped through KEY_MAP[32] = physical 24 (left bottom row, column 0) - defaults to \
 *   33: Thumb key (physical 36 for left outer, 39 for right outer) - empty if no thumb
 *   34: Mapped through KEY_MAP[33] = physical 12 (left home row, column 0) - defaults to ^
 * 
 * The \^ at the end are required placeholders even if those positions are empty.
 * 
 * @param {KeyboardLayout} layout - The keyboard layout data structure
 * @returns {string} - The encoded layout string for Cyanophage
 */
function layoutToCyanophageString(layout) {
    // KEY_MAP from keyboard-accordion.js - maps string index to physical position
    const KEY_MAP = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
        13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
        25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
        24, 12
    ];
    
    // Get the flat array representation (40 positions)
    const flatLayout = layout.toFlatArray();
    
    console.log('Flat layout:', flatLayout);
    
    // Build the encoded string character by character
    let result = '';
    
    // Encode positions 0-31 using KEY_MAP
    for (let stringPos = 0; stringPos < 32; stringPos++) {
        const physicalPos = KEY_MAP[stringPos];
        const char = flatLayout[physicalPos];
        result += (char && char !== ' ') ? char : '';
    }
    
    // Position 32: Maps to KEY_MAP[32] = physical 24 (left bottom, column 0)
    // This is usually empty, so we use backslash as placeholder
    const pos32Char = flatLayout[KEY_MAP[32]];
    result += (pos32Char && pos32Char !== ' ') ? pos32Char : '\\';
    
    // Position 33: Thumb key (optional)
    // According to keyboard-accordion.js:
    // - Position 36 = left outer thumb (THUMB_LEFT_OUTER_KEY_INDEX)
    // - Position 39 = right outer thumb (THUMB_RIGHT_OUTER_KEY_INDEX)
    // The thumb key goes at string position 33
    const leftThumb = layout.leftHand.thumbOuter;
    const rightThumb = layout.rightHand.thumbOuter;
    
    let thumbChar = '';
    let thumbSide = null;
    
    if (leftThumb && leftThumb !== ' ') {
        thumbChar = leftThumb;
        thumbSide = 'l';
    } else if (rightThumb && rightThumb !== ' ') {
        thumbChar = rightThumb;
        thumbSide = 'r';
    }
    
    result += thumbChar;
    
    // Position 34: Maps to KEY_MAP[33] = physical 12 (left home, column 0)
    // This is usually empty, so we use caret as placeholder
    const pos34Char = flatLayout[KEY_MAP[33]];
    result += (pos34Char && pos34Char !== ' ') ? pos34Char : '^';
    
    console.log('Cyanophage encoded string:', result);
    console.log('String length:', result.length);
    console.log('Thumb side:', thumbSide);
    
    return { encodedString: result, thumbSide };
}

/**
 * Generates the complete Cyanophage URL from a KeyboardLayout.
 * 
 * @param {KeyboardLayout} layout - The keyboard layout data structure
 * @returns {string} - Complete Cyanophage URL
 */
function buildCyanophageUrl(layout) {
    const baseUrl = 'https://cyanophage.github.io/playground.html';
    
    // Convert layout to Cyanophage string encoding
    const { encodedString, thumbSide } = layoutToCyanophageString(layout);
    const encodedLayout = encodeURIComponent(encodedString);
    
    // Build URL - only include thumb parameter if there's a thumb key
    let url = `${baseUrl}?layout=${encodedLayout}`;
    
    if (thumbSide) {
        url += `&thumb=${thumbSide}`;
    }
    
    console.log('Generated URL:', url);
    
    return url;
}

/**
 * Main function to generate the Cyanophage URL from user input.
 */
function generateCyanophageUrl() {
    const inputText = document.getElementById('layoutInput').value;
    const errorDiv = document.getElementById('errorMessage');
    const resultSection = document.getElementById('resultSection');
    const resultUrlDiv = document.getElementById('resultUrl');
    const resultYamlDiv = document.getElementById('resultYaml');
    
    // Hide previous errors
    errorDiv.classList.remove('show');
    
    // STEP 1: Parse text input into KeyboardLayout data structure
    const { layout, error } = parseLayoutInput(inputText);
    
    if (error) {
        errorDiv.textContent = error;
        errorDiv.classList.add('show');
        resultSection.classList.remove('show');
        return;
    }
    
    // STEP 2: Show preview using the KeyboardLayout data structure
    showPreview(layout);
    
    // STEP 3: Convert KeyboardLayout to Cyanophage URL
    const url = buildCyanophageUrl(layout);
    
    // STEP 4: Generate YAML configuration
    const hasLeftThumb = layout.leftHand.thumbOuter && layout.leftHand.thumbOuter !== ' ';
    const hasRightThumb = layout.rightHand.thumbOuter && layout.rightHand.thumbOuter !== ' ';
    const hasThumb = hasLeftThumb || hasRightThumb;
    
    const yaml = `- name: name_of_layout
  link: ${url}
  thumb: ${hasThumb}
  website: https://relevantwebsite
  year: year_made`;
    
    // Display the URL and YAML
    resultUrlDiv.innerHTML = `<a href="${url}" target="_blank">${url}</a>`;
    resultYamlDiv.textContent = yaml;
    resultSection.classList.add('show');
}

/**
 * Displays a preview of the layout using the keyboard visualizer.
 * 
 * @param {KeyboardLayout} layout - The keyboard layout data structure
 */
function showPreview(layout) {
    const svg = document.getElementById('keyboard-preview-svg');
    
    // Check if we have thumb keys
    const hasLeftThumb = layout.leftHand.thumbOuter && layout.leftHand.thumbOuter !== ' ';
    const hasRightThumb = layout.rightHand.thumbOuter && layout.rightHand.thumbOuter !== ' ';
    const hasThumbs = hasLeftThumb || hasRightThumb;
    
    // Draw the keyboard
    drawKeyboard(svg, hasThumbs);
    
    // Get the flat array representation and update the SVG directly
    const flatLayout = layout.toFlatArray();
    updateLayout(flatLayout, svg);
}

/**
 * Copies the generated URL or YAML to clipboard.
 * @param {string} type - Either 'url' or 'yaml'
 */
function copyToClipboard(type) {
    let textToCopy;
    let buttonSelector;
    
    if (type === 'yaml') {
        textToCopy = document.getElementById('resultYaml').textContent;
        buttonSelector = '#resultYaml + .copy-button';
    } else {
        const urlElement = document.getElementById('resultUrl').querySelector('a');
        textToCopy = urlElement ? urlElement.href : document.getElementById('resultUrl').textContent;
        buttonSelector = '#resultUrl + .copy-button';
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        // Visual feedback - find the specific button that was clicked
        const button = document.querySelector(buttonSelector);
        
        if (button) {
            button.classList.add('copied');
            
            setTimeout(() => {
                button.classList.remove('copied');
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}
