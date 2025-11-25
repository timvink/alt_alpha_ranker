/**
 * Cyanophage URL Converter
 * Handles translation between Cyanophage URLs and KeyboardLayout data structures
 */

import { KeyboardLayout } from './keyboard.js';

// Cyanophage layout string to our physical key index mapping
// Based on rcdata from https://cyanophage.github.io/keyboard_svg.js
// 
// rcdata format: [char, row, col, freq, y, x, width, keyname]
// Cyanophage uses columns 1-11 for the 32 main keys (col 0 is for special keys)
// Columns 1-5 = left hand, columns 6-11 = right hand
//
// Our physical index layout:
//   Left Hand (cols 0-5)          Right Hand (cols 0-5)
//   [0] [1] [2] [3] [4] [5]      [6] [7] [8] [9][10][11]    Top Row
//   [12][13][14][15][16][17]    [18][19][20][21][22][23]    Home Row  
//   [24][25][26][27][28][29]    [30][31][32][33][34][35]    Bottom Row
//
// Cyanophage string positions map as:
//   0-10:  row 0, cols 1-11 -> q,w,e,r,t,y,u,i,o,p,-
//   11-21: row 1, cols 1-11 -> a,s,d,f,g,h,j,k,l,;,'
//   22-31: row 2, cols 1-10 -> z,x,c,v,b,n,m,,,.,/
//   32:    row 2, col 0     -> \ (left bottom outer pinky)
//   33:    thumb key        -> ^
//   34:    row 1, col 0     -> $ (left home outer pinky)

function cyanophageColToPhysicalIndex(row, cyanophageCol) {
    // Convert Cyanophage row/col to our physical key index
    // Cyanophage col 1-5 = left hand, col 6-11 = right hand
    if (cyanophageCol >= 1 && cyanophageCol <= 5) {
        // Left hand: cyanophage col 1 -> our col 1, etc.
        const ourCol = cyanophageCol;
        if (row === 0) return ourCol;           // top row: 0-5
        if (row === 1) return 12 + ourCol;      // home row: 12-17
        if (row === 2) return 24 + ourCol;      // bottom row: 24-29
    } else if (cyanophageCol >= 6 && cyanophageCol <= 11) {
        // Right hand: cyanophage col 6 -> our col 0, col 7 -> our col 1, etc.
        const ourCol = cyanophageCol - 6;
        if (row === 0) return 6 + ourCol;       // top row: 6-11
        if (row === 1) return 18 + ourCol;      // home row: 18-23
        if (row === 2) return 30 + ourCol;      // bottom row: 30-35
    } else if (cyanophageCol === 0) {
        // Column 0 is the outer pinky stretch position (left hand only in Cyanophage)
        if (row === 1) return 12;               // home row outer pinky: index 12
        if (row === 2) return 24;               // bottom row outer pinky: index 24
    }
    return -1; // Invalid
}

// Build the mapping array from string position to physical index
// String positions 0-31 are the 32 main keys
const CYANOPHAGE_KEY_MAP = [];

// Positions 0-10: row 0, cols 1-11 (q,w,e,r,t,y,u,i,o,p,-)
for (let i = 0; i <= 10; i++) {
    CYANOPHAGE_KEY_MAP[i] = cyanophageColToPhysicalIndex(0, i + 1);
}

// Positions 11-21: row 1, cols 1-11 (a,s,d,f,g,h,j,k,l,;,')
for (let i = 0; i <= 10; i++) {
    CYANOPHAGE_KEY_MAP[11 + i] = cyanophageColToPhysicalIndex(1, i + 1);
}

// Positions 22-31: row 2, cols 1-10 (z,x,c,v,b,n,m,,,.,/)
for (let i = 0; i <= 9; i++) {
    CYANOPHAGE_KEY_MAP[22 + i] = cyanophageColToPhysicalIndex(2, i + 1);
}

// Position 32: row 2, col 0 (\ - left bottom outer pinky)
CYANOPHAGE_KEY_MAP[32] = cyanophageColToPhysicalIndex(2, 0);  // -> 24

// Position 33 is the thumb key (handled separately)

// Position 34: row 1, col 0 ($ - left home outer pinky)  
CYANOPHAGE_KEY_MAP[33] = cyanophageColToPhysicalIndex(1, 0);  // -> 12 (stored at index 33 for the 34th position)

// Physical key indices for thumbs (from keyboard.js)
const THUMB_LEFT_INNER_KEY_INDEX = 36;
const THUMB_LEFT_OUTER_KEY_INDEX = 37;
const THUMB_RIGHT_OUTER_KEY_INDEX = 38;
const THUMB_RIGHT_INNER_KEY_INDEX = 39;

/**
 * Converts a Cyanophage URL to a KeyboardLayout data structure
 * @param {string} url - Full Cyanophage URL or layout string
 * @returns {KeyboardLayout} - Populated KeyboardLayout object
 */
function cyanophageToKeyboard(url) {
    const { layoutString, thumbSide } = parseCyanophageUrl(url);
    
    let decodedString;
    try {
        decodedString = decodeURIComponent(layoutString);
    } catch (e) {
        decodedString = layoutString;
    }
    
    const flatLayout = Array(40).fill(' ');

    // Map the 32 main keys (User 1-32)
    for (let i = 0; i < 32; i++) {
        if (decodedString[i]) {
            const char = decodedString[i].toLowerCase();
            const physicalKeyIndex = CYANOPHAGE_KEY_MAP[i];
            if (physicalKeyIndex !== undefined) {
                flatLayout[physicalKeyIndex] = char;
            }
        }
    }

    // Map User Key 33 (string pos 32)
    if (decodedString.length > 32) {
        const char = decodedString[32].toLowerCase();
        const physicalKeyIndex = CYANOPHAGE_KEY_MAP[32]; // Maps to physical 24
        if (char !== '\\') { // Filter placeholder
            flatLayout[physicalKeyIndex] = char;
        }
    }

    // Map User Key 35 (string pos 34)
    if (decodedString.length > 34) {
        const char = decodedString[34].toLowerCase();
        const physicalKeyIndex = CYANOPHAGE_KEY_MAP[33]; // Maps to physical 12
        if (char !== '^') { // Filter placeholder
            flatLayout[physicalKeyIndex] = char;
        }
    }
    
    const isLetter = /^[a-zA-Z]$/;

    // Handle Thumb Key (User Key 34 / string pos 33)
    if (decodedString.length > 33) {
        const thumbChar = decodedString[33].toLowerCase();
        // Only map if it's a letter (filter out placeholders like '-')
        if (isLetter.test(thumbChar)) {
            // --- BUG FIX ---
            // Place thumb on INNER keys (36, 39) to match physical layouts like 'racket'
            if (thumbSide === 'r') {
                // Map to Right INNER Thumb
                flatLayout[THUMB_RIGHT_INNER_KEY_INDEX] = thumbChar;
            } else {
                // Default to Left INNER Thumb
                flatLayout[THUMB_LEFT_INNER_KEY_INDEX] = thumbChar;
            }
        }
    }
    
    // Convert flat array to KeyboardLayout
    return flatArrayToKeyboard(flatLayout);
}

/**
 * Converts a KeyboardLayout to a Cyanophage URL
 * @param {KeyboardLayout} layout - The keyboard layout object
 * @returns {string} - Full Cyanophage URL
 */
function keyboardToCyanophage(layout) {
    // Use the class method to get the flat array
    const flatLayout = layout.toFlatArray();
    
    // Build the encoded string character by character
    const resultChars = [];
    
    // Encode User keys 1-32 (string pos 0-31)
    for (let stringPos = 0; stringPos < 32; stringPos++) {
        const physicalPos = CYANOPHAGE_KEY_MAP[stringPos];
        const char = flatLayout[physicalPos];
        resultChars[stringPos] = (char && char !== ' ') ? char : '-'; // Use '-' for blank
    }
    
    // Encode User key 33 (string pos 32)
    const pos32Char = flatLayout[CYANOPHAGE_KEY_MAP[32]]; // physical 24
    resultChars[32] = (pos32Char && pos32Char !== ' ') ? pos32Char : '\\'; // Placeholder
    
    // Find the thumb key (User key 34 / string pos 33)
    // This logic correctly checks both inner and outer thumbs,
    // matching the robust structure of the KeyboardLayout class.
    
    const leftThumb = (layout.leftHand.thumbOuter && layout.leftHand.thumbOuter !== ' ') 
        ? layout.leftHand.thumbOuter 
        : layout.leftHand.thumbInner;
        
    const rightThumb = (layout.rightHand.thumbOuter && layout.rightHand.thumbOuter !== ' ')
        ? layout.rightHand.thumbOuter
        : layout.rightHand.thumbInner;

    let thumbSide = null;
    
    const isLetter = /^[a-zA-Z]$/;

    // Use left thumb if it's a letter
    if (leftThumb && isLetter.test(leftThumb)) {
        resultChars[33] = leftThumb;
        thumbSide = 'l';
    // Otherwise, use right thumb if it's a letter
    } else if (rightThumb && isLetter.test(rightThumb)) {
        resultChars[33] = rightThumb;
        thumbSide = 'r';
    }
    // If no thumb, don't add position 33
    
    // Encode User key 35 (string pos 34) - only if we have a thumb
    if (thumbSide) {
        const pos35Char = flatLayout[CYANOPHAGE_KEY_MAP[33]]; // physical 12
        resultChars[34] = (pos35Char && pos35Char !== ' ') ? pos35Char : '^'; // Placeholder
    }
    
    // Build URL
    const baseUrl = 'https://cyanophage.github.io/playground.html';
    // Join and encode the string
    const encodedLayout = encodeURIComponent(resultChars.join(''));
    
    let url = `${baseUrl}?layout=${encodedLayout}&mode=ergo`;
    if (thumbSide) {
        url += `&thumb=${thumbSide}`;
    }
    
    return url;
}

/**
 * Parses a Cyanophage URL to extract layout string and thumb side
 * @param {string} rawValue - URL or layout string
 * @returns {Object} - {layoutString, thumbSide}
 */
function parseCyanophageUrl(rawValue) {
    let layoutString = rawValue;
    let thumbSide = null;

    try {
        // Handle full URLs
        const url = new URL(rawValue);
        layoutString = url.searchParams.get('layout') || '';
        thumbSide = url.searchParams.get('thumb');
    } catch (e) {
        try {
            // Handle partial param strings (e.g., "?layout=...")
            const params = new URLSearchParams(rawValue.startsWith('?') ? rawValue : '?' + rawValue);
            if (params.has('layout')) {
                layoutString = params.get('layout');
                thumbSide = params.get('thumb');
            } else {
                // Handle case where layout string is the first param
                const firstKey = params.keys().next().value;
                if (firstKey) {
                    layoutString = firstKey;
                    thumbSide = params.get('thumb');
                }
            }
        } catch (e2) {
            // Fallback for simple string with "&thumb=r"
            layoutString = rawValue.split('&')[0];
            if (rawValue.includes('&thumb=r')) thumbSide = 'r';
            if (rawValue.includes('&thumb=l')) thumbSide = 'l';
        }
    }
    
    return { layoutString, thumbSide };
}

/**
 * Converts a flat 40-element array to a KeyboardLayout object
 * @param {Array} flatArray - 40-element array of key characters
 * @returns {KeyboardLayout} - Populated KeyboardLayout object
 */
function flatArrayToKeyboard(flatArray) {
    // This assumes the KeyboardLayout class is available in the global scope
    // or has been imported if this is a module.
    const layout = new KeyboardLayout();
    
    // Left hand top row (positions 0-5)
    for (let col = 0; col < 6; col++) {
        const char = flatArray[col] || ' ';
        layout.leftHand.rows[0][col] = char === ' ' ? char : char.toLowerCase();
    }
    
    // Right hand top row (positions 6-11)
    for (let col = 0; col < 6; col++) {
        const char = flatArray[6 + col] || ' ';
        layout.rightHand.rows[0][col] = char === ' ' ? char : char.toLowerCase();
    }
    
    // Left hand home row (positions 12-17)
    for (let col = 0; col < 6; col++) {
        const char = flatArray[12 + col] || ' ';
        layout.leftHand.rows[1][col] = char === ' ' ? char : char.toLowerCase();
    }
    
    // Right hand home row (positions 18-23)
    for (let col = 0; col < 6; col++) {
        const char = flatArray[18 + col] || ' ';
        layout.rightHand.rows[1][col] = char === ' ' ? char : char.toLowerCase();
    }
    
    // Left hand bottom row (positions 24-29)
    for (let col = 0; col < 6; col++) {
        const char = flatArray[24 + col] || ' ';
        layout.leftHand.rows[2][col] = char === ' ' ? char : char.toLowerCase();
    }
    
    // Right hand bottom row (positions 30-35)
    for (let col = 0; col < 6; col++) {
        const char = flatArray[30 + col] || ' ';
        // This was the bug you pointed out last time, it's correct now.
        layout.rightHand.rows[2][col] = char === ' ' ? char : char.toLowerCase();
    }
    
    // Thumb keys (positions 36-39)
    // (using indices from keyboard.js)
    const thumbInnerLeft = flatArray[36] || ' ';
    layout.leftHand.thumbInner = thumbInnerLeft === ' ' ? thumbInnerLeft : thumbInnerLeft.toLowerCase();
    
    const thumbOuterLeft = flatArray[37] || ' ';
    layout.leftHand.thumbOuter = thumbOuterLeft === ' ' ? thumbOuterLeft : thumbOuterLeft.toLowerCase();
    
    const thumbOuterRight = flatArray[38] || ' ';
    layout.rightHand.thumbOuter = thumbOuterRight === ' ' ? thumbOuterRight : thumbOuterRight.toLowerCase();
    
    const thumbInnerRight = flatArray[39] || ' ';
    layout.rightHand.thumbInner = thumbInnerRight === ' ' ? thumbInnerRight : thumbInnerRight.toLowerCase();
    
    return layout;
}

// Make available globally for browser scripts and export for ES modules
if (typeof window !== 'undefined') {
    window.cyanophageToKeyboard = cyanophageToKeyboard;
    window.keyboardToCyanophage = keyboardToCyanophage;
    window.parseCyanophageUrl = parseCyanophageUrl;
    window.flatArrayToKeyboard = flatArrayToKeyboard;
}

export { cyanophageToKeyboard, keyboardToCyanophage, parseCyanophageUrl, flatArrayToKeyboard };
