/**
 * Layout score calculation module.
 * 
 * Calculates composite scores for keyboard layouts using QWERTY-fixed normalization.
 * This approach uses fixed reference points:
 * - For lower-is-better metrics: 0 is best, QWERTY's value is worst
 * - For higher-is-better metrics: 100 is best, QWERTY's value is worst
 * 
 * Scores represent improvement over QWERTY: 0% = same as QWERTY, 100% = best possible.
 * Negative scores are possible for layouts worse than QWERTY on some metrics.
 * 
 * Metrics and their direction:
 * - SFB (same_finger_bigrams): lower is better
 * - SFS (skip_bigrams_1u): lower is better
 * - LSB (lat_stretch_bigrams): lower is better
 * - Scissors: lower is better
 * - Rolls (sum of bigram_roll_in, bigram_roll_out, roll_in, roll_out): higher is better
 * - Redirect: lower is better
 * - Pinky Off (pinky_off): lower is better
 */

/**
 * Extract numeric value from a metric string (removes % sign).
 * @param {string} value - The metric value, e.g. "1.23%"
 * @returns {number} The numeric value
 */
export function parseMetricValue(value) {
    if (value === undefined || value === null) return 0;
    return parseFloat(String(value).replace('%', '')) || 0;
}

/**
 * Extract all metric values from a layout's metrics object.
 * @param {Object} metrics - The metrics object for a specific language
 * @returns {Object} Object with sfb, sfs, lsb, scissors, rolls, redirect, pinky values
 */
export function extractMetricValues(metrics) {
    if (!metrics) {
        return { sfb: 0, sfs: 0, lsb: 0, scissors: 0, rolls: 0, redirect: 0, pinky: 0 };
    }

    const sfb = parseMetricValue(metrics.same_finger_bigrams);
    const sfs = parseMetricValue(metrics.skip_bigrams_1u);
    const lsb = parseMetricValue(metrics.lat_stretch_bigrams);
    const scissors = parseMetricValue(metrics.scissors);
    const redirect = parseMetricValue(metrics.redirect);
    const pinky = parseMetricValue(metrics.pinky_off);
    
    // Calculate rolls sum (bigram roll in + bigram roll out + roll in + roll out)
    const rolls = parseMetricValue(metrics.bigram_roll_in) +
                  parseMetricValue(metrics.bigram_roll_out) +
                  parseMetricValue(metrics.roll_in) +
                  parseMetricValue(metrics.roll_out);

    return { sfb, sfs, lsb, scissors, rolls, redirect, pinky };
}

/**
 * Normalize a value using QWERTY-fixed normalization.
 * Uses fixed reference points:
 * - For lower-is-better: 0 is best, QWERTY's value is worst
 * - For higher-is-better: 100 is best, QWERTY's value is worst
 * 
 * Returns 0 when value equals QWERTY, 1 when value equals the fixed best.
 * Can return values > 1 if layout is better than the fixed best.
 * Negative values indicate worse than QWERTY.
 * 
 * @param {number} value - The value to normalize
 * @param {number} qwertyValue - QWERTY's value (the reference point = 0)
 * @param {boolean} lowerIsBetter - Whether lower values are better
 * @returns {number} Normalized value (0 = QWERTY, 1 = fixed best, negative = worse than QWERTY)
 */
export function normalizeToQwerty(value, qwertyValue, lowerIsBetter) {
    if (lowerIsBetter) {
        // For lower-is-better: best = 0, worst = qwerty
        // normalized = (qwerty - value) / qwerty
        // At qwerty: (qwerty - qwerty) / qwerty = 0
        // At 0: (qwerty - 0) / qwerty = 1
        if (qwertyValue === 0) {
            return value === 0 ? 1 : 0;
        }
        return (qwertyValue - value) / qwertyValue;
    } else {
        // For higher-is-better (rolls): best = 100, worst = qwerty
        // normalized = (value - qwerty) / (100 - qwerty)
        // At qwerty: 0
        // At 100: 1
        const range = 100 - qwertyValue;
        if (range === 0) return 0;
        return (value - qwertyValue) / range;
    }
}

/**
 * Find QWERTY layout in the layouts array.
 * @param {Array<Object>} layouts - Array of layout objects
 * @returns {Object|null} QWERTY layout or null if not found
 */
export function findQwertyLayout(layouts) {
    return layouts.find(l => l.name.toLowerCase() === 'qwerty') || null;
}

/**
 * Calculate raw score for a single layout given its normalized values and weights.
 * All normalized values are already in "higher is better" form (0 = QWERTY, 1 = best).
 * 
 * @param {Object} normalizedValues - Object with normalized metric values
 * @param {Object} weights - Object with weight for each metric (0-100)
 * @returns {number} Raw score (weighted sum)
 */
export function calculateRawScore(normalizedValues, weights) {
    return (
        weights.sfb * normalizedValues.sfb +
        weights.sfs * normalizedValues.sfs +
        weights.lsb * normalizedValues.lsb +
        weights.scissors * normalizedValues.scissors +
        weights.rolls * normalizedValues.rolls +
        weights.redirect * normalizedValues.redirect +
        weights.pinky * normalizedValues.pinky
    );
}

/**
 * Calculate scores for all layouts using QWERTY-fixed normalization.
 * 
 * The algorithm:
 * 1. Find QWERTY layout to use as reference (0 point)
 * 2. Use fixed best values: 0 for lower-is-better metrics, 100 for rolls
 * 3. Normalize each layout's metrics relative to QWERTY and fixed best
 * 4. Calculate weighted sum for each layout
 * 5. Scale to percentage (QWERTY = 0%, fixed best = 100%)
 * 
 * @param {Array<Object>} layouts - Array of layout objects with metrics
 * @param {Object} weights - Object with weights for each metric (sfb, sfs, lsb, scissors, rolls, redirect, pinky)
 * @param {string} language - Language to use for metrics (e.g., 'english')
 * @returns {Object} Object mapping layout names to scores (0 = QWERTY level, 100 = fixed best, can be negative)
 */
export function calculateScores(layouts, weights, language = 'english') {
    if (!layouts || layouts.length === 0) {
        return {};
    }

    // Find QWERTY layout
    const qwertyLayout = findQwertyLayout(layouts);
    if (!qwertyLayout) {
        // Fallback: if no QWERTY, use worst values as reference
        console.warn('QWERTY layout not found, falling back to min-max normalization');
        return calculateScoresFallback(layouts, weights, language);
    }

    // Extract QWERTY's metric values for this language
    const qwertyMetrics = qwertyLayout.metrics?.[language] || {};
    const qwertyValues = extractMetricValues(qwertyMetrics);

    // Extract metric values for all layouts
    const metricValuesList = layouts.map(layout => {
        const metrics = layout.metrics?.[language] || {};
        return {
            name: layout.name,
            values: extractMetricValues(metrics)
        };
    });

    // Calculate normalized values and raw scores using fixed best values
    // Fixed best: 0 for lower-is-better, 100 for higher-is-better (rolls)
    const rawScores = metricValuesList.map(({ name, values }) => {
        const normalizedValues = {
            sfb: normalizeToQwerty(values.sfb, qwertyValues.sfb, true),
            sfs: normalizeToQwerty(values.sfs, qwertyValues.sfs, true),
            lsb: normalizeToQwerty(values.lsb, qwertyValues.lsb, true),
            scissors: normalizeToQwerty(values.scissors, qwertyValues.scissors, true),
            rolls: normalizeToQwerty(values.rolls, qwertyValues.rolls, false),
            redirect: normalizeToQwerty(values.redirect, qwertyValues.redirect, true),
            pinky: normalizeToQwerty(values.pinky, qwertyValues.pinky, true)
        };

        const rawScore = calculateRawScore(normalizedValues, weights);
        return { name, rawScore };
    });

    // Calculate max possible raw score (when all normalized values = 1)
    const maxRawScore = Object.values(weights).reduce((sum, w) => sum + w, 0);

    // Convert to percentage (0 = QWERTY, 100 = fixed best)
    const scores = {};
    rawScores.forEach(({ name, rawScore }) => {
        // Score as percentage of max possible improvement over QWERTY
        const score = maxRawScore > 0 ? (rawScore / maxRawScore) * 100 : 0;
        scores[name] = Math.round(score * 10) / 10; // Round to 1 decimal
    });

    return scores;
}

/**
 * Fallback score calculation when QWERTY is not in the dataset.
 * Uses min-max normalization as before.
 */
function calculateScoresFallback(layouts, weights, language) {
    const metricValuesList = layouts.map(layout => {
        const metrics = layout.metrics?.[language] || {};
        return {
            name: layout.name,
            values: extractMetricValues(metrics)
        };
    });

    const keys = ['sfb', 'sfs', 'lsb', 'scissors', 'rolls', 'redirect', 'pinky'];
    const minMax = {};
    keys.forEach(key => {
        const values = metricValuesList.map(m => m.values[key]);
        minMax[key] = { min: Math.min(...values), max: Math.max(...values) };
    });

    const normalize = (value, min, max) => {
        if (max === min) return 0.5;
        return (value - min) / (max - min);
    };

    const rawScores = metricValuesList.map(({ name, values }) => {
        const rawScore = 
            weights.sfb * (1 - normalize(values.sfb, minMax.sfb.min, minMax.sfb.max)) +
            weights.sfs * (1 - normalize(values.sfs, minMax.sfs.min, minMax.sfs.max)) +
            weights.lsb * (1 - normalize(values.lsb, minMax.lsb.min, minMax.lsb.max)) +
            weights.scissors * (1 - normalize(values.scissors, minMax.scissors.min, minMax.scissors.max)) +
            weights.rolls * normalize(values.rolls, minMax.rolls.min, minMax.rolls.max) +
            weights.redirect * (1 - normalize(values.redirect, minMax.redirect.min, minMax.redirect.max)) +
            weights.pinky * (1 - normalize(values.pinky, minMax.pinky.min, minMax.pinky.max));
        return { name, rawScore };
    });

    const rawMin = Math.min(...rawScores.map(r => r.rawScore));
    const rawMax = Math.max(...rawScores.map(r => r.rawScore));

    const scores = {};
    rawScores.forEach(({ name, rawScore }) => {
        const finalScore = rawMax === rawMin ? 50 : 100 * (rawScore - rawMin) / (rawMax - rawMin);
        scores[name] = Math.round(finalScore * 10) / 10;
    });

    return scores;
}

// Default export for convenience
export default {
    parseMetricValue,
    extractMetricValues,
    normalizeToQwerty,
    findQwertyLayout,
    calculateRawScore,
    calculateScores
};
