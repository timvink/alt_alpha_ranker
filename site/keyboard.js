/**
 * Keyboard Layout Data Structure
 * Core class for representing split keyboard layouts
 */

// Key index constants for the 40-key layout
// Each index corresponds to a physical key position on the split keyboard
const KeyIndex = {
    // Left Hand - Top Row (0-5)
    L_TOP_PINKY: 0,
    L_TOP_RING: 1,
    L_TOP_MIDDLE: 2,
    L_TOP_INDEX_1: 3,
    L_TOP_INDEX_2: 4,
    L_TOP_INDEX_3: 5,
    
    // Right Hand - Top Row (6-11)
    R_TOP_INDEX_3: 6,
    R_TOP_INDEX_2: 7,
    R_TOP_INDEX_1: 8,
    R_TOP_MIDDLE: 9,
    R_TOP_RING: 10,
    R_TOP_PINKY: 11,
    
    // Left Hand - Home Row (12-17)
    L_HOME_PINKY: 12,
    L_HOME_RING: 13,
    L_HOME_MIDDLE: 14,
    L_HOME_INDEX_1: 15,
    L_HOME_INDEX_2: 16,
    L_HOME_INDEX_3: 17,
    
    // Right Hand - Home Row (18-23)
    R_HOME_INDEX_3: 18,
    R_HOME_INDEX_2: 19,
    R_HOME_INDEX_1: 20,
    R_HOME_MIDDLE: 21,
    R_HOME_RING: 22,
    R_HOME_PINKY: 23,
    
    // Left Hand - Bottom Row (24-29)
    L_BOTTOM_PINKY: 24,
    L_BOTTOM_RING: 25,
    L_BOTTOM_MIDDLE: 26,
    L_BOTTOM_INDEX_1: 27,
    L_BOTTOM_INDEX_2: 28,
    L_BOTTOM_INDEX_3: 29,
    
    // Right Hand - Bottom Row (30-35)
    R_BOTTOM_INDEX_3: 30,
    R_BOTTOM_INDEX_2: 31,
    R_BOTTOM_INDEX_1: 32,
    R_BOTTOM_MIDDLE: 33,
    R_BOTTOM_RING: 34,
    R_BOTTOM_PINKY: 35,
    
    // Thumb Keys (36-39)
    L_THUMB_INNER: 36,
    L_THUMB_OUTER: 37,
    R_THUMB_OUTER: 38,
    R_THUMB_INNER: 39
};

// Metadata for each key position
// Note: Home position (resting position) is columns 1-4 for each hand (4 middle keys)
// Column 0 (outer pinky) and column 5 (inner index) are stretch positions
const KeyMetadata = [
    // Left Hand - Top Row (0-5)
    { index: 0, hand: 'left', row: 'top', finger: 'pinky', col: 0, homePosition: false },
    { index: 1, hand: 'left', row: 'top', finger: 'pinky', col: 1, homePosition: false },
    { index: 2, hand: 'left', row: 'top', finger: 'ring', col: 2, homePosition: false },
    { index: 3, hand: 'left', row: 'top', finger: 'middle', col: 3, homePosition: false },
    { index: 4, hand: 'left', row: 'top', finger: 'index', col: 4, homePosition: false },
    { index: 5, hand: 'left', row: 'top', finger: 'index', col: 5, homePosition: false },
    
    // Right Hand - Top Row (6-11)
    { index: 6, hand: 'right', row: 'top', finger: 'index', col: 0, homePosition: false },
    { index: 7, hand: 'right', row: 'top', finger: 'index', col: 1, homePosition: false },
    { index: 8, hand: 'right', row: 'top', finger: 'middle', col: 2, homePosition: false },
    { index: 9, hand: 'right', row: 'top', finger: 'ring', col: 3, homePosition: false },
    { index: 10, hand: 'right', row: 'top', finger: 'pinky', col: 4, homePosition: false },
    { index: 11, hand: 'right', row: 'top', finger: 'pinky', col: 5, homePosition: false },
    
    // Left Hand - Home Row (12-17) - columns 1-4 are home positions
    { index: 12, hand: 'left', row: 'home', finger: 'pinky', col: 0, homePosition: false },
    { index: 13, hand: 'left', row: 'home', finger: 'pinky', col: 1, homePosition: true },
    { index: 14, hand: 'left', row: 'home', finger: 'ring', col: 2, homePosition: true },
    { index: 15, hand: 'left', row: 'home', finger: 'middle', col: 3, homePosition: true },
    { index: 16, hand: 'left', row: 'home', finger: 'index', col: 4, homePosition: true },
    { index: 17, hand: 'left', row: 'home', finger: 'index', col: 5, homePosition: false },
    
    // Right Hand - Home Row (18-23) - columns 1-4 are home positions
    { index: 18, hand: 'right', row: 'home', finger: 'index', col: 0, homePosition: false },
    { index: 19, hand: 'right', row: 'home', finger: 'index', col: 1, homePosition: true },
    { index: 20, hand: 'right', row: 'home', finger: 'middle', col: 2, homePosition: true },
    { index: 21, hand: 'right', row: 'home', finger: 'ring', col: 3, homePosition: true },
    { index: 22, hand: 'right', row: 'home', finger: 'pinky', col: 4, homePosition: true },
    { index: 23, hand: 'right', row: 'home', finger: 'pinky', col: 5, homePosition: false },
    
    // Left Hand - Bottom Row (24-29)
    { index: 24, hand: 'left', row: 'bottom', finger: 'pinky', col: 0, homePosition: false },
    { index: 25, hand: 'left', row: 'bottom', finger: 'pinky', col: 1, homePosition: false },
    { index: 26, hand: 'left', row: 'bottom', finger: 'ring', col: 2, homePosition: false },
    { index: 27, hand: 'left', row: 'bottom', finger: 'middle', col: 3, homePosition: false },
    { index: 28, hand: 'left', row: 'bottom', finger: 'index', col: 4, homePosition: false },
    { index: 29, hand: 'left', row: 'bottom', finger: 'index', col: 5, homePosition: false },
    
    // Right Hand - Bottom Row (30-35)
    { index: 30, hand: 'right', row: 'bottom', finger: 'index', col: 0, homePosition: false },
    { index: 31, hand: 'right', row: 'bottom', finger: 'index', col: 1, homePosition: false },
    { index: 32, hand: 'right', row: 'bottom', finger: 'middle', col: 2, homePosition: false },
    { index: 33, hand: 'right', row: 'bottom', finger: 'ring', col: 3, homePosition: false },
    { index: 34, hand: 'right', row: 'bottom', finger: 'pinky', col: 4, homePosition: false },
    { index: 35, hand: 'right', row: 'bottom', finger: 'pinky', col: 5, homePosition: false },
    
    // Thumb Keys (36-39)
    { index: 36, hand: 'left', row: 'thumb', finger: 'thumb', type: 'inner', homePosition: false },
    { index: 37, hand: 'left', row: 'thumb', finger: 'thumb', type: 'outer', homePosition: false },
    { index: 38, hand: 'right', row: 'thumb', finger: 'thumb', type: 'outer', homePosition: false },
    { index: 39, hand: 'right', row: 'thumb', finger: 'thumb', type: 'inner', homePosition: false }
];

class KeyboardLayout {
    constructor() {
        // Left hand: 3 rows × 6 columns
        this.leftHand = {
            rows: [
                Array(6).fill(' '),  // Top row
                Array(6).fill(' '),  // Home row
                Array(6).fill(' ')   // Bottom row
            ],
            thumbInner: ' ',  // Inner thumb key
            thumbOuter: ' '   // Outer thumb key
        };
        
        // Right hand: 3 rows × 6 columns
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
     * Get a key by its index (0-39)
     * @param {number} index - The key index (0-39)
     * @returns {string} The character at that key position
     */
    getKeyByIndex(index) {
        if (index < 0 || index >= 40) {
            return ' ';
        }
        
        const flatArray = this.toFlatArray();
        return flatArray[index];
    }
    
    /**
     * Set a key by its index (0-39)
     * @param {number} index - The key index (0-39)
     * @param {string} char - The character to set
     */
    setKeyByIndex(index, char) {
        if (index < 0 || index >= 40) {
            return;
        }
        
        const metadata = KeyMetadata[index];
        if (!metadata) {
            return;
        }
        
        if (metadata.row === 'thumb') {
            // Handle thumb keys
            if (metadata.hand === 'left') {
                if (metadata.type === 'inner') {
                    this.leftHand.thumbInner = char;
                } else {
                    this.leftHand.thumbOuter = char;
                }
            } else {
                if (metadata.type === 'inner') {
                    this.rightHand.thumbInner = char;
                } else {
                    this.rightHand.thumbOuter = char;
                }
            }
        } else {
            // Handle regular keys
            const rowIndex = metadata.row === 'top' ? 0 : metadata.row === 'home' ? 1 : 2;
            if (metadata.hand === 'left') {
                this.setLeftKey(rowIndex, metadata.col, char);
            } else {
                this.setRightKey(rowIndex, metadata.col, char);
            }
        }
    }
    
    /**
     * Get metadata for a key by its index
     * @param {number} index - The key index (0-39)
     * @returns {Object|null} Metadata object with hand, row, finger, col info
     */
    getKeyInfo(index) {
        if (index < 0 || index >= 40) {
            return null;
        }
        return KeyMetadata[index];
    }
    
    /**
     * Find all indices where a specific character appears
     * @param {string} char - The character to search for
     * @returns {Array<number>} Array of indices where the character appears
     */
    findCharacterIndices(char) {
        const indices = [];
        const flatArray = this.toFlatArray();
        const searchChar = char.toLowerCase();
        
        for (let i = 0; i < flatArray.length; i++) {
            if (flatArray[i].toLowerCase() === searchChar) {
                indices.push(i);
            }
        }
        
        return indices;
    }
    
    /**
     * Check if a key position is assigned (not a space)
     * @param {number} index - The key index (0-39)
     * @returns {boolean} True if the key has a character assigned
     */
    isKeyAssigned(index) {
        const char = this.getKeyByIndex(index);
        return char !== ' ' && char !== '';
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
     * Check if layout has thumb keys
     */
    hasThumbKeys() {
        const hasLeftThumb = (this.leftHand.thumbOuter && this.leftHand.thumbOuter !== ' ') ||
                            (this.leftHand.thumbInner && this.leftHand.thumbInner !== ' ');
        const hasRightThumb = (this.rightHand.thumbOuter && this.rightHand.thumbOuter !== ' ') ||
                             (this.rightHand.thumbInner && this.rightHand.thumbInner !== ' ');
        return hasLeftThumb || hasRightThumb;
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
    
    /**
     * Convert layout to text representation (matching input format)
     * This is useful for testing and verification
     * @returns {string} Text representation of the layout
     */
    toText() {
        let lines = [];
        
        // Process each row
        for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
            const leftRow = this.leftHand.rows[rowIndex];
            const rightRow = this.rightHand.rows[rowIndex];
            
            // Get non-empty keys from left hand (trim leading spaces)
            let leftKeys = leftRow.filter(c => c !== ' ');
            // Get non-empty keys from right hand (trim trailing spaces)
            let rightKeys = rightRow.filter(c => c !== ' ');
            
            // Combine with space separator
            const line = leftKeys.join(' ') + '  ' + rightKeys.join(' ');
            lines.push(line);
        }
        
        // Add thumb row if exists
        const leftThumb = this.leftHand.thumbOuter !== ' ' ? this.leftHand.thumbOuter : '';
        const rightThumb = this.rightHand.thumbOuter !== ' ' ? this.rightHand.thumbOuter : '';
        
        if (leftThumb || rightThumb) {
            // Calculate spacing for thumb positioning
            // Left thumb should be left-aligned, right thumb should be right-aligned
            if (leftThumb && !rightThumb) {
                lines.push(leftThumb);
            } else if (!leftThumb && rightThumb) {
                // Add spacing to position right thumb
                const firstRowLength = lines[0].length;
                const spacing = ' '.repeat(Math.floor(firstRowLength / 2) + 5);
                lines.push(spacing + rightThumb);
            } else if (leftThumb && rightThumb) {
                // Both thumbs
                const firstRowLength = lines[0].length;
                const spacing = ' '.repeat(Math.floor(firstRowLength / 2) - 1);
                lines.push(leftThumb + spacing + rightThumb);
            }
        }
        
        return lines.join('\n');
    }
}
