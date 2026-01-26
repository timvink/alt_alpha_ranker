import { KeyboardLayout, KeyIndex } from './keyboard.js';
import { cyanophageToKeyboard, keyboardToCyanophage } from './cyanophage.js';

/**
 * Helper function to compare layouts, ignoring positions that are blank in the expected layout.
 * Cyanophage URLs have a fixed set of characters that get shuffled, so blank positions
 * may be filled with placeholder characters like '*', '\', etc.
 */
function expectLayoutsEqual(converted, expected) {
  const convertedFlat = converted.toFlatArray();
  const expectedFlat = expected.toFlatArray();
  
  // Map index to KeyIndex name for better error messages
  const indexToKeyName = Object.fromEntries(
    Object.entries(KeyIndex).map(([name, index]) => [index, name])
  );
  
  for (let i = 0; i < 40; i++) {
    // Only compare positions where expected has a non-blank character
    if (expectedFlat[i] !== ' ') {
      const keyName = indexToKeyName[i] || `index ${i}`;
      if (convertedFlat[i] !== expectedFlat[i]) {
        throw new Error(
          `Key mismatch at ${keyName}: expected "${expectedFlat[i]}" but received "${convertedFlat[i]}"`
        );
      }
    }
  }
}

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
  const qwerty_url = 'https://cyanophage.github.io/playground.html?layout=qwertyuiop-asdfghjkl%3B%27zxcvbnm%2C.%2F%5C%5E&mode=ergo&lan=english';

  test('should convert Cyanophage QWERTY URL to KeyboardLayout', () => {
    const converted_layout = cyanophageToKeyboard(qwerty_url);
    expect(converted_layout.toFlatArray()).toEqual(qwerty_layout.toFlatArray());
  });
});

describe('Enthium v11 layout conversion', () => {
  // Define the expected Enthium v11 layout using KeyboardLayout class
  // Layout:
  //   z y o u = q l d p x
  // w c i a e ; k h t n s f
  //   ' - , . / j m g b v
  //             r
  
  const enthium_v11_layout = new KeyboardLayout();
  
  // Left hand top row (no outer pinky key on top row)
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_TOP_PINKY_OUTER, ' ');
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_TOP_PINKY, 'z');
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_TOP_RING, 'y');
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_TOP_MIDDLE, 'o');
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_TOP_INDEX, 'u');
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_TOP_INDEX_INNER, '=');
  
  // Right hand top row
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_TOP_INDEX_INNER, 'q');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_TOP_INDEX, 'l');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_TOP_MIDDLE, 'd');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_TOP_RING, 'p');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_TOP_PINKY, 'x');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_TOP_PINKY_OUTER, ' ');
  
  // Left hand home row (w is on outer pinky)
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_HOME_PINKY_OUTER, 'w');
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_HOME_PINKY, 'c');
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_HOME_RING, 'i');
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_HOME_MIDDLE, 'a');
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_HOME_INDEX, 'e');
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_HOME_INDEX_INNER, ';');
  
  // Right hand home row
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_HOME_INDEX_INNER, 'k');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_HOME_INDEX, 'h');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_HOME_MIDDLE, 't');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_HOME_RING, 'n');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_HOME_PINKY, 's');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_HOME_PINKY_OUTER, 'f');
  
  // Left hand bottom row (no outer pinky key on bottom row)
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_BOTTOM_PINKY_OUTER, ' ');
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_BOTTOM_PINKY, "'");
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_BOTTOM_RING, '-');
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_BOTTOM_MIDDLE, ',');
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_BOTTOM_INDEX, '.');
  enthium_v11_layout.setKeyByIndex(KeyIndex.L_BOTTOM_INDEX_INNER, '/');
  
  // Right hand bottom row
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_BOTTOM_INDEX_INNER, 'j');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_BOTTOM_INDEX, 'm');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_BOTTOM_MIDDLE, 'g');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_BOTTOM_RING, 'b');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_BOTTOM_PINKY, 'v');
  enthium_v11_layout.setKeyByIndex(KeyIndex.R_BOTTOM_PINKY_OUTER, ' ');
  
  // Right thumb key
  enthium_v11_layout.setKeyByIndex(KeyIndex.THUMB_RIGHT_INNER, 'r');

  // The Cyanophage URL for Enthium v11
  const enthium_v11_url = 'https://cyanophage.github.io/playground.html?layout=zyou%3Dqldpx%5Cciae%3Bkhtnsf%27-%2C.%2Fjmgbv*rw&mode=ergo&lan=english&thumb=r';

  test('should convert Cyanophage Enthium v11 URL to KeyboardLayout', () => {
    const converted_layout = cyanophageToKeyboard(enthium_v11_url);
    // Use helper that ignores blank positions (Cyanophage fills blanks with placeholders)
    expectLayoutsEqual(converted_layout, enthium_v11_layout);
  });
});

describe('Racket layout conversion', () => {
  // Define the expected Racket layout using KeyboardLayout class
  // Layout:
  //   f d l w j   ; b o u ,
  //   s t h c y   q n a e i -
  //   x k m g v   z p ' / . 
  //         r

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
  racket_layout.setKeyByIndex(KeyIndex.R_BOTTOM_MIDDLE, "'");
  racket_layout.setKeyByIndex(KeyIndex.R_BOTTOM_RING, "/");
  racket_layout.setKeyByIndex(KeyIndex.R_BOTTOM_PINKY, '.');
  racket_layout.setKeyByIndex(KeyIndex.R_BOTTOM_PINKY_OUTER, ' ');
  
  // Left thumb key
  racket_layout.setKeyByIndex(KeyIndex.THUMB_LEFT_INNER, 'r');

  // The Cyanophage URL for Racket
  const racket_url = 'https://cyanophage.github.io/playground.html?layout=fdlwj%3Bbou%2C*sthcyqnaei-xkmgvzp%27%2F.%5Cr%3D&mode=ergo&thumb=l&lan=english';

  test('should convert Cyanophage Racket URL to KeyboardLayout', () => {
    const converted_layout = cyanophageToKeyboard(racket_url);
    // Use helper that ignores blank positions (Cyanophage fills blanks with placeholders)
    expectLayoutsEqual(converted_layout, racket_layout);
  });
});

describe('Bunya layout conversion', () => {
  // Define the expected Bunya layout using KeyboardLayout class
  // Layout:
  //   b l m c z   x f o u ,
  //   n r t d p   y h a e i -
  //   ; j q g w   k v ' / .
  //         s

  const bunya_layout = new KeyboardLayout();
  
  // Left hand top row
  bunya_layout.setKeyByIndex(KeyIndex.L_TOP_PINKY_OUTER, ' ');
  bunya_layout.setKeyByIndex(KeyIndex.L_TOP_PINKY, 'b');
  bunya_layout.setKeyByIndex(KeyIndex.L_TOP_RING, 'l');
  bunya_layout.setKeyByIndex(KeyIndex.L_TOP_MIDDLE, 'm');
  bunya_layout.setKeyByIndex(KeyIndex.L_TOP_INDEX, 'c');
  bunya_layout.setKeyByIndex(KeyIndex.L_TOP_INDEX_INNER, 'z');
  
  // Right hand top row
  bunya_layout.setKeyByIndex(KeyIndex.R_TOP_INDEX_INNER, 'x');
  bunya_layout.setKeyByIndex(KeyIndex.R_TOP_INDEX, 'f');
  bunya_layout.setKeyByIndex(KeyIndex.R_TOP_MIDDLE, 'o');
  bunya_layout.setKeyByIndex(KeyIndex.R_TOP_RING, 'u');
  bunya_layout.setKeyByIndex(KeyIndex.R_TOP_PINKY, ',');
  bunya_layout.setKeyByIndex(KeyIndex.R_TOP_PINKY_OUTER, ' ');
  
  // Left hand home row
  bunya_layout.setKeyByIndex(KeyIndex.L_HOME_PINKY_OUTER, ' ');
  bunya_layout.setKeyByIndex(KeyIndex.L_HOME_PINKY, 'n');
  bunya_layout.setKeyByIndex(KeyIndex.L_HOME_RING, 'r');
  bunya_layout.setKeyByIndex(KeyIndex.L_HOME_MIDDLE, 't');
  bunya_layout.setKeyByIndex(KeyIndex.L_HOME_INDEX, 'd');
  bunya_layout.setKeyByIndex(KeyIndex.L_HOME_INDEX_INNER, 'p');
  
  // Right hand home row
  bunya_layout.setKeyByIndex(KeyIndex.R_HOME_INDEX_INNER, 'y');
  bunya_layout.setKeyByIndex(KeyIndex.R_HOME_INDEX, 'h');
  bunya_layout.setKeyByIndex(KeyIndex.R_HOME_MIDDLE, 'a');
  bunya_layout.setKeyByIndex(KeyIndex.R_HOME_RING, 'e');
  bunya_layout.setKeyByIndex(KeyIndex.R_HOME_PINKY, 'i');
  bunya_layout.setKeyByIndex(KeyIndex.R_HOME_PINKY_OUTER, '-');
  
  // Left hand bottom row
  bunya_layout.setKeyByIndex(KeyIndex.L_BOTTOM_PINKY_OUTER, ' ');
  bunya_layout.setKeyByIndex(KeyIndex.L_BOTTOM_PINKY, ';');
  bunya_layout.setKeyByIndex(KeyIndex.L_BOTTOM_RING, 'j');
  bunya_layout.setKeyByIndex(KeyIndex.L_BOTTOM_MIDDLE, 'q');
  bunya_layout.setKeyByIndex(KeyIndex.L_BOTTOM_INDEX, 'g');
  bunya_layout.setKeyByIndex(KeyIndex.L_BOTTOM_INDEX_INNER, 'w');
  
  // Right hand bottom row
  bunya_layout.setKeyByIndex(KeyIndex.R_BOTTOM_INDEX_INNER, 'k');
  bunya_layout.setKeyByIndex(KeyIndex.R_BOTTOM_INDEX, 'v');
  bunya_layout.setKeyByIndex(KeyIndex.R_BOTTOM_MIDDLE, "'");
  bunya_layout.setKeyByIndex(KeyIndex.R_BOTTOM_RING, '/');
  bunya_layout.setKeyByIndex(KeyIndex.R_BOTTOM_PINKY, '.');
  bunya_layout.setKeyByIndex(KeyIndex.R_BOTTOM_PINKY_OUTER, ' ');
  
  // Left thumb key
  bunya_layout.setKeyByIndex(KeyIndex.THUMB_LEFT_INNER, 's');

  // The Cyanophage URL for Bunya
  const bunya_url = 'https://cyanophage.github.io/playground.html?layout=blmczxfou%2C*nrtdpyhaei-%3Bjqgwkv%27%2F.%5Cs%3D&mode=ergo&thumb=l&lan=english';

  test('should convert Cyanophage Bunya URL to KeyboardLayout', () => {
    const converted_layout = cyanophageToKeyboard(bunya_url);
    // Use helper that ignores blank positions (Cyanophage fills blanks with placeholders)
    expectLayoutsEqual(converted_layout, bunya_layout);
  });
});

describe('Cyanophage layout with back suffix', () => {
  const back_layout = new KeyboardLayout();
  
  // Left hand top row
  back_layout.setKeyByIndex(KeyIndex.L_TOP_PINKY_OUTER, ' ');
  back_layout.setKeyByIndex(KeyIndex.L_TOP_PINKY, 'f');
  back_layout.setKeyByIndex(KeyIndex.L_TOP_RING, 'd');
  back_layout.setKeyByIndex(KeyIndex.L_TOP_MIDDLE, 'h');
  back_layout.setKeyByIndex(KeyIndex.L_TOP_INDEX, 'w');
  back_layout.setKeyByIndex(KeyIndex.L_TOP_INDEX_INNER, 'j');
  
  // Right hand top row
  back_layout.setKeyByIndex(KeyIndex.R_TOP_INDEX_INNER, '/');
  back_layout.setKeyByIndex(KeyIndex.R_TOP_INDEX, 'u');
  back_layout.setKeyByIndex(KeyIndex.R_TOP_MIDDLE, 'l');
  back_layout.setKeyByIndex(KeyIndex.R_TOP_RING, 'o');
  back_layout.setKeyByIndex(KeyIndex.R_TOP_PINKY, 'y');
  back_layout.setKeyByIndex(KeyIndex.R_TOP_PINKY_OUTER, ',');
  
  // Left hand home row
  back_layout.setKeyByIndex(KeyIndex.L_HOME_PINKY_OUTER, ' ');
  back_layout.setKeyByIndex(KeyIndex.L_HOME_PINKY, 's');
  back_layout.setKeyByIndex(KeyIndex.L_HOME_RING, 't');
  back_layout.setKeyByIndex(KeyIndex.L_HOME_MIDDLE, 'n');
  back_layout.setKeyByIndex(KeyIndex.L_HOME_INDEX, 'c');
  back_layout.setKeyByIndex(KeyIndex.L_HOME_INDEX_INNER, 'b');
  
  // Right hand home row
  back_layout.setKeyByIndex(KeyIndex.R_HOME_INDEX_INNER, '-');
  back_layout.setKeyByIndex(KeyIndex.R_HOME_INDEX, 'e');
  back_layout.setKeyByIndex(KeyIndex.R_HOME_MIDDLE, 'r');
  back_layout.setKeyByIndex(KeyIndex.R_HOME_RING, 'a');
  back_layout.setKeyByIndex(KeyIndex.R_HOME_PINKY, 'i');
  back_layout.setKeyByIndex(KeyIndex.R_HOME_PINKY_OUTER, '.');
  
  // Left hand bottom row
  back_layout.setKeyByIndex(KeyIndex.L_BOTTOM_PINKY_OUTER, 'v');
  back_layout.setKeyByIndex(KeyIndex.L_BOTTOM_PINKY, 'k');
  back_layout.setKeyByIndex(KeyIndex.L_BOTTOM_RING, 'm');
  back_layout.setKeyByIndex(KeyIndex.L_BOTTOM_MIDDLE, 'g');
  back_layout.setKeyByIndex(KeyIndex.L_BOTTOM_INDEX, 'p');
  back_layout.setKeyByIndex(KeyIndex.L_BOTTOM_INDEX_INNER, 'z');
  
  // Right hand bottom row
  back_layout.setKeyByIndex(KeyIndex.R_BOTTOM_INDEX_INNER, ';');
  back_layout.setKeyByIndex(KeyIndex.R_BOTTOM_INDEX, "'");
  back_layout.setKeyByIndex(KeyIndex.R_BOTTOM_MIDDLE, 'x');
  back_layout.setKeyByIndex(KeyIndex.R_BOTTOM_RING, 'q');
  back_layout.setKeyByIndex(KeyIndex.R_BOTTOM_PINKY, '\\');
  back_layout.setKeyByIndex(KeyIndex.R_BOTTOM_PINKY_OUTER, ' ');
  
  const back_url = 'https://cyanophage.github.io/playground.html?layout=fdhwj%2Fuloy%2Cstncb-erai.kmgpz%3B%27xq%5Cv%5Eback&mode=iso&lan=english&thumb=l';
  
  test('should ignore back suffix in Cyanophage layout URL', () => {
    const converted_layout = cyanophageToKeyboard(back_url);
    expectLayoutsEqual(converted_layout, back_layout);
  });
});
