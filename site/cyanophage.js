/**
 * Cyanophage URL Converter
 * Handles translation between Cyanophage URLs and KeyboardLayout data structures
 */

import { KeyboardLayout } from './keyboard.js';

// Cyanophage KEY_MAP: maps 34 string positions to 34 physical keyboard positions
// Based on user-provided map (image_257205.jpg)
const CYANOPHAGE_KEY_MAP = [
    // User keys 1-11 (string pos 0-10)
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    // User keys 12-22 (string pos 11-21)
    13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    // User keys 23-32 (string pos 22-31)
    25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
    // User key 33 (string pos 32)
    24,
    // User key 35 (string pos 34)
    12
];

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

export { cyanophageToKeyboard, keyboardToCyanophage, parseCyanophageUrl, flatArrayToKeyboard };