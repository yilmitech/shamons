import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2, 
  Building, 
  Phone, 
  MapPin, 
  MessageCircle,
  ShieldCheck,
  Clock,
  QrCode
} from 'lucide-react';
import { Order } from '../types';
import { DEPOT_INFO } from '../data/initialData';
import { formatNaira, formatDateTime, getWhatsAppOrderUrl } from '../lib/utils';

interface DigitalReceiptProps {
  order: Order;
  onClose: () => void;
}

export const DigitalReceipt: React.FC<DigitalReceiptProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const whatsAppUrl = getWhatsAppOrderUrl(order);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-scaleUp border border-slate-200 my-auto">
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white p-3.5 px-5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Official Digital Receipt</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              id="print-receipt-btn"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Print Slip</span>
            </button>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">WhatsApp Staff</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Container */}
        <div className="p-6 sm:p-8 bg-white" id="printable-receipt">
          {/* Depot Header & Logo */}
          <div className="border-b-2 border-slate-900 pb-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-400 flex items-center justify-center font-black text-base">
                  S
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  shamons  Poultry & Feeds
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-semibold">
                Kaltungo Poultry & Authorized Chikun/Ultima Depot
              </p>
              <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1 mt-1">
                <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                <span>Kaltungo, Gombe State</span>
              </p>
              <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1">
                <Phone className="w-3 h-3 text-emerald-700 shrink-0" />
                <span>Tel / WhatsApp: {DEPOT_INFO.phones.join(' • ')}</span>
              </p>
            </div>

            {/* Booking Code Stamp */}
            <div className="text-center sm:text-right bg-emerald-50 border-2 border-emerald-800/30 rounded-2xl p-3 sm:p-4 shrink-0">
              <div className="text-[10px] font-extrabold uppercase text-emerald-900 tracking-wider">
                Booking Reference
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-950 tracking-widest mt-0.5">
                {order.bookingCode}
              </div>
              <div className="text-[10px] text-emerald-800 font-semibold mt-1">
                {formatDateTime(order.createdAt)}
              </div>
            </div>
          </div>

          {/* Customer & Fulfillment Information */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Customer Name & Phone:
              </span>
              <div className="font-extrabold text-sm text-slate-900 mt-0.5">
                {order.customerName}
              </div>
              <div className="text-slate-700 font-medium">{order.phone}</div>
              {order.altPhone && <div className="text-slate-500">Alt: {order.altPhone}</div>}
            </div>

            <div className="text-right">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Fulfillment Location:
              </span>
              <div className="font-extrabold text-sm text-slate-900 mt-0.5">
                {order.fulfillmentMethod === 'depot_pickup'
                  ? 'Kaltungo Depot Pickup'
                  : `Delivery to ${order.lga} LGA`}
              </div>
              <div className="text-slate-600">{order.lga} LGA, Gombe State</div>
              {order.address && <div className="text-slate-500 text-[11px]">{order.address}</div>}
            </div>
          </div>

          {/* Items Table */}
          <div className="py-4 border-b border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 uppercase text-[10px] tracking-wider font-extrabold">
                  <th className="pb-2">Description / Breed</th>
                  <th className="pb-2 text-center">Unit / Variant</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Price</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="text-slate-800">
                    <td className="py-2.5 font-bold pr-2">
                      <div>{item.name}</div>
                      {item.brand && <span className="text-[10px] text-slate-500 font-medium">({item.brand})</span>}
                    </td>
                    <td className="py-2.5 text-center text-slate-600 font-medium">
                      {item.selectedVariant === '25kg'
                        ? '25kg Bag'
                        : item.selectedVariant === '12.5kg'
                        ? '12.5kg Bag'
                        : item.unit}
                    </td>
                    <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                    <td className="py-2.5 text-right text-slate-600">{formatNaira(item.unitPrice)}</td>
                    <td className="py-2.5 text-right font-extrabold text-slate-950">
                      {formatNaira(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Bank Details Breakdown */}
          <div className="py-4 border-b border-slate-200 grid sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] space-y-1">
              <div className="font-bold text-slate-700 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-emerald-700" />
                <span>Bank Payment Verification:</span>
              </div>
              <div className="text-slate-600">
                Bank: <strong>First Bank of Nigeria</strong>
              </div>
              <div className="text-slate-600">
                Acc No: <strong>2017902276</strong>
              </div>
              <div className="text-slate-600">
                Sender: <strong>{order.paymentDetails?.senderName || order.customerName}</strong>
              </div>
              <div className="text-slate-600">
                Txn Ref: <span className="font-mono">{order.paymentDetails?.transactionRef || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex justify-between text-slate-600">
                <span>Gross Total:</span>
                <span className="font-bold text-slate-900">{formatNaira(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Depot Handling & Packaging:</span>
                <span className="font-semibold text-emerald-700">FREE</span>
              </div>
              <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline">
                <span className="font-black text-sm text-slate-900">Total Paid (₦):</span>
                <span className="font-black text-xl text-emerald-900">{formatNaira(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Official Seal & Notes */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="text-[10px] text-slate-500 max-w-xs space-y-0.5">
              <p className="font-bold text-slate-700">Depot Pickup Notice:</p>
              <p>• Present this booking code ({order.bookingCode}) at Kaltungo Depot counter.</p>
              <p>• DOC batches must be collected early morning on arrival day (7:00 AM – 11:00 AM).</p>
            </div>

            <div className="border-2 border-emerald-700 rounded-xl px-4 py-2 text-center text-emerald-800 bg-emerald-50/50">
              <div className="text-[9px] font-black uppercase tracking-widest text-emerald-950">
                OFFICIAL VERIFIED VOUCHER
              </div>
              <div className="text-xs font-bold text-emerald-900 mt-0.5">
                shamons KALTUNGO DEPOT
              </div>
              <div className="text-[9px] text-emerald-700">Gombe State, Nigeria</div>
            </div>
          </div>
        </div>

        {/* Action Buttons at Bottom */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap gap-2 justify-end no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Close Receipt
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
