/**
 * Keyboard Accordion Component
 * Manages collapsible keyboard preview rows in the layout table
 */

import { cyanophageToKeyboard } from './cyanophage.js';
import { renderKeyboard, getKeyboardViewPreference, getTopKeyY } from './keyboard_visualization.js';

class KeyboardAccordion {
    constructor() {
        this.openRows = new Set();
        this.isInitialized = false;
        this.layoutCache = new Map(); // Cache of layoutName -> { layout, rowElement, layoutInfo }
        
        // Listen for keyboard view changes
        window.addEventListener('keyboardViewChanged', (e) => {
            this.refreshAllOpen();
        });
    }
    
    /**
     * Update the button position to align with the top key Y position
     */
    updateButtonPosition(accordionRow) {
        const actionsEl = accordionRow.querySelector('.accordion-actions');
        if (actionsEl) {
            const viewType = getKeyboardViewPreference();
            const topKeyY = getTopKeyY(viewType);
            actionsEl.style.paddingTop = `${topKeyY}px`;
        }
    }

    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
    }
    
    /**
     * Update cyanophage URL to use specified language
     */
    updateCyanophageUrl(url, language) {
        if (!url) return url;
        try {
            const urlObj = new URL(url);
            urlObj.searchParams.set('lan', language || 'english');
            return urlObj.toString();
        } catch (e) {
            // If URL parsing fails, try simple string replacement
            if (url.includes('&lan=')) {
                return url.replace(/&lan=[^&]+/, `&lan=${language || 'english'}`);
            } else if (url.includes('?')) {
                return url + `&lan=${language || 'english'}`;
            }
            return url;
        }
    }

    /**
     * Toggle accordion for a given row
     * @param {string} layoutName - Name of the layout
     * @param {string} layoutUrl - Cyanophage URL for the layout
     * @param {HTMLElement} rowElement - The table row element
     * @param {boolean} hasThumbs - Whether layout has thumb keys
     * @param {string} website - Optional website/source URL
     */
    toggle(layoutName, layoutUrl, rowElement, hasThumbs, website) {
        const accordionRow = rowElement.nextElementSibling;
        const isOpen = accordionRow && accordionRow.classList.contains('accordion-row');
        
        if (isOpen) {
            this.close(rowElement);
        } else {
            this.open(layoutName, layoutUrl, rowElement, hasThumbs, website);
        }
    }

    /**
     * Update the button position to align with the keyboard's top key Y
     */
    updateButtonPosition(accordionRow) {
        const topKeyY = getTopKeyY(getKeyboardViewPreference());
        const actionsEl = accordionRow.querySelector('.accordion-actions');
        if (actionsEl) {
            actionsEl.style.paddingTop = `${topKeyY + 12}px`;
        }
    }

    /**
     * Open accordion and render keyboard
     */
    open(layoutName, layoutUrl, rowElement, hasThumbs = false, website = null) {
        // Get current language from global state (set by script.js)
        const currentLanguage = window.currentLanguage || 'english';
        
        // Create accordion row
        const accordionRow = this.createAccordionRow(layoutName, layoutUrl);
        rowElement.insertAdjacentElement('afterend', accordionRow);

        // Mark the data row as active
        rowElement.classList.add('active');
        
        // Open the accordion
        const content = accordionRow.querySelector('.accordion-content');
        content.classList.add('open');
        
        // Convert URL to KeyboardLayout and render
        const svg = accordionRow.querySelector('#keyboard-svg');
        const layout = cyanophageToKeyboard(layoutUrl);
        
        // Build layout info for the left panel
        const layoutInfo = {
            name: layoutName,
            statsUrl: this.updateCyanophageUrl(layoutUrl, currentLanguage),
            website: website || null
        };
        
        renderKeyboard(layout, svg, { layoutInfo });
        
        // Position the button to align with the keyboard
        this.updateButtonPosition(accordionRow);
        
        // Cache the layout for refresh
        this.layoutCache.set(rowElement, { layout, svg, layoutName, layoutUrl, website });
        
        // Add to open rows set
        this.openRows.add(rowElement);
        
        // Add click handler to accordion content to close when clicked (but not on buttons/links)
        content.addEventListener('click', (e) => {
            // Don't close if clicking on the try layout button, view switcher, or layout info links
            if (e.target.closest('.try-layout-btn') || 
                e.target.closest('.keyboard-view-switcher') ||
                e.target.closest('.keyboard-layout-info a')) {
                return;
            }
            e.stopPropagation();
            this.close(rowElement);
        });
    }

    /**
     * Close accordion row
     */
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

        // Remove from open rows set and cache
        this.openRows.delete(rowElement);
        this.layoutCache.delete(rowElement);
    }
    
    /**
     * Refresh all open accordions (re-render with current view preference and language)
     */
    refreshAllOpen() {
        const currentLanguage = window.currentLanguage || 'english';
        
        for (const [rowElement, data] of this.layoutCache.entries()) {
            if (this.openRows.has(rowElement)) {
                const layoutInfo = {
                    name: data.layoutName,
                    statsUrl: this.updateCyanophageUrl(data.layoutUrl, currentLanguage),
                    website: data.website || null
                };
                renderKeyboard(data.layout, data.svg, { layoutInfo });
                
                // Update button position for the new view
                const accordionRow = rowElement.nextElementSibling;
                if (accordionRow && accordionRow.classList.contains('accordion-row')) {
                    this.updateButtonPosition(accordionRow);
                }
            }
        }
    }

    /**
     * Create the accordion row HTML
     */
    createAccordionRow(layoutName, layoutUrl) {
        const tr = document.createElement('tr');
        tr.className = 'accordion-row';
        
        // Get the number of columns in the table
        const table = document.getElementById('layoutTable');
        const columnCount = table.querySelector('thead tr').children.length;
        
        // Create the try layout URL with the target parameter
        const tryLayoutUrl = `try-layout.html?target=${encodeURIComponent(layoutName)}`;
        
        tr.innerHTML = `
            <td colspan="${columnCount}">
                <div class="accordion-content">
                    <div class="accordion-layout">
                        <div class="keyboard-container">
                            <svg id="keyboard-svg" width="800" height="280" viewBox="0 0 800 280"></svg>
                        </div>
                        <div class="accordion-actions">
                            <a href="${tryLayoutUrl}" class="try-layout-btn">
                                <i class="fas fa-keyboard"></i>
                                Try layout
                            </a>
                        </div>
                    </div>
                </div>
            </td>
        `;

        return tr;
    }

    /**
     * Check if a row is currently open
     */
    isOpen(rowElement) {
        return this.openRows.has(rowElement);
    }
}

// Create global accordion instance
window.keyboardAccordion = new KeyboardAccordion();
