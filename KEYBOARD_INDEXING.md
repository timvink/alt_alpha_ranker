# Keyboard Layout Indexing System

## Overview

The keyboard layout system now uses a robust 40-key indexing scheme that provides a consistent way to reference every key position on the split keyboard, including unassigned keys.

## Key Layout Structure

The split keyboard has:
- **Left hand**: 3 rows × 6 columns + 2 thumb keys = 20 keys
- **Right hand**: 3 rows × 6 columns + 2 thumb keys = 20 keys
- **Total**: 40 key positions (indices 0-39)

### Finger Assignment

Each hand has 6 columns (0-5):
- **Column 0**: Outer pinky (stretch position)
- **Columns 1-4**: Home positions where fingers rest (pinky, ring, middle, index)
- **Column 5**: Inner index (stretch position)

The **home row positions** (where fingers naturally rest) are:
- Left hand: indices 13-16 (columns 1-4)
- Right hand: indices 19-22 (columns 1-4)
- Total: 8 home position keys

## Index Mapping

### Visual Layout

```
Left Hand                    Right Hand
Col:  0   1   2   3   4   5        0   1   2   3   4   5
     [0] [1] [2] [3] [4] [5]      [6] [7] [8] [9][10][11]    Top Row
     [12][13][14][15][16][17]    [18][19][20][21][22][23]    Home Row  
     [24][25][26][27][28][29]    [30][31][32][33][34][35]    Bottom Row
                 [36][37]         [38][39]                     Thumb Keys

Finger:   P   P   R   M   I   I        I   I   M   R   P   P
Home:         ✓   ✓   ✓   ✓              ✓   ✓   ✓   ✓

Legend:
  P = Pinky, R = Ring, M = Middle, I = Index
  ✓ = Home position (resting position)
  Col 0 = Outer stretch, Col 5 = Inner stretch
```

### Index Constants

Use the `KeyIndex` constants for readable code:

```javascript
// Left hand examples
KeyIndex.L_HOME_PINKY     // 13 - Left home row, pinky (col 1, home position)
KeyIndex.L_HOME_RING      // 14 - Left home row, ring (col 2, home position)
KeyIndex.L_HOME_MIDDLE    // 15 - Left home row, middle (col 3, home position)
KeyIndex.L_HOME_INDEX_1   // 16 - Left home row, index (col 4, home position)
KeyIndex.L_THUMB_INNER    // 36 - Left inner thumb key

// Right hand examples
KeyIndex.R_HOME_INDEX_1   // 19 - Right home row, index (col 1, home position)
KeyIndex.R_HOME_MIDDLE    // 20 - Right home row, middle (col 2, home position)
KeyIndex.R_HOME_RING      // 21 - Right home row, ring (col 3, home position)
KeyIndex.R_HOME_PINKY     // 22 - Right home row, pinky (col 4, home position)
KeyIndex.R_THUMB_OUTER    // 38 - Right outer thumb key
```

## Key Metadata

Each key has associated metadata accessible via `KeyMetadata[index]`:

```javascript
{
  index: 14,           // The key index
  hand: 'left',        // 'left' or 'right'
  row: 'home',         // 'top', 'home', 'bottom', or 'thumb'
  finger: 'ring',      // 'pinky', 'ring', 'middle', 'index', or 'thumb'
  col: 2,              // Column position (0-5) - only for non-thumb keys
  homePosition: true   // True for the 8 resting position keys (cols 1-4 on home row)
}
```

Thumb keys also have a `type` field: `'inner'` or `'outer'`.

### Home Position Keys

The 8 home position keys (where fingers rest) are indices **13-16** (left) and **19-22** (right).
These correspond to columns 1-4 on the home row for each hand.

## KeyboardLayout API

### New Methods

#### `getKeyByIndex(index)`
Get the character at a specific key position.

```javascript
const layout = new KeyboardLayout();
const char = layout.getKeyByIndex(KeyIndex.L_HOME_MIDDLE); // Get left home middle key
```

#### `setKeyByIndex(index, char)`
Set a character at a specific key position.

```javascript
layout.setKeyByIndex(KeyIndex.R_TOP_INDEX_1, 'e');
```

#### `getKeyInfo(index)`
Get metadata for a key position.

```javascript
const info = layout.getKeyInfo(15);
console.log(`${info.hand} hand, ${info.row} row, ${info.finger} finger`);
// Output: "left hand, home row, index finger"
```

#### `findCharacterIndices(char)`
Find all positions where a character appears.

```javascript
const indices = layout.findCharacterIndices('e');
console.log(`'e' appears at positions: ${indices.join(', ')}`);
```

#### `isKeyAssigned(index)`
Check if a key position has a character assigned (not a space).

```javascript
if (layout.isKeyAssigned(KeyIndex.L_TOP_PINKY)) {
    console.log('Pinky key is assigned');
}
```

### Existing Methods

These continue to work as before:

- `setLeftKey(row, col, char)` - Set a key on the left hand
- `setRightKey(row, col, char)` - Set a key on the right hand
- `toFlatArray()` - Get all 40 keys as a flat array
- `hasThumbKeys()` - Check if layout uses thumb keys
- `toString()` - Get a human-readable string representation
- `toText()` - Convert to text format

## Visualization Updates

The keyboard visualization now handles unassigned keys gracefully:

- **Assigned keys**: Normal appearance with character displayed
- **Unassigned keys**: Dimmed with dashed border and no character

The CSS class `unassigned-key` is automatically applied to keys without assigned characters.

## Usage Examples

### Example 1: Create a Layout with Sparse Key Assignment

```javascript
const layout = new KeyboardLayout();

// Only assign keys to home positions (the 8 resting position keys)
layout.setKeyByIndex(KeyIndex.L_HOME_PINKY, 'a');     // 13
layout.setKeyByIndex(KeyIndex.L_HOME_RING, 's');      // 14
layout.setKeyByIndex(KeyIndex.L_HOME_MIDDLE, 'd');    // 15
layout.setKeyByIndex(KeyIndex.L_HOME_INDEX_1, 'f');   // 16

layout.setKeyByIndex(KeyIndex.R_HOME_INDEX_1, 'j');   // 19
layout.setKeyByIndex(KeyIndex.R_HOME_MIDDLE, 'k');    // 20
layout.setKeyByIndex(KeyIndex.R_HOME_RING, 'l');      // 21
layout.setKeyByIndex(KeyIndex.R_HOME_PINKY, ';');     // 22

// All other keys remain unassigned (space character)
```

### Example 2: Iterate Through All Keys

```javascript
const layout = new KeyboardLayout();
// ... set up layout ...

// Check all keys
for (let i = 0; i < 40; i++) {
    if (layout.isKeyAssigned(i)) {
        const char = layout.getKeyByIndex(i);
        const info = layout.getKeyInfo(i);
        console.log(`Key ${i}: '${char}' on ${info.hand} ${info.finger}`);
    }
}
```

### Example 3: Find All Home Row Keys

```javascript
const homeRowIndices = KeyMetadata
    .filter(meta => meta.row === 'home')
    .map(meta => meta.index);

console.log('Home row positions:', homeRowIndices);
// [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]

// Get only the home position keys (resting positions)
const homePositionIndices = KeyMetadata
    .filter(meta => meta.homePosition === true)
    .map(meta => meta.index);

console.log('Home position keys:', homePositionIndices);
// [13, 14, 15, 16, 19, 20, 21, 22]
```

### Example 4: Find Keys by Finger

```javascript
// Get all ring finger keys
const ringFingerKeys = KeyMetadata
    .filter(meta => meta.finger === 'ring')
    .map(meta => ({
        index: meta.index,
        char: layout.getKeyByIndex(meta.index),
        assigned: layout.isKeyAssigned(meta.index),
        hand: meta.hand,
        row: meta.row,
        homePosition: meta.homePosition
    }));

// Left hand ring finger is at col 2, right hand ring finger is at col 3
// Home positions: indices 14 (left) and 21 (right)
```

## Migration Guide

If you have existing code that works with the layout:

### Before (still works)
```javascript
layout.setLeftKey(1, 2, 'a');  // row, col, char
const char = layout.leftHand.rows[1][2];
```

### After (recommended for robustness)
```javascript
layout.setKeyByIndex(KeyIndex.L_HOME_RING, 'a');  // Using constant for col 2, home row
const char = layout.getKeyByIndex(KeyIndex.L_HOME_RING);
```

## Benefits

1. **Robust**: Handles layouts with unassigned keys gracefully
2. **Predictable**: Every key position has a fixed index (0-39)
3. **Discoverable**: Clear constants and metadata make code self-documenting
4. **Flexible**: Easy to iterate, search, and manipulate keys programmatically
5. **Backwards compatible**: All existing methods continue to work

## Testing

Run the test page at `site/test-keyboard-indexing.html` to see the indexing system in action with various layout configurations.
