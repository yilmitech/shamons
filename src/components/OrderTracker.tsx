import React, { useState } from 'react';
import { 
  X, 
  Search, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Package, 
  MapPin, 
  Phone, 
  FileText, 
  AlertCircle,
  Building,
  ShieldCheck
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { StorageService } from '../lib/storage';
import { formatNaira, formatDateTime, getWhatsAppOrderUrl } from '../lib/utils';
import { DEPOT_INFO } from '../data/initialData';

interface OrderTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt: (order: Order) => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  isOpen,
  onClose,
  onViewReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const matches = await StorageService.trackOrder(searchQuery.trim());
      setSearchedOrder(matches[0] || null);
    } finally {
      setSearched(true);
      setIsSearching(false);
    }
  };

  const getStatusStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'pending_verification':
        return 1;
      case 'payment_verified':
        return 2;
      case 'ready_for_pickup':
        return 3;
      case 'completed':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 1;
    }
  };

  const currentStep = searchedOrder ? getStatusStepIndex(searchedOrder.status) : 1;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-scaleUp border border-slate-200 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 leading-tight">
                Track Poultry Booking & Feeds
              </h2>
              <p className="text-xs text-slate-500">
                Enter your Booking Code (e.g. SHM-84219) or phone number
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Booking Code (SHM-XXXXX) or Phone"
                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium text-slate-900"
                id="tracker-search-input"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors shrink-0 shadow-xs"
              id="tracker-submit-btn"
            >
              {isSearching ? 'Searching…' : 'Track'}
            </button>
          </form>
        </div>

        {/* Results Area */}
        <div className="p-5 sm:p-6 max-h-[65vh] overflow-y-auto">
          {searchedOrder ? (
            <div className="space-y-6">
              {/* Order Status Badge & Booking Code */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                    Booking Reference
                  </div>
                  <div className="font-mono font-black text-xl text-emerald-950">
                    {searchedOrder.bookingCode}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Placed on {formatDateTime(searchedOrder.createdAt)}
                  </div>
                </div>

                <div>
                  {searchedOrder.status === 'pending_verification' && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                      <span>Pending Bank Verification</span>
                    </span>
                  )}
                  {searchedOrder.status === 'payment_verified' && (
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Payment Verified • Stock Reserved</span>
                    </span>
                  )}
                  {searchedOrder.status === 'ready_for_pickup' && (
                    <span className="bg-blue-100 text-blue-900 border border-blue-300 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-700" />
                      <span>Ready for Kaltungo Depot Pickup</span>
                    </span>
                  )}
                  {searchedOrder.status === 'completed' && (
                    <span className="bg-slate-900 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Completed & Dispatched</span>
                    </span>
                  )}
                  {searchedOrder.status === 'cancelled' && (
                    <span className="bg-rose-100 text-rose-900 text-xs font-black px-3 py-1 rounded-full">
                      Cancelled
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="py-2">
                <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider mb-4">
                  Booking Status Timeline
                </h4>

                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {/* Step 1 */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                        currentStep >= 1
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      ✓
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        Booking Placed & Transfer Ref Submitted
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatDateTime(searchedOrder.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                        currentStep >= 2
                          ? 'bg-emerald-600 text-white'
                          : currentStep === 1
                          ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-100 animate-pulse'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {currentStep >= 2 ? '✓' : '2'}
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        First Bank Transfer Verification
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {currentStep >= 2
                          ? 'Payment verified by Kaltungo Depot team'
                          : 'Accountant verifying your transfer ref'}
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                        currentStep >= 3
                          ? 'bg-emerald-600 text-white'
                          : currentStep === 2
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {currentStep >= 3 ? '✓' : '3'}
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        Stock Allocation & Packing
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Cartons allocated / feed bags tagged for collection
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                        currentStep >= 4
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {currentStep >= 4 ? '✓' : '4'}
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        Depot Pickup / Collection Complete
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Kaltungo, Gombe State
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-700 mb-2">Booked Items:</h4>
                <div className="space-y-2">
                  {searchedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.quantity}x • {item.selectedVariant || item.unit}
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-900">
                        {formatNaira(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-slate-100">
                  <span className="font-extrabold text-xs text-slate-700">Total Amount:</span>
                  <span className="font-black text-lg text-emerald-950">
                    {formatNaira(searchedOrder.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => onViewReceipt(searchedOrder)}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Digital Receipt</span>
                </button>

                <a
                  href={getWhatsAppOrderUrl(searchedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-300" />
                  <span>Contact Kaltungo Depot</span>
                </a>
              </div>
            </div>
          ) : searched ? (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-900 text-sm">No booking found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                We couldn't find any booking matching "{searchQuery}". Please check your code or contact the depot.
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              Enter your booking reference or phone number above to track order status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
