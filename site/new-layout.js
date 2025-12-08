/**
 * New Layout Generator - Page Logic
 * Uses modular keyboard functions from keyboard.js, cyanophage.js, and keyboard-visualization.js
 */

import { KeyboardLayout } from './keyboard.js';
import { keyboardToCyanophage, cyanophageToKeyboard } from './cyanophage.js';
import { renderKeyboard } from './keyboard_visualization.js';

// Store current state
let currentLayout = null;
let currentUrl = '';
let hasThumb = false;
let existingLayouts = []; // Loaded from data.json

/**
 * Load existing layouts from data.json
 */
async function loadExistingLayouts() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        existingLayouts = data.layouts || [];
        console.log(`Loaded ${existingLayouts.length} existing layouts`);
    } catch (err) {
        console.warn('Could not load existing layouts:', err);
        existingLayouts = [];
    }
}

/**
 * Extract the layout parameter from a Cyanophage URL
 */
function extractLayoutParam(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('layout');
    } catch {
        // Try regex for partial URLs
        const match = url.match(/[?&]layout=([^&]+)/);
        return match ? match[1] : null;
    }
}

/**
 * Check if a layout URL already exists in the database
 * @returns {Object|null} - The existing layout if found, null otherwise
 */
function findExistingLayout(url) {
    const layoutParam = extractLayoutParam(url);
    if (!layoutParam) return null;
    
    for (const layout of existingLayouts) {
        const existingParam = extractLayoutParam(layout.url);
        if (existingParam === layoutParam) {
            return layout;
        }
    }
    return null;
}

/**
 * Parses the layout text input into a KeyboardLayout data structure.
 * 
 * Expected format (with or without spaces):
 *   Each row can have 4-10 keys total (split between left and right hand, max 5 per hand)
 *   Keys are aligned from the inside (middle) towards the outside (pinky)
 *   
 *   Left hand: right-aligned in 5 columns (4-5 keys, columns 1-5, position 0 unused)
 *   Right hand: left-aligned in 5 columns (4-5 keys, columns 0-4, position 5 unused)
 * 
 * Physical layout uses 6 columns per hand but only inner 5 are typically used.
 * 
 * Examples:
 *   b l d w z ' f o u j ;      (5+6)
 *   n r t s g y h a e i ,      (5+6) 
 *   q x m c v k p . - /        (5+5)
 * 
 * For thumb rows, spacing matters:
 *   Leading spaces determine which hand the thumb belongs to
 *   More spaces = right hand thumb
 * 
 * @param {string} inputText - The raw text input from the user
 * @returns {Object} - { layout: KeyboardLayout|null, error: string|null }
 */
function parseLayoutInput(inputText) {
    // Keep original lines with spacing for thumb detection
    const originalLines = inputText.split('\n');
    
    // Split into lines and clean up for main parsing
    const lines = inputText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (lines.length < 3) {
        return { layout: null, error: 'Please provide at least 3 rows of keys' };
    }

    const layout = new KeyboardLayout();
    
    // Process first 3 rows (main keyboard)
    for (let rowIndex = 0; rowIndex < 3 && rowIndex < lines.length; rowIndex++) {
        const line = lines[rowIndex];
        
        // Remove all spaces to get raw characters
        const chars = line.replace(/\s+/g, '').split('').filter(c => c.length > 0);
        
        if (chars.length < 2) {
            return {
                layout: null,
                error: `Row ${rowIndex + 1} has only ${chars.length} key(s), expected at least 2`
            };
        }
        
        if (chars.length > 12) {
            return {
                layout: null,
                error: `Row ${rowIndex + 1} has ${chars.length} keys, maximum is 12 (6 per hand)`
            };
        }
        
        // Split the row - find the midpoint
        const midpoint = Math.floor(chars.length / 2);
        
        const leftKeys = chars.slice(0, midpoint);
        const rightKeys = chars.slice(midpoint);
        
        // Left hand: right-align in columns 1-5 (position 0 is typically unused)
        // If we have 5 keys, they go in columns 1-5
        // If we have 4 keys, they go in columns 2-5, etc.
        const leftStartCol = 6 - leftKeys.length;
        for (let i = 0; i < leftKeys.length && leftStartCol + i < 6; i++) {
            layout.setLeftKey(rowIndex, leftStartCol + i, leftKeys[i].toLowerCase());
        }
        
        // Right hand: left-align in columns 0-4 (position 5 is typically unused)
        // Keys fill from column 0 onwards, up to max 5 keys
        for (let i = 0; i < rightKeys.length && i < 5; i++) {
            layout.setRightKey(rowIndex, i, rightKeys[i].toLowerCase());
        }
        
        // If right hand has a 6th key, it might be in position 5 (outermost)
        if (rightKeys.length > 5) {
            layout.setRightKey(rowIndex, 5, rightKeys[5].toLowerCase());
        }
    }
    
    // Process optional 4th row (thumb keys)
    if (lines.length > 3) {
        const thumbLine = lines[3];
        
        // For thumb row, preserve spacing to determine hand assignment
        // Find the original 4th line (accounting for empty lines)
        let originalThumbLine = '';
        let nonEmptyCount = 0;
        for (let i = 0; i < originalLines.length; i++) {
            const trimmed = originalLines[i].trim();
            if (trimmed.length > 0) {
                nonEmptyCount++;
                if (nonEmptyCount === 4) {
                    originalThumbLine = originalLines[i];
                    break;
                }
            }
        }
        
        // Get all thumb characters (only support 1 alpha key)
        const thumbChars = thumbLine.replace(/\s+/g, '').split('').filter(c => c.length > 0);
        
        if (thumbChars.length > 1) {
            return {
                layout: null,
                error: 'Only 1 alpha key is supported on the thumb row by the stats engine (cyanophage.github.io)'
            };
        }
        
        if (thumbChars.length > 0 && originalThumbLine) {
            // Calculate the midpoint based on the first row's layout
            // Find where the gap between hands is in the original first row
            let originalFirstRow = '';
            for (let i = 0; i < originalLines.length; i++) {
                const trimmed = originalLines[i].trim();
                if (trimmed.length > 0) {
                    originalFirstRow = originalLines[i];
                    break;
                }
            }
            
            if (originalFirstRow) {
                // Find the position of the first character on the first row
                const firstRowStart = originalFirstRow.search(/\S/);
                // Get all characters from first row
                const firstRowChars = originalFirstRow.replace(/\s+/g, '').split('');
                const midpoint = Math.floor(firstRowChars.length / 2);
                
                // Find positions of each character in the original first row
                let charPositions = [];
                let charIndex = 0;
                for (let i = 0; i < originalFirstRow.length; i++) {
                    if (originalFirstRow[i] !== ' ' && originalFirstRow[i] !== '\t') {
                        charPositions.push(i);
                        charIndex++;
                    }
                }
                
                // The gap should be between the midpoint-1 and midpoint character
                const gapPosition = charPositions.length > 0 ? 
                    (charPositions[midpoint - 1] + charPositions[midpoint]) / 2 : 
                    originalFirstRow.length / 2;
                
                // Find where the first thumb character appears in the original thumb line
                const firstCharPos = originalThumbLine.indexOf(thumbChars[0]);
                
                // If thumb char is after the gap, it's right thumb
                const isRightThumb = firstCharPos > gapPosition;
                
                if (isRightThumb) {
                    // Thumb on right side (outer position only)
                    layout.rightHand.thumbOuter = thumbChars[0].toLowerCase();
                } else {
                    // Thumb on left side (outer position only)
                    layout.leftHand.thumbOuter = thumbChars[0].toLowerCase();
                }
            }
        }
    }

    console.log('Parsed Keyboard Layout:');
    console.log(layout.toString());
    console.log('\nFlat array representation:', layout.toFlatArray());

    return { layout, error: null };
}

/**
 * Switch between text input and URL input tabs
 */
function switchInputTab(tab) {
    const textTab = document.getElementById('textTab');
    const urlTab = document.getElementById('urlTab');
    const textPanel = document.getElementById('textPanel');
    const urlPanel = document.getElementById('urlPanel');
    
    if (tab === 'text') {
        textTab.classList.add('active');
        urlTab.classList.remove('active');
        textPanel.classList.add('active');
        urlPanel.classList.remove('active');
    } else {
        textTab.classList.remove('active');
        urlTab.classList.add('active');
        textPanel.classList.remove('active');
        urlPanel.classList.add('active');
    }
}

/**
 * Show or hide a step card
 */
function showStep(stepId, show = true) {
    const step = document.getElementById(stepId);
    if (step) {
        if (show) {
            step.classList.remove('hidden');
        } else {
            step.classList.add('hidden');
        }
    }
}

/**
 * Process text layout input and update the UI
 */
function processLayoutText() {
    const inputText = document.getElementById('layoutInput').value;
    const errorDiv = document.getElementById('errorMessage');
    
    // Hide previous errors
    errorDiv.classList.remove('show');
    
    if (!inputText.trim()) {
        // Hide steps 2-4 if no input
        showStep('step2', false);
        showStep('step3', false);
        showStep('step4', false);
        currentLayout = null;
        currentUrl = '';
        return;
    }
    
    // Parse the layout
    const { layout, error } = parseLayoutInput(inputText);
    
    if (error) {
        errorDiv.textContent = error;
        errorDiv.classList.add('show');
        showStep('step2', false);
        showStep('step3', false);
        showStep('step4', false);
        currentLayout = null;
        currentUrl = '';
        return;
    }
    
    // Store current layout
    currentLayout = layout;
    
    // Generate URL
    currentUrl = keyboardToCyanophage(layout);
    
    // Also fill in the URL input field
    document.getElementById('cyanophageUrlInput').value = currentUrl;
    
    // Update display
    updateLayoutDisplay();
}

/**
 * Process direct URL input and update the UI
 */
function processUrlInput() {
    const urlInput = document.getElementById('cyanophageUrlInput').value.trim();
    const errorDiv = document.getElementById('errorMessage');
    
    // Hide previous errors
    errorDiv.classList.remove('show');
    
    if (!urlInput) {
        // Hide steps 2-4 if no input
        showStep('step2', false);
        showStep('step3', false);
        showStep('step4', false);
        currentLayout = null;
        currentUrl = '';
        return;
    }
    
    // Validate it's a cyanophage URL
    if (!urlInput.includes('cyanophage.github.io')) {
        errorDiv.textContent = 'Please enter a valid Cyanophage URL (e.g., https://cyanophage.github.io/playground.html?layout=...)';
        errorDiv.classList.add('show');
        showStep('step2', false);
        showStep('step3', false);
        showStep('step4', false);
        return;
    }
    
    try {
        // Parse the URL to extract the layout
        const layout = cyanophageToKeyboard(urlInput);
        
        if (!layout) {
            throw new Error('Could not parse layout from URL');
        }
        
        currentLayout = layout;
        currentUrl = urlInput;
        
        // Update display
        updateLayoutDisplay();
    } catch (err) {
        errorDiv.textContent = 'Could not parse the Cyanophage URL. Please check the URL format.';
        errorDiv.classList.add('show');
        showStep('step2', false);
        showStep('step3', false);
        showStep('step4', false);
        currentLayout = null;
        currentUrl = '';
    }
}

/**
 * Update the layout display (keyboard preview, URL, validation status)
 */
function updateLayoutDisplay() {
    if (!currentLayout || !currentUrl) {
        return;
    }
    
    // Show step 2
    showStep('step2', true);
    
    // Render keyboard preview
    const svg = document.getElementById('keyboard-preview-svg');
    renderKeyboard(currentLayout, svg);
    
    // Update URL display
    const resultUrlDiv = document.getElementById('resultUrl');
    resultUrlDiv.innerHTML = `<a href="${currentUrl}" target="_blank">${currentUrl}</a>`;
    
    // Check for thumb keys
    const hasLeftThumb = currentLayout.leftHand.thumbOuter && currentLayout.leftHand.thumbOuter !== ' ';
    const hasRightThumb = currentLayout.rightHand.thumbOuter && currentLayout.rightHand.thumbOuter !== ' ';
    hasThumb = hasLeftThumb || hasRightThumb;
    
    // Check if this layout already exists
    const existingLayout = findExistingLayout(currentUrl);
    const validationStatus = document.getElementById('validationStatus');
    
    if (existingLayout) {
        // Layout already exists - show warning and hide steps 3 & 4
        validationStatus.className = 'validation-status duplicate';
        validationStatus.innerHTML = `
            <i class="fa-solid fa-circle-info"></i>
            <span>This layout already exists as "<strong>${existingLayout.name}</strong>"</span>
        `;
        
        // Show duplicate notice with link to open issue
        const duplicateNotice = document.getElementById('duplicateNotice');
        if (duplicateNotice) {
            duplicateNotice.classList.add('show');
            duplicateNotice.querySelector('.existing-layout-name').textContent = existingLayout.name;
        }
        
        // Hide steps 3 and 4 since layout already exists
        showStep('step3', false);
        showStep('step4', false);
    } else {
        // New layout - show success
        validationStatus.className = 'validation-status valid';
        validationStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i><span>Layout parsed successfully</span>';
        
        // Hide duplicate notice
        const duplicateNotice = document.getElementById('duplicateNotice');
        if (duplicateNotice) {
            duplicateNotice.classList.remove('show');
        }
        
        // Show steps 3 and 4
        showStep('step3', true);
        showStep('step4', true);
        
        // Update YAML preview
        updateYamlPreview();
    }
}

/**
 * Update the YAML configuration preview
 */
function updateYamlPreview() {
    if (!currentUrl) {
        return;
    }
    
    const layoutName = document.getElementById('layoutName').value.trim() || 'my_layout';
    const layoutYear = document.getElementById('layoutYear').value.trim();
    const layoutWebsite = document.getElementById('layoutWebsite').value.trim();
    
    let yaml = `- name: ${layoutName.toLowerCase().replace(/\s+/g, '_')}
  link: ${currentUrl}
  thumb: ${hasThumb}`;
    
    if (layoutYear) {
        yaml += `\n  year: ${layoutYear}`;
    }
    
    if (layoutWebsite) {
        yaml += `\n  website: ${layoutWebsite}`;
    }
    
    const resultYamlDiv = document.getElementById('resultYaml');
    resultYamlDiv.textContent = yaml;
    
    // Update the GitHub issue button
    updateIssueButton(layoutName, yaml);
}

/**
 * Update the GitHub issue button with the correct URL
 */
function updateIssueButton(layoutName, yaml) {
    const btn = document.getElementById('submitIssueBtn');
    
    const title = encodeURIComponent(`Add new layout: ${layoutName || 'new layout'}`);
    const body = encodeURIComponent(`Please add this layout to the rankings:\n\n\`\`\`yaml\n${yaml}\n\`\`\``);
    
    btn.href = `https://github.com/timvink/alt_alpha_ranker/issues/new?title=${title}&body=${body}&assignees=copilot`;
}

/**
 * Copies the generated URL or YAML to clipboard.
 * @param {string} type - Either 'url' or 'yaml'
 */
function copyToClipboard(type) {
    let textToCopy;
    let buttonSelector;
    
    if (type === 'yaml') {
        textToCopy = document.getElementById('resultYaml').textContent;
        buttonSelector = '#resultYaml + .copy-button';
    } else {
        const urlElement = document.getElementById('resultUrl').querySelector('a');
        textToCopy = urlElement ? urlElement.href : document.getElementById('resultUrl').textContent;
        buttonSelector = '#resultUrl + .copy-button';
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        // Visual feedback - find the specific button that was clicked
        const button = document.querySelector(buttonSelector);
        
        if (button) {
            button.classList.add('copied');
            
            setTimeout(() => {
                button.classList.remove('copied');
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}

/**
 * Initialize all event handlers for the page
 */
async function initEventHandlers() {
    // Load existing layouts first
    await loadExistingLayouts();
    
    // Tab switching
    document.getElementById('textTab').addEventListener('click', () => switchInputTab('text'));
    document.getElementById('urlTab').addEventListener('click', () => switchInputTab('url'));
    
    // Layout input handlers
    document.getElementById('layoutInput').addEventListener('input', processLayoutText);
    document.getElementById('cyanophageUrlInput').addEventListener('input', processUrlInput);
    
    // Context form handlers
    document.getElementById('layoutName').addEventListener('input', updateYamlPreview);
    document.getElementById('layoutYear').addEventListener('input', updateYamlPreview);
    document.getElementById('layoutWebsite').addEventListener('input', updateYamlPreview);
    
    // Copy buttons
    document.getElementById('copyUrlBtn').addEventListener('click', () => copyToClipboard('url'));
    document.getElementById('copyYamlBtn').addEventListener('click', () => copyToClipboard('yaml'));
}

// Export for ES module usage
export { initEventHandlers };

// Export to window for browser usage (inline scripts)
if (typeof window !== 'undefined') {
    window.switchInputTab = switchInputTab;
    window.processLayoutText = processLayoutText;
    window.processUrlInput = processUrlInput;
    window.updateYamlPreview = updateYamlPreview;
    window.copyToClipboard = copyToClipboard;
}
