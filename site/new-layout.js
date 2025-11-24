/**
 * New Layout Generator - Page Logic
 * Uses modular keyboard functions from keyboard.js, cyanophage.js, and keyboard-visualization.js
 */

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
            layout.setLeftKey(rowIndex, leftStartCol + i, leftKeys[i].toLowerCase());
        }
        
        // Right hand: left-align in columns 0-4 (position 5 is typically unused)
        // Keys fill from column 0 onwards, up to max 5 keys
        for (let i = 0; i < rightKeys.length && i < 5; i++) {
            layout.setRightKey(rowIndex, i, rightKeys[i].toLowerCase());
        }
        
        // If right hand has a 6th key, it might be in position 5 (outermost)
        if (rightKeys.length > 5) {
            layout.setRightKey(rowIndex, 5, rightKeys[5].toLowerCase());
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
                    layout.rightHand.thumbOuter = thumbChars[0].toLowerCase();
                } else {
                    // Thumb on left side (outer position only)
                    layout.leftHand.thumbOuter = thumbChars[0].toLowerCase();
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
    const svg = document.getElementById('keyboard-preview-svg');
    const hasLeftThumb = layout.leftHand.thumbOuter && layout.leftHand.thumbOuter !== ' ';
    const hasRightThumb = layout.rightHand.thumbOuter && layout.rightHand.thumbOuter !== ' ';
    const hasThumbs = hasLeftThumb || hasRightThumb;
    
    renderKeyboard(layout, svg);
    
    // STEP 3: Convert KeyboardLayout to Cyanophage URL
    const url = keyboardToCyanophage(layout);
    
    // STEP 4: Generate YAML configuration
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
