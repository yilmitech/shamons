import { BookingOrder, BankAccountDetails } from "../types";

/**
 * Converts numbers into English words formatted for Nigerian Naira currency.
 * e.g. 181000 -> "One Hundred and Eighty-One Thousand Naira Only"
 */
export function amountInWords(amount: number): string {
  if (amount === 0) return "Zero Naira Only";

  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertChunk(num: number): string {
    let chunk = "";
    if (num >= 100) {
      chunk += units[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num >= 20) {
      chunk += tens[Math.floor(num / 10)] + (num % 10 !== 0 ? "-" + units[num % 10] : "") + " ";
    } else if (num > 0) {
      chunk += units[num] + " ";
    }
    return chunk.trim();
  }

  const billions = Math.floor(amount / 1000000000);
  const millions = Math.floor((amount % 1000000000) / 1000000);
  const thousands = Math.floor((amount % 1000000) / 1000);
  const remainder = Math.floor(amount % 1000);

  let words = "";
  if (billions > 0) {
    words += convertChunk(billions) + " Billion ";
  }
  if (millions > 0) {
    words += convertChunk(millions) + " Million ";
  }
  if (thousands > 0) {
    words += convertChunk(thousands) + " Thousand ";
  }
  if (remainder > 0) {
    words += convertChunk(remainder) + " ";
  }

  return `${words.trim()} Naira Only`;
}

/**
 * Generates a standard receipt text summary suitable for SMS, WhatsApp or clipboard.
 */
export function formatReceiptText(
  booking: BookingOrder,
  bankDetails?: BankAccountDetails
): string {
  const dateStr = booking.soldAt || booking.approvedAt || booking.createdAt;
  const isPaid = booking.paymentStatus === "payment_confirmed";

  let text = `==============================\n`;
  text += `shamonsPOULTRY & FEEDS - VIRTUAL RECEIPT\n`;
  text += `Location: Kaltungo, Gombe State, Nigeria\n`;
  text += `==============================\n`;
  text += `Receipt No: REC-${booking.bookingRef}\n`;
  text += `Booking Ref: ${booking.bookingRef}\n`;
  text += `Date: ${dateStr}\n`;
  text += `Status: ${
    isPaid ? "PAYMENT CONFIRMED (PAID)" : "PAYMENT PENDING / PROOF RECORDED"
  }\n`;
  text += `------------------------------\n`;
  text += `Customer: ${booking.customerName}\n`;
  text += `Phone: ${booking.phone}\n`;
  text += `Pickup/Delivery: ${booking.deliveryOrPickupLocation}\n`;
  text += `Supply Date: ${booking.preferredDate}\n`;
  text += `------------------------------\n`;
  text += `ITEMS ORDERED:\n`;
  booking.items.forEach((item, idx) => {
    text += `${idx + 1}. ${item.name} (${item.detailLabel})\n`;
    text += `   Qty: ${item.quantity} | Unit: ₦${item.unitPrice.toLocaleString()} | Subtotal: ₦${item.subtotal.toLocaleString()}\n`;
  });
  text += `------------------------------\n`;
  text += `TOTAL AMOUNT: ₦${booking.totalAmount.toLocaleString()}\n`;
  text += `Amount in Words: ${amountInWords(booking.totalAmount)}\n`;
  text += `------------------------------\n`;
  if (bankDetails) {
    text += `Bank: ${bankDetails.bankName}\n`;
    text += `Account: ${bankDetails.accountNumber} (${bankDetails.accountName})\n`;
  }
  text += `Note: Present this virtual receipt or booking reference at shamonsStore Kaltungo for verification.\n`;
  text += `Thank you for doing business with shamonsPoultry & Feeds!\n`;
  text += `==============================`;

  return text;
}

/**
 * Triggers standard browser printing of the receipt.
 */
export function printReceipt(elementId: string = "shamon-virtual-receipt") {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.print();
    return;
  }

  const styles = Array.from(
    document.querySelectorAll("style, link[rel='stylesheet']")
  )
    .map((el) => el.outerHTML)
    .join("\n");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt_${elementId}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        ${styles}
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            @page { margin: 10mm; }
          }
          body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
        </style>
      </head>
      <body class="p-6 bg-white flex justify-center">
        <div class="max-w-xl w-full">
          ${element.outerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 350);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

/**
 * Copies receipt text to clipboard and returns success boolean.
 */
export async function copyReceiptToClipboard(
  booking: BookingOrder,
  bankDetails?: BankAccountDetails
): Promise<boolean> {
  try {
    const text = formatReceiptText(booking, bankDetails);
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
