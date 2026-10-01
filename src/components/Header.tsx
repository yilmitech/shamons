import React from "react";
import {
  ShoppingBag,
  Bell,
  Search,
  
  MapPin,
} from "lucide-react";
import { AppTheme } from "../types";

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenTracker: () => void;
  onOpenAlerts: () => void;

  onNavigateHome: () => void;
  currentTheme: AppTheme;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onOpenTracker,
  onOpenAlerts,

  onNavigateHome,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
      {/* Top micro-bar with location */}
      <div className="bg-gray-50 text-gray-500 text-xs py-1.5 px-4 border-b border-gray-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Kaltungo, Gombe State</span>
          </div>
         
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
        {/* Branding */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left cursor-pointer"
          id="header-brand-home-btn"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-xs">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                shamons 
              </h1>
              <span className="hidden xs:inline-block px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-full">
                Poultry &amp; Feeds
              </span>
            </div>
            <p className="text-xs text-gray-500 font-normal">
              Booking &amp; Supply Depot • Kaltungo
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Track Orders button */}
          <button
            id="track-order-header-btn"
            onClick={onOpenTracker}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition cursor-pointer"
          >
            <Search className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Track Booking</span>
            <span className="sm:hidden">Track</span>
          </button>

          {/* Alert / Notification subscription */}
          <button
            id="register-alert-header-btn"
            onClick={onOpenAlerts}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition cursor-pointer"
            title="Get alerts on new stocks and price updates"
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Stock Alerts</span>
          </button>

          {/* Cart Button */}
          <button
            id="view-cart-header-btn"
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-xs sm:text-sm rounded-lg shadow-xs transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-white" />
            <span className="font-semibold">Cart</span>
            {cartCount > 0 && (
              <span className="bg-white text-emerald-800 text-xs font-bold px-1.5 py-0.2 rounded-full min-w-[20px] text-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
