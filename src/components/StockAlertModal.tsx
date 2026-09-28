import React, { useState } from 'react';
import { 
  X, 
  BellRing, 
  CheckCircle2, 
  MessageSquare, 
  Phone, 
  Calendar, 
  Wheat, 
  Egg,
  Sparkles
} from 'lucide-react';
import { StorageService } from '../lib/storage';
import { StockAlertSubscription } from '../types';

interface StockAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockAlertModal: React.FC<StockAlertModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState<StockAlertSubscription['productInterest']>('all_doc');
  const [lga, setLga] = useState('Kaltungo');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    const sub: StockAlertSubscription = {
      id: `sub-${Date.now()}`,
      customerName: name.trim() || 'Farmer',
      phone: phone.trim(),
      productInterest: interest,
      lga,
      createdAt: new Date().toISOString(),
    };

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await StorageService.addAlertSubscription(sub);
      setIsSuccess(true);
    } catch (err) {
      setSubmitError('Could not save your alert request. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scaleUp border border-slate-200 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 leading-tight">
                Poultry & Feed Restock Alerts
              </h2>
              <p className="text-xs text-slate-500">
                Receive free WhatsApp/SMS notices for fresh arrivals
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

        {isSuccess ? (
          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Alert Subscription Active!
            </h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Thank you, <strong>{name || 'Farmer'}</strong>. You will receive priority notices for new arrivals and Chikun/Ultima shipments at Kaltungo Depot.
            </p>
            <button
              onClick={onClose}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Full Name / Farm Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Malam Danladi"
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium text-slate-900"
                id="alert-name-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp / Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0803 498 1726"
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium text-slate-900"
                id="alert-phone-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product of Interest:
              </label>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {[
                  { id: 'all_doc', label: 'All Day-Old Chicks (Broilers, Noilers, Layers)' },
                  { id: 'broiler_doc', label: 'Day-Old Broilers (DOC)' },
                  { id: 'noiler_doc', label: 'Day-Old Noilers (DOC)' },
                  { id: 'layer_doc', label: 'Day-Old Layer Pullets (DOC)' },
                  { id: 'chikun_feeds', label: 'Chikun Feeds (Starter, Finisher, Layer Mash)' },
                  { id: 'ultima_feeds', label: 'Ultima Feeds Restock' },
                  { id: 'all', label: 'All Poultry & Feeds Updates' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                      interest === opt.id
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <input
                      type="radio"
                      name="interest"
                      value={opt.id}
                      checked={interest === opt.id}
                      onChange={() => setInterest(opt.id as any)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {submitError && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
                {submitError}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                id="alert-subscribe-btn"
              >
                <BellRing className="w-4 h-4 text-amber-300" />
                <span>{isSubmitting ? 'Submitting…' : 'Register for Restock Alerts'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
