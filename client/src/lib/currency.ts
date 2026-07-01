/**
 * Currency formatting utility for consistent INR display across the application.
 *
 * All prices are stored as plain numbers in the database.
 * This module handles display-only formatting using the Indian locale.
 */

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Format a numeric price value as Indian Rupees (₹).
 *
 * @example
 *   formatPrice(499)    // "₹499"
 *   formatPrice(1299)   // "₹1,299"
 *   formatPrice(12999)  // "₹12,999"
 *   formatPrice(4.99)   // "₹4.99"
 */
export function formatPrice(value: number): string {
  return INR_FORMATTER.format(value);
}
