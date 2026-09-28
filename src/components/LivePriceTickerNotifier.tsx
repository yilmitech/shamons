import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  Sparkles,
  Package,
  Calendar,
  Truck,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BellRing,
  RefreshCw,
  Layers,
  DollarSign,
} from "lucide-react";
import { Product, HatcheryBatch } from "../types";
import { StorageService } from "../lib/storage";

export interface TickerItem {
  id: string;
  type: "bird" | "feed" | "batch" | "announcement";
  badge: string;
  badgeColor: string;
  title: string;
  subtitle?: string;
  primaryPrice?: string;
  secondaryPrice?: string;
  statusText: string;
  statusType: "in_stock" | "low_stock" | "upcoming" | "info";
  productId?: string;
  actionText?: string;
}

interface LivePriceTickerNotifierProps {
  products: Product[];
  onSelectProduct?: (productId: string) => void;
  onOpenAlerts?: () => void;
  onOpenCalculator?: () => void;
}

export const LivePriceTickerNotifier: React.FC<LivePriceTickerNotifierProps> = ({
  products,
  onSelectProduct,
  onOpenAlerts,
  onOpenCalculator,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<"all" | "birds" | "feeds" | "batches">("all");
  const [lastUpdated, setLastUpdated] = useState<string>("Just now");
  const [pulseKey, setPulseKey] = useState(0);
  const [batches, setBatches] = useState<HatcheryBatch[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load hatchery batches from Supabase; refresh whenever admin pushes a
  // price/stock update event so the ticker doesn't go stale.
  useEffect(() => {
    let cancelled = false;
    const loadBatches = () => {
      StorageService.getBatches().then((result) => {
        if (!cancelled) setBatches(result);
      });
    };
    loadBatches();
    window.addEventListener("shamon_price_updated", loadBatches);
    return () => {
      cancelled = true;
      window.removeEventListener("shamon_price_updated", loadBatches);
    };
  }, []);

  // Generate dynamic live ticker items from actual products & price manager state
  const buildTickerItems = (): TickerItem[] => {
    const items: TickerItem[] = [];

    // 1. LIVE BIRD & DOC PRICES
    const birdProducts = products.filter((p) => !p.isFeed);
    birdProducts.forEach((prod) => {
      const isDoc = prod.subCategory === "doc" || prod.unit.toLowerCase().includes("carton");

      let priceStr = `₦${prod.basePrice.toLocaleString()}`;
      let unitLabel = prod.unit;

      if (isDoc) {
        priceStr = `₦${prod.basePrice.toLocaleString()}/ctn`;
        const estUnit = Math.round(prod.basePrice / 50);
        unitLabel = `(50 chicks + 1 bonus • ~₦${estUnit.toLocaleString()}/chick)`;
      } else {
        priceStr = `₦${prod.basePrice.toLocaleString()}/bird`;
      }

      items.push({
        id: `bird-${prod.id}`,
        type: "bird",
        badge: isDoc ? "🐣 DOC Hatch Rate" : "🐔 Live Bird Rate",
        badgeColor: isDoc ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-emerald-100 text-emerald-900 border-emerald-300",
        title: prod.name,
        subtitle: unitLabel,
        primaryPrice: priceStr,
        statusText: prod.inStock ? `In Stock (${prod.stockCount} ${isDoc ? 'cartons' : 'birds'})` : "Booking Fast",
        statusType: prod.inStock ? "in_stock" : "low_stock",
        productId: prod.id,
        actionText: "Book Now",
      });
    });

    // 2. POULTRY FEEDS (25KG FULL BAG & 12.5KG HALF BAG MATRIX)
    const feedProducts = products.filter((p) => p.isFeed);
    feedProducts.forEach((feed) => {
      const fullPrice = feed.feedSizes?.fullBag?.price || feed.basePrice;
      const halfPrice = feed.feedSizes?.halfBag?.price || Math.round(fullPrice / 2 + 250);
      const stock = feed.feedSizes?.fullBag?.stockCount || feed.stockCount || 50;

      items.push({
        id: `feed-${feed.id}`,
        type: "feed",
        badge: "🌾 Feed Matrix",
        badgeColor: "bg-lime-100 text-lime-950 border-lime-300",
        title: feed.name,
        subtitle: `${feed.brand} High-Protein Formula`,
        primaryPrice: `Full 25kg: ₦${fullPrice.toLocaleString()}`,
        secondaryPrice: `Half 12.5kg: ₦${halfPrice.toLocaleString()}`,
        statusText: feed.inStock ? `In Depot (${stock} bags)` : "Limited Bags",
        statusType: feed.inStock ? "in_stock" : "low_stock",
        productId: feed.id,
        actionText: "Order Feed",
      });
    });

    // 3. HATCHERY BATCHES & ARRIVAL SCHEDULE
    if (batches && batches.length > 0) {
      batches.slice(0, 3).forEach((batch, bIdx) => {
        const rawDate = batch.deliveryDate || batch.hatchDate || new Date().toISOString();
        const arrivalFormatted = new Date(rawDate).toLocaleDateString("en-NG", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        const batchNum = batch.id ? `Batch #${batch.id.replace(/\D/g, '') || (bIdx + 1)}` : `Batch ${bIdx + 1}`;
        const availCount = batch.availableCartons ?? batch.cartonsAvailable ?? 45;

        items.push({
          id: `batch-${batch.id || bIdx}`,
          type: "batch",
          badge: "🚀 Hatch Batch Arrival",
          badgeColor: "bg-blue-100 text-blue-950 border-blue-300",
          title: `${batchNum}: ${batch.breed}`,
          subtitle: `Arrival: ${arrivalFormatted} @ 7:00 AM`,
          primaryPrice: `₦${(batch.pricePerCarton || 38500).toLocaleString()}/ctn`,
          statusText: `${availCount} cartons available for Kaltungo pickup`,
          statusType: "upcoming",
          actionText: "Reserve Batch",
        });
      });
    }

    // 4. DEPOT GUARANTEES & NOTIFICATIONS
    items.push({
      id: "depot-announcement-1",
      type: "announcement",
      badge: "📍 Kaltungo Depot Alert",
      badgeColor: "bg-purple-100 text-purple-950 border-purple-300",
      title: "Daily Fresh Feeds & DOC Collection",
      subtitle: "First Bank Account: 2034981726 (Shamon Poultry & Feeds)",
      primaryPrice: "Verified Rates",
      statusText: "Open Mon–Sat 7:30 AM – 6:30 PM",
      statusType: "info",
      actionText: "Get Alerts",
    });

    return items;
  };

  const allItems = buildTickerItems();

  // Filter items based on active category chip
  const filteredItems = allItems.filter((item) => {
    if (activeCategoryFilter === "all") return true;
    if (activeCategoryFilter === "birds") return item.type === "bird";
    if (activeCategoryFilter === "feeds") return item.type === "feed";
    if (activeCategoryFilter === "batches") return item.type === "batch" || item.type === "announcement";
    return true;
  });

  // Listen to custom price update events from AdminPortal
  useEffect(() => {
    const handlePriceUpdate = () => {
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setLastUpdated(`Today at ${timeStr}`);
      setPulseKey((prev) => prev + 1);
    };

    window.addEventListener("shamon_price_updated", handlePriceUpdate);
    window.addEventListener("storage", handlePriceUpdate);

    return () => {
      window.removeEventListener("shamon_price_updated", handlePriceUpdate);
      window.removeEventListener("storage", handlePriceUpdate);
    };
  }, []);

  const handleItemClick = (item: TickerItem) => {
    if (item.productId && onSelectProduct) {
      onSelectProduct(item.productId);
    } else if (item.type === "batch" || item.type === "announcement") {
      if (onOpenAlerts) onOpenAlerts();
    }
  };

  // Standard calibrated 0.6x speed for steady, effortless reading
  const speedDuration = "280s";

  return (
    <div
      className="relative bg-slate-900 border-b border-emerald-900/80 text-white shadow-md overflow-hidden z-20 select-none"
      id="sliding-price-notifier-container"
    >
      {/* Top Header Row of the Ticker */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Live indicator dot */}
          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-emerald-400 tracking-wider text-[11px] uppercase">
              Live Stock &amp; Price Feed
            </span>
          </div>

          <span className="hidden sm:inline text-slate-400">•</span>
          <span className="hidden md:inline text-slate-300 text-[11px] font-medium">
            Synced from <strong className="text-amber-300">Admin Price Manager</strong> ({lastUpdated})
          </span>
        </div>

        {/* Interactive Controls: Category Filter Chips & Pause Button */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setActiveCategoryFilter("all")}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                activeCategoryFilter === "all"
                  ? "bg-amber-400 text-slate-950 shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              All ({allItems.length})
            </button>
            <button
              onClick={() => setActiveCategoryFilter("birds")}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                activeCategoryFilter === "birds"
                  ? "bg-amber-400 text-slate-950 shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              🐣 Live Birds
            </button>
            <button
              onClick={() => setActiveCategoryFilter("feeds")}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                activeCategoryFilter === "feeds"
                  ? "bg-amber-400 text-slate-950 shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              🌾 Feeds
            </button>
            <button
              onClick={() => setActiveCategoryFilter("batches")}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                activeCategoryFilter === "batches"
                  ? "bg-amber-400 text-slate-950 shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              🚀 Hatch &amp; Depot
            </button>
          </div>

          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-[11px] font-semibold cursor-pointer transition active:scale-95"
            title={isPaused ? "Resume sliding carousel" : "Pause sliding carousel"}
            id="ticker-pause-toggle-btn"
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Play</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Pause</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Horizontally Sliding Marquee Carousel Track */}
      <div
        className="relative w-full py-2.5 overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Soft edge gradient fades */}
        <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

        {/* Sliding Infinite Track Container with Duplicated Items for seamless loop */}
        <div
          ref={scrollContainerRef}
          className={`ticker-track ${isPaused ? "is-paused" : ""}`}
          style={{ animationDuration: speedDuration }}
        >
          {/* Render 2 sets of items to guarantee seamless infinite sideways loop */}
          {[...filteredItems, ...filteredItems].map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              onClick={() => handleItemClick(item)}
              className="inline-flex items-center gap-3 bg-slate-800/95 hover:bg-slate-750 active:bg-slate-700 border border-slate-700/80 hover:border-amber-400/60 rounded-xl px-3.5 py-2 mx-2 transition-all shadow-md cursor-pointer hover:scale-[1.02] shrink-0"
              title={`Click to view ${item.title}`}
            >
              {/* Category / Source Badge */}
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wide whitespace-nowrap ${item.badgeColor}`}
              >
                {item.badge}
              </span>

              {/* Title and details */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-xs sm:text-sm whitespace-nowrap">
                    {item.title}
                  </span>
                  {item.statusText && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                        item.statusType === "in_stock"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : item.statusType === "low_stock"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-blue-950 text-blue-300 border border-blue-800"
                      }`}
                    >
                      {item.statusText}
                    </span>
                  )}
                </div>

                {item.subtitle && (
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {item.subtitle}
                  </span>
                )}
              </div>

              {/* Price Pill Highlight */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
                {item.primaryPrice && (
                  <span className="font-black text-amber-300 text-xs sm:text-sm tracking-tight bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-lg whitespace-nowrap shadow-xs">
                    {item.primaryPrice}
                  </span>
                )}

                {item.secondaryPrice && (
                  <span className="font-bold text-lime-300 text-[11px] bg-lime-950/60 border border-lime-500/30 px-1.5 py-0.5 rounded-lg whitespace-nowrap">
                    {item.secondaryPrice}
                  </span>
                )}

                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-300 ml-1 transition-transform group-hover:translate-x-0.5 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
