/**
 * Keyboard Visualization
 * Renders split keyboard layouts as SVG
 */

// --- CONFIGURATION CONSTANTS ---

// Key dimensions
const KEY_W = 50;
const KEY_H = 50;
const KEY_RX = 6;
const GAP = 5;

// Total size (key + gap)
const KS = KEY_W + GAP;

// Columnar stagger (vertical offset for each column)
// ZSA Voyager stagger: middle finger highest, ring/index same & lower, pinky twice as low
const STAGGER = [20, 20, 10, 0, 10, 20];

// Hand offsets
const LEFT_HAND_X = 50;
const LEFT_HAND_Y = 10;
const RIGHT_HAND_X = 425;
const RIGHT_HAND_Y = 10;

// Thumb cluster offsets
const THUMB_Y_OFFSET = 180;

// Key positions array (40 keys total)
// Matches the KeyIndex and KeyMetadata structure from keyboard.js
const keyPositions = [
    // Left Hand - Top row (0-5)
    { x: LEFT_HAND_X + KS * 0, y: LEFT_HAND_Y + KS * 0 + STAGGER[0] },
    { x: LEFT_HAND_X + KS * 1, y: LEFT_HAND_Y + KS * 0 + STAGGER[1] },
    { x: LEFT_HAND_X + KS * 2, y: LEFT_HAND_Y + KS * 0 + STAGGER[2] },
    { x: LEFT_HAND_X + KS * 3, y: LEFT_HAND_Y + KS * 0 + STAGGER[3] },
    { x: LEFT_HAND_X + KS * 4, y: LEFT_HAND_Y + KS * 0 + STAGGER[4] },
    { x: LEFT_HAND_X + KS * 5, y: LEFT_HAND_Y + KS * 0 + STAGGER[5] },
    
    // Right Hand - Top row (6-11)
    { x: RIGHT_HAND_X + KS * 0, y: RIGHT_HAND_Y + KS * 0 + STAGGER[5] },
    { x: RIGHT_HAND_X + KS * 1, y: RIGHT_HAND_Y + KS * 0 + STAGGER[4] },
    { x: RIGHT_HAND_X + KS * 2, y: RIGHT_HAND_Y + KS * 0 + STAGGER[3] },
    { x: RIGHT_HAND_X + KS * 3, y: RIGHT_HAND_Y + KS * 0 + STAGGER[2] },
    { x: RIGHT_HAND_X + KS * 4, y: RIGHT_HAND_Y + KS * 0 + STAGGER[1] },
    { x: RIGHT_HAND_X + KS * 5, y: RIGHT_HAND_Y + KS * 0 + STAGGER[0] },

    // Left Hand - Home row (12-17)
    { x: LEFT_HAND_X + KS * 0, y: LEFT_HAND_Y + KS * 1 + STAGGER[0] },
    { x: LEFT_HAND_X + KS * 1, y: LEFT_HAND_Y + KS * 1 + STAGGER[1] },
    { x: LEFT_HAND_X + KS * 2, y: LEFT_HAND_Y + KS * 1 + STAGGER[2] },
    { x: LEFT_HAND_X + KS * 3, y: LEFT_HAND_Y + KS * 1 + STAGGER[3] },
    { x: LEFT_HAND_X + KS * 4, y: LEFT_HAND_Y + KS * 1 + STAGGER[4] },
    { x: LEFT_HAND_X + KS * 5, y: LEFT_HAND_Y + KS * 1 + STAGGER[5] },
    
    // Right Hand - Home row (18-23)
    { x: RIGHT_HAND_X + KS * 0, y: RIGHT_HAND_Y + KS * 1 + STAGGER[5] },
    { x: RIGHT_HAND_X + KS * 1, y: RIGHT_HAND_Y + KS * 1 + STAGGER[4] },
    { x: RIGHT_HAND_X + KS * 2, y: RIGHT_HAND_Y + KS * 1 + STAGGER[3] },
    { x: RIGHT_HAND_X + KS * 3, y: RIGHT_HAND_Y + KS * 1 + STAGGER[2] },
    { x: RIGHT_HAND_X + KS * 4, y: RIGHT_HAND_Y + KS * 1 + STAGGER[1] },
    { x: RIGHT_HAND_X + KS * 5, y: RIGHT_HAND_Y + KS * 1 + STAGGER[0] },

    // Left Hand - Bottom row (24-29)
    { x: LEFT_HAND_X + KS * 0, y: LEFT_HAND_Y + KS * 2 + STAGGER[0] },
    { x: LEFT_HAND_X + KS * 1, y: LEFT_HAND_Y + KS * 2 + STAGGER[1] },
    { x: LEFT_HAND_X + KS * 2, y: LEFT_HAND_Y + KS * 2 + STAGGER[2] },
    { x: LEFT_HAND_X + KS * 3, y: LEFT_HAND_Y + KS * 2 + STAGGER[3] },
    { x: LEFT_HAND_X + KS * 4, y: LEFT_HAND_Y + KS * 2 + STAGGER[4] },
    { x: LEFT_HAND_X + KS * 5, y: LEFT_HAND_Y + KS * 2 + STAGGER[5] },
    
    // Right Hand - Bottom row (30-35)
    { x: RIGHT_HAND_X + KS * 0, y: RIGHT_HAND_Y + KS * 2 + STAGGER[5] },
    { x: RIGHT_HAND_X + KS * 1, y: RIGHT_HAND_Y + KS * 2 + STAGGER[4] },
    { x: RIGHT_HAND_X + KS * 2, y: RIGHT_HAND_Y + KS * 2 + STAGGER[3] },
    { x: RIGHT_HAND_X + KS * 3, y: RIGHT_HAND_Y + KS * 2 + STAGGER[2] },
    { x: RIGHT_HAND_X + KS * 4, y: RIGHT_HAND_Y + KS * 2 + STAGGER[1] },
    { x: RIGHT_HAND_X + KS * 5, y: RIGHT_HAND_Y + KS * 2 + STAGGER[0] },

    // Thumbs (36-39)
    { x: LEFT_HAND_X + KS * 4, y: LEFT_HAND_Y + THUMB_Y_OFFSET + STAGGER[4] },
    { x: LEFT_HAND_X + KS * 5, y: LEFT_HAND_Y + THUMB_Y_OFFSET + STAGGER[5] },
    { x: RIGHT_HAND_X + KS * 0, y: RIGHT_HAND_Y + THUMB_Y_OFFSET + STAGGER[5] },
    { x: RIGHT_HAND_X + KS * 1, y: RIGHT_HAND_Y + THUMB_Y_OFFSET + STAGGER[4] }
];

// SVG Namespace
const ns = "http://www.w3.org/2000/svg";

/**
 * Creates a single key group (rect + text).
 * @param {number} id - The key index (0-39)
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {boolean} isHome - Whether this is a home row key
 * @param {boolean} isThumb - Whether this is a thumb key
 * @param {Object} options - Additional options
 * @param {boolean} options.showSecondaryLegend - Whether to show secondary legend (top-right)
 */
function createKey(id, x, y, isHome, isThumb, options = {}) {
    const { showSecondaryLegend = false } = options;
    const group = document.createElementNS(ns, 'g');
    group.setAttribute('id', `key-group-${id}`);
    
    // Home position keys are the 8 middle keys of the home row (indices 13-16 and 19-22)
    // Use metadata if available, otherwise fall back to index check
    let isHomePosition = false;
    if (typeof KeyMetadata !== 'undefined' && KeyMetadata[id]) {
        isHomePosition = KeyMetadata[id].homePosition === true;
    } else {
        // Fallback: indices 13-16 (left hand) and 19-22 (right hand)
        isHomePosition = (id >= 13 && id <= 16) || (id >= 19 && id <= 22);
    }
    
    let groupClass = 'key';
    if (isHome) groupClass += ' home-key';
    if (isThumb) groupClass += ' thumb-key';
    if (isHomePosition) groupClass += ' home-position-key';
    group.setAttribute('class', groupClass);

    // Apply rotation for thumb keys
    if (isThumb) {
        let angle = 0;
        if (id === 36) angle = 6;   // Left inner thumb
        if (id === 37) angle = 12;  // Left outer thumb
        if (id === 38) angle = -12; // Right outer thumb
        if (id === 39) angle = -6;  // Right inner thumb
        
        const centerX = x + KEY_W / 2;
        const centerY = y + KEY_H / 2;
        group.setAttribute('transform', `rotate(${angle} ${centerX} ${centerY})`);
    }

    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', KEY_W);
    rect.setAttribute('height', KEY_H);
    rect.setAttribute('class', 'key-rect');
    
    // Main legend (center of key)
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('id', `key-legend-${id}`);
    text.setAttribute('x', x + KEY_W / 2);
    text.setAttribute('y', y + KEY_H / 2);
    text.setAttribute('class', 'key-legend');
    text.textContent = '';
    
    group.appendChild(rect);
    group.appendChild(text);
    
    // Secondary legend (top-right corner) - for showing known layout key
    if (showSecondaryLegend) {
        const secondaryText = document.createElementNS(ns, 'text');
        secondaryText.setAttribute('id', `key-legend-secondary-${id}`);
        secondaryText.setAttribute('x', x + KEY_W - 8);
        secondaryText.setAttribute('y', y + 14);
        secondaryText.setAttribute('class', 'key-legend-secondary');
        secondaryText.textContent = '';
        group.appendChild(secondaryText);
    }
    
    return group;
}

/**
 * Draws the keyboard skeleton (empty keys)
 * @param {SVGElement} svgElement - The SVG element to draw in
 * @param {boolean} showThumbs - Whether to show thumb keys
 * @param {Object} options - Additional drawing options
 * @param {boolean} options.showSecondaryLegend - Whether to add secondary legend elements
 */
function drawKeyboard(svgElement, showThumbs = true, options = {}) {
    const { showSecondaryLegend = false } = options;
    svgElement.innerHTML = '';
    
    // Adjust SVG viewBox height based on whether thumbs are shown
    if (showThumbs) {
        svgElement.setAttribute('viewBox', '0 0 800 280');
        svgElement.setAttribute('height', '280');
    } else {
        svgElement.setAttribute('viewBox', '0 0 800 220');
        svgElement.setAttribute('height', '220');
    }
    
    keyPositions.forEach((pos, i) => {
        const isHome = (i >= 12 && i <= 17) || (i >= 18 && i <= 23);
        const isThumb = i >= 36;
        
        // Skip thumb keys if not showing thumbs
        if (isThumb && !showThumbs) return;
        
        const key = createKey(i, pos.x, pos.y, isHome, isThumb, { showSecondaryLegend });
        svgElement.appendChild(key);
    });
}

/**
 * Updates key legends from a 40-element flat array
 * @param {Array} layoutArray - 40-element array of key characters
 * @param {SVGElement} svgElement - The SVG element containing the keyboard
 */
function updateKeyboardFromArray(layoutArray, svgElement) {
    for (let i = 0; i < 40; i++) {
        const textElement = svgElement.querySelector(`#key-legend-${i}`);
        const keyGroup = svgElement.querySelector(`#key-group-${i}`);
        
        if (textElement && keyGroup) {
            const char = layoutArray[i] || ' ';
            const isAssigned = char !== ' ' && char !== '';
            
            textElement.textContent = char;
            
            // Add a class to unassigned keys for styling purposes
            if (isAssigned) {
                keyGroup.classList.remove('unassigned-key');
            } else {
                keyGroup.classList.add('unassigned-key');
            }
        }
    }
}

/**
 * Updates secondary key legends (top-right corner)
 * @param {Array} layoutArray - 40-element array of key characters for secondary legends
 * @param {SVGElement} svgElement - The SVG element containing the keyboard
 */
function updateSecondaryLegends(layoutArray, svgElement) {
    for (let i = 0; i < 40; i++) {
        const textElement = svgElement.querySelector(`#key-legend-secondary-${i}`);
        
        if (textElement) {
            const char = layoutArray[i] || '';
            textElement.textContent = char;
        }
    }
}

/**
 * Renders a KeyboardLayout object to an SVG element
 * @param {KeyboardLayout} layout - The keyboard layout object
 * @param {SVGElement} svgElement - The SVG element to render to
 */
function renderKeyboard(layout, svgElement) {
    const hasThumbs = layout.hasThumbKeys();
    drawKeyboard(svgElement, hasThumbs);
    
    const flatArray = layout.toFlatArray();
    updateKeyboardFromArray(flatArray, svgElement);
}

/**
 * Renders a keyboard with both target layout (main) and known layout (secondary) legends
 * Used for the try-layout page to show what keys to press
 * @param {KeyboardLayout} targetLayout - The layout being tried (shown as main legend)
 * @param {KeyboardLayout} knownLayout - The user's known layout (shown in top-right)
 * @param {SVGElement} svgElement - The SVG element to render to
 */
function renderKeyboardWithMapping(targetLayout, knownLayout, svgElement) {
    const targetHasThumbs = targetLayout.hasThumbKeys();
    const knownHasThumbs = knownLayout.hasThumbKeys();
    
    // Show thumb keys if either layout has them
    const showThumbs = targetHasThumbs || knownHasThumbs;
    
    // Draw keyboard with secondary legend support
    drawKeyboard(svgElement, showThumbs, { showSecondaryLegend: true });
    
    const targetFlat = targetLayout.toFlatArray();
    const knownFlat = knownLayout.toFlatArray();
    
    // Build mapping array for secondary legends
    // For each position, show what key the user needs to press on their known layout
    const secondaryArray = [];
    
    for (let i = 0; i < 40; i++) {
        const targetChar = targetFlat[i];
        
        // If target has a thumb key but known layout doesn't have thumb keys,
        // the user will press space for that position
        if (i >= 36 && targetChar && targetChar !== ' ' && !knownHasThumbs) {
            secondaryArray[i] = '␣'; // Space symbol
        } else {
            secondaryArray[i] = knownFlat[i] || '';
        }
    }
    
    // Update primary legends with target layout
    updateKeyboardFromArray(targetFlat, svgElement);
    
    // Update secondary legends with known layout mapping
    updateSecondaryLegends(secondaryArray, svgElement);
}

// Export to window for browser usage
if (typeof window !== 'undefined') {
    window.renderKeyboard = renderKeyboard;
    window.renderKeyboardWithMapping = renderKeyboardWithMapping;
    window.drawKeyboard = drawKeyboard;
    window.updateKeyboardFromArray = updateKeyboardFromArray;
    window.updateSecondaryLegends = updateSecondaryLegends;
}

// ES module exports
export { renderKeyboard, renderKeyboardWithMapping, drawKeyboard, updateKeyboardFromArray, updateSecondaryLegends };
