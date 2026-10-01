import React, { useState, useRef } from "react";
import {
  X,
  Printer,
  Download,
  Share2,
  Check,
  Copy,
  Building2,
  ShieldCheck,
  QrCode,
  Calendar,
  Phone,
  User,
  MapPin,
  FileCheck2,
  CheckCircle2,
  CreditCard,
  Send,
  Upload,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { BookingOrder, BankAccountDetails } from "../types";
import { amountInWords, formatReceiptText, printReceipt, copyReceiptToClipboard } from "../utils/receipt";
import { StorageService } from "../lib/storage";

interface VirtualReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingOrder | null;
  bankDetails: BankAccountDetails;
  onPaymentSubmitted?: (updatedBooking: BookingOrder) => void;
}

export const VirtualReceiptModal: React.FC<VirtualReceiptModalProps> = ({
  isOpen,
  onClose,
  booking,
  bankDetails,
  onPaymentSubmitted,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().substring(0, 16)
  );
  const [proofNote, setProofNote] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofSuccessMsg, setProofSuccessMsg] = useState<string | null>(null);
  const [currentBooking, setCurrentBooking] = useState<BookingOrder | null>(booking);

  // Sync state when prop updates
  React.useEffect(() => {
    setCurrentBooking(booking);
    if (booking) {
      setPayerName(booking.payerName || booking.customerName || "");
      setTransactionRef(booking.transactionRef || "");
    }
  }, [booking]);

  if (!isOpen || !currentBooking) return null;

  const isPaid = currentBooking.paymentStatus === "payment_confirmed";
  const receiptNo =
    currentBooking.receiptNumber ||
    `REC-${currentBooking.bookingRef}-${new Date().getFullYear()}`;
  const issueDate =
    currentBooking.paymentConfirmedAt ||
    currentBooking.soldAt ||
    currentBooking.approvedAt ||
    currentBooking.createdAt;

  const handleCopyText = async () => {
    const success = await copyReceiptToClipboard(currentBooking, bankDetails);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const text = formatReceiptText(currentBooking, bankDetails);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handleDownloadText = () => {
    const text = formatReceiptText(currentBooking, bankDetails);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shamon-receipt-${currentBooking.bookingRef}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProof(true);
    setProofSuccessMsg(null);

    const paymentPayload = {
      payerName: payerName.trim(),
      transactionRef: transactionRef.trim(),
      paymentDate,
      paymentProofNotes: proofNote.trim(),
      paymentMethod: `Bank Transfer (${bankDetails.bankName})`,
    };

    try {
      const bookingCode = currentBooking.bookingCode || currentBooking.bookingRef || currentBooking.id || "";
      const updated = await StorageService.updateOrderPaymentProof(bookingCode, paymentPayload);
      if (updated) {
        setCurrentBooking(updated);
        if (onPaymentSubmitted) onPaymentSubmitted(updated);
      }
      setProofSuccessMsg("Payment details saved. Official Virtual Receipt updated.");
      setShowPaymentForm(false);
      setTimeout(() => setProofSuccessMsg(null), 4000);
    } catch (err: any) {
      setProofSuccessMsg(null);
      alert("Could not save payment details. Please check your connection and try again.");
    } finally {
      setSubmittingProof(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 overflow-hidden my-4 sm:my-8 animate-fade-in flex flex-col max-h-[92vh]">
        {/* Top Control Bar (Hidden in print) */}
        <div className="no-print bg-slate-900 text-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Official Virtual Receipt</span>
                {isPaid ? (
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Paid
                  </span>
                ) : (
                  <span className="bg-amber-500 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Provisional
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-300">
                Ref: {currentBooking.bookingRef} • {receiptNo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => printReceipt("shamon-virtual-receipt")}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
              title="Print Receipt or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-medium rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="Share receipt via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleCopyText}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="Copy receipt text summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/70 space-y-4">
          {proofSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs p-3 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{proofSuccessMsg}</span>
            </div>
          )}

          {/* Payment Proof Update Drawer */}
          {!isPaid && !showPaymentForm && (
            <div className="no-print bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Made the bank transfer? Confirm payment details to finalize your receipt.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentForm(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs whitespace-nowrap"
              >
                Confirm Payment Details
              </button>
            </div>
          )}

          {showPaymentForm && (
            <div className="no-print bg-white rounded-2xl border border-emerald-300 p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Submit Payment Verification Details</span>
                </h4>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                >
                  Cancel
                </button>
              </div>
              <form onSubmit={handleSubmitProof} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Payer Full Name (Bank Account Holder)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Garba Kaltungo"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Bank Transaction Ref / Session ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FBN-TRX-982341 or Session ID"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Payment Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Payment Notes / Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Paid via Firstmonie / USSD"
                      value={proofNote}
                      onChange={(e) => setProofNote(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-medium"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProof}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submittingProof ? "Saving..." : "Verify & Generate Official Receipt"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ===================== THE ACTUAL PRINTABLE / VIRTUAL RECEIPT ===================== */}
          <div
            id="shamon-virtual-receipt"
            className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 sm:p-8 text-gray-900 space-y-6 relative overflow-hidden"
          >
            {/* Watermark Stamp when Paid */}
            <div className="absolute right-4 top-28 sm:top-24 opacity-10 sm:opacity-15 pointer-events-none select-none rotate-[-18deg] flex flex-col items-center justify-center border-4 sm:border-8 border-emerald-700 rounded-full w-36 h-36 sm:w-52 sm:h-52 text-emerald-800 p-2 text-center">
              <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase">
                shamons AGRO
              </span>
              <span className="text-xl sm:text-3xl font-black tracking-wider uppercase my-0.5">
                {isPaid ? "PAID" : "OFFICIAL"}
              </span>
              <span className="text-[8px] sm:text-[10px] font-bold">KALTUNGO • GOMBE</span>
            </div>

            {/* 1. Header & Farm Identity */}
            <div className="border-b-2 border-emerald-800 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-2xl shadow-md">
                    S
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-emerald-950 tracking-tight leading-tight">
                      shamons POULTRY &amp; FEEDS
                    </h1>
                    <p className="text-[11px] font-semibold text-emerald-800">
                      Day-Old Chicks • Full-Breeded Broilers • Egg Layers • Chikun &amp; Ultima Feeds
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600 inline" />
                      Kaltungo, Gombe State, Nigeria
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs">
                  <div className="inline-block bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-lg">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">
                      {isPaid ? "Official Electronic Receipt" : "Provisional Payment Slip"}
                    </div>
                    <div className="text-sm font-black tracking-wide text-emerald-950 font-mono">
                      {receiptNo}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Key Metadata Grid (Customer, Dates, Reference) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-gray-200">
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Booking Ref</span>
                <span className="font-mono font-black text-emerald-900 text-sm">
                  {currentBooking.bookingRef}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Date Issued</span>
                <span className="font-semibold text-gray-800">{issueDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Payment Status</span>
                <span
                  className={`font-bold inline-flex items-center gap-1 ${
                    isPaid ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {isPaid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Confirmed (Paid)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pending Verification</span>
                    </>
                  )}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Supply / Pickup</span>
                <span className="font-semibold text-gray-800">{currentBooking.preferredDate}</span>
              </div>
            </div>

            {/* 3. Customer & Receiving Bank Settlement Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Customer Box */}
              <div className="border border-gray-200 rounded-xl p-3 bg-white space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 border-b border-gray-100 pb-1 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Billed To Customer</span>
                </div>
                <div className="font-bold text-gray-900 text-sm">{currentBooking.customerName}</div>
                <div className="text-gray-600 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span>{currentBooking.phone}</span>
                </div>
                {currentBooking.email && (
                  <div className="text-gray-500 text-[11px] truncate">{currentBooking.email}</div>
                )}
                <div className="text-gray-600 text-[11px] pt-1">
                  <span className="text-gray-400">Location:</span>{" "}
                  <strong>{currentBooking.deliveryOrPickupLocation}</strong>
                </div>
              </div>

              {/* Settlement / Bank Account Box */}
              <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50/40 space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-900 border-b border-emerald-100 pb-1 mb-1.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Payment Settlement Details</span>
                </div>
                <div className="text-[11px] text-gray-700">
                  Bank: <strong className="text-gray-900">{bankDetails.bankName}</strong>
                </div>
                <div className="text-[11px] text-gray-700">
                  Account:{" "}
                  <strong className="text-emerald-950 font-mono font-bold">
                    {bankDetails.accountNumber}
                  </strong>{" "}
                  ({bankDetails.accountName})
                </div>
                {currentBooking.transactionRef && (
                  <div className="text-[11px] text-gray-700 pt-0.5">
                    Trx Ref:{" "}
                    <strong className="font-mono text-emerald-900">
                      {currentBooking.transactionRef}
                    </strong>
                  </div>
                )}
                {currentBooking.payerName && (
                  <div className="text-[11px] text-gray-700">
                    Payer Name: <strong>{currentBooking.payerName}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Itemized Purchases Table */}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                Purchased Items &amp; Quantities
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-emerald-900 text-white font-bold">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Age / Variant</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price (₦)</th>
                      <th className="py-2.5 px-3 text-right">Subtotal (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentBooking.items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-gray-50/70">
                        <td className="py-2.5 px-3 text-gray-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">{it.name}</td>
                        <td className="py-2.5 px-3 text-gray-600 text-[11px]">{it.detailLabel}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-gray-900">
                          {it.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-700 font-mono">
                          ₦{it.unitPrice.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-950 font-mono">
                          ₦{it.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Totals & Words Section */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-4 border-t border-gray-200 pt-4">
              <div className="flex-1 text-xs text-gray-600 space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Amount in Words:
                  </span>
                  <span className="font-bold text-gray-900 italic text-xs sm:text-sm">
                    {amountInWords(currentBooking.totalAmount)}
                  </span>
                </div>
                {currentBooking.notes && (
                  <div className="bg-gray-50 p-2 rounded-lg text-[11px] text-gray-600 border border-gray-100">
                    <span className="font-semibold text-gray-700">Customer Note:</span>{" "}
                    {currentBooking.notes}
                  </div>
                )}
              </div>

              {/* Total Box */}
              <div className="w-full sm:w-64 bg-emerald-900 text-white p-4 rounded-xl space-y-1.5 shadow-sm">
                <div className="flex justify-between text-xs text-emerald-200">
                  <span>Subtotal:</span>
                  <span>₦{currentBooking.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-200">
                  <span>Discounts / Tax:</span>
                  <span>₦0.00</span>
                </div>
                <div className="border-t border-emerald-700 pt-1.5 flex justify-between items-baseline font-black">
                  <span className="text-xs uppercase tracking-wider text-emerald-100">
                    {isPaid ? "Total Paid:" : "Total Due:"}
                  </span>
                  <span className="text-lg text-white font-mono">
                    ₦{currentBooking.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Footer, Barcode Simulation & Official Signature */}
            <div className="border-t-2 border-dashed border-gray-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
              {/* QR & Verification Code */}
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gray-100 rounded-lg border border-gray-300 shrink-0">
                  <QrCode className="w-9 h-9 text-gray-800" />
                </div>
                <div>
                  <div className="font-mono font-bold text-gray-800 text-[11px]">
                    VERIFY: {currentBooking.bookingRef}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Scan or present at shamons Store Kaltungo
                  </div>
                </div>
              </div>

              {/* Signature / Stamp line */}
              <div className="text-center sm:text-right space-y-1">
                <div className="font-serif italic font-bold text-emerald-950 text-sm">
                  shamons Audit &amp; Dispatch Dept
                </div>
                <div className="w-44 h-0.5 bg-gray-300 mx-auto sm:ml-auto" />
                <div className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">
                  Authorized Electronic Signature
                </div>
              </div>
            </div>

            {/* Store Policy Notice */}
            <div className="text-center text-[10px] text-gray-400 pt-1">
              Thank you for partnering with shamons Poultry &amp; Feeds Kaltungo. For inquiries or live pen
              support, contact +234 803 456 7890.
            </div>
          </div>

          {/* Bottom Action Buttons (Hidden in print) */}
          <div className="no-print flex flex-wrap items-center justify-between gap-2 pt-2 pb-1">
            <button
              onClick={handleDownloadText}
              className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-gray-600" />
              <span>Download Text Copy</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => printReceipt("shamon-virtual-receipt")}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
