// Keyboard Layout Visualizer for Drawer
// Adapted from the cyanophage layout visualizer

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

// Key mapping order (40 keys total)
const keyPositions = [
    // Left Hand (18 keys) - Top row (0-5)
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

// Key mapping logic
const KEY_MAP = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
    24, 12
];

const THUMB_LEFT_OUTER_KEY_INDEX = 36;
const THUMB_RIGHT_OUTER_KEY_INDEX = 39;

// SVG Namespace
const ns = "http://www.w3.org/2000/svg";

/**
 * Creates a single key group (rect + text).
 */
function createKey(id, x, y, isHome, isThumb) {
    const group = document.createElementNS(ns, 'g');
    group.setAttribute('id', `key-group-${id}`);
    
    // Home position keys are the 8 keys where fingers rest (A,S,D,F and J,K,L,;)
    const isHomePosition = (id >= 13 && id <= 16) || (id >= 19 && id <= 22);
    
    let groupClass = 'key';
    if (isHome) groupClass += ' home-key';
    if (isThumb) groupClass += ' thumb-key';
    if (isHomePosition) groupClass += ' home-position-key';
    group.setAttribute('class', groupClass);

    // Apply rotation for thumb keys (20% incline towards middle)
    if (isThumb) {
        let angle = 0;
        if (id === 36) angle = 6;   // Left inner thumb: slight clockwise
        if (id === 37) angle = 12;  // Left outer thumb: more clockwise
        if (id === 38) angle = -12; // Right outer thumb: more counter-clockwise
        if (id === 39) angle = -6;  // Right inner thumb: slight counter-clockwise
        
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
    
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('id', `key-legend-${id}`);
    text.setAttribute('x', x + KEY_W / 2);
    text.setAttribute('y', y + KEY_H / 2);
    text.setAttribute('class', 'key-legend');
    text.textContent = '';
    
    group.appendChild(rect);
    group.appendChild(text);
    return group;
}

/**
 * Draws the entire 40-key keyboard skeleton.
 * @param {SVGElement} svgElement - The SVG element to draw in
 * @param {boolean} showThumbs - Whether to show thumb keys
 */
function drawKeyboard(svgElement, showThumbs = true) {
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
        
        const key = createKey(i, pos.x, pos.y, isHome, isThumb);
        svgElement.appendChild(key);
    });
}

/**
 * Updates all key legends from a 40-element layout array.
 */
function updateLayout(layoutArray, svgElement) {
    for (let i = 0; i < 40; i++) {
        const textElement = svgElement.querySelector(`#key-legend-${i}`);
        if (textElement) {
            textElement.textContent = layoutArray[i] || ' ';
        }
    }
}

/**
 * Parses the raw input string and returns the layout string and thumb side.
 */
function parseRawInput(rawValue) {
    let layoutString = rawValue;
    let thumbSide = null;

    try {
        const url = new URL(rawValue);
        layoutString = url.searchParams.get('layout') || '';
        thumbSide = url.searchParams.get('thumb');
    } catch (e) {
        try {
            const params = new URLSearchParams(rawValue.startsWith('?') ? rawValue : '?' + rawValue);
            if (params.has('layout')) {
                layoutString = params.get('layout');
                thumbSide = params.get('thumb');
            } else {
                const firstKey = params.keys().next().value;
                if (firstKey) {
                    layoutString = firstKey;
                    thumbSide = params.get('thumb');
                }
            }
        } catch (e2) {
            layoutString = rawValue.split('&')[0];
            if (rawValue.includes('&thumb=r')) thumbSide = 'r';
            if (rawValue.includes('&thumb=l')) thumbSide = 'l';
        }
    }
    return { layoutString, thumbSide };
}

/**
 * Takes the raw input, parses it, and updates the SVG.
 */
function parseAndDisplay(rawValue, svgElement) {
    const { layoutString, thumbSide } = parseRawInput(rawValue);

    let decodedString;
    try {
        decodedString = decodeURIComponent(layoutString);
    } catch (e) {
        decodedString = layoutString;
    }
    
    const finalLayout = Array(40).fill(' ');

    // Map the 32 main keys
    for (let i = 0; i < 32; i++) {
        if (decodedString[i]) {
            const char = decodedString[i];
            const physicalKeyIndex = KEY_MAP[i];
            if (physicalKeyIndex !== undefined) {
                finalLayout[physicalKeyIndex] = char;
            }
        }
    }

    // Map User Key 33 (string[32])
    if (decodedString.length > 32) {
        const char = decodedString[32];
        const physicalKeyIndex = KEY_MAP[32];
        if (char !== '\\') {
            finalLayout[physicalKeyIndex] = char;
        }
    }

    // Map User Key 35 (string[34])
    if (decodedString.length > 34) {
        const char = decodedString[34];
        const physicalKeyIndex = KEY_MAP[33];
        finalLayout[physicalKeyIndex] = char;
    }
    
    const isLetter = /^[a-zA-Z]$/;

    // Handle the Thumb Key (User key 34 / string[33])
    if (decodedString.length > 33) {
        const thumbChar = decodedString[33];
        if (isLetter.test(thumbChar)) {
            if (thumbSide === 'r') {
                finalLayout[THUMB_RIGHT_OUTER_KEY_INDEX] = thumbChar;
            } else {
                finalLayout[THUMB_LEFT_OUTER_KEY_INDEX] = thumbChar;
            }
        }
    }
    
    updateLayout(finalLayout, svgElement);
    
    // Return whether thumbs are used
    return thumbSide !== null;
}

// Accordion management
class KeyboardAccordion {
    constructor() {
        this.openRows = new Set();
        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
    }

    toggle(layoutName, layoutUrl, rowElement, hasThumbs) {
        // Check if this row is already open
        const accordionRow = rowElement.nextElementSibling;
        const isOpen = accordionRow && accordionRow.classList.contains('accordion-row');
        
        if (isOpen) {
            // Close it
            this.close(rowElement);
        } else {
            // Open it
            this.open(layoutName, layoutUrl, rowElement, hasThumbs);
        }
    }

    open(layoutName, layoutUrl, rowElement, hasThumbs = false) {
        // Create accordion row
        const accordionRow = this.createAccordionRow(layoutName, layoutUrl);
        rowElement.insertAdjacentElement('afterend', accordionRow);

        // Mark the data row as active
        rowElement.classList.add('active');
        
        // Open the accordion
        const content = accordionRow.querySelector('.accordion-content');
        content.classList.add('open');
        
        // Parse and display the layout
        const svg = accordionRow.querySelector('#keyboard-svg');
        drawKeyboard(svg, hasThumbs);
        parseAndDisplay(layoutUrl, svg);
        
        // Add to open rows set
        this.openRows.add(rowElement);
        
        // Add click handler to accordion content to close when clicked
        content.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close(rowElement);
        });
    }

    close(rowElement) {
        if (!rowElement) return;

        // Remove active class from row
        rowElement.classList.remove('active');

        // Close accordion
        const accordionRow = rowElement.nextElementSibling;
        if (accordionRow && accordionRow.classList.contains('accordion-row')) {
            const content = accordionRow.querySelector('.accordion-content');
            content.classList.remove('open');
            
            // Remove the accordion row after animation
            setTimeout(() => {
                if (!content.classList.contains('open')) {
                    accordionRow.remove();
                }
            }, 300);
        }

        // Remove from open rows set
        this.openRows.delete(rowElement);
    }

    createAccordionRow(layoutName, layoutUrl) {
        const tr = document.createElement('tr');
        tr.className = 'accordion-row';
        
        // Get the number of columns in the table
        const table = document.getElementById('layoutTable');
        const columnCount = table.querySelector('thead tr').children.length;
        
        tr.innerHTML = `
            <td colspan="${columnCount}">
                <div class="accordion-content">
                    <div class="keyboard-container">
                        <svg id="keyboard-svg" width="800" height="280" viewBox="0 0 800 280"></svg>
                    </div>
                </div>
            </td>
        `;

        return tr;
    }

    isOpen(rowElement) {
        return this.openRows.has(rowElement);
    }
}

// Create global accordion instance
window.keyboardAccordion = new KeyboardAccordion();
