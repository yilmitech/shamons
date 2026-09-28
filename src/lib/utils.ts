import { Order } from '../types';
import { DEPOT_INFO } from '../data/initialData';

/**
 * Format currency amount to Nigerian Naira with thousand separators
 */
export function formatNaira(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₦0';
  }
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('NGN', '₦').trim();
}

/**
 * Generate unique customer booking code like SHM-84920
 */
export function generateBookingCode(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `SHM-${randomNum}`;
}

/**
 * Format ISO or human-readable date string
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatDateOnly(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Generate a WhatsApp message and link for instant booking confirmation
 */
export function getWhatsAppOrderUrl(order: Order): string {
  const phone = DEPOT_INFO.whatsappNumber.replace(/[^0-9]/g, '');
  const itemsSummary = order.items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.name} (${item.unit || item.selectedVariant}) @ ${formatNaira(
          item.unitPrice
        )} = ${formatNaira(item.subtotal)}`
    )
    .join('\n');

  const text = `*SHAMON POULTRY & FEEDS KALTUNGO - BOOKING NOTICE*
━━━━━━━━━━━━━━━━━━━━
📌 *Booking Code:* ${order.bookingCode}
👤 *Customer:* ${order.customerName}
📞 *Phone:* ${order.phone}
📍 *Location/LGA:* ${order.lga} (${order.fulfillmentMethod === 'depot_pickup' ? 'Depot Pickup' : 'Delivery'})

🛒 *ORDERED ITEMS:*
${itemsSummary}

💰 *TOTAL AMOUNT:* ${formatNaira(order.totalAmount)}
💳 *PAYMENT METHOD:* Direct Bank Transfer (First Bank)
🏷️ *Transaction Ref:* ${order.paymentDetails?.transactionRef || 'Provided'}
👤 *Sender Name:* ${order.paymentDetails?.senderName || order.customerName}

_Please confirm my stock allocation and payment verification for Kaltungo Depot. Thank you!_`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Export generic array of objects to downloadable CSV
 */
export function exportToCSV(filename: string, data: Record<string, any>[]): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') {
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
