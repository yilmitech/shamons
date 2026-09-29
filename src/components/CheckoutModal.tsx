import React, { useState } from 'react';
import { 
  X, 
  Building, 
  Copy, 
  Check, 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  MessageCircle, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { CartItem, Order } from '../types';
import { DEPOT_INFO } from '../data/initialData';
import { formatNaira, generateBookingCode, getWhatsAppOrderUrl } from '../lib/utils';
import { StorageService } from '../lib/storage';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
}) => {
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');

  // Customer info form
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [lga, setLga] = useState('Kaltungo');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'depot_pickup' | 'local_delivery'>('depot_pickup');
  const [address, setAddress] = useState('');

  // Payment form
  const [senderName, setSenderName] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [proofImage, setProofImage] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Created order state for success screen
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  if (!isOpen) return null;

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  const lgasInGombe = [
    'Kaltungo',
    'Shongom',
    'Billiri',
    'Balanga',
    'Gombe Central',
    'Akko',
    'Yamaltu/Deba',
    'Dukku',
    'Funakaye',
    'Nafada',
    'Kwami'
  ];

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(DEPOT_INFO.bankDetails.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setErrorMessage('Please enter a valid active phone number for booking alerts');
      return;
    }
    setErrorMessage('');
    if (!senderName) {
      setSenderName(customerName);
    }
    setStep('payment');
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPlacingOrder(true);
    setErrorMessage('');
    try {
      const finalSender = senderName.trim() || customerName.trim() || 'Customer';
      const finalTxnRef = transactionRef.trim() || `TRF-${Math.floor(100000 + Math.random() * 900000)}`;

      const bookingCode = generateBookingCode();
      const newOrder: Order = {
        id: bookingCode,
        bookingCode,
        bookingRef: bookingCode,
        createdAt: new Date().toISOString(),
        customerName: customerName.trim(),
        phone: phone.trim(),
        altPhone: altPhone.trim() || undefined,
        address: address.trim() || undefined,
        lga,
        fulfillmentMethod,
        deliveryOrPickupLocation: fulfillmentMethod === 'local_delivery' ? `Delivery: ${address} (${lga})` : `Store Pickup: shamonsDepot Kaltungo`,
        items,
        totalAmount,
        paymentMethod: 'bank_transfer',
        status: 'pending_verification',
        orderStatus: 'pending_verification',
        paymentStatus: 'pending_transfer',
        payerName: finalSender,
        transactionRef: finalTxnRef,
        paymentProofImage: proofImage,
        paymentDetails: {
          bankName: DEPOT_INFO.bankDetails.bankName,
          accountName: DEPOT_INFO.bankDetails.accountName,
          accountNumber: DEPOT_INFO.bankDetails.accountNumber,
          senderName: finalSender,
          transactionRef: finalTxnRef,
          proofImageUrl: proofImage,
          paidAmount: totalAmount,
          paidAt: new Date().toISOString(),
        },
        synced: navigator.onLine,
      };

      // Save to Supabase (falls back to an offline queue if unreachable —
      // the booking still confirms locally and syncs once back online).
      const saved = await StorageService.addOrder(newOrder);
      setCompletedOrder(saved ?? newOrder);
      setStep('success');
      onOrderSuccess(saved ?? newOrder);
    } catch (err) {
      setErrorMessage('Could not submit your booking. Please check your connection and try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-scaleUp border border-slate-200 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
              {step === 'info' ? '1' : step === 'payment' ? '2' : '✓'}
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 leading-tight">
                {step === 'info' && 'Customer & Delivery Details'}
                {step === 'payment' && 'Direct Bank Transfer Payment'}
                {step === 'success' && 'Booking Confirmed!'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 'info' && 'Step 1 of 2: Enter contact and pickup preference'}
                {step === 'payment' && 'Step 2 of 2: Transfer to First Bank & confirm'}
                {step === 'success' && 'Your poultry booking is registered'}
              </p>
            </div>
          </div>

          {step !== 'success' && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* STEP 1: CUSTOMER INFORMATION */}
        {step === 'info' && (
          <form onSubmit={handleProceedToPayment} className="p-5 sm:p-6 space-y-4">
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Order Summary Pill */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-600">Total Items in Booking:</span>
                <span className="font-bold text-slate-900 ml-1">
                  {items.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-slate-600">Total:</span>
                <span className="font-black text-emerald-900 text-base ml-1">
                  {formatNaira(totalAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ibrahim Danladi"
                  className="w-full text-xs sm:text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden text-slate-900 font-medium"
                  id="checkout-name-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Active Phone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0803 498 1726"
                  className="w-full text-xs sm:text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden text-slate-900 font-medium"
                  id="checkout-phone-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Local Govt Area (LGA) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden text-slate-900 font-bold"
                  id="checkout-lga-select"
                >
                  {lgasInGombe.map((g) => (
                    <option key={g} value={g}>
                      {g} LGA
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alternative Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  placeholder="e.g. 0814 620 9381"
                  className="w-full text-xs sm:text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* Fulfillment Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Fulfillment Preference:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillmentMethod('depot_pickup')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    fulfillmentMethod === 'depot_pickup'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-extrabold text-xs flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Depot Pickup</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Free pickup at Kaltungo Depot counter
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentMethod('local_delivery')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    fulfillmentMethod === 'local_delivery'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-extrabold text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Local Delivery</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Dispatch to your farm or house in {lga}
                  </div>
                </button>
              </div>
            </div>

            {fulfillmentMethod === 'local_delivery' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Farm / Delivery Address in {lga}
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Government Secondary School, Kaltungo Town"
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden text-slate-900 font-medium"
                />
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-700/20 transition-all active:scale-95"
                id="checkout-step1-next-btn"
              >
                <span>Continue to Bank Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: DIRECT BANK TRANSFER PAYMENT */}
        {step === 'payment' && (
          <form onSubmit={handleCompleteOrder} className="p-5 sm:p-6 space-y-4">
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Official Bank Account Box */}
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-emerald-700/40 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-600/10 rounded-full blur-xl pointer-events-none"></div>

              <div className="flex items-center justify-between text-xs text-amber-300 font-bold mb-2">
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  <span>{DEPOT_INFO.bankDetails.bankName}</span>
                </div>
                <span className="text-[11px] bg-emerald-800 px-2 py-0.5 rounded text-emerald-200">
                  {DEPOT_INFO.bankDetails.branch}
                </span>
              </div>

              <div className="space-y-2 mt-3">
                <div>
                  <div className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold">
                    Account Name:
                  </div>
                  <div className="font-extrabold text-sm sm:text-base text-white">
                    {DEPOT_INFO.bankDetails.accountName}
                  </div>
                </div>

                <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-300 uppercase font-semibold">
                      Account Number:
                    </div>
                    <div className="font-black font-mono text-xl sm:text-2xl text-amber-300 tracking-wider">
                      {DEPOT_INFO.bankDetails.accountNumber}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-colors"
                    id="copy-account-num-btn"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-900" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300">Exact Amount to Transfer:</span>
                  <span className="font-black text-amber-300 text-lg">
                    {formatNaira(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Verification Form Inputs */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sender Account Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Name on the bank account used to transfer"
                  className="w-full text-xs sm:text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden text-slate-900 font-medium"
                  id="sender-name-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transaction Reference / Session ID <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. FBN-9823746198 or last digits (Optional)"
                  className="w-full text-xs sm:text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden text-slate-900 font-medium"
                  id="txn-ref-input"
                />
              </div>

              {/* Upload Proof (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Upload Payment Receipt Screenshot <span className="text-emerald-700 font-medium">(Optional)</span>
                  </label>
                  {proofImage && (
                    <button
                      type="button"
                      onClick={() => setProofImage(null)}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold underline cursor-pointer"
                    >
                      Remove Screenshot
                    </button>
                  )}
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-3 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="proof-upload-input"
                  />
                  {proofImage ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Receipt screenshot attached (Optional)</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-500">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-xs font-medium">Click or tap to upload transfer slip (Optional)</span>
                      <span className="text-[10px] text-slate-400">You can also present your SMS alert / receipt on arrival</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('info')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isPlacingOrder}
                className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-700/20 transition-all active:scale-95"
                id="submit-booking-order-btn"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>{isPlacingOrder ? 'Submitting…' : 'Submit & Generate Booking Code'}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 'success' && completedOrder && (
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                Booking Successfully Placed!
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Your poultry booking is registered with shamonsDepot Kaltungo. Our dispatch team is verifying the bank transfer.
              </p>
            </div>

            {/* Booking Code Card */}
            <div className="bg-emerald-50 border-2 border-emerald-600/40 rounded-2xl p-4 max-w-sm mx-auto">
              <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-widest">
                Your Official Booking Code
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-950 tracking-wider my-1">
                {completedOrder.bookingCode}
              </div>
              <p className="text-[11px] text-emerald-800 font-medium">
                Save this code to track your batch or present at Kaltungo Depot counter.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="space-y-2.5 max-w-sm mx-auto">
              {/* WhatsApp notification button */}
              <a
                href={getWhatsAppOrderUrl(completedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                id="send-whatsapp-order-btn"
              >
                <MessageCircle className="w-4 h-4 text-emerald-200" />
                <span>Send Booking to WhatsApp Depot</span>
              </a>

              <button
                onClick={onClose}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-colors"
                id="done-booking-btn"
              >
                Return to Store Catalog
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
