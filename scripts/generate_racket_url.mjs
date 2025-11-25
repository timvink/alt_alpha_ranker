import { KeyboardLayout, KeyIndex } from '../site/keyboard.js';
import { keyboardToCyanophage } from '../site/cyanophage.js';

const racket_layout = new KeyboardLayout();

// Left hand top row
racket_layout.setKeyByIndex(KeyIndex.L_TOP_PINKY_OUTER, ' ');
racket_layout.setKeyByIndex(KeyIndex.L_TOP_PINKY, 'f');
racket_layout.setKeyByIndex(KeyIndex.L_TOP_RING, 'd');
racket_layout.setKeyByIndex(KeyIndex.L_TOP_MIDDLE, 'l');
racket_layout.setKeyByIndex(KeyIndex.L_TOP_INDEX, 'w');
racket_layout.setKeyByIndex(KeyIndex.L_TOP_INDEX_INNER, 'j');

// Right hand top row
racket_layout.setKeyByIndex(KeyIndex.R_TOP_INDEX_INNER, ';');
racket_layout.setKeyByIndex(KeyIndex.R_TOP_INDEX, 'b');
racket_layout.setKeyByIndex(KeyIndex.R_TOP_MIDDLE, 'o');
racket_layout.setKeyByIndex(KeyIndex.R_TOP_RING, 'u');
racket_layout.setKeyByIndex(KeyIndex.R_TOP_PINKY, ',');
racket_layout.setKeyByIndex(KeyIndex.R_TOP_PINKY_OUTER, ' ');

// Left hand home row
racket_layout.setKeyByIndex(KeyIndex.L_HOME_PINKY_OUTER, ' ');
racket_layout.setKeyByIndex(KeyIndex.L_HOME_PINKY, 's');
racket_layout.setKeyByIndex(KeyIndex.L_HOME_RING, 't');
racket_layout.setKeyByIndex(KeyIndex.L_HOME_MIDDLE, 'h');
racket_layout.setKeyByIndex(KeyIndex.L_HOME_INDEX, 'c');
racket_layout.setKeyByIndex(KeyIndex.L_HOME_INDEX_INNER, 'y');

// Right hand home row
racket_layout.setKeyByIndex(KeyIndex.R_HOME_INDEX_INNER, 'q');
racket_layout.setKeyByIndex(KeyIndex.R_HOME_INDEX, 'n');
racket_layout.setKeyByIndex(KeyIndex.R_HOME_MIDDLE, 'a');
racket_layout.setKeyByIndex(KeyIndex.R_HOME_RING, 'e');
racket_layout.setKeyByIndex(KeyIndex.R_HOME_PINKY, 'i');
racket_layout.setKeyByIndex(KeyIndex.R_HOME_PINKY_OUTER, '-');

// Left hand bottom row
racket_layout.setKeyByIndex(KeyIndex.L_BOTTOM_PINKY_OUTER, ' ');
racket_layout.setKeyByIndex(KeyIndex.L_BOTTOM_PINKY, 'x');
racket_layout.setKeyByIndex(KeyIndex.L_BOTTOM_RING, 'k');
racket_layout.setKeyByIndex(KeyIndex.L_BOTTOM_MIDDLE, 'm');
racket_layout.setKeyByIndex(KeyIndex.L_BOTTOM_INDEX, 'g');
racket_layout.setKeyByIndex(KeyIndex.L_BOTTOM_INDEX_INNER, 'v');

// Right hand bottom row
racket_layout.setKeyByIndex(KeyIndex.R_BOTTOM_INDEX_INNER, 'z');
racket_layout.setKeyByIndex(KeyIndex.R_BOTTOM_INDEX, 'p');
racket_layout.setKeyByIndex(KeyIndex.R_BOTTOM_MIDDLE, '"');
racket_layout.setKeyByIndex(KeyIndex.R_BOTTOM_RING, "'");
racket_layout.setKeyByIndex(KeyIndex.R_BOTTOM_PINKY, '/');
racket_layout.setKeyByIndex(KeyIndex.R_BOTTOM_PINKY_OUTER, '.');

// Left thumb key
racket_layout.setKeyByIndex(KeyIndex.THUMB_LEFT_INNER, 'r');

console.log(keyboardToCyanophage(racket_layout));
