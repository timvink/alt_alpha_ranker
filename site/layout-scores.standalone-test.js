/**
 * Tests for layout-scores.js
 * 
 * Run with: node --experimental-vm-modules site/layout-scores.test.js
 * Or open in browser console after including the module.
 */

import {
    parseMetricValue,
    extractMetricValues,
    normalizeToQwerty,
    findQwertyLayout,
    calculateRawScore,
    calculateScores
} from './layout-scores.js';

// Test data: QWERTY, graphite and octa8 layouts (english metrics)
const qwertyMetrics = {
    "pinky_off": "2.47%",
    "skip_bigrams_1u": "5.45%",
    "bigram_roll_in": "20.38%",
    "bigram_roll_out": "17.58%",
    "roll_in": "1.32%",
    "roll_out": "1.48%",
    "redirect": "6.22%",
    "same_finger_bigrams": "4.38%",
    "lat_stretch_bigrams": "4.55%",
    "scissors": "1.46%"
};

const graphiteMetrics = {
    "pinky_off": "2.34%",
    "skip_bigrams_1u": "2.73%",
    "skip_bigrams_2u": "0.24%",
    "bigram_roll_in": "21.68%",
    "bigram_roll_out": "22.65%",
    "roll_in": "0.50%",
    "roll_out": "1.18%",
    "redirect": "1.80%",
    "weak_redirect": "0.26%",
    "total_word_effort": "952.5",
    "effort": "521.49",
    "same_finger_bigrams": "0.68%",
    "lat_stretch_bigrams": "0.87%",
    "scissors": "0.41%"
};

const octa8Metrics = {
    "pinky_off": "3.48%",
    "skip_bigrams_1u": "2.99%",
    "skip_bigrams_2u": "0.20%",
    "bigram_roll_in": "22.79%",
    "bigram_roll_out": "23.42%",
    "roll_in": "1.88%",
    "roll_out": "0.71%",
    "redirect": "3.03%",
    "weak_redirect": "0.33%",
    "total_word_effort": "1039.5",
    "effort": "557.99",
    "same_finger_bigrams": "0.88%",
    "lat_stretch_bigrams": "0.64%",
    "scissors": "0.10%"
};

const testLayouts = [
    { name: "qwerty", metrics: { english: qwertyMetrics } },
    { name: "graphite", metrics: { english: graphiteMetrics } },
    { name: "octa8", metrics: { english: octa8Metrics } }
];

// Equal weights (all 100)
const equalWeights = {
    sfb: 100,
    sfs: 100,
    lsb: 100,
    scissors: 100,
    rolls: 100,
    redirect: 100,
    pinky: 100
};

// Simple test framework
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        testsPassed++;
        console.log(`✓ ${message}`);
    } else {
        testsFailed++;
        console.error(`✗ ${message}`);
    }
}

function assertApproxEqual(actual, expected, tolerance, message) {
    const diff = Math.abs(actual - expected);
    if (diff <= tolerance) {
        testsPassed++;
        console.log(`✓ ${message} (${actual} ≈ ${expected})`);
    } else {
        testsFailed++;
        console.error(`✗ ${message} (${actual} != ${expected}, diff: ${diff})`);
    }
}

// Tests
console.log('\n=== Testing parseMetricValue ===');
assert(parseMetricValue("1.23%") === 1.23, 'parseMetricValue handles percentage strings');
assert(parseMetricValue("0.68%") === 0.68, 'parseMetricValue handles small percentages');
assert(parseMetricValue(null) === 0, 'parseMetricValue handles null');
assert(parseMetricValue(undefined) === 0, 'parseMetricValue handles undefined');
assert(parseMetricValue("100") === 100, 'parseMetricValue handles numbers without %');

console.log('\n=== Testing extractMetricValues ===');
const graphiteValues = extractMetricValues(graphiteMetrics);
assertApproxEqual(graphiteValues.sfb, 0.68, 0.01, 'graphite SFB extracted correctly');
assertApproxEqual(graphiteValues.sfs, 2.73, 0.01, 'graphite SFS extracted correctly');
assertApproxEqual(graphiteValues.lsb, 0.87, 0.01, 'graphite LSB extracted correctly');
assertApproxEqual(graphiteValues.scissors, 0.41, 0.01, 'graphite scissors extracted correctly');
assertApproxEqual(graphiteValues.redirect, 1.80, 0.01, 'graphite redirect extracted correctly');
assertApproxEqual(graphiteValues.pinky, 2.34, 0.01, 'graphite pinky extracted correctly');

// Rolls In = 21.68 + 0.50 = 22.18 (inward rolls only)
assertApproxEqual(graphiteValues.rolls, 22.18, 0.01, 'graphite rolls in calculated correctly');

const qwertyValues = extractMetricValues(qwertyMetrics);
assertApproxEqual(qwertyValues.sfb, 4.38, 0.01, 'qwerty SFB extracted correctly');
// Rolls In = 20.38 + 1.32 = 21.70 (inward rolls only)
assertApproxEqual(qwertyValues.rolls, 21.70, 0.01, 'qwerty rolls in calculated correctly');

console.log('\n=== Testing normalizeToQwerty (QWERTY-fixed approach) ===');
// For lower-is-better: normalized = (qwerty - value) / qwerty
// SFB: qwerty=4.38
// graphite (0.68): (4.38 - 0.68) / 4.38 = 0.845
// qwerty (4.38): (4.38 - 4.38) / 4.38 = 0.0 (reference)
assertApproxEqual(normalizeToQwerty(0.68, 4.38, true), 0.845, 0.01, 'graphite SFB normalizes correctly');
assertApproxEqual(normalizeToQwerty(4.38, 4.38, true), 0.0, 0.01, 'qwerty value normalizes to 0.0');
// At value=0, normalized = (4.38 - 0) / 4.38 = 1.0 (perfect)
assertApproxEqual(normalizeToQwerty(0, 4.38, true), 1.0, 0.01, 'zero value normalizes to 1.0 (best)');

// For higher-is-better: normalized = (value - qwerty) / (100 - qwerty)
// Rolls In: qwerty=21.70
// octa8 (24.67): (24.67 - 21.70) / (100 - 21.70) = 2.97 / 78.30 = 0.038
// qwerty: (21.70 - 21.70) / (100 - 21.70) = 0.0 (reference)
assertApproxEqual(normalizeToQwerty(24.67, 21.70, false), 0.038, 0.01, 'octa8 rolls in normalizes correctly');
assertApproxEqual(normalizeToQwerty(21.70, 21.70, false), 0.0, 0.01, 'qwerty rolls in normalizes to 0.0');
// At value=100, normalized = (100 - 21.70) / (100 - 21.70) = 1.0 (perfect)
assertApproxEqual(normalizeToQwerty(100, 21.70, false), 1.0, 0.01, '100% rolls in normalizes to 1.0 (best)');

// Test negative values (worse than qwerty)
// If a layout has SFB = 5.0 (worse than qwerty's 4.38):
// (4.38 - 5.0) / 4.38 = -0.62 / 4.38 = -0.14
assertApproxEqual(normalizeToQwerty(5.0, 4.38, true), -0.14, 0.02, 'worse than qwerty gives negative');

console.log('\n=== Testing findQwertyLayout ===');
const foundQwerty = findQwertyLayout(testLayouts);
assert(foundQwerty !== null, 'findQwertyLayout finds qwerty');
assert(foundQwerty.name === 'qwerty', 'findQwertyLayout returns correct layout');

console.log('\n=== Testing calculateScores with QWERTY-fixed normalization ===');
const scores = calculateScores(testLayouts, equalWeights, 'english');
console.log('Scores:', scores);

// QWERTY should score 0% (it's the reference)
assertApproxEqual(scores.qwerty, 0, 0.1, 'QWERTY scores 0% (reference point)');

// Graphite should score positive (better than qwerty overall)
assert(scores.graphite > 0, `graphite (${scores.graphite}) scores positive (better than QWERTY)`);

// octa8 might be negative because it's worse than QWERTY on pinky (3.48% vs 2.47%)
// This is expected - layouts can be worse than QWERTY on some metrics
console.log(`Note: octa8 score is ${scores.octa8} - may be negative due to worse pinky than QWERTY`);

// With equal weights, graphite should still beat octa8 (wins on 4 metrics vs 3)
assert(scores.graphite > scores.octa8, `graphite (${scores.graphite}) > octa8 (${scores.octa8}) with equal weights`);

console.log('\n=== Testing score stability with additional layouts ===');
// Add more layouts and verify graphite still beats octa8
// With QWERTY-fixed normalization, scores should be IDENTICAL regardless of other layouts

const mtgapMetrics = {
    "pinky_off": "3.80%",
    "skip_bigrams_1u": "3.27%",
    "bigram_roll_in": "21.67%",
    "bigram_roll_out": "23.37%",
    "roll_in": "0.43%",
    "roll_out": "0.86%",
    "redirect": "1.78%",
    "same_finger_bigrams": "0.92%",
    "lat_stretch_bigrams": "0.46%",
    "scissors": "0.15%"
};

const aptV3Metrics = {
    "pinky_off": "3.45%",
    "skip_bigrams_1u": "3.09%",
    "bigram_roll_in": "24.18%",
    "bigram_roll_out": "22.31%",
    "roll_in": "2.16%",
    "roll_out": "0.90%",
    "redirect": "3.60%",
    "same_finger_bigrams": "0.81%",
    "lat_stretch_bigrams": "0.33%",
    "scissors": "0.11%"
};

const extendedLayouts = [
    { name: "qwerty", metrics: { english: qwertyMetrics } },
    { name: "graphite", metrics: { english: graphiteMetrics } },
    { name: "octa8", metrics: { english: octa8Metrics } },
    { name: "mtgap", metrics: { english: mtgapMetrics } },
    { name: "aptV3", metrics: { english: aptV3Metrics } }
];

const extendedScores = calculateScores(extendedLayouts, equalWeights, 'english');
console.log('Extended scores:', extendedScores);

// CRITICAL: graphite should STILL beat octa8 even with more layouts
// This is the key property that QWERTY-fixed normalization provides
assert(
    extendedScores.graphite > extendedScores.octa8, 
    `STABLE: graphite (${extendedScores.graphite}) > octa8 (${extendedScores.octa8}) even with 5 layouts`
);

// QWERTY should still be 0
assertApproxEqual(extendedScores.qwerty, 0, 0.1, 'QWERTY still scores 0% with more layouts');

// CRITICAL for QWERTY-fixed: Scores should be IDENTICAL regardless of other layouts
console.log(`\nScore comparison: 3 layouts vs 5 layouts`);
console.log(`graphite: ${scores.graphite} -> ${extendedScores.graphite}`);
console.log(`octa8: ${scores.octa8} -> ${extendedScores.octa8}`);

// With QWERTY-fixed approach, scores should be identical
assertApproxEqual(scores.graphite, extendedScores.graphite, 0.01, 'graphite score UNCHANGED with more layouts');
assertApproxEqual(scores.octa8, extendedScores.octa8, 0.01, 'octa8 score UNCHANGED with more layouts');

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed > 0) {
    console.log('\n⚠️  Some tests failed!');
    if (typeof process !== 'undefined') {
        process.exit(1);
    }
} else {
    console.log('\n✅ All tests passed!');
}
