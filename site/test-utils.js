/**
 * Test Utilities for Keyboard Layout Conversion
 * Run these tests in the browser console to verify conversions are working correctly
 */

/**
 * Helper function to create a test layout manually
 */
function createTestLayout(leftRows, rightRows, leftThumb = ' ', rightThumb = ' ') {
    const layout = new KeyboardLayout();
    
    // Set left hand keys
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 6; col++) {
            if (leftRows[row] && leftRows[row][col]) {
                layout.leftHand.rows[row][col] = leftRows[row][col];
            }
        }
    }
    
    // Set right hand keys
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 6; col++) {
            if (rightRows[row] && rightRows[row][col]) {
                layout.rightHand.rows[row][col] = rightRows[row][col];
            }
        }
    }
    
    // Set thumb keys
    layout.leftHand.thumbOuter = leftThumb;
    layout.rightHand.thumbOuter = rightThumb;
    
    return layout;
}

/**
 * Compare two KeyboardLayout objects
 */
function compareLayouts(layout1, layout2) {
    // Compare left hand rows
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 6; col++) {
            if (layout1.leftHand.rows[row][col] !== layout2.leftHand.rows[row][col]) {
                return {
                    match: false,
                    reason: `Left hand row ${row} col ${col} mismatch: '${layout1.leftHand.rows[row][col]}' vs '${layout2.leftHand.rows[row][col]}'`
                };
            }
        }
    }
    
    // Compare right hand rows
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 6; col++) {
            if (layout1.rightHand.rows[row][col] !== layout2.rightHand.rows[row][col]) {
                return {
                    match: false,
                    reason: `Right hand row ${row} col ${col} mismatch: '${layout1.rightHand.rows[row][col]}' vs '${layout2.rightHand.rows[row][col]}'`
                };
            }
        }
    }
    
    // Compare thumb keys
    if (layout1.leftHand.thumbOuter !== layout2.leftHand.thumbOuter) {
        return {
            match: false,
            reason: `Left thumb outer mismatch: '${layout1.leftHand.thumbOuter}' vs '${layout2.leftHand.thumbOuter}'`
        };
    }
    
    if (layout1.rightHand.thumbOuter !== layout2.rightHand.thumbOuter) {
        return {
            match: false,
            reason: `Right thumb outer mismatch: '${layout1.rightHand.thumbOuter}' vs '${layout2.rightHand.thumbOuter}'`
        };
    }
    
    return { match: true };
}

/**
 * Test cases for keyboard layout conversions
 */
const TEST_CASES = [
    {
        name: "Graphite (no thumb)",
        url: "https://cyanophage.github.io/playground.html?layout=bldwz%27fouj%3Bnrtsgyhaei%2Cqxmcvkp.-%2F%5C%5E",
        expectedLayout: createTestLayout(
            // Left hand: columns are right-aligned, so we need to pad correctly
            [[' ', 'b', 'l', 'd', 'w', 'z'], 
             [' ', 'n', 'r', 't', 's', 'g'],
             [' ', 'q', 'x', 'm', 'c', 'v']],
            // Right hand: columns are left-aligned
            [["'", 'f', 'o', 'u', 'j', ';'],
             ['y', 'h', 'a', 'e', 'i', ','],
             ['k', 'p', '.', '-', '/', ' ']]
        )
    },
    
    {
        name: "Maltron (thumb without explicit parameter - defaults to left)",
        url: "https://cyanophage.github.io/playground.html?layout=qpycbvmuzl%3Danisfdthor%27%2C.jg%3B%2Fwk-x%5Ce&mode=ergo&lan=english",
        expectedLayout: createTestLayout(
            // Left hand
            [[' ', 'q', 'p', 'y', 'c', 'b'],
             [' ', 'a', 'n', 'i', 's', 'f'],
             [' ', ',', '.', 'j', 'g', ';']],
            // Right hand
            [['v', 'm', 'u', 'z', 'l', '='],
             ['d', 't', 'h', 'o', 'r', "'"],
             ['/', 'w', 'k', '-', 'x', ' ']],
            'e'  // left thumb (default)
        )
    }
];

/**
 * Run a single test case
 */
function runTest(testCase) {
    console.group(`Test: ${testCase.name}`);
    console.log('URL:', testCase.url);
    
    try {
        // Convert URL to keyboard layout
        const actualLayout = cyanophageToKeyboard(testCase.url);
        
        // Compare with expected layout
        const comparison = compareLayouts(actualLayout, testCase.expectedLayout);
        
        if (comparison.match) {
            console.log('%c✓ PASS', 'color: green; font-weight: bold');
        } else {
            console.log('%c✗ FAIL', 'color: red; font-weight: bold');
            console.log('Reason:', comparison.reason);
            console.log('\nExpected layout:', testCase.expectedLayout);
            console.log('Actual layout:', actualLayout);
        }
    } catch (error) {
        console.log('%c✗ ERROR', 'color: red; font-weight: bold');
        console.error(error);
    }
    
    console.groupEnd();
}

/**
 * Run all test cases
 */
function runAllTests() {
    console.clear();
    console.log('%c=== Keyboard Layout Conversion Tests ===', 'font-size: 16px; font-weight: bold; color: blue');
    console.log('');
    
    let passed = 0;
    let failed = 0;
    
    TEST_CASES.forEach(testCase => {
        try {
            const actualLayout = cyanophageToKeyboard(testCase.url);
            const comparison = compareLayouts(actualLayout, testCase.expectedLayout);
            
            if (comparison.match) {
                passed++;
                console.log(`%c✓ ${testCase.name}`, 'color: green');
            } else {
                failed++;
                console.log(`%c✗ ${testCase.name}`, 'color: red');
                console.log('  ', comparison.reason);
            }
        } catch (error) {
            failed++;
            console.log(`%c✗ ${testCase.name} (ERROR)`, 'color: red');
            console.error('  ', error);
        }
    });
    
    console.log('');
    console.log(`%c=== Results: ${passed} passed, ${failed} failed ===`, 'font-size: 14px; font-weight: bold');
    
    if (failed > 0) {
        console.log('\nRun individual tests for details: testKeyboardConversion.runTest(testKeyboardConversion.TEST_CASES[index])');
    }
}

// Export for console use
window.testKeyboardConversion = {
    runAllTests,
    runTest,
    TEST_CASES,
    createTestLayout,
    compareLayouts
};

console.log('%cKeyboard Layout Tests Loaded!', 'color: blue; font-weight: bold');
console.log('Run tests with: testKeyboardConversion.runAllTests()');
console.log('Or test individual cases: testKeyboardConversion.runTest(testKeyboardConversion.TEST_CASES[0])');
