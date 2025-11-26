/**
 * Keyboard Accordion Component
 * Manages collapsible keyboard preview rows in the layout table
 */

import { cyanophageToKeyboard } from './cyanophage.js';
import { renderKeyboard } from './keyboard_visualization.js';

class KeyboardAccordion {
    constructor() {
        this.openRows = new Set();
        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
    }

    /**
     * Toggle accordion for a given row
     * @param {string} layoutName - Name of the layout
     * @param {string} layoutUrl - Cyanophage URL for the layout
     * @param {HTMLElement} rowElement - The table row element
     * @param {boolean} hasThumbs - Whether layout has thumb keys
     */
    toggle(layoutName, layoutUrl, rowElement, hasThumbs) {
        const accordionRow = rowElement.nextElementSibling;
        const isOpen = accordionRow && accordionRow.classList.contains('accordion-row');
        
        if (isOpen) {
            this.close(rowElement);
        } else {
            this.open(layoutName, layoutUrl, rowElement, hasThumbs);
        }
    }

    /**
     * Open accordion and render keyboard
     */
    open(layoutName, layoutUrl, rowElement, hasThumbs = false) {
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
        renderKeyboard(layout, svg);
        
        // Add to open rows set
        this.openRows.add(rowElement);
        
        // Add click handler to accordion content to close when clicked (but not on buttons/links)
        content.addEventListener('click', (e) => {
            // Don't close if clicking on the try layout button
            if (e.target.closest('.try-layout-btn')) {
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

        // Remove from open rows set
        this.openRows.delete(rowElement);
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
                    <div class="keyboard-container">
                        <svg id="keyboard-svg" width="800" height="280" viewBox="0 0 800 280"></svg>
                    </div>
                    <div class="accordion-actions">
                        <a href="${tryLayoutUrl}" class="try-layout-btn">
                            <i class="fas fa-keyboard"></i>
                            Try how this layout feels
                        </a>
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
