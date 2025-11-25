import { KeyboardLayout, KeyIndex } from './keyboard.js';
import { cyanophageToKeyboard } from './cyanophage.js';

describe('QWERTY layout conversion', () => {
  // Define the expected QWERTY layout using KeyboardLayout class
  const qwerty_layout = new KeyboardLayout();
  
  // Left hand top row
  qwerty_layout.setKeyByIndex(KeyIndex.L_TOP_PINKY_OUTER, ' ');
  qwerty_layout.setKeyByIndex(KeyIndex.L_TOP_PINKY, 'q');
  qwerty_layout.setKeyByIndex(KeyIndex.L_TOP_RING, 'w');
  qwerty_layout.setKeyByIndex(KeyIndex.L_TOP_MIDDLE, 'e');
  qwerty_layout.setKeyByIndex(KeyIndex.L_TOP_INDEX, 'r');
  qwerty_layout.setKeyByIndex(KeyIndex.L_TOP_INDEX_INNER, 't');
  
  // Right hand top row
  qwerty_layout.setKeyByIndex(KeyIndex.R_TOP_INDEX_INNER, 'y');
  qwerty_layout.setKeyByIndex(KeyIndex.R_TOP_INDEX, 'u');
  qwerty_layout.setKeyByIndex(KeyIndex.R_TOP_MIDDLE, 'i');
  qwerty_layout.setKeyByIndex(KeyIndex.R_TOP_RING, 'o');
  qwerty_layout.setKeyByIndex(KeyIndex.R_TOP_PINKY, 'p');
  qwerty_layout.setKeyByIndex(KeyIndex.R_TOP_PINKY_OUTER, '-');
  
  // Left hand home row
  qwerty_layout.setKeyByIndex(KeyIndex.L_HOME_PINKY_OUTER, ' ');
  qwerty_layout.setKeyByIndex(KeyIndex.L_HOME_PINKY, 'a');
  qwerty_layout.setKeyByIndex(KeyIndex.L_HOME_RING, 's');
  qwerty_layout.setKeyByIndex(KeyIndex.L_HOME_MIDDLE, 'd');
  qwerty_layout.setKeyByIndex(KeyIndex.L_HOME_INDEX, 'f');
  qwerty_layout.setKeyByIndex(KeyIndex.L_HOME_INDEX_INNER, 'g');
  
  // Right hand home row
  qwerty_layout.setKeyByIndex(KeyIndex.R_HOME_INDEX_INNER, 'h');
  qwerty_layout.setKeyByIndex(KeyIndex.R_HOME_INDEX, 'j');
  qwerty_layout.setKeyByIndex(KeyIndex.R_HOME_MIDDLE, 'k');
  qwerty_layout.setKeyByIndex(KeyIndex.R_HOME_RING, 'l');
  qwerty_layout.setKeyByIndex(KeyIndex.R_HOME_PINKY, ';');
  qwerty_layout.setKeyByIndex(KeyIndex.R_HOME_PINKY_OUTER, "'");
  
  // Left hand bottom row
  qwerty_layout.setKeyByIndex(KeyIndex.L_BOTTOM_PINKY_OUTER, ' ');
  qwerty_layout.setKeyByIndex(KeyIndex.L_BOTTOM_PINKY, 'z');
  qwerty_layout.setKeyByIndex(KeyIndex.L_BOTTOM_RING, 'x');
  qwerty_layout.setKeyByIndex(KeyIndex.L_BOTTOM_MIDDLE, 'c');
  qwerty_layout.setKeyByIndex(KeyIndex.L_BOTTOM_INDEX, 'v');
  qwerty_layout.setKeyByIndex(KeyIndex.L_BOTTOM_INDEX_INNER, 'b');
  
  // Right hand bottom row
  qwerty_layout.setKeyByIndex(KeyIndex.R_BOTTOM_INDEX_INNER, 'n');
  qwerty_layout.setKeyByIndex(KeyIndex.R_BOTTOM_INDEX, 'm');
  qwerty_layout.setKeyByIndex(KeyIndex.R_BOTTOM_MIDDLE, ',');
  qwerty_layout.setKeyByIndex(KeyIndex.R_BOTTOM_RING, '.');
  qwerty_layout.setKeyByIndex(KeyIndex.R_BOTTOM_PINKY, '/');
  qwerty_layout.setKeyByIndex(KeyIndex.R_BOTTOM_PINKY_OUTER, ' ');

  // The Cyanophage URL for QWERTY
  const qwerty_url = 'https://cyanophage.github.io/playground.html?layout=qwertyuiop-asdfghjkl%3B%27zxcvbnm%2C.%2F%5C%5Eback&mode=ergo&lan=english';

  test('should convert Cyanophage QWERTY URL to KeyboardLayout', () => {
    const converted_layout = cyanophageToKeyboard(qwerty_url);
    expect(converted_layout.toFlatArray()).toEqual(qwerty_layout.toFlatArray());
  });
});