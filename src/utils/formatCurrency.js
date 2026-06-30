/**
 * Formats a rupee amount for customer-facing display.
 * @param {number} amount - Amount in rupees
 * @returns {string} Formatted string e.g. "Rs.1,299"
 */
export function formatCurrency(amount) {
  return `Rs.${Math.round(amount).toLocaleString('en-IN')}`
}
