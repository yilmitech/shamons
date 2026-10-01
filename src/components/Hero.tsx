import React from 'react';
import {
  ShieldCheck,
  Truck,
  Package,
  ArrowRight,
  Calculator,
  BellRing,
} from 'lucide-react';

interface HeroProps {
  onSelectCategory: (cat: string) => void;
  onOpenCalculator: () => void;
  onOpenAlerts: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onSelectCategory,
  onOpenCalculator,
  onOpenAlerts,
}) => {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 sm:pt-8 sm:pb-10">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome to shamons </h2>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' '}• Book fresh chicks, birds &amp; feeds in minutes
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
          <button
            onClick={() => onSelectCategory('all')}
            className="h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            id="hero-explore-catalog-btn"
          >
            <span>Browse &amp; Book Catalog</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>

          <button
            onClick={onOpenCalculator}
            className="h-12 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            id="hero-calculator-btn"
          >
            <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Feed Calculator</span>
          </button>

          <button
            onClick={onOpenAlerts}
            className="h-12 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            id="hero-alerts-btn"
          >
            <BellRing className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Get Stock Alerts</span>
          </button>
        </div>

        {/* Clean highlight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">Hatchery Vaccinated</div>
              <div className="text-xs text-gray-500">Marek &amp; Newcastle safe</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">25kg &amp; 12.5kg Bags</div>
              <div className="text-xs text-gray-500">Full &amp; half bag options</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">Fast Kaltungo Depot</div>
              <div className="text-xs text-gray-500">Same-day pickup ready</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
