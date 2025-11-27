/**
 * Keyboard Visualization
 * Renders split keyboard layouts as SVG
 */

// --- KEYBOARD VIEW TYPES ---
const KEYBOARD_VIEW = {
    COLSTAG: 'colstag',   // Columnar staggered (split ergo keyboards)
    ORTHO: 'ortho',        // Ortholinear (grid layout)
    ROWSTAG: 'rowstag'     // Row staggered (traditional keyboards)
};

// --- KEYBOARD VIEW PREFERENCE STORAGE ---
function getKeyboardViewPreference() {
    const saved = localStorage.getItem('keyboardViewPreference');
    return saved || KEYBOARD_VIEW.COLSTAG;
}

function setKeyboardViewPreference(view) {
    localStorage.setItem('keyboardViewPreference', view);
    // Dispatch custom event so all pages can react
    window.dispatchEvent(new CustomEvent('keyboardViewChanged', { detail: { view } }));
}

// --- CONFIGURATION CONSTANTS ---

// Key dimensions
const KEY_W = 50;
const KEY_H = 50;
const GAP = 5;

// Total size (key + gap)
const KS = KEY_W + GAP;

// Columnar stagger (vertical offset for each column)
// ZSA Voyager stagger: middle finger highest, ring/index same & lower, pinky twice as low
const STAGGER = [20, 20, 10, 0, 10, 20];

// Hand offsets for columnar staggered
const LEFT_HAND_X = 50;
const LEFT_HAND_Y = 10;
const RIGHT_HAND_X = 425;
const RIGHT_HAND_Y = 10;

// Thumb cluster offsets
const THUMB_Y_OFFSET = 180;

// --- KEY POSITION GENERATORS ---

/**
 * Generate key positions for columnar staggered layout (split ergo keyboards)
 */
function getColstagPositions() {
    return [
        // Left Hand - Top row (0-5)
        { x: LEFT_HAND_X + KS * 0, y: LEFT_HAND_Y + KS * 0 + STAGGER[0], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 1, y: LEFT_HAND_Y + KS * 0 + STAGGER[1], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 2, y: LEFT_HAND_Y + KS * 0 + STAGGER[2], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 3, y: LEFT_HAND_Y + KS * 0 + STAGGER[3], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 4, y: LEFT_HAND_Y + KS * 0 + STAGGER[4], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 5, y: LEFT_HAND_Y + KS * 0 + STAGGER[5], w: KEY_W, h: KEY_H },
        
        // Right Hand - Top row (6-11)
        { x: RIGHT_HAND_X + KS * 0, y: RIGHT_HAND_Y + KS * 0 + STAGGER[5], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 1, y: RIGHT_HAND_Y + KS * 0 + STAGGER[4], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 2, y: RIGHT_HAND_Y + KS * 0 + STAGGER[3], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 3, y: RIGHT_HAND_Y + KS * 0 + STAGGER[2], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 4, y: RIGHT_HAND_Y + KS * 0 + STAGGER[1], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 5, y: RIGHT_HAND_Y + KS * 0 + STAGGER[0], w: KEY_W, h: KEY_H },

        // Left Hand - Home row (12-17)
        { x: LEFT_HAND_X + KS * 0, y: LEFT_HAND_Y + KS * 1 + STAGGER[0], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 1, y: LEFT_HAND_Y + KS * 1 + STAGGER[1], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 2, y: LEFT_HAND_Y + KS * 1 + STAGGER[2], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 3, y: LEFT_HAND_Y + KS * 1 + STAGGER[3], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 4, y: LEFT_HAND_Y + KS * 1 + STAGGER[4], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 5, y: LEFT_HAND_Y + KS * 1 + STAGGER[5], w: KEY_W, h: KEY_H },
        
        // Right Hand - Home row (18-23)
        { x: RIGHT_HAND_X + KS * 0, y: RIGHT_HAND_Y + KS * 1 + STAGGER[5], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 1, y: RIGHT_HAND_Y + KS * 1 + STAGGER[4], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 2, y: RIGHT_HAND_Y + KS * 1 + STAGGER[3], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 3, y: RIGHT_HAND_Y + KS * 1 + STAGGER[2], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 4, y: RIGHT_HAND_Y + KS * 1 + STAGGER[1], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 5, y: RIGHT_HAND_Y + KS * 1 + STAGGER[0], w: KEY_W, h: KEY_H },

        // Left Hand - Bottom row (24-29)
        { x: LEFT_HAND_X + KS * 0, y: LEFT_HAND_Y + KS * 2 + STAGGER[0], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 1, y: LEFT_HAND_Y + KS * 2 + STAGGER[1], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 2, y: LEFT_HAND_Y + KS * 2 + STAGGER[2], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 3, y: LEFT_HAND_Y + KS * 2 + STAGGER[3], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 4, y: LEFT_HAND_Y + KS * 2 + STAGGER[4], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 5, y: LEFT_HAND_Y + KS * 2 + STAGGER[5], w: KEY_W, h: KEY_H },
        
        // Right Hand - Bottom row (30-35)
        { x: RIGHT_HAND_X + KS * 0, y: RIGHT_HAND_Y + KS * 2 + STAGGER[5], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 1, y: RIGHT_HAND_Y + KS * 2 + STAGGER[4], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 2, y: RIGHT_HAND_Y + KS * 2 + STAGGER[3], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 3, y: RIGHT_HAND_Y + KS * 2 + STAGGER[2], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 4, y: RIGHT_HAND_Y + KS * 2 + STAGGER[1], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 5, y: RIGHT_HAND_Y + KS * 2 + STAGGER[0], w: KEY_W, h: KEY_H },

        // Thumbs (36-39)
        { x: LEFT_HAND_X + KS * 4, y: LEFT_HAND_Y + THUMB_Y_OFFSET + STAGGER[4], w: KEY_W, h: KEY_H },
        { x: LEFT_HAND_X + KS * 5, y: LEFT_HAND_Y + THUMB_Y_OFFSET + STAGGER[5], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 0, y: RIGHT_HAND_Y + THUMB_Y_OFFSET + STAGGER[5], w: KEY_W, h: KEY_H },
        { x: RIGHT_HAND_X + KS * 1, y: RIGHT_HAND_Y + THUMB_Y_OFFSET + STAGGER[4], w: KEY_W, h: KEY_H }
    ];
}

/**
 * Generate key positions for ortholinear layout (grid layout)
 */
function getOrthoPositions() {
    const ORTHO_LEFT_X = 50;
    const ORTHO_RIGHT_X = 425;
    const ORTHO_Y = 10;
    
    return [
        // Left Hand - Top row (0-5)
        { x: ORTHO_LEFT_X + KS * 0, y: ORTHO_Y + KS * 0, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 1, y: ORTHO_Y + KS * 0, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 2, y: ORTHO_Y + KS * 0, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 3, y: ORTHO_Y + KS * 0, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 4, y: ORTHO_Y + KS * 0, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 5, y: ORTHO_Y + KS * 0, w: KEY_W, h: KEY_H },
        
        // Right Hand - Top row (6-11)
        { x: ORTHO_RIGHT_X + KS * 0, y: ORTHO_Y + KS * 0, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 1, y: ORTHO_Y + KS * 0, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 2, y: ORTHO_Y + KS * 0, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 3, y: ORTHO_Y + KS * 0, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 4, y: ORTHO_Y + KS * 0, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 5, y: ORTHO_Y + KS * 0, w: KEY_W, h: KEY_H },

        // Left Hand - Home row (12-17)
        { x: ORTHO_LEFT_X + KS * 0, y: ORTHO_Y + KS * 1, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 1, y: ORTHO_Y + KS * 1, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 2, y: ORTHO_Y + KS * 1, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 3, y: ORTHO_Y + KS * 1, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 4, y: ORTHO_Y + KS * 1, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 5, y: ORTHO_Y + KS * 1, w: KEY_W, h: KEY_H },
        
        // Right Hand - Home row (18-23)
        { x: ORTHO_RIGHT_X + KS * 0, y: ORTHO_Y + KS * 1, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 1, y: ORTHO_Y + KS * 1, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 2, y: ORTHO_Y + KS * 1, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 3, y: ORTHO_Y + KS * 1, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 4, y: ORTHO_Y + KS * 1, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 5, y: ORTHO_Y + KS * 1, w: KEY_W, h: KEY_H },

        // Left Hand - Bottom row (24-29)
        { x: ORTHO_LEFT_X + KS * 0, y: ORTHO_Y + KS * 2, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 1, y: ORTHO_Y + KS * 2, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 2, y: ORTHO_Y + KS * 2, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 3, y: ORTHO_Y + KS * 2, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 4, y: ORTHO_Y + KS * 2, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 5, y: ORTHO_Y + KS * 2, w: KEY_W, h: KEY_H },
        
        // Right Hand - Bottom row (30-35)
        { x: ORTHO_RIGHT_X + KS * 0, y: ORTHO_Y + KS * 2, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 1, y: ORTHO_Y + KS * 2, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 2, y: ORTHO_Y + KS * 2, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 3, y: ORTHO_Y + KS * 2, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 4, y: ORTHO_Y + KS * 2, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 5, y: ORTHO_Y + KS * 2, w: KEY_W, h: KEY_H },

        // Thumbs (36-39) - positioned below index fingers
        { x: ORTHO_LEFT_X + KS * 4, y: ORTHO_Y + KS * 3, w: KEY_W, h: KEY_H },
        { x: ORTHO_LEFT_X + KS * 5, y: ORTHO_Y + KS * 3, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 0, y: ORTHO_Y + KS * 3, w: KEY_W, h: KEY_H },
        { x: ORTHO_RIGHT_X + KS * 1, y: ORTHO_Y + KS * 3, w: KEY_W, h: KEY_H }
    ];
}

/**
 * Generate key positions for row staggered layout (traditional keyboards)
 * Each row is horizontally offset to create the classic stagger pattern
 * Outer keys (Tab, Caps, etc.) are RIGHT-aligned to their row's alpha keys
 */
function getRowstagPositions() {
    const ROWSTAG_Y = 10;
    const ROWSTAG_BASE_X = 30;
    
    const positions = [];
    
    // Row stagger: how much each row's alpha keys shift RIGHT relative to top row
    // Traditional keyboard stagger pattern
    const rowStaggerPx = {
        0: 0,                    // Top row - reference
        1: 0.25 * KEY_W,         // Home row - 12.5px right
        2: 0.75 * KEY_W          // Bottom row - 37.5px right (more indent)
    };
    
    // Fixed key widths for outer keys (in key units)
    const TAB_WIDTH = 1.5;           // Tab is 1.5 units wide
    const CAPS_WIDTH = 1.75;         // Caps Lock is 1.75 units wide  
    const BOTTOM_OUTER_WIDTH = 1.0;  // Bottom row outer is normal 1u key
    
    // Calculate widths in pixels
    const tabWidthPx = TAB_WIDTH * KEY_W + (TAB_WIDTH - 1) * GAP;
    const capsWidthPx = CAPS_WIDTH * KEY_W + (CAPS_WIDTH - 1) * GAP;
    const bottomOuterWidthPx = BOTTOM_OUTER_WIDTH * KEY_W;
    
    // Top row alpha keys start here (reference point for stagger)
    const topRowAlphaStartX = ROWSTAG_BASE_X + tabWidthPx + GAP;
    
    for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
        const rowY = ROWSTAG_Y + rowIndex * KS;
        const rowOffset = rowStaggerPx[rowIndex];
        
        // Alpha keys start from the reference point plus row stagger
        const alphaStartX = topRowAlphaStartX + rowOffset;
        
        // Determine outer key properties for this row
        let outerKeyWidthPx, outerKeyIndex;
        if (rowIndex === 0) {
            outerKeyWidthPx = tabWidthPx;
            outerKeyIndex = 0;
        } else if (rowIndex === 1) {
            outerKeyWidthPx = capsWidthPx;
            outerKeyIndex = 12;
        } else {
            outerKeyWidthPx = bottomOuterWidthPx;
            outerKeyIndex = 24;
        }
        
        // RIGHT-align outer keys to their row's alpha keys
        // Outer key's right edge + GAP = alphaStartX
        const outerKeyX = alphaStartX - GAP - outerKeyWidthPx;
        
        positions[outerKeyIndex] = {
            x: outerKeyX,
            y: rowY,
            w: outerKeyWidthPx,
            h: KEY_H
        };
        
        // Left hand alpha keys (5 keys per row)
        const leftStartIndex = rowIndex === 0 ? 1 : (rowIndex === 1 ? 13 : 25);
        for (let i = 0; i < 5; i++) {
            positions[leftStartIndex + i] = {
                x: alphaStartX + i * KS,
                y: rowY,
                w: KEY_W,
                h: KEY_H
            };
        }
        
        // Right hand alpha keys (6 keys per row)
        // Add a gap between hands
        const HAND_GAP = KS * 0.5;
        const rightStartX = alphaStartX + 5 * KS + HAND_GAP;
        const rightStartIndex = rowIndex === 0 ? 6 : (rowIndex === 1 ? 18 : 30);
        
        for (let i = 0; i < 6; i++) {
            positions[rightStartIndex + i] = {
                x: rightStartX + i * KS,
                y: rowY,
                w: KEY_W,
                h: KEY_H
            };
        }
    }
    
    // Thumb keys - positioned below the inner index finger columns
    const thumbY = ROWSTAG_Y + 3 * KS;
    positions[36] = { x: positions[16].x, y: thumbY, w: KEY_W, h: KEY_H }; // Left inner thumb
    positions[37] = { x: positions[17].x, y: thumbY, w: KEY_W, h: KEY_H }; // Left outer thumb
    positions[38] = { x: positions[18].x, y: thumbY, w: KEY_W, h: KEY_H }; // Right outer thumb
    positions[39] = { x: positions[19].x, y: thumbY, w: KEY_W, h: KEY_H }; // Right inner thumb
    
    return positions;
}

/**
 * Get key positions for the specified view type
 * @param {string} viewType - One of KEYBOARD_VIEW values
 * @returns {Array} Array of key position objects
 */
function getKeyPositions(viewType) {
    switch (viewType) {
        case KEYBOARD_VIEW.ORTHO:
            return getOrthoPositions();
        case KEYBOARD_VIEW.ROWSTAG:
            return getRowstagPositions();
        case KEYBOARD_VIEW.COLSTAG:
        default:
            return getColstagPositions();
    }
}

// Key positions array (40 keys total) - default to columnar staggered
// Matches the KeyIndex and KeyMetadata structure from keyboard.js
const keyPositions = getColstagPositions();

// SVG Namespace
const ns = "http://www.w3.org/2000/svg";

/**
 * Creates a single key group (rect + text).
 * @param {number} id - The key index (0-39)
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} w - Key width (default KEY_W)
 * @param {number} h - Key height (default KEY_H)
 * @param {boolean} isHome - Whether this is a home row key
 * @param {boolean} isThumb - Whether this is a thumb key
 * @param {Object} options - Additional options
 * @param {boolean} options.showSecondaryLegend - Whether to show secondary legend (top-right)
 * @param {string} options.viewType - The keyboard view type (affects thumb rotation)
 */
function createKey(id, x, y, w, h, isHome, isThumb, options = {}) {
    const { showSecondaryLegend = false, viewType = KEYBOARD_VIEW.COLSTAG } = options;
    const keyWidth = w || KEY_W;
    const keyHeight = h || KEY_H;
    
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

    // Apply rotation for thumb keys (only for columnar staggered view)
    if (isThumb && viewType === KEYBOARD_VIEW.COLSTAG) {
        let angle = 0;
        if (id === 36) angle = 6;   // Left inner thumb
        if (id === 37) angle = 12;  // Left outer thumb
        if (id === 38) angle = -12; // Right outer thumb
        if (id === 39) angle = -6;  // Right inner thumb
        
        const centerX = x + keyWidth / 2;
        const centerY = y + keyHeight / 2;
        group.setAttribute('transform', `rotate(${angle} ${centerX} ${centerY})`);
    }

    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', keyWidth);
    rect.setAttribute('height', keyHeight);
    rect.setAttribute('class', 'key-rect');
    
    // Main legend (center of key)
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('id', `key-legend-${id}`);
    text.setAttribute('x', x + keyWidth / 2);
    text.setAttribute('y', y + keyHeight / 2);
    text.setAttribute('class', 'key-legend');
    text.textContent = '';
    
    group.appendChild(rect);
    group.appendChild(text);
    
    // Secondary legend (top-right corner) - for showing known layout key
    if (showSecondaryLegend) {
        const secondaryText = document.createElementNS(ns, 'text');
        secondaryText.setAttribute('id', `key-legend-secondary-${id}`);
        secondaryText.setAttribute('x', x + keyWidth - 8);
        secondaryText.setAttribute('y', y + 14);
        secondaryText.setAttribute('class', 'key-legend-secondary');
        secondaryText.textContent = '';
        group.appendChild(secondaryText);
    }
    
    return group;
}

// Width reserved for view switcher on the right side
const VIEW_SWITCHER_WIDTH = 50;

/**
 * Creates a view switcher control to toggle between keyboard layouts
 * Positioned vertically on the right side of the keyboard
 * @param {SVGElement} svgElement - The SVG element to add the switcher to
 * @param {string} currentView - Current view type
 * @param {Function} onViewChange - Callback when view changes
 * @param {number} keyboardMaxY - Maximum Y position of keyboard keys (for vertical centering)
 */
function createViewSwitcher(svgElement, currentView, onViewChange, keyboardMaxY) {
    const switcherGroup = document.createElementNS(ns, 'g');
    switcherGroup.setAttribute('class', 'keyboard-view-switcher');
    
    // Get SVG viewBox to position on right side
    const viewBox = svgElement.getAttribute('viewBox').split(' ').map(Number);
    const svgWidth = viewBox[2];
    
    const views = [
        { id: KEYBOARD_VIEW.COLSTAG, label: 'Col', title: 'Columnar Staggered' },
        { id: KEYBOARD_VIEW.ORTHO, label: 'Ortho', title: 'Ortholinear' },
        { id: KEYBOARD_VIEW.ROWSTAG, label: 'Row', title: 'Row Staggered' }
    ];
    
    const buttonWidth = 38;
    const buttonHeight = 22;
    const buttonGap = 3;
    const totalHeight = views.length * buttonHeight + (views.length - 1) * buttonGap;
    
    // Position on right side, vertically centered with the keyboard
    const startX = svgWidth - buttonWidth - 8;
    const startY = Math.max(10, (keyboardMaxY - totalHeight) / 2);
    
    views.forEach((view, i) => {
        const buttonGroup = document.createElementNS(ns, 'g');
        buttonGroup.setAttribute('class', `view-switch-btn ${currentView === view.id ? 'active' : ''}`);
        buttonGroup.setAttribute('data-view', view.id);
        buttonGroup.style.cursor = 'pointer';
        
        const rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('x', startX);
        rect.setAttribute('y', startY + i * (buttonHeight + buttonGap));
        rect.setAttribute('width', buttonWidth);
        rect.setAttribute('height', buttonHeight);
        rect.setAttribute('rx', 4);
        rect.setAttribute('fill', 'transparent');
        rect.setAttribute('class', 'view-switch-rect');
        
        const text = document.createElementNS(ns, 'text');
        text.setAttribute('x', startX + buttonWidth / 2);
        text.setAttribute('y', startY + i * (buttonHeight + buttonGap) + buttonHeight / 2 + 1);
        text.setAttribute('class', 'view-switch-text');
        text.textContent = view.label;
        
        // Add title for tooltip
        const title = document.createElementNS(ns, 'title');
        title.textContent = view.title;
        buttonGroup.appendChild(title);
        
        buttonGroup.appendChild(rect);
        buttonGroup.appendChild(text);
        
        // Add click handler
        buttonGroup.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentView !== view.id) {
                setKeyboardViewPreference(view.id);
                if (onViewChange) {
                    onViewChange(view.id);
                }
            }
        });
        
        switcherGroup.appendChild(buttonGroup);
    });
    
    return switcherGroup;
}

/**
 * Draws the keyboard skeleton (empty keys)
 * @param {SVGElement} svgElement - The SVG element to draw in
 * @param {boolean} showThumbs - Whether to show thumb keys
 * @param {Object} options - Additional drawing options
 * @param {boolean} options.showSecondaryLegend - Whether to add secondary legend elements
 * @param {string} options.viewType - The keyboard view type (colstag, ortho, rowstag)
 * @param {boolean} options.showViewSwitcher - Whether to show the view switcher (default: true)
 * @param {Function} options.onViewChange - Callback when view type changes
 */
function drawKeyboard(svgElement, showThumbs = true, options = {}) {
    const { 
        showSecondaryLegend = false, 
        viewType = getKeyboardViewPreference(),
        showViewSwitcher = true,
        onViewChange = null
    } = options;
    
    svgElement.innerHTML = '';
    
    // Get positions for the current view type
    const positions = getKeyPositions(viewType);
    
    // Calculate viewBox dimensions based on key positions
    let maxX = 0;
    let maxY = 0;
    positions.forEach((pos, i) => {
        const isThumb = i >= 36;
        if (isThumb && !showThumbs) return;
        
        const keyWidth = pos.w || KEY_W;
        const keyHeight = pos.h || KEY_H;
        maxX = Math.max(maxX, pos.x + keyWidth);
        maxY = Math.max(maxY, pos.y + keyHeight);
    });
    
    // Add padding, and extra width for view switcher on the right
    const viewBoxWidth = maxX + (showViewSwitcher ? VIEW_SWITCHER_WIDTH + 15 : 20);
    const viewBoxHeight = maxY + 20;
    
    svgElement.setAttribute('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
    svgElement.setAttribute('height', viewBoxHeight);
    
    // Add view switcher if enabled (positioned on right side)
    if (showViewSwitcher) {
        const switcher = createViewSwitcher(svgElement, viewType, onViewChange, maxY);
        svgElement.appendChild(switcher);
    }
    
    positions.forEach((pos, i) => {
        const isHome = (i >= 12 && i <= 17) || (i >= 18 && i <= 23);
        const isThumb = i >= 36;
        
        // Skip thumb keys if not showing thumbs
        if (isThumb && !showThumbs) return;
        
        const key = createKey(i, pos.x, pos.y, pos.w, pos.h, isHome, isThumb, { 
            showSecondaryLegend,
            viewType 
        });
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
 * @param {Object} options - Additional rendering options
 * @param {boolean} options.showViewSwitcher - Whether to show the view switcher
 * @param {Function} options.onViewChange - Callback when view changes (will re-render)
 */
function renderKeyboard(layout, svgElement, options = {}) {
    const { showViewSwitcher = true, onViewChange = null } = options;
    const hasThumbs = layout.hasThumbKeys();
    const viewType = getKeyboardViewPreference();
    
    // Create a callback that re-renders on view change
    const handleViewChange = (newView) => {
        renderKeyboard(layout, svgElement, options);
        if (onViewChange) {
            onViewChange(newView);
        }
    };
    
    drawKeyboard(svgElement, hasThumbs, { 
        viewType,
        showViewSwitcher,
        onViewChange: handleViewChange
    });
    
    const flatArray = layout.toFlatArray();
    updateKeyboardFromArray(flatArray, svgElement);
}

/**
 * Renders a keyboard with both target layout (main) and known layout (secondary) legends
 * Used for the try-layout page to show what keys to press
 * @param {KeyboardLayout} targetLayout - The layout being tried (shown as main legend)
 * @param {KeyboardLayout} knownLayout - The user's known layout (shown in top-right)
 * @param {SVGElement} svgElement - The SVG element to render to
 * @param {Object} options - Additional rendering options
 * @param {boolean} options.showViewSwitcher - Whether to show the view switcher
 * @param {Function} options.onViewChange - Callback when view changes (will re-render)
 */
function renderKeyboardWithMapping(targetLayout, knownLayout, svgElement, options = {}) {
    const { showViewSwitcher = true, onViewChange = null } = options;
    const targetHasThumbs = targetLayout.hasThumbKeys();
    const knownHasThumbs = knownLayout.hasThumbKeys();
    const viewType = getKeyboardViewPreference();
    
    // Show thumb keys if either layout has them
    const showThumbs = targetHasThumbs || knownHasThumbs;
    
    // Create a callback that re-renders on view change
    const handleViewChange = (newView) => {
        renderKeyboardWithMapping(targetLayout, knownLayout, svgElement, options);
        if (onViewChange) {
            onViewChange(newView);
        }
    };
    
    // Draw keyboard with secondary legend support
    drawKeyboard(svgElement, showThumbs, { 
        showSecondaryLegend: true,
        viewType,
        showViewSwitcher,
        onViewChange: handleViewChange
    });
    
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
    window.KEYBOARD_VIEW = KEYBOARD_VIEW;
    window.getKeyboardViewPreference = getKeyboardViewPreference;
    window.setKeyboardViewPreference = setKeyboardViewPreference;
    window.getKeyPositions = getKeyPositions;
}

// ES module exports
export { 
    renderKeyboard, 
    renderKeyboardWithMapping, 
    drawKeyboard, 
    updateKeyboardFromArray, 
    updateSecondaryLegends,
    KEYBOARD_VIEW,
    getKeyboardViewPreference,
    setKeyboardViewPreference,
    getKeyPositions
};
